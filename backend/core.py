from flask import redirect, send_file, render_template, abort, jsonify, request, url_for, Blueprint, current_app, session
from flask_login import login_required, current_user
import ldap3
from datetime import datetime
from pathlib import Path

import os
import helpers

from app import is_admin, get_db_connection, get_logs_connection
import json

core = Blueprint('core', __name__, template_folder='templates', static_folder='static')

def rows_to_dicts(rows):
    """
    Convert a list of sqlite3.Row objects to a list of dicts.
    """
    return [dict(row) for row in rows]

@core.get("/api/auth/status")
def auth_status():
    if current_user.is_authenticated:
        try:
            session["impersonating"]
        except KeyError:
            session["impersonating"] = False
        
        return jsonify({
            "authenticated": True,
            "impersonating": session["impersonating"],
            "user": {"id": current_user.id,
                     "email": current_user.email,
                     "name": current_user.full_name,
                     "is_admin": is_admin(write_required=False),
                     "admin_write_perm": is_admin(write_required=True)}
        })
    return jsonify({"authenticated": False})

@core.get("/api/config")
def config():
    # Return config in the exact order it appears
    return current_app.response_class(
        json.dumps(current_app.config["lifted_config"], ensure_ascii=False),
        mimetype='application/json'
    )

@core.get("/api/stats/lifted")
def stats_lifted():
    conn = get_db_connection()
    
    total_received = conn.execute("select count(*) from messages").fetchone()[0]
    unique_received = conn.execute("select count(distinct recipient_email) from messages").fetchone()[0]
    unique_sent = conn.execute("select count(distinct sender_email) from messages").fetchone()[0]

    conn.close()

    return jsonify({
        "stats": {
            "total_received": total_received,
            "unique_received": unique_received,
            "unique_sent": unique_sent
        }
    })

@core.get("/api/list-images")
def list_images():
    directory = request.args.get("dir", "")
    if not directory:
        return jsonify({"error": "Directory not specified"}), 400

    # List all images in the specified directory
    image_dir = Path("../frontend/public") / directory
    if not image_dir.exists() or not image_dir.is_dir():
        return jsonify({"error": "Directory not found"}), 404

    images = []
    for ext in ["jpg", "jpeg", "png", "gif"]:
        images.extend([f.name for f in image_dir.glob(f"*.{ext}") if not f.name.startswith(".")])

    return jsonify({"images": images})

@core.get("/about-this-website")
def about_this_website():
    # helpers.log(current_user.id, current_user.full_name, "INFO", None, "Accessed About This Website")
    return render_template("about-this-website.html")

