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
    print(current_user.is_authenticated)
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
                     "name": current_user.name,
                     "is_admin": is_admin(write_required=False),
                     "admin_write_perm": is_admin(write_required=True)}
        })
    return jsonify({"authenticated": False}), 401

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
    print(image_dir)
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
        return {"error": "User not authenticated"}, 401

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
    # Sanitize input to prevent LDAP injection
    query = ldap3.utils.conv.escape_filter_chars(request.args.get("q"))

    # Remove leading a trailing whitespace
    query = request.args.get("q").strip()

    # Join the words with '*' and add '*' at the beginning and end
    formatted_query = '*' + '*'.join(query.split()) + '*'

    server = ldap3.Server(host=os.getenv("LDAP_HOST"), port=int(os.getenv("LDAP_PORT")), use_ssl=True, get_info=ldap3.ALL)
    conn = ldap3.Connection(server, f'uid={os.getenv("LDAP_UID")},ou=Directory Administrators,o=cornell university,c=us', os.getenv("LDAP_PW"), auto_bind=True)

    # This query allows you to either search by NetID and show all results, OR you can type a name and it will only show ppl who
    # 1) have a Cornell affiliation, and 2) don't have an affiliation of alumni or retiree 
    conn.search('ou=People,o=Cornell University,c=us', f"(|(uid=*{query}*)(&(|(uid=<other-uid>)(cn={formatted_query}))(cornelleduprimaryaffiliation=*)(!(|(cornelleduprimaryaffiliation=alumni)(cornelleduprimaryaffiliation=retiree)))))", attributes=[
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