from flask import Flask, redirect, send_file, render_template, session, abort, jsonify, request, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from flask_oidc import OpenIDConnect, signals
import ldap3
from werkzeug.exceptions import HTTPException
from waitress import serve
from datetime import datetime
from pathlib import Path
from wtforms import Form, BooleanField, StringField, HiddenField, TextAreaField, validators
from functools import wraps
from dotenv import load_dotenv

import json
import sqlite3
import os
import mimetypes
import helpers

load_dotenv()

login_manager = LoginManager()

app = Flask(__name__)

### COMMENT OUT BEFORE DEPLOYING!!!!! ###
# app.debug = True

app.config.update({
    'SECRET_KEY': os.getenv("SECRET_KEY"),
    "OIDC_CLIENT_SECRETS": "client_secrets_test.json" if app.debug else "client_secrets.json",
})

oidc = OpenIDConnect(app)
login_manager.init_app(app)

# Load Lifted configuration
def load_lifted_config():
    with open('lifted_config.json', 'r') as file:
        return json.load(file)

# Update Lifted configuration
def update_lifted_config(new_config):
    with open('lifted_config.json', 'w') as file:
        json.dump(new_config, file, indent=4)

lifted_config = load_lifted_config()
app.jinja_env.globals['lifted_config'] = lifted_config

def get_db_connection():
    conn = sqlite3.connect("db/database.db")
    conn.row_factory = sqlite3.Row
    return conn

class User(UserMixin):
    def __init__(self, name, id):
        self.name = name
        self.id = id
        self.email = id + "@cornell.edu"

    def is_authenticated(self):
        return True

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if is_admin() == False:
            abort(401)
        return f(*args, **kwargs)
    return decorated_function

def is_admin():
    return current_user.id in lifted_config["admins"]

def get_impersonating_status():
    return session.get("impersonating")

@login_manager.user_loader
def load_user(user_id):
    # user_id = "atn45" # use to TEST a user!
    user = User(name=session["given_name"], id=user_id)
    return user

def after_oidc_authorize(sender, **extras):
    oidc_profile = session["oidc_auth_profile"]
    session["given_name"] = oidc_profile["given_name"]
    user = load_user(oidc_profile["sub"])
    login_user(user)
    # app.logger.info(current_user.id, ' logged in successfully')
    print(current_user.id, ' logged in successfully')

signals.after_authorize.connect(after_oidc_authorize)


@app.get("/")
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
            'index.html',
            stats=stats,
            cards_dict=cards_dict,
            ranks_dict=ranks_dict
            )
    else:
        return render_template('index.html', stats=stats)

@app.route("/process-all-cards/<message_group>")
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

@app.route("/get-card-html/<id>")
@login_required
def get_card_html(id):
    card = get_card(id)

    # First check if the user is an admin.  If so, they can bypass all the remaining checks
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401)
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden and the user was not a sender of the card, abort
        elif card["message_group"] in lifted_config["hidden_cards"] and card["sender_email"] != current_user.email:
            abort(401)

    return render_template("card.html", card=card, message_confirmation=request.args.get("message_confirmation"))

@app.route("/get-card-pdf/<id>")
@login_required
def get_card_pdf(id):
    card = get_card(id)
    
    # note: THE LOGIC HERE IS SLIGHTLY DIFFERENT THAN FOR HTML, since we don't want anyone downloading a PDF before its unhidden
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401)
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden, abort
        elif card["message_group"] in lifted_config["hidden_cards"]:
            abort(401)

    helpers.cards_to_pptx_and_pdf([card], card['message_group'] if "override-template" not in request.args else request.args.get("override-template"), f"tmp_output/{id}")

    return send_file(f"tmp_output/{id}.pdf", download_name=f"Lifted Message #{id}", mimetype='application/pdf')