@core.get("/api/messages")
@login_required
def get_messages():
    if current_user.is_authenticated: # changed from "g.oidc_user.logged_in"    
        conn = get_db_connection()

        received_cards = rows_to_dicts(conn.execute("select id, message_group from messages where recipient_email=?", (current_user.email,)).fetchall())
        sent_cards = rows_to_dicts(conn.execute("select id, message_group from messages where sender_email=?", (current_user.email,)).fetchall())

        received_ranks = rows_to_dicts(conn.execute("select message_group, rank from (select message_group, recipient_email, rank() over (partition by message_group order by count(*) desc) as rank from messages group by message_group, recipient_email) where recipient_email=?", (current_user.email,)).fetchall())
        sent_ranks = rows_to_dicts(conn.execute("select message_group, rank from (select message_group, sender_email, rank() over (partition by message_group order by count(*) desc) as rank from messages group by message_group, sender_email) where sender_email=?", (current_user.email,)).fetchall())

        hidden_card_overrides = [row["message_group"] for row in conn.execute("select message_group from hidden_card_overrides where recipient_email=?",
                                       (current_user.email,)).fetchall()]
        
        current_attachment_message_group = current_app.config["lifted_config"]["attachment_message_group"]
        # current_attachment_message_group = "sp_25_p"

        attachments = rows_to_dicts(conn.execute("select * from attachments where message_group=? order by id desc", (current_attachment_message_group,)).fetchall())
        attachment_prefs = rows_to_dicts(conn.execute("select attachment_prefs.*, attachments.attachment from attachment_prefs inner join attachments on attachments.id = attachment_prefs.attachment_id where recipient_email=?",
                                       (current_user.email,)).fetchall())
        
        conn.close()

        events = set(["_".join(message_group.split("_")[0:2]) for message_group in current_app.config["lifted_config"]["message_group_list_map"].keys()])
        # Order events: year descending, then fa before sp for same year
        def event_sort_key(event):
            season, year = event.split("_")
            # For sorting: year descending, fa before sp
            season_order = {"fa": 0, "sp": 1}
            return (-int(year), season_order.get(season, 2))
        events = sorted(events, key=event_sort_key)

        output = []
        for event in events:
            build = {}

            build["year"] = int(event.split("_")[1])
            build["year_name"] = int(str(20) + str(build["year"]))
            build["season"] = event.split("_")[0]
            build["season_name"] = "Fall" if build["season"] == "fa" else "Spring"

            build["types"] = []
            for message_group in current_app.config["lifted_config"]["message_group_list_map"].keys():
                if event in message_group:
                    received_cards_in_current_message_group = [card for card in received_cards if card["message_group"] == message_group]
                    sent_cards_in_current_message_group = [card for card in sent_cards if card["message_group"] == message_group]

                    attachments_in_current_message_group = [{"id": attachment["id"],
                                                             "attachment_name": attachment["attachment"],
                                                             "attachment_count": int(attachment["count"])}
                                                             for attachment in attachments if attachment["message_group"] == message_group]

                    build["types"].append({
                    "message_group": message_group,
                    "type":  message_group.split("_")[2],
                    "type_name": "eLifted" if "e" in message_group else "Physical Lifted",
                    "hide_cards": False if message_group not in current_app.config["lifted_config"]["hidden_cards"] or message_group in hidden_card_overrides else True,
                    "received_count": len(received_cards_in_current_message_group),
                    "sent_count": len(sent_cards_in_current_message_group),
                    "received_card_ids": [card["id"] for card in received_cards_in_current_message_group],
                    "sent_card_ids": [card["id"] for card in sent_cards_in_current_message_group],
                    "received_rank": next((item["rank"] for item in received_ranks if item["message_group"] == message_group), None),
                    "sent_rank": next((item["rank"] for item in sent_ranks if item["message_group"] == message_group), None),
                    # "allow_choosing_attachments": True if current_attachment_message_group == message_group else False,
                    # "allow_swapping"
                    # "available_attachments": attachments_in_current_message_group,
                    "chosen_attachment": next(({"id": pref["attachment_id"], "attachment_name": pref["attachment"]} for pref in attachment_prefs if pref["message_group"] == message_group), None)
                })

            output.append(build)

        return jsonify(output)
    else:
        return {"error": "User not authenticated"}

@core.route("/api/get-attachment-pref/<message_group>")
@login_required
def get_attachment_pref(message_group):
    conn = get_db_connection()
    attachment_pref = conn.execute("select * from attachment_prefs where message_group = ? and recipient_email = ?",
                                    (message_group, current_user.email)).fetchone()
    conn.close()
    if attachment_pref is None:
        return jsonify({"attachment_pref": None})
    return jsonify({"attachment_pref": dict(attachment_pref)})

@core.route("/api/get-attachments/<message_group>")
@login_required
def get_attachments(message_group):
    conn = get_db_connection()
    attachments = rows_to_dicts(conn.execute("select * from attachments where message_group = ? order by id desc", (message_group,)).fetchall())
    conn.close()
    return jsonify({"attachments": attachments})

@core.post("/api/set-attachment-pref")
@login_required
def set_attachment():
    attachment_id = request.form["id"]
    message_group = current_app.config["lifted_config"]["attachment_message_group"]

    conn = get_db_connection()
    attachment = conn.execute("select * from attachments where id=?", (attachment_id,)).fetchone()
    if attachment["count"] < 1:
        return f"Sorry, there are no more {attachment["attachment"]} left :("

    conn.execute("update attachments set count=count-1 where id=?", (attachment_id,))

    prev_attachment = conn.execute("select * from attachment_prefs where recipient_email=? and message_group=?",
                                       (current_user.email, message_group)).fetchone()
    
    if prev_attachment:
        conn.execute("update attachment_prefs set attachment_id=? where recipient_email=? and message_group=?",
                     (attachment_id, current_user.email, message_group))
        conn.execute("update attachments set count=count+1 where id=?", (prev_attachment["attachment_id"],))
    else:
        conn.execute("insert into attachment_prefs (recipient_email, message_group, attachment_id) values (?, ?, ?)",
                 (current_user.email, current_app.config["lifted_config"]["attachment_message_group"], attachment_id))

    # conn.execute("insert or replace into attachment_prefs (recipient_email, attachment) values (?, ?)", (current_user.email, attachment))
    conn.commit()
    conn.close()

    return jsonify({"status": "success"})

