from flask import redirect, send_file, session, abort, jsonify, request, url_for, Blueprint, current_app
from flask_login import login_user, login_required, current_user, logout_user
from pathlib import Path
from datetime import datetime

import json
import os
import mimetypes
import helpers
from db.repositories import (
    get_cards_with_attachments,
    list_logs_desc,
    list_recently_deleted_messages_desc,
    get_google_slides_presentation_id,
    upsert_google_slides_id,
    get_attachment_prefs_with_attachment,
    delete_attachment_by_id,
    create_attachment,
    list_swap_prefs,
    delete_swap_pref_by_id,
    browse_messages as browse_messages_repo,
    list_admins,
    add_admin as add_admin_repo,
    delete_admin,
    list_hidden_card_overrides_desc,
    add_hidden_card_override as add_hidden_card_override_repo,
    delete_hidden_card_override,
)

from app import admin_required, update_lifted_config, load_user, sync_admin_permissions_for_session, clear_admin_permissions_from_session, db_call

admin = Blueprint('admin', __name__, static_folder='static')

@admin.route("/api/admin/logs")
@login_required
@admin_required(write_required=False)
def logs_page():
    logs = db_call(list_logs_desc)
    recently_deleted_messages = db_call(list_recently_deleted_messages_desc)

    return jsonify({
        "logs": logs,
        "recently_deleted_messages": recently_deleted_messages
    })

### Message Groups

@admin.post("/api/admin/add-message-group")
@login_required
@admin_required(write_required=True)
def add_message_group():
    old_dict = current_app.config["lifted_config"]["message_group_list_map"]
    new_dict = {}

    request_data = json.loads(request.data)

    for type in ["p", "e"]:
        short_name = request_data["semester"] + "_" + str(request_data["year"]).split("20")[1] + "_" + type
        long_name = ("Fall " if request_data["semester"] == "fa" else "Spring ") + str(request_data["year"]) + (" Physical Lifted" if type == "p" else " eLifted")

        if short_name in old_dict:
            return jsonify({"status": "Message group already exists!"}), 400

        new_dict.update({short_name: long_name})
        current_app.config["lifted_config"]["hidden_cards"].append(short_name)
    
    # Adds the new stuff at the beginning of the old dict
    new_dict.update(old_dict)

    # Sets the old dict to the new one, and then writes the JSON
    current_app.config["lifted_config"]["message_group_list_map"] = new_dict
    update_lifted_config(current_app.config["lifted_config"])

    return jsonify({"status": "Message group added successfully!"})

@admin.post("/api/admin/update-hidden-cards/<message_group>")
@login_required
@admin_required(write_required=True)
def update_hidden_cards(message_group):
    if json.loads(request.data).get('hidden-cards'): # meaning a checkbox was ticked "on"
        current_app.config["lifted_config"]["hidden_cards"].append(message_group)
    else: # meaning a checkbox was ticked "off"
        current_app.config["lifted_config"]["hidden_cards"].remove(message_group)

    update_lifted_config(current_app.config["lifted_config"])

    return jsonify({"status": "Hidden cards updated successfully!"})

# NEED TO IMPLEMENT MESSAGE DELETING!!!!
@admin.route("/api/admin/remove-message-group/<message_group>")
@login_required
@admin_required(write_required=True)
def remove_message_group(message_group):
    old_dict = current_app.config["lifted_config"]["message_group_list_map"]
    current_app.config["lifted_config"]["message_group_list_map"] = {short_name: long_name for short_name, long_name in old_dict.items() if short_name != message_group}
    if message_group in current_app.config["lifted_config"]["hidden_cards"]:
        current_app.config["lifted_config"]["hidden_cards"].remove(message_group)
    if current_app.config["lifted_config"]["form_message_group"] == message_group:
        current_app.config["lifted_config"]["form_message_group"] = "none"
    update_lifted_config(current_app.config["lifted_config"])
    return jsonify({"status": "Message group removed successfully!"})

@admin.route("/api/admin/get-google-slides-id/<message_group>")
@login_required
@admin_required(write_required=False)
def get_google_slides_id(message_group):
    presentation_id = db_call(get_google_slides_presentation_id, message_group)

    if presentation_id:
        return jsonify({"presentation_id": presentation_id})
    return jsonify({"presentation_id": None})