def check_if_can_edit_or_delete(card):
    if is_admin() == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not a sender of the message, abort
        if card["sender_email"] != current_user.email:
            abort(401)
        # So now we know the user is a sender of the message.  However, if the form is closed, abort
        elif card["message_group"] != lifted_config["form_message_group"]:
            abort(401)

@app.route("/edit-message/<id>", methods=["GET", "POST"])
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
            message_group = lifted_config["form_message_group"]
            if message_group == "none":
                return "Haha, nice try :)"
            
            id = conn.execute('update messages set sender_name=?, recipient_name=?, message_content=?  where id=? returning id',
                         (sender_name, recipient_name, message_content, card["id"])).fetchone()
        
        conn.commit()
        conn.close()

        return redirect(url_for('get_card_html', id=id["id"]))
    
    return render_template("send-message.html", form=form, is_edit=True, show_admin_overrides=show_admin_overrides,
                           form_description="<p>Edit your Lifted message.  If you need to change the recipient email, please email us at <a href=mailto:lifted@cornell.edu>lifted@cornell.edu</a></p>",)


@app.route("/delete-message/<id>")
@login_required
def delete_message(id):
    card = get_card(id)
    
    check_if_can_edit_or_delete(card)

    conn = get_db_connection()
    conn.execute('delete from messages where id = ?', (id,))
    conn.commit()
    conn.close()

    if request.args.get("go_to_admin") == "true":
        return redirect(url_for("admin"))
    return redirect(url_for("home"))

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

@app.route("/send-message", methods=["GET", "POST"])
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
            message_group = lifted_config["form_message_group"]
            if message_group == "none":
                return "Haha, nice try :)"
            
            recipient_netID = form.recipient_netid.data.strip()
            if "@" in recipient_netID:
                return "Haha nice try...it must be a valid NetID.  If you want to send something to a non-NetID, email us at lifted@cornell.edu :)"
            recipient_email = recipient_netID + "@cornell.edu"

        if lifted_config["swap_from"] == message_group:
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

        return redirect(url_for('get_card_html', id=id["id"], message_confirmation=True))

    dir_path = f"templates/rich_text/{lifted_config["form_message_group"]}/form.html"
    if Path(dir_path).exists():
        with open(dir_path, 'r', encoding='utf-8') as file:
            form_description = file.read()
        return render_template("send-message.html", form=form, is_edit=False, show_admin_overrides=show_admin_overrides, form_description=form_description)
    
    return render_template("send-message.html", form=form, is_edit=False, show_admin_overrides=show_admin_overrides,
                           form_description="<p>You need to set a form description!</p>",)

@app.route("/people-search")
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
    
@app.route("/admin", methods=['GET', 'POST'])
@login_required
@admin_required
def admin():
    if request.method == "POST":
        return redirect(url_for('admin')) # prevents form resubmission
    
    pptx_templates_files = [os.path.splitext(file)[0] for file in os.listdir("pptx_templates")]
    
    all_cards_files = sorted(os.listdir("all_cards_output"), key=lambda x: os.path.getctime(os.path.join("all_cards_output", x)), reverse=True)
    all_cards_files_dict = {}

    for file in all_cards_files:
        stem = os.path.splitext(file)[0]
        ext = os.path.splitext(file)[1]

        if ext == ".txt":
            with open(f"all_cards_output/{stem}.txt", "r") as file:
                first_line = file.readline()
                for line in file:
                    pass
                last_line = line
                all_cards_files_dict[stem] = {"to_process": first_line,
                                   "done": "",
                                   "pptx_progress": last_line
                                   }
    
    for file in all_cards_files:
        stem = os.path.splitext(file)[0]
        ext = os.path.splitext(file)[1]

        if stem in all_cards_files_dict: # Don't include tmp files or other stuff
            if "~" not in stem and ext in all_cards_files_dict[stem]["to_process"]:
                all_cards_files_dict[stem]["done"] += ext + ", "

    # Swap Prefs Table
    conn = get_db_connection()
    swap_prefs = conn.execute("select * from swap_prefs").fetchall()
    conn.close()

    return render_template("admin.html",
                           all_cards_files_dict=all_cards_files_dict,
                           pptx_templates_files=pptx_templates_files,
                           swap_prefs=swap_prefs)