@core.route("/api/delete-attachment-pref/<id>")
@login_required
def delete_attachment_pref(id):
    conn = get_db_connection()
    attachment_pref = conn.execute('select * from attachment_prefs where id = ?', (id,)).fetchone()
    conn.close()

    if attachment_pref["recipient_email"] == current_user.email or is_admin(write_required=True):
        conn = get_db_connection()
        conn.execute("update attachments set count=count+1 where id=?", (attachment_pref["attachment_id"],))
        conn.execute('delete from attachment_prefs where id = ?', (id,))
        conn.commit()
        conn.close()

        return jsonify({"status": "success"})

    abort(401, "Not your account")

def get_card(id):
    conn = get_db_connection()
    sql = """select messages.*, attachment_prefs.attachment_id, attachments.attachment from messages
             left join attachment_prefs on messages.recipient_email = attachment_prefs.recipient_email and messages.message_group = attachment_prefs.message_group
             left join attachments on attachment_prefs.attachment_id = attachments.id
             where messages.id=?"""
    card = conn.execute(sql, (id,)).fetchone()

    hidden_card_overrides = conn.execute("select message_group from hidden_card_overrides where recipient_email=?",
                                       (current_user.email,)).fetchall()
        
    hidden_card_overrides = [i["message_group"] for i in hidden_card_overrides]

    conn.close()

    if card is None:
        abort(404, "Card DNE")
    
    return card, hidden_card_overrides

@core.route("/api/get-card-json/<id>")
@login_required
def get_card_json(id):
    card, hidden_card_overrides = get_card(id)

    # First check if the user is an admin.  If so, they can bypass all the remaining checks
    if is_admin(write_required=False) == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401, "Not your card")
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden and the user was not a sender of the card, abort
        elif card["message_group"] in current_app.config["lifted_config"]["hidden_cards"] and card["message_group"] not in hidden_card_overrides and card["sender_email"] != current_user.email:
            abort(401, "Hidden Card")
    
    card_json = {
        "id": card["id"],
        "created_timestamp": card["created_timestamp"],
        "message_group": card["message_group"],
        "sender_email": card["sender_email"] if current_user.email == card["sender_email"] or is_admin(write_required=False) else "nice try :)",
        "sender_name": card["sender_name"],
        "recipient_email": card["recipient_email"],
        "recipient_name": card["recipient_name"],
        "message_content": card["message_content"],
        "attachment": card["attachment"]
    }

    # helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Viewed Card ID {id}")

    return jsonify(card_json)

@core.route("/api/get-card-pdf/<id>")
@login_required
def get_card_pdf(id):
    card, hidden_card_overrides = get_card(id)
    
    # note: THE LOGIC HERE IS SLIGHTLY DIFFERENT THAN FOR HTML, since we don't want anyone downloading a PDF before its unhidden
    if is_admin(write_required=False) == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401, "Not your card")
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden, abort
        elif card["message_group"] in current_app.config["lifted_config"]["hidden_cards"] and card["message_group"] not in hidden_card_overrides:
            abort(401, "Hidden Card")

    override_template = request.args.get("override-template", False)
    message_group = override_template if override_template else card['message_group']

    filepath = os.path.join("single_card_output", message_group, id)
    download_name=f"Lifted Message #{id} From {card["sender_email"]}"

    # Get a cached version if it exists, otherwise get a fresh copy via pptx
    if os.path.isfile(filepath + ".pdf") and not override_template:
        return send_file(filepath + ".pdf", download_name=download_name, mimetype='application/pdf')

    helpers.cards_to_pptx_and_pdf(cards=[card],
                                  message_group=message_group,
                                  output_filepath=filepath,
                                  override_template=True if override_template else False)

    # helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Viewed PDF Card ID {id}")

    return send_file(filepath + ".pdf", download_name=download_name, mimetype='application/pdf')

def check_if_can_edit_or_delete(card):
    if is_admin(write_required=True) == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not a sender of the message, abort
        if card["sender_email"] != current_user.email:
            abort(401, "Not your card")
        # So now we know the user is a sender of the message.  However, if the form is closed, abort
        elif card["message_group"] != current_app.config["lifted_config"]["form_message_group"]:
            abort(401, "Form is closed")

