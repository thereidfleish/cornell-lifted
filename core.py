from flask import redirect, send_file, render_template, abort, jsonify, request, url_for, Blueprint, current_app
from flask_login import login_required, current_user
import ldap3
from datetime import datetime
from pathlib import Path
from wtforms import Form, BooleanField, StringField, HiddenField, TextAreaField, validators

import os
import helpers

from app import is_admin, get_db_connection

core = Blueprint('core', __name__, template_folder='templates', static_folder='static')

@core.get("/")
def home():
    conn = get_db_connection()
    
    total_received = conn.execute("select count(*) from messages").fetchone()[0]
    unique_received = conn.execute("select count(distinct recipient_email) from messages").fetchone()[0]
    unique_sent = conn.execute("select count(distinct sender_email) from messages").fetchone()[0]

    conn.close()
    
    stats = {
        "total_received": total_received,
        "unique_received": unique_received,
        "unique_sent": unique_sent
    }

    fall_pics = len(os.listdir("static/images/home_fall"))
    spring_pics = len(os.listdir("static/images/home_spring"))

    carousel = {
        "fall": fall_pics,
        "spring": spring_pics
    }

    return render_template('index.html', stats=stats, helpers=helpers, carousel=carousel)

@core.get("/faqs")
def faqs():
    return render_template("faqs.html", helpers=helpers)

@core.get("/messages")
def messages():
    if current_user.is_authenticated: # changed from "g.oidc_user.logged_in"     
        conn = get_db_connection()
                
        received_cards = conn.execute("select * from messages where recipient_email=?", (current_user.email,)).fetchall()
        sent_cards = conn.execute("select * from messages where sender_email=?", (current_user.email,)).fetchall()

        cards_dict = {
            "received": helpers.process_cards_to_dict(received_cards),
            "sent": helpers.process_cards_to_dict(sent_cards)
        }

        received_ranks = conn.execute("select * from (select message_group, recipient_email, rank() over (partition by message_group order by count(*) desc) as rank from messages group by message_group, recipient_email) where recipient_email=?", (current_user.email,)).fetchall()
        sent_ranks = conn.execute("select * from (select message_group, sender_email, rank() over (partition by message_group order by count(*) desc) as rank from messages group by message_group, sender_email) where sender_email=?", (current_user.email,)).fetchall()

        ranks_dict = {
            "received": helpers.process_ranks_to_dict(received_ranks),
            "sent": helpers.process_ranks_to_dict(sent_ranks)
        }

        conn.close()

        return render_template(
            'messages.html',
            cards_dict=cards_dict,
            ranks_dict=ranks_dict
            )
    else:
        return render_template('messages.html')

@core.route("/process-all-cards/<message_group>")
@login_required
def process_all_cards(message_group):
    print("Starting task")
    sql = "select * from messages where message_group=?" + (" order by recipient_email asc" if request.args.get('alphabetical') == "true" else "")
    conn = get_db_connection()
    cards = conn.execute(sql, (message_group,)).fetchall()
    conn.close()
    
    if len(cards) == 0:
        return "No cards found", 404

    output_filepath = "all_cards_output/" + message_group + datetime.now().strftime(" %m-%d-%Y at %H-%M-%S")
    
    should_process_pptx_pdf = True if request.args.get("pptx-pdf") == "true" else False

    with open(f"{output_filepath}.txt", "w") as file:
        file.write(f".csv{', .pptx, .pdf' if should_process_pptx_pdf == True else ""}\n0%")
    
    helpers.create_csv(cards, output_filepath)

    if should_process_pptx_pdf:
        helpers.cards_to_pptx_and_pdf(cards, message_group, output_filepath)
    
    return "Done!"

def get_card(id):
    conn = get_db_connection()
    card = conn.execute("select * from messages where id=?", (id,)).fetchone()
    conn.close()

    if card is None:
        abort(404)
    
    return card