@app.post("/add-message-group")
@login_required
@admin_required
def add_message_group():
    old_dict = lifted_config["message_group_list_map"]
    new_dict = {}

    for type in ["p", "e"]:
        short_name = request.form["sem"] + "_" + request.form["year"].split("20")[1] + "_" + type
        long_name = ("Fall " if request.form["sem"] == "fa" else "Spring ") + request.form["year"] + (" Physical Lifted" if type == "p" else " eLifted")
        
        if short_name in old_dict:
            return "Error: This message group has already been added!"
        
        new_dict.update({short_name: long_name})
        lifted_config["hidden_cards"].append(short_name)
    
    # Adds the new stuff at the beginning of the old dict
    new_dict.update(old_dict)

    # Sets the old dict to the new one, and then writes the JSON
    lifted_config["message_group_list_map"] = new_dict
    update_lifted_config(lifted_config)

    return redirect(url_for('admin'))

@app.post("/update-hidden-cards/<message_group>")
@login_required
@admin_required
def update_hidden_cards(message_group):
    if request.form.get('hidden-cards') != None: # meaning a checkbox was ticked "on"
        lifted_config["hidden_cards"].append(message_group)
    else: # meaning a checkbox was ticked "off"
        lifted_config["hidden_cards"].remove(message_group)

    update_lifted_config(lifted_config)
    
    return redirect(url_for('admin'))

# NEED TO IMPLEMENT MESSAGE DELETING!!!!
@app.route("/remove-message-group/<message_group>")
@login_required
@admin_required
def remove_message_group(message_group):
    old_dict = lifted_config["message_group_list_map"]
    lifted_config["message_group_list_map"] = {short_name: long_name for short_name, long_name in old_dict.items() if short_name != message_group}
    if message_group in lifted_config["hidden_cards"]:
        lifted_config["hidden_cards"].remove(message_group)
    if lifted_config["form_message_group"] == message_group:
        lifted_config["form_message_group"] = "none"
    update_lifted_config(lifted_config)
    return redirect(url_for('admin'))

@app.post("/update-form-message-group")
@login_required
@admin_required
def update_form_message_group():
    lifted_config["form_message_group"] = request.form.get("form-message-group")
    update_lifted_config(lifted_config)
    return redirect(url_for('admin'))

@app.post("/update-swapping-config")
@login_required
@admin_required
def update_swapping_config():
    lifted_config["swap_from"] = request.form.get("swap-from")
    lifted_config["swap_to"] = request.form.get("swap-to")
    lifted_config["swap_text"] = request.form.get("swap-text")
    update_lifted_config(lifted_config)
    return redirect(url_for('admin'))

@app.route("/swap-messages")
@login_required
def swap_messages():
    swap_from = lifted_config["swap_from"]
    swap_to = lifted_config["swap_to"]

    if swap_from == "none":
        return "Cannot swap at this time.  swap_from=none in Lifted config."

    conn = get_db_connection()
    conn.execute('update messages set message_group=? where message_group=? and recipient_email=?',
                         (swap_to, swap_from, current_user.email))
    conn.execute("insert into swap_prefs (recipient_email, message_group_from, message_group_to) values (?, ?, ?)", (current_user.email, swap_from, swap_to))
    conn.commit()
    conn.close()
    
    return redirect(url_for("home"))

@app.route("/delete-swap-pref/<id>")
@login_required
@admin_required
def delete_swap_pref(id):
    conn = get_db_connection()
    conn.execute('delete from swap_prefs where id = ?', (id,))
    conn.commit()
    conn.close()

    return redirect(url_for("admin"))