@admin.post("/api/admin/save-google-slides-id/<message_group>")
@login_required
@admin_required(write_required=True)
def save_google_slides_id(message_group):
    import re
    url = request.form.get('url', '')
    
    # Extract presentation ID from various Google Slides URL formats
    # Format 1: https://docs.google.com/presentation/d/{ID}/edit...
    # Format 2: Just the ID itself
    match = re.search(r'/presentation/d/([a-zA-Z0-9-_]+)', url)
    if match:
        presentation_id = match.group(1)
    elif re.match(r'^[a-zA-Z0-9-_]+$', url):
        # If it's just an ID
        presentation_id = url
    else:
        return jsonify({"status": "error", "message": "Invalid Google Slides URL or ID"}), 400
    
    db_call(upsert_google_slides_id, message_group, presentation_id)

    return jsonify({"status": "success", "presentation_id": presentation_id})

### Form and Email

@admin.post("/api/admin/update-form-message-group")
@login_required
@admin_required(write_required=True)
def update_form_message_group():
    current_app.config["lifted_config"]["form_message_group"] = request.form.get("form-message-group")
    update_lifted_config(current_app.config["lifted_config"])
    return jsonify({"status": "Form message group updated successfully!"})

@admin.post("/api/admin/save-rich-text/<message_group>/<type>")
@login_required
@admin_required(write_required=True)
def save_rich_text(message_group, type):
    data = request.get_json()
    html_content = data["html"]
    subject = data["subject"]

    if type == "form":
        html_content = html_content.replace("<p>", "<p style='margin: 0px'>")

    dir_path = f"templates/rich_text/{message_group}"
    os.makedirs(dir_path, exist_ok=True)

    # Save the raw HTML to a file (without email template wrapper)
    with open(f'{dir_path}/{type}.html', 'w', encoding='utf-8') as file:
        file.write(html_content)

    with open(f'{dir_path}/{type}.txt', 'w', encoding='utf-8') as file:
        file.write(subject)
    
    if request.args.get("send_email") == "true":
        helpers.send_email(message_group, type, to=[current_user.email])

    return jsonify({'status': 'Rich text saved successfully!'})

@admin.route("/api/admin/get-rich-text/<message_group>/<type>")
@login_required
@admin_required(write_required=False)
def get_rich_text(message_group, type):
    dir_path_html = f"templates/rich_text/{message_group}/{type}.html"
    dir_path_subject = f"templates/rich_text/{message_group}/{type}.txt"

    if Path(dir_path_html).exists() and Path(dir_path_subject).exists():
        with open(dir_path_html, 'r', encoding='utf-8') as file:
            html = file.read()
        with open(dir_path_subject, 'r', encoding='utf-8') as file:
            subject = file.read()

        return jsonify({'status': 'found',
                        'json': None,
                        'html': html,
                        'subject': subject})
    else:
        return jsonify({'status': 'no files found'})

