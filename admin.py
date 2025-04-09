from flask import redirect, send_file, render_template, session, abort, jsonify, request, url_for, Blueprint, current_app
from flask_login import login_user, login_required, current_user, logout_user
from pathlib import Path
from datetime import datetime

import json
import os
import mimetypes
import helpers

from app import admin_required, update_lifted_config, get_db_connection, load_user

admin = Blueprint('admin', __name__, template_folder='templates', static_folder='static')

@admin.route("/admin", methods=['GET', 'POST'])
@login_required
@admin_required
def admin_page():
    if request.method == "POST":
        return redirect(url_for('admin.admin_page')) # prevents form resubmission
    
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

    # Attachments Table
    conn = get_db_connection()
    attachments = conn.execute("select * from attachments").fetchall()
    conn.close()

    # Attachment Prefs Table
    conn = get_db_connection()
    attachment_prefs = conn.execute("select * from attachment_prefs").fetchall()
    conn.close()

    return render_template("admin.html",
                           all_cards_files_dict=all_cards_files_dict,
                           pptx_templates_files=pptx_templates_files,
                           swap_prefs=swap_prefs,
                           attachments=attachments,
                           attachment_prefs=attachment_prefs)

@admin.post("/add-message-group")
@login_required
@admin_required
def add_message_group():
    old_dict = current_app.config["lifted_config"]["message_group_list_map"]
    new_dict = {}

    for type in ["p", "e"]:
        short_name = request.form["sem"] + "_" + request.form["year"].split("20")[1] + "_" + type
        long_name = ("Fall " if request.form["sem"] == "fa" else "Spring ") + request.form["year"] + (" Physical Lifted" if type == "p" else " eLifted")
        
        if short_name in old_dict:
            return "Error: This message group has already been added!"
        
        new_dict.update({short_name: long_name})
        current_app.config["lifted_config"]["hidden_cards"].append(short_name)
    
    # Adds the new stuff at the beginning of the old dict
    new_dict.update(old_dict)

    # Sets the old dict to the new one, and then writes the JSON
    current_app.config["lifted_config"]["message_group_list_map"] = new_dict
    update_lifted_config(current_app.config["lifted_config"])

    return redirect(url_for('admin.admin_page'))

@admin.post("/update-hidden-cards/<message_group>")
@login_required
@admin_required
def update_hidden_cards(message_group):
    if request.form.get('hidden-cards') != None: # meaning a checkbox was ticked "on"
        current_app.config["lifted_config"]["hidden_cards"].append(message_group)
    else: # meaning a checkbox was ticked "off"
        current_app.config["lifted_config"]["hidden_cards"].remove(message_group)

    update_lifted_config(current_app.config["lifted_config"])
    
    return redirect(url_for('admin.admin_page'))

# NEED TO IMPLEMENT MESSAGE DELETING!!!!
@admin.route("/remove-message-group/<message_group>")
@login_required
@admin_required
def remove_message_group(message_group):
    old_dict = current_app.config["lifted_config"]["message_group_list_map"]
    current_app.config["lifted_config"]["message_group_list_map"] = {short_name: long_name for short_name, long_name in old_dict.items() if short_name != message_group}
    if message_group in current_app.config["lifted_config"]["hidden_cards"]:
        current_app.config["lifted_config"]["hidden_cards"].remove(message_group)
    if current_app.config["lifted_config"]["form_message_group"] == message_group:
        current_app.config["lifted_config"]["form_message_group"] = "none"
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))

@admin.post("/update-form-message-group")
@login_required
@admin_required
def update_form_message_group():
    current_app.config["lifted_config"]["form_message_group"] = request.form.get("form-message-group")
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))

@admin.post("/update-attachment-message-group")
@login_required
@admin_required
def update_attachment_message_group():
    current_app.config["lifted_config"]["attachment_message_group"] = request.form.get("attachment-message-group")
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))

@admin.route("/delete-attachment/<attachment>")
@login_required
@admin_required
def delete_attachment(attachment):
    conn = get_db_connection()
    conn.execute('delete from attachments where attachment = ?', (attachment,))
    conn.commit()
    conn.close()

    return redirect(url_for("admin.admin_page"))

@admin.post("/add-attachment")
@login_required
@admin_required
def add_attachment():
    attachment = request.form["attachment-name"]
    count = request.form["attachment-count"]

    conn = get_db_connection()
    conn.execute("insert into attachments (attachment, count) values (?, ?)", (attachment, count))
    conn.commit()
    conn.close()
    
    return redirect(url_for("admin.admin_page"))

@admin.post("/update-swapping-config")
@login_required
@admin_required
def update_swapping_config():
    current_app.config["lifted_config"]["swap_from"] = request.form.get("swap-from")
    current_app.config["lifted_config"]["swap_to"] = request.form.get("swap-to")
    current_app.config["lifted_config"]["swap_text"] = request.form.get("swap-text")
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))

@admin.route("/delete-swap-pref/<id>")
@login_required
@admin_required
def delete_swap_pref(id):
    conn = get_db_connection()
    conn.execute('delete from swap_prefs where id = ?', (id,))
    conn.commit()
    conn.close()

    return redirect(url_for("admin.admin_page"))

@admin.post("/save-rich-text/<message_group>/<type>")
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

@admin.route("/get-rich-text/<message_group>/<type>")
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

@admin.route("/get-all-cards/<filename>")
@login_required
@admin_required
def get_all_cards(filename):
    return send_file(f"all_cards_output/{filename}", mimetype=mimetypes.guess_type(filename)[0])

@admin.route("/get-pptx-template/<message_group>")
@login_required
@admin_required
def get_pptx_template(message_group):
    return send_file(f"pptx_templates/{message_group}", mimetype=mimetypes.guess_type(message_group)[0])

@admin.post("/upload-pptx-template/<message_group>")
@login_required
@admin_required
def upload_pptx_template(message_group):
    file = request.files['file']
    if os.path.splitext(file.filename)[1] != ".pptx":
        return "You need to upload a PPTX file!!"
    file.save(f"pptx_templates/{message_group}.pptx")
    return redirect(url_for('admin.admin_page'))

@admin.route("/query-messages")
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

@admin.route("/process-all-cards/<message_group>")
@login_required
@admin_required
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
        file.write(f".csv{', .pptx, .pdf' if should_process_pptx_pdf == True else ''}\n0%")
    
    helpers.create_csv(cards, output_filepath)

    if should_process_pptx_pdf:
        helpers.cards_to_pptx_and_pdf(cards, message_group, output_filepath)
    
    return "Done!"

@admin.post("/impersonate")
@login_required
@admin_required
def impersonate():
    netID = request.form.get("impersonate_netid")
    user = load_user(netID)
    login_user(user)
    session["impersonating"] = True
    return redirect(url_for("core.messages"))

@admin.route("/end-impersonate")
def end_impersonate():
    logout_user()
    session["impersonating"] = False
    return redirect(url_for("core.messages"))

@admin.post("/add-admin")
@login_required
@admin_required
def add_admin():
    current_app.config["lifted_config"]["admins"].append(request.form.get("admin_add"))
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))

@admin.route("/remove-admin/<admin>")
@login_required
@admin_required
def remove_admin(admin):
    if admin in current_app.config["lifted_config"]["admins"]:
        current_app.config["lifted_config"]["admins"].remove(admin)
    update_lifted_config(current_app.config["lifted_config"])
    return redirect(url_for('admin.admin_page'))