@app.post("/save-rich-text/<message_group>/<type>")
@login_required
@admin_required
def save_rich_text(message_group, type):
    data = request.get_json()
    html_content = data["html"]
    delta = data["delta"]
    subject = data["subject"]

    if type == "form":
        html_content = html_content.replace("<p>", "<p style='margin: 0px'>")
    else:
        html_content = html_content.replace("<p>", "<p style='margin: 0px; line-height: 1.5'>")

    if type != "form":
        # html_content = html_content.replace("<p><br></p>", "")

        html_content = html_content.replace("{{LOGO}}", """<img src='https://cornelllifted.com/static/images/logo.png'
                                            style='display: block; max-width: 300px; margin-left: auto; margin-right: auto;'>
                                            """)
                
        html_content = "<div style='background-color: white; padding: 15px; max-width: 1000px; margin-left: auto; margin-right: auto; border-radius: 5px'>" + html_content + "</div>"

        html_content = "<div style='background-color: #cfecf7; padding: 15px;'>" + html_content + "</div>"
    
    
    dir_path = f"templates/rich_text/{message_group}"
    os.makedirs(dir_path, exist_ok=True)

    # Save the HTML to a file
    with open(f'{dir_path}/{type}.html', 'w', encoding='utf-8') as file:
        file.write(html_content)
    
    # Save the Quill delta to a file
    with open(f'{dir_path}/{type}.json', 'w') as file:
        json.dump(delta, file, indent=4)

    with open(f'{dir_path}/{type}.txt', 'w', encoding='utf-8') as file:
        file.write(subject)
    
    if request.args.get("send_email") == "true":
        helpers.send_email(message_group, type, to=[current_user.email])

    return jsonify({'status': 'Rich text saved successfully!'})

@app.route("/get-rich-text/<message_group>/<type>")
@login_required
@admin_required
def get_rich_text(message_group, type):
    dir_path_delta = f"templates/rich_text/{message_group}/{type}.json"
    dir_path_subject = f"templates/rich_text/{message_group}/{type}.txt"

    if Path(dir_path_delta).exists() and Path(dir_path_subject).exists():
        with open(dir_path_delta, 'r') as file:
            delta = file.read()
        with open(dir_path_subject, 'r', encoding='utf-8') as file:
            subject = file.read()

        return jsonify({'status': 'found',
                        'delta': delta,
                        'subject': subject})
    else:
        return jsonify({'status': 'no files found'}) 

@app.route("/get-all-cards/<filename>")
@login_required
@admin_required
def get_all_cards(filename):
    return send_file(f"all_cards_output/{filename}", mimetype=mimetypes.guess_type(filename)[0])

@app.route("/get-pptx-template/<message_group>")
@login_required
@admin_required
def get_pptx_template(message_group):
    return send_file(f"pptx_templates/{message_group}", mimetype=mimetypes.guess_type(message_group)[0])

@app.post("/upload-pptx-template/<message_group>")
@login_required
@admin_required
def upload_pptx_template(message_group):
    file = request.files['file']
    if os.path.splitext(file.filename)[1] != ".pptx":
        return "You need to upload a PPTX file!!"
    file.save(f"pptx_templates/{message_group}.pptx")
    return redirect(url_for('admin'))

@app.route("/query-messages")
@login_required
@admin_required
def query_messages():
    query = request.args.get("q")
    message_group = request.args.get("mg")

    conn = get_db_connection()

    query_sql = ""

    if message_group == "all":
        if query != "":
            query_sql = "where (recipient_email like ? or sender_email like ?) "
            bindings = (f"%{query}%", f"%{query}%",)

        sql = "select * from messages " + query_sql + "order by created_timestamp desc"
        results = conn.execute(sql, bindings).fetchall() if query != "" else conn.execute(sql).fetchall()
    else:
        bindings = (message_group,)

        if query != "":
            query_sql = "(recipient_email like ? or sender_email like ?) and "
            bindings = (f"%{query}%", f"%{query}%", message_group,)

        sql = "select * from messages where " + query_sql + "message_group=? order by created_timestamp desc"
        results = conn.execute(sql, bindings).fetchall()
    
    conn.close()

    if len(results) == 0:
        return jsonify({"results": "none"})
    
    return jsonify({"results": [{attr: result[attr] for attr in result.keys()} for result in results]})