@core.route("/get-card-html/<id>")
@login_required
def get_card_html(id):
    card = get_card(id)

    # First check if the user is an admin.  If so, they can bypass all the remaining checks
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401)
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden and the user was not a sender of the card, abort
        elif card["message_group"] in current_app.config["lifted_config"]["hidden_cards"] and card["sender_email"] != current_user.email:
            abort(401)

    return render_template("card.html", card=card, message_confirmation=request.args.get("message_confirmation"))

@core.route("/get-card-pdf/<id>")
@login_required
def get_card_pdf(id):
    card = get_card(id)
    
    # note: THE LOGIC HERE IS SLIGHTLY DIFFERENT THAN FOR HTML, since we don't want anyone downloading a PDF before its unhidden
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401)
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden, abort
        elif card["message_group"] in current_app.config["lifted_config"]["hidden_cards"]:
            abort(401)

    helpers.cards_to_pptx_and_pdf([card], card['message_group'] if "override-template" not in request.args else request.args.get("override-template"), f"tmp_output/{id}")

    return send_file(f"tmp_output/{id}.pdf", download_name=f"Lifted Message #{id}", mimetype='application/pdf')

def check_if_can_edit_or_delete(card):
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not a sender of the message, abort
        if card["sender_email"] != current_user.email:
            abort(401)
        # So now we know the user is a sender of the message.  However, if the form is closed, abort
        elif card["message_group"] != current_app.config["lifted_config"]["form_message_group"]:
            abort(401)

@core.route("/edit-message/<id>", methods=["GET", "POST"])
@login_required
def edit_message(id):
    card = get_card(id)

    check_if_can_edit_or_delete(card)

    show_admin_overrides = False
    if current_user.is_authenticated and is_admin() and request.args.get("show_admin_overrides") == "true":
        show_admin_overrides = True

    form = RegistrationForm(request.form)

    if request.method == 'GET':
        form.message_group.data = card["message_group"]
        form.sender_name.data = card["sender_name"]
        form.recipient_name.data = card["recipient_name"]
        form.recipient_netid.data = card["recipient_email"].split("@")[0]
        form.message_content.data = card["message_content"]
        
        # These ones are only used when we're allowed to edit the sender and recipient email (Admins only)
        form.sender_email.data = card["sender_email"]
        form.recipient_email.data = card["recipient_email"]

    # (Disable validation for editing...due to complications with NetID validation, and also, if someone is savvy enough to bypass server-side validation, well, they can have their way)
    if request.method == 'POST':        
        sender_name = form.sender_name.data.strip()
        recipient_name = form.recipient_name.data.strip()
        message_content = form.message_content.data.strip()

        conn = get_db_connection()

        if show_admin_overrides:
            message_group = form.message_group.data.strip()
            if message_group == "None" or message_group == "":
                return "message group cannot be empty!"
            sender_email = form.sender_email.data.strip()
            recipient_email = form.recipient_email.data.strip()
            send_ybl_email = form.send_ybl_email.data

            id = conn.execute('update messages set message_group=?, sender_email=?, sender_name=?, recipient_email=?, recipient_name=?, message_content=?  where id=? returning id',
                         (message_group, sender_email, sender_name, recipient_email, recipient_name, message_content, card["id"])).fetchone()
            
            if send_ybl_email:
                helpers.send_email(message_group=message_group, type="recipient", to=[recipient_email])
        else:
            message_group = current_app.config["lifted_config"]["form_message_group"]
            if message_group == "none":
                return "Haha, nice try :)"
            
            id = conn.execute('update messages set sender_name=?, recipient_name=?, message_content=?  where id=? returning id',
                         (sender_name, recipient_name, message_content, card["id"])).fetchone()
        
        conn.commit()
        conn.close()

        return redirect(url_for('core.get_card_html', id=id["id"]))
    
    return render_template("send-message.html", form=form, is_edit=True, show_admin_overrides=show_admin_overrides,
                           form_description="<p>Edit your Lifted message.  If you need to change the recipient email, please email us at <a href=mailto:lifted@cornell.edu>lifted@cornell.edu</a></p>",)