@admin.route("/api/admin/preview-email/<message_group>/<type>")
@login_required
@admin_required(write_required=False)
def preview_email(message_group, type):
    """Return the full rendered email HTML for preview from saved files"""
    dir_path_html = f"templates/rich_text/{message_group}/{type}.html"
    
    if Path(dir_path_html).exists():
        with open(dir_path_html, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        # Use the same email template wrapper as actual emails
        full_email_html = helpers.process_html_for_email(html_content, message_group)
        return full_email_html, 200, {'Content-Type': 'text/html; charset=utf-8'}
    else:
        return "<html><body><p>No email template found</p></body></html>", 404, {'Content-Type': 'text/html; charset=utf-8'}

@admin.post("/api/admin/preview-email-live")
@login_required
@admin_required(write_required=False)
def preview_email_live():
    """Return the full rendered email HTML for live preview with provided HTML content"""
    data = request.get_json()
    html_content = data.get("html", "")
    message_group = data.get("message_group", None)
    
    if not html_content:
        return "<html><body><p>No content provided</p></body></html>", 200, {'Content-Type': 'text/html; charset=utf-8'}
    
    # Use the same email template wrapper as actual emails
    full_email_html = helpers.process_html_for_email(html_content, message_group)
    return full_email_html, 200, {'Content-Type': 'text/html; charset=utf-8'}

### Attachments

@admin.route("/api/admin/get-attachment-prefs/<message_group>")
@login_required
@admin_required(write_required=False)
def get_attachment_prefs(message_group):
    attachment_prefs = db_call(get_attachment_prefs_with_attachment, message_group)
    return jsonify({"attachment_prefs": attachment_prefs})

@admin.post("/api/admin/update-attachment-message-group")
@login_required
@admin_required(write_required=True)
def update_attachment_message_group():
    current_app.config["lifted_config"]["attachment_message_group"] = request.form.get("attachment-message-group")
    update_lifted_config(current_app.config["lifted_config"])
    return jsonify({"status": "Attachment message group updated successfully!"})

@admin.route("/api/admin/delete-attachment/<id>")
@login_required
@admin_required(write_required=True)
def delete_attachment(id):
    db_call(delete_attachment_by_id, id)
    return jsonify({"status": "Attachment deleted successfully!"})

@admin.post("/api/admin/add-attachment/<message_group>")
@login_required
@admin_required(write_required=True)
def add_attachment(message_group):
    attachment = request.form["attachment-name"]
    count = request.form["attachment-count"]
    db_call(create_attachment, message_group, attachment, count)
    return jsonify({"status": "Attachment added successfully!"})

### Swapping

@admin.get("/api/admin/get-swap-prefs")
@login_required
@admin_required(write_required=False)
def get_swap_prefs():
    swap_prefs = db_call(list_swap_prefs)
    return jsonify({"swap_prefs": swap_prefs})

@admin.post("/api/admin/update-swapping-config")
@login_required
@admin_required(write_required=True)
def update_swapping_config():
    current_app.config["lifted_config"]["swap_from"] = request.form.get("swap-from")
    current_app.config["lifted_config"]["swap_to"] = request.form.get("swap-to")
    current_app.config["lifted_config"]["swap_text"] = request.form.get("swap-text")
    update_lifted_config(current_app.config["lifted_config"])
    return jsonify({"status": "Swapping config updated successfully!"})

@admin.post("/api/admin/update-theme")
@login_required
@admin_required(write_required=True)
def update_theme():
    request_data = json.loads(request.data)
    theme = request_data.get("theme")
    
    if theme not in ["fall", "spring"]:
        return jsonify({"status": "Invalid theme. Must be 'fall' or 'spring'"}), 400
    
    current_app.config["lifted_config"]["theme"] = theme
    update_lifted_config(current_app.config["lifted_config"])
    return jsonify({"status": "Theme updated successfully!"})

@admin.route("/api/admin/delete-swap-pref/<id>")
@login_required
@admin_required(write_required=True)
def delete_swap_pref(id):
    # The below code will move all the eLifted messages back to physical, but I recommend we don't use this
    # because it can be problematic (e.g., we don't want to move eLifted messages to physical that were sent after the physical deadline)
    # swap_pref = conn.execute('select * from swap_prefs where id = ?', (id,)).fetchone()
    # conn.execute('update messages set message_group=? where message_group=? and recipient_email=?',
    #                      (swap_pref["message_group_from"], swap_pref["message_group_to"], swap_pref["recipient_email"]))
    
    db_call(delete_swap_pref_by_id, id)

    return jsonify({"status": "Swap pref deleted successfully!"})

### Browse Messages

@admin.route("/api/admin/browse-messages")
@login_required
@admin_required(write_required=False)
def browse_messages():
    query = request.args.get("q")
    message_group = request.args.get("mg")

    if current_user.id != "rf377":
        helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Queried '{query}' for {message_group}")

    results = db_call(browse_messages_repo, message_group, query)

    if len(results) == 0:
        return jsonify({"results": "none"})
    
    return jsonify({"results": results})

### Process Cards

@admin.route("/api/admin/get-all-cards/<filename>")
@login_required
@admin_required(write_required=False)
def get_all_cards(filename):
    return send_file(f"all_cards_output/{filename}", mimetype=mimetypes.guess_type(filename)[0])

@admin.route("/api/admin/get-process-status")
@login_required
@admin_required(write_required=True)
def get_process_status():
    all_cards_files = sorted(
        os.listdir("all_cards_output"),
        key=lambda x: os.path.getctime(os.path.join("all_cards_output", x)),
        reverse=True
    )
    result = []

    for file in all_cards_files:
        stem, ext = os.path.splitext(file)
        if ext == ".txt":
            txt_path = os.path.join("all_cards_output", file)
            with open(txt_path, "r") as f:
                first_line = f.readline().strip()
                last_line = ""
                for line in f:
                    last_line = line.strip()
            # Extract message_group and timestamp
            if " " in stem:
                message_group, timestamp_raw = stem.split(" ", 1)
            else:
                message_group, timestamp_raw = stem, ""
            # Format timestamp to ISO 8601 if possible
            try:
                dt = datetime.strptime(timestamp_raw, "%m-%d-%Y at %H-%M-%S")
                timestamp = dt.strftime("%Y-%m-%dT%H:%M:%S")
            except Exception:
                timestamp = timestamp_raw
            # Find done extensions
            done = ""
            for ext_file in all_cards_files:
                ext_stem, ext_ext = os.path.splitext(ext_file)
                if ext_stem == stem and "~" not in ext_stem and ext_ext in first_line:
                    done += ext_ext + ", "
            result.append({
                "filename": stem,
                "timestamp": timestamp,
                "message_group": message_group,
                "to_process": first_line,
                "done": done,
                "pptx_progress": last_line
            })

    # Sort result by timestamp
    result_sorted = sorted(result, key=lambda x: x["timestamp"], reverse=True)
    return jsonify(result_sorted)

@admin.route("/api/admin/process-all-cards/<message_group>")
@login_required
@admin_required(write_required=True)
def process_all_cards(message_group):
    print("Starting task")
    
    # Get the Google Slides presentation ID
    presentation_id = db_call(get_google_slides_presentation_id, message_group)

    if not presentation_id:
        return jsonify({"status": "error", "message": "No Google Slides template found for this message group"}), 404
    
    cards = db_call(get_cards_with_attachments, message_group)
    
    # Sort alphabetically by netid (letters then numbers) if requested
    if request.args.get('alphabetical') == "true":
        import re
        def netid_sort_key(card):
            email = card['recipient_email']
            # Extract letters and numbers from email prefix (before @)
            match = re.match(r'^([a-z]+)(\d+)', email)
            if match:
                letters, numbers = match.groups()
                return (letters, int(numbers))
            return (email, 0)  # fallback for non-standard format
        cards = sorted(cards, key=netid_sort_key)
    
    if len(cards) == 0:
        return jsonify({"status": "error", "message": "No cards found"}), 404

    output_filepath = "all_cards_output/" + message_group + datetime.now().strftime(" %m-%d-%Y at %H-%M-%S")
    
    should_process_pptx_pdf = True if request.args.get("pptx-pdf") == "true" else False

    with open(f"{output_filepath}.txt", "w") as file:
        file.write(f".csv{', .pptx, .pdf' if should_process_pptx_pdf == True else ''}\n0% starting")
    
    helpers.create_csv(cards, output_filepath)

    if should_process_pptx_pdf:
        import google_tools
        google_tools.cards_to_pdf(presentation_id, [dict(card) for card in cards], output_filepath)
    
    return jsonify({"status": "Processing started!"})

### Impersonation

@admin.post("/api/admin/impersonate")
@login_required
@admin_required(write_required=True)
def impersonate():
    netID = request.form.get("impersonate_netid")
    sync_admin_permissions_for_session(netID)
    user = load_user(netID)
    login_user(user)
    session["impersonating"] = True
    return jsonify({"status": f"Now impersonating {netID}!"})

@admin.route("/api/admin/end-impersonate")
def end_impersonate():
    logout_user()
    session["impersonating"] = False
    clear_admin_permissions_from_session()
    return jsonify({"status": "No longer impersonating."})

### Admins

def fetch_admins_from_db():
    admins = list(reversed(db_call(list_admins)))
    return admins

@admin.route("/api/admin/get-admins")
@login_required
@admin_required(write_required=False)
def get_admins():
    admins = fetch_admins_from_db()
    return jsonify({"admins": admins})

@admin.post("/api/admin/add-admin")
@login_required
@admin_required(write_required=True)
def add_admin():
    netID = request.form["admin_netid"]
    write_perm = True if request.form.get("admin_write_perm") else False
    db_call(add_admin_repo, netID, write_perm)
    admins = fetch_admins_from_db()
    return jsonify({"admins": admins})

@admin.post("/api/admin/remove-admin/<id>")
@login_required
@admin_required(write_required=True)
def remove_admin(id):
    db_call(delete_admin, id)
    admins = fetch_admins_from_db()
    return jsonify({"admins": admins})

### Hidden Card Overrides

def fetch_hidden_card_overrides_from_db():
    hidden_card_overrides = db_call(list_hidden_card_overrides_desc)
    return hidden_card_overrides

@admin.route("/api/admin/get-hidden-card-overrides")
@login_required
@admin_required(write_required=False)
def get_hidden_card_overrides():
    hidden_card_overrides = fetch_hidden_card_overrides_from_db()
    return jsonify({"hidden_card_overrides": hidden_card_overrides})

@admin.post("/api/admin/add-hidden-card-override")
@login_required
@admin_required(write_required=True)
def add_hidden_card_override():
    message_group = request.form["hidden-card-message-group-input"]
    recipient_email = request.form["hidden-card-email-input"]
    db_call(add_hidden_card_override_repo, recipient_email, message_group)
    hidden_card_overrides = fetch_hidden_card_overrides_from_db()
    return jsonify({"hidden_card_overrides": hidden_card_overrides})

@admin.post("/api/admin/remove-hidden-card-override/<id>")
@login_required
@admin_required(write_required=True)
def remove_hidden_card_override(id):
    db_call(delete_hidden_card_override, id)
    hidden_card_overrides = fetch_hidden_card_overrides_from_db()
    return jsonify({"hidden_card_overrides": hidden_card_overrides})