@core.route("/api/edit-message/<id>", methods=["POST"])
@login_required
def edit_message(id):
    card, hidden_card_overrides = get_card(id)
    check_if_can_edit_or_delete(card)

    form = json.loads(request.data)

    show_admin_overrides = False
    if current_user.is_authenticated and is_admin(write_required=True) and request.args.get("show_admin_overrides") == "true":
        show_admin_overrides = True

    # (Disable validation for editing...due to complications with NetID validation, and also, if someone is savvy enough to bypass server-side validation, well, they can have their way)
    sender_name = form["sender_name"].strip()
    recipient_name = form["recipient_name"].strip()
    message_content = form["message_content"].strip()

    conn = get_db_connection()

    recipient_email = card["recipient_email"]

    if show_admin_overrides:
        message_group = form["message_group"].strip()
        if message_group == "none" or message_group == "":
            return "message group cannot be empty!"
        sender_email = form["sender_email"].strip()
        recipient_email = form["recipient_email"].strip()
        send_ybl_email = form["send_ybl_email"]

        id = conn.execute('update messages set message_group=?, sender_email=?, sender_name=?, recipient_email=?, recipient_name=?, message_content=?  where id=? returning id',
                        (message_group, sender_email, sender_name, recipient_email, recipient_name, message_content, card["id"])).fetchone()
        
        if send_ybl_email:
            helpers.send_email(message_group=message_group, type="recipient", to=[recipient_email])
    else:
        message_group = current_app.config["lifted_config"]["form_message_group"]
        if message_group == "none":
            return "Sorry - the form is closed!"
        
        conn.execute('update messages set sender_name=?, recipient_name=?, message_content=?  where id=? returning id',
                        (sender_name, recipient_name, message_content, card["id"]))
    
    conn.commit()
    conn.close()

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Edited Card ID {id}") 

    return jsonify({"message_confirmation": True, "recipient_email": recipient_email})