@app.post("/impersonate")
@login_required
@admin_required
def impersonate():
    netID = request.form.get("impersonate_netid")
    user = load_user(netID)
    login_user(user)
    session["impersonating"] = True
    return redirect(url_for("home"))

@app.route("/end-impersonate")
def end_impersonate():
    logout_user()
    session["impersonating"] = False
    return redirect(url_for("home"))

@app.post("/add-admin")
@login_required
@admin_required
def add_admin():
    lifted_config["admins"].append(request.form.get("admin_add"))
    update_lifted_config(lifted_config)
    return redirect(url_for('admin'))

@app.route("/remove-admin/<admin>")
@login_required
@admin_required
def remove_admin(admin):
    if admin in lifted_config["admins"]:
        lifted_config["admins"].remove(admin)
    update_lifted_config(lifted_config)
    return redirect(url_for('admin'))

@app.errorhandler(HTTPException)
def handle_exception(e):    
    error_code = e.code
    error_message_title = e.name
    error_message_body = e.description
    
    if hasattr(current_user, "id"):
        print(current_user.id, ' had an error ', e.code)
    
    if e.code == 400:
        error_code = "In other words, the server did not like something you just sent it.  Like if you sent your ex a Lifted message, they would probably not like it (please do that at your own risk — we are not endorsing this).  Or, if you were trying to reverse-engineer this web app, that's why you might be here.  Otherwise, I don't know what to tell you, it's probably something wrong on our end, so you should email us below."
    
    if e.code == 401 or 403:
        error_message_human_body = "In other words, you are either not logged in or you are trying to access a Lifted message that's not yours (don't do that!).  After Lifted Day, recipients' messages are for their eyes only...please ensure you're logged in and try again.  You might also wind up here if someone tried to share their message with you by sending you this link — tell them they need to download the pdf or screenshot it and send it to you that way instead!"
    
    if e.code == 404:
        error_message_human_body = "In other words, this page or Lifted message just simply does not exist.  Not sure how you ended up here, but you probably did something wrong.  Or sneaky, like trying to increase the number in the URL to see if you had extra Lifted messages.  Or maybe it was our fault and you're missing messages.  Idk.  Send us an email below if you're not sure and we'll check it out!"
    
    if e.code == 500:
        error_message_human_body = "In other words, something on our end went very wrong.  You probably didn't do anything wrong.  Although I am an InfoSci major, this is the first major web app I've built, so there's a good chance I missed some weird edge case.  Send me an email below and I'll look into it!"
    
    return render_template(
        "error.html",
        error_code=error_code,
        error_message_title=error_message_title,
        error_message_body=error_message_body,
        error_message_human_body=error_message_human_body
        ), error_code

app.jinja_env.globals.update(zip=zip)
app.jinja_env.globals.update(is_admin=is_admin)
app.jinja_env.globals.update(get_impersonating_status=get_impersonating_status)

@app.template_filter('ordinal')
def ordinal(num):
    if 10 <= num % 100 <= 20:
        suffix = 'th'
    else:
        suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(num % 10, 'th')
    return str(num) + suffix

if __name__ == '__main__':  
    # app.run(host='127.0.0.1', debug=app.debug, ssl_context="adhoc")
    # app.run(host='127.0.0.1', debug=app.debug, ssl_context=('cert.pem', 'key.pem'))
    serve(app, host='0.0.0.0', port=5000, url_scheme='https', threads=100)