@core.route("/delete-message/<id>")
@login_required
def delete_message(id):
    card = get_card(id)
    
    check_if_can_edit_or_delete(card)

    conn = get_db_connection()
    conn.execute('delete from messages where id = ?', (id,))
    conn.commit()
    conn.close()

    if request.args.get("go_to_admin") == "true":
        return redirect(url_for("admin.admin_page"))
    return redirect(url_for("core.messages"))

class RegistrationForm(Form):
    sender_name = StringField("Your Name", [validators.DataRequired(message="Please enter your name (or at the very least, 'Anonymous').")])
    recipient_name = StringField("Recipient's Name", [validators.DataRequired(message="Please enter the recipient's name.")])
    people_search = StringField("Select Recipient")
    recipient_netid = HiddenField("Select Recipient", [validators.DataRequired(message="Please search for a recipient and then select them in the table below.  Otherwise, we won't know who to send the message to!")])
    message_content = TextAreaField("Your Thank You Message", [validators.DataRequired(message="Please enter a message.  It wouldn't be a Lifted message without a message!")])

    # These ones are only used when we're allowed to edit the sender and recipient email (Admins only)
    message_group = HiddenField("Select Message Group")
    sender_email = StringField("Your Email")
    recipient_email = StringField("Recipient's Email")
    send_ybl_email = BooleanField("Send You've Been Lifted! Email")

@core.route("/send-message", methods=["GET", "POST"])
def send_message():
    form = RegistrationForm(request.form)

    show_admin_overrides = False
    if current_user.is_authenticated and is_admin() and request.args.get("show_admin_overrides") == "true":
        show_admin_overrides = True

                                                # (Disable validation for admin overrides)
    if request.method == 'POST' and (form.validate() or show_admin_overrides):
        # return form.data
 
        sender_email = current_user.email
        sender_name = form.sender_name.data.strip()
        recipient_name = form.recipient_name.data.strip()
        message_content = form.message_content.data.strip()

        if show_admin_overrides:
            message_group = form.message_group.data.strip()
            # return message_group
            if message_group == "None" or message_group == "":
                return "message group cannot be empty!"
            sender_email = form.sender_email.data.strip()
            recipient_email = form.recipient_email.data.strip()
        else:
            message_group = current_app.config["lifted_config"]["form_message_group"]
            if message_group == "none":
                return "Haha, nice try :)"
            
            recipient_netID = form.recipient_netid.data.strip()
            if "@" in recipient_netID:
                return "Haha nice try...it must be a valid NetID.  If you want to send something to a non-NetID, email us at lifted@cornell.edu :)"
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

        return redirect(url_for('core.get_card_html', id=id["id"], message_confirmation=True))

    dir_path = f"templates/rich_text/{current_app.config["lifted_config"]["form_message_group"]}/form.html"
    if Path(dir_path).exists():
        with open(dir_path, 'r', encoding='utf-8') as file:
            form_description = file.read()
        return render_template("send-message.html", form=form, is_edit=False, show_admin_overrides=show_admin_overrides, form_description=form_description)
    
    return render_template("send-message.html", form=form, is_edit=False, show_admin_overrides=show_admin_overrides,
                           form_description="<p>You need to set a form description!</p>",)

@core.route("/people-search")
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
            "Primary Dept": str(result.cornelledudeptname1),
            "Primary Title": str(result.cornelleduwrkngtitle1),
        }

        master_dict.append(dict)
    
    return jsonify({"results": sorted(master_dict, key=lambda x: x["NetID"])})

@core.route("/swap-messages")
@login_required
def swap_messages():
    swap_from = current_app.config["lifted_config"]["swap_from"]
    swap_to = current_app.config["lifted_config"]["swap_to"]

    if swap_from == "none":
        return "Cannot swap at this time.  swap_from=none in Lifted config."

    conn = get_db_connection()
    conn.execute('update messages set message_group=? where message_group=? and recipient_email=?',
                         (swap_to, swap_from, current_user.email))
    conn.execute("insert into swap_prefs (recipient_email, message_group_from, message_group_to) values (?, ?, ?)", (current_user.email, swap_from, swap_to))
    conn.commit()
    conn.close()
    
    return redirect(url_for("core.messages"))