@core.post("/api/delete-message/<id>")
@login_required
def delete_message(id):
    card, hidden_card_overrides = get_card(id)

    check_if_can_edit_or_delete(card)

    conn = get_db_connection()
    conn.execute('delete from messages where id = ?', (id,))
    conn.commit()
    conn.close()

    conn = get_logs_connection()
    timestamp = datetime.now().replace(microsecond=0)
    conn.execute('insert into recently_deleted_messages (created_timestamp, deleted_timestamp, message_group, sender_email, sender_name, recipient_email, recipient_name, message_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                         (card["created_timestamp"], timestamp, card["message_group"], card["sender_email"], card["sender_name"], card["recipient_email"], card["recipient_name"], card["message_content"])).fetchone()
    conn.commit()
    conn.close()

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Deleted Card ID {id}")

    return jsonify({"deleted": True})


def validate_form(form):
    return form["sender_name"] and form["recipient_name"] and form["recipient_netid"] and form["message_content"]

@core.route("/api/send-message", methods=["POST"])
def send_message():
    form = json.loads(request.data)

    show_admin_overrides = False
    if current_user.is_authenticated and is_admin(write_required=True) and request.args.get("show_admin_overrides") == "true":
        show_admin_overrides = True

                        # (Disable validation for admin overrides)
    if show_admin_overrides or validate_form(form):
        # return form.data 
        sender_email = current_user.email
        sender_name = form["sender_name"].strip()
        recipient_name = form["recipient_name"].strip()
        message_content = form["message_content"].strip()

        if show_admin_overrides:
            message_group = form["message_group"].strip()
            # return message_group
            if message_group == "none" or message_group == "":
                return "message group cannot be empty!"
            sender_email = form["sender_email"].strip()
            recipient_email = form["recipient_email"].strip()
        else:
            message_group = current_app.config["lifted_config"]["form_message_group"]
            if message_group == "none":
                abort(401, "Form is closed")

            recipient_netID = form["recipient_netid"].strip()
            if "@" in recipient_netID:
                abort(400, "Haha nice try...it must be a valid NetID.  If you want to send something to a non-NetID, email us at lifted@cornell.edu :)")
            recipient_email = recipient_netID + "@cornell.edu"

        if current_app.config["lifted_config"]["swap_from"] == message_group:
            # Check to see if the user wants their messages in a different message group
            conn = get_db_connection()
            swap_prefs = conn.execute("select * from swap_prefs where recipient_email=? and message_group_from=?", (recipient_email, message_group)).fetchall()
            conn.close()

            # If there is a swap pref, honor it
            if len(swap_prefs) > 0:
                message_group = swap_prefs[0]["message_group_to"]

        timestamp = datetime.now().replace(microsecond=0)

        conn = get_db_connection()
        id = conn.execute('insert into messages (created_timestamp, message_group, sender_email, sender_name, recipient_email, recipient_name, message_content) VALUES (?, ?, ?, ?, ?, ?, ?) returning id',
                         (timestamp, message_group, sender_email, sender_name, recipient_email, recipient_name, message_content)).fetchone()
        conn.commit()
        conn.close()

        helpers.send_email(message_group=message_group, type="recipient", to=[recipient_email])

        return jsonify({"message_confirmation": True, "recipient_email": recipient_email})

@core.route("/api/get-form-description")
def get_form_description():
    dir_path = f'templates/rich_text/{current_app.config["lifted_config"]["form_message_group"]}/form.html'
    if Path(dir_path).exists():
        with open(dir_path, 'r', encoding='utf-8') as file:
            form_description = file.read()
    else:
        form_description = "<p>Admin needs to set form description in Admin Dashboard!</p>"
    return jsonify({"form_description": form_description})

@core.route("/api/people-search")
@login_required
def get_person_info():

    # Get the query and strip whitespace
    query = request.args.get("q", "").strip()
    # Check if expanded search is requested
    expand_search = request.args.get("expand_search", "").lower() == "true"
    
    # If there's an '@', strip everything to the right (including '@')
    if "@" in query:
        query = query.split("@", 1)[0]
    # Sanitize input to prevent LDAP injection
    query = ldap3.utils.conv.escape_filter_chars(query)

    # Join the words with '*' and add '*' at the beginning and end
    formatted_query = '*' + '*'.join(query.split()) + '*'

    server = ldap3.Server(host=os.getenv("LDAP_HOST"), port=int(os.getenv("LDAP_PORT")), use_ssl=True, get_info=ldap3.ALL)
    conn = ldap3.Connection(server, f'uid={os.getenv("LDAP_UID")},ou=Directory Administrators,o=cornell university,c=us', os.getenv("LDAP_PW"), auto_bind=True)

    # Build the search filter based on whether expanded search is enabled
    if expand_search:
        # Expanded search: remove all affiliation restrictions
        search_filter = f"(|(uid=*{query}*)(cn={formatted_query}))"
    else:
        # Default search: only show people with Cornell affiliation, excluding alumni and retirees
        search_filter = f"(|(uid=*{query}*)(&(|(uid=<other-uid>)(cn={formatted_query}))(cornelleduprimaryaffiliation=*)(!(|(cornelleduprimaryaffiliation=alumni)(cornelleduprimaryaffiliation=retiree)))))"
    
    conn.search('ou=People,o=Cornell University,c=us', search_filter, attributes=[
        "uid",
        "cn",
        "cornelleduacadcollege",
        "cornelleduactivateddt",
        "cornelleduprimaryaffiliation",
        "cornelledudeptname1",
        "cornelleduwrkngtitle1",
        ])
    
    results = conn.entries

    if len(results) == 0:
        return jsonify({"results": "none"})

    master_dict = []

    for result in results:
        dict = {
            "NetID": str(result.uid.value),
            "Name": str(result.cn.value),
            "Primary Affiliation": str(result.cornelleduprimaryaffiliation.value),
            "College": helpers.college_dict.get(result.cornelleduacadcollege.value, str(result.cornelleduacadcollege.value)),
            "Primary Dept": str("" if len(result.cornelledudeptname1) == 0 else result.cornelledudeptname1),
            "Primary Title": str("" if len(result.cornelleduwrkngtitle1) == 0 else result.cornelleduwrkngtitle1),
        }

        master_dict.append(dict)
    
    return jsonify({"results": sorted(master_dict, key=lambda x: x["NetID"])})

@core.route("/api/easter-egg/<netID>")
@login_required
def easter_egg(netID):
    result = ""

    if is_admin(write_required=True, custom_netID=netID):
        result = " 🎈🌸"
    elif is_admin(write_required=False, custom_netID=netID):
        result = " 🎈"

    return jsonify({"result": result})

@core.post("/api/swap-messages")
@login_required
def swap_messages():
    swap_from = current_app.config["lifted_config"]["swap_from"]
    swap_to = current_app.config["lifted_config"]["swap_to"]

    if swap_from == "none":
        return "Cannot swap at this time.  swap_from=none in Lifted config."

    conn = get_db_connection()

    # Delete attachment pref if there is one
    attachment_pref = conn.execute("select * from attachment_prefs where recipient_email=? and message_group=?",
                                       (current_user.email, current_app.config["lifted_config"]["swap_from"])).fetchone()
    if attachment_pref:
        conn.execute("update attachments set count=count+1 where id=?", (attachment_pref["attachment_id"],))
        conn.execute('delete from attachment_prefs where id = ?', (attachment_pref["id"],))


    conn.execute('update messages set message_group=? where message_group=? and recipient_email=?',
                         (swap_to, swap_from, current_user.email))
    conn.execute("insert into swap_prefs (recipient_email, message_group_from, message_group_to) values (?, ?, ?)", (current_user.email, swap_from, swap_to))
    conn.commit()
    conn.close()

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Swapped Cards to eLifted")
    
    return jsonify({"swapped": True})

@core.get("/api/analytics")
def get_analytics():
    """Get analytics data for Lifted messages"""
    semester = request.args.get("semester", "all")
    
    conn = get_db_connection()
    
    # Build query conditions based on semester
    where_clause = ""
    params = []
    if semester != "all":
        # Query both physical and elifted for the semester
        where_clause = "WHERE (message_group = ? OR message_group = ?)"
        params = [f"{semester}_p", f"{semester}_e"]
    
    # 1. Cards written breakdown
    total_cards = conn.execute(f"SELECT COUNT(*) as count FROM messages {where_clause}", params).fetchone()["count"]
    physical_cards = conn.execute(f"SELECT COUNT(*) as count FROM messages {where_clause} {'AND' if where_clause else 'WHERE'} message_group LIKE '%_p'", params).fetchone()["count"]
    elifted_cards = conn.execute(f"SELECT COUNT(*) as count FROM messages {where_clause} {'AND' if where_clause else 'WHERE'} message_group LIKE '%_e'", params).fetchone()["count"]
    
    # 2. Unique individuals who received and sent messages
    unique_recipients = conn.execute(f"SELECT COUNT(DISTINCT recipient_email) as count FROM messages {where_clause}", params).fetchone()["count"]
    unique_senders = conn.execute(f"SELECT COUNT(DISTINCT sender_email) as count FROM messages {where_clause}", params).fetchone()["count"]
    
    # 3. Leaderboards - strip @cornell.edu from netids
    sending_leaderboard_raw = rows_to_dicts(conn.execute(f"""
        SELECT sender_email as netid, COUNT(*) as count 
        FROM messages {where_clause}
        GROUP BY sender_email 
        ORDER BY count DESC 
        LIMIT 5
    """, params).fetchall())
    
    receiving_leaderboard_raw = rows_to_dicts(conn.execute(f"""
        SELECT recipient_email as netid, COUNT(*) as count 
        FROM messages {where_clause}
        GROUP BY recipient_email 
        ORDER BY count DESC 
        LIMIT 5
    """, params).fetchall())
    
    # Format leaderboards - just remove @cornell.edu
    sending_leaderboard = []
    for entry in sending_leaderboard_raw:
        netid = entry['netid'].replace('@cornell.edu', '')
        sending_leaderboard.append({
            'name': netid,
            'count': entry['count']
        })
    
    receiving_leaderboard = []
    for entry in receiving_leaderboard_raw:
        netid = entry['netid'].replace('@cornell.edu', '')
        receiving_leaderboard.append({
            'name': netid,
            'count': entry['count']
        })
    
    # 4. Attachment swaps (if applicable)
    swap_stats = []
    try:
        # Get attachment preferences
        attachment_prefs = rows_to_dicts(conn.execute(f"""
            SELECT a.attachment as name, COUNT(*) as count
            FROM attachment_prefs ap
            JOIN attachments a ON ap.attachment_id = a.id
            {where_clause.replace('message_group', 'ap.message_group') if where_clause else ''}
            GROUP BY a.attachment
            ORDER BY count DESC
        """, params).fetchall())
        
        # Get swap preferences
        total_swaps = conn.execute(f"""
            SELECT COUNT(DISTINCT recipient_email) as count
            FROM swap_prefs
            {where_clause.replace('message_group', 'message_group_from') if where_clause else ''}
        """, params).fetchone()["count"]
        
        swap_stats = {
            "total_swaps": total_swaps,
            "attachments": attachment_prefs
        }
    except:
        swap_stats = {"total_swaps": 0, "attachments": []}
    
    # 5. Most common words
    messages_text = conn.execute(f"SELECT message_content FROM messages {where_clause}", params).fetchall()
    word_freq = {}
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'your', 'my', 'me', 'am'}
    
    for row in messages_text:
        if row["message_content"]:
            words = row["message_content"].lower().split()
            for word in words:
                # Remove punctuation
                word = ''.join(c for c in word if c.isalnum())
                if word and word not in stop_words and len(word) > 2:
                    word_freq[word] = word_freq.get(word, 0) + 1
    
    # Get top 50 words for word cloud
    common_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:50]
    
    # 6. Message length statistics
    message_lengths = conn.execute(f"""
        SELECT 
            message_content,
            LENGTH(message_content) - LENGTH(REPLACE(message_content, ' ', '')) + 1 as word_count
        FROM messages 
        {where_clause}
        ORDER BY word_count
    """, params).fetchall()
    
    if message_lengths:
        shortest_msg = message_lengths[0]
        longest_msg = message_lengths[-1]
        avg_words = sum(msg["word_count"] for msg in message_lengths) / len(message_lengths)
    else:
        shortest_msg = {"message_content": "", "word_count": 0}
        longest_msg = {"message_content": "", "word_count": 0}
        avg_words = 0
    
    # 7. Timeline of message submissions
    if semester == "all":
        # For all-time view, show submissions by semester (physical vs elifted)
        timeline_raw = rows_to_dicts(conn.execute("""
            SELECT 
                REPLACE(REPLACE(message_group, '_p', ''), '_e', '') as semester,
                SUM(CASE WHEN message_group LIKE '%_p' THEN 1 ELSE 0 END) as physical,
                SUM(CASE WHEN message_group LIKE '%_e' THEN 1 ELSE 0 END) as elifted,
                COUNT(*) as total
            FROM messages
            GROUP BY REPLACE(REPLACE(message_group, '_p', ''), '_e', '')
        """).fetchall())
        
        # Sort timeline by year (ascending) and season (spring before fall)
        def timeline_sort_key(item):
            sem_code = item['semester']  # e.g., "sp_25" or "fa_24"
            parts = sem_code.split('_')
            if len(parts) == 2:
                season, year = parts
                year_num = int(year)
                season_order = 0 if season == 'sp' else 1
                return (year_num, season_order)
            return (0, 0)
        
        timeline = sorted(timeline_raw, key=timeline_sort_key)
    else:
        # For specific semester, show timeline by date
        timeline = rows_to_dicts(conn.execute(f"""
            SELECT DATE(created_timestamp) as date, COUNT(*) as count
            FROM messages
            {where_clause}
            GROUP BY DATE(created_timestamp)
            ORDER BY date
        """, params).fetchall())
    
    # 8. Participation ranking (only for all-time view)
    participation_leaderboard = []
    if semester == "all":
        # Count how many semesters each person participated in (sent or received)
        participation_raw = rows_to_dicts(conn.execute("""
            SELECT 
                email,
                COUNT(DISTINCT semester) as semester_count
            FROM (
                SELECT 
                    sender_email as email,
                    REPLACE(REPLACE(message_group, '_p', ''), '_e', '') as semester
                FROM messages
                UNION
                SELECT 
                    recipient_email as email,
                    REPLACE(REPLACE(message_group, '_p', ''), '_e', '') as semester
                FROM messages
            )
            GROUP BY email
            ORDER BY semester_count DESC
            LIMIT 5
        """).fetchall())
        
        for entry in participation_raw:
            netid = entry['email'].replace('@cornell.edu', '')
            participation_leaderboard.append({
                'name': netid,
                'count': entry['semester_count']
            })
    
    # Get available message groups and extract unique semesters
    message_groups = rows_to_dicts(conn.execute("""
        SELECT DISTINCT message_group 
        FROM messages 
        ORDER BY message_group DESC
    """).fetchall())
    
    # Extract unique base semesters and format display names
    def format_semester_name(semester_code):
        """Convert sp_25 to Spring 2025, fa_24 to Fall 2024, etc."""
        parts = semester_code.split('_')
        if len(parts) == 2:
            season_code, year = parts
            season_map = {
                'sp': 'Spring',
                'fa': 'Fall',
                'su': 'Summer',
                'wi': 'Winter'
            }
            season = season_map.get(season_code, season_code.upper())
            full_year = f"20{year}" if len(year) == 2 else year
            return f"{season} {full_year}"
        return semester_code
    
    unique_semesters = {}
    for group in message_groups:
        semester = group["message_group"].replace("_p", "").replace("_e", "")
        if semester not in unique_semesters:
            unique_semesters[semester] = format_semester_name(semester)
    
    # Custom sort function for semesters (most recent first, spring before fall in same year)
    def semester_sort_key(sem_tuple):
        sem_code = sem_tuple[0]  # e.g., "sp_25" or "fa_24"
        parts = sem_code.split('_')
        if len(parts) == 2:
            season, year = parts
            # Convert year to int for proper numeric sorting
            year_num = int(year)
            # Spring (sp) = 1, Fall (fa) = 0, so fall comes after spring in same year
            # For descending order: negate year, and use 0 for spring, 1 for fall
            season_order = 0 if season == 'sp' else 1
            return (-year_num, season_order)
        return (0, 0)
    
    # Create list of semester objects with value and label
    available_semesters = [
        {"value": sem, "label": label} 
        for sem, label in sorted(unique_semesters.items(), key=semester_sort_key)
    ]
    
    conn.close()
    
    return jsonify({
        "cards_breakdown": {
            "total": total_cards,
            "physical": physical_cards,
            "elifted": elifted_cards
        },
        "unique_recipients": unique_recipients,
        "unique_senders": unique_senders,
        "leaderboards": {
            "sending": sending_leaderboard,
            "receiving": receiving_leaderboard,
            "participation": participation_leaderboard
        },
        "swap_stats": swap_stats,
        "common_words": common_words,
        "message_stats": {
            "shortest": {
                "message": shortest_msg["message_content"],
                "word_count": shortest_msg["word_count"]
            },
            "longest": {
                "message": longest_msg["message_content"],
                "word_count": longest_msg["word_count"]
            },
            "avg_words": round(avg_words, 1)
        },
        "timeline": timeline,
        "available_semesters": available_semesters,
        "is_all_time": request.args.get("semester", "all") == "all"
    })

@core.get("/api/friend-group")
@login_required
def predict_friend_group():
    """Predict friend group based on network analysis - requires login"""
    if not current_user.is_authenticated:
        return jsonify({"error": "Authentication required"}), 401
    
    # Use the logged-in user's email
    email = current_user.email
    netid = email.replace('@cornell.edu', '')
    
    conn = get_db_connection()
    
    # Check if user exists in database
    user_exists = conn.execute("""
        SELECT COUNT(*) as count FROM messages 
        WHERE sender_email = ? OR recipient_email = ?
    """, [email, email]).fetchone()["count"]
    
    if user_exists == 0:
        conn.close()
        return jsonify({"error": "NetID not found in Lifted messages"}), 404
    
    # 1. Get direct connections (people they sent to or received from)
    direct_connections = rows_to_dicts(conn.execute("""
        SELECT DISTINCT 
            CASE 
                WHEN sender_email = ? THEN recipient_email 
                ELSE sender_email 
            END as connection_email,
            COUNT(*) as interaction_count
        FROM messages
        WHERE sender_email = ? OR recipient_email = ?
        GROUP BY connection_email
    """, [email, email, email]).fetchall())
    
    # Build a weighted graph of connections
    connection_scores = {}
    
    for conn_person in direct_connections:
        person_email = conn_person['connection_email']
        person_netid = person_email.replace('@cornell.edu', '')
        
        # Start with base score from direct interactions
        score = conn_person['interaction_count'] * 10
        
        # 2. Find mutual connections (friends of friends)
        mutual_connections = rows_to_dicts(conn.execute("""
            SELECT COUNT(DISTINCT mutual) as mutual_count
            FROM (
                SELECT CASE 
                    WHEN sender_email = ? THEN recipient_email 
                    ELSE sender_email 
                END as mutual
                FROM messages
                WHERE sender_email = ? OR recipient_email = ?
            )
            WHERE mutual IN (
                SELECT CASE 
                    WHEN sender_email = ? THEN recipient_email 
                    ELSE sender_email 
                END
                FROM messages
                WHERE sender_email = ? OR recipient_email = ?
            )
        """, [person_email, person_email, person_email, email, email, email]).fetchall())
        
        mutual_count = mutual_connections[0]['mutual_count'] if mutual_connections else 0
        score += mutual_count * 5
        
        # 3. Check for reciprocal communication
        reciprocal = conn.execute("""
            SELECT COUNT(*) as count FROM messages
            WHERE (sender_email = ? AND recipient_email = ?)
               OR (sender_email = ? AND recipient_email = ?)
        """, [email, person_email, person_email, email]).fetchone()["count"]
        
        if reciprocal >= 2:  # Both directions
            score += 20
        
        connection_scores[person_netid] = {
            'score': score,
            'direct_interactions': conn_person['interaction_count'],
            'mutual_connections': mutual_count
        }
    
    # Sort by score and get top predictions
    sorted_connections = sorted(connection_scores.items(), key=lambda x: x[1]['score'], reverse=True)
    
    # Identify likely friend group (top connections with score above threshold)
    friend_group = []
    threshold = sorted_connections[0][1]['score'] * 0.3 if sorted_connections else 0
    
    for person_netid, data in sorted_connections[:15]:  # Limit to top 15
        if data['score'] >= threshold:
            friend_group.append({
                'netid': person_netid,
                'confidence': min(100, int((data['score'] / sorted_connections[0][1]['score']) * 100)) if sorted_connections else 0,
                'interactions': data['direct_interactions'],
                'mutual_friends': data['mutual_connections']
            })
    
    conn.close()
    
    return jsonify({
        'netid': netid.replace('@cornell.edu', ''),
        'friend_group': friend_group,
        'total_connections': len(connection_scores)
    })
