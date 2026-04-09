from flask import redirect, send_file, abort, jsonify, request, url_for, Blueprint, current_app, session
from flask_login import login_required, current_user
import ldap3
from pathlib import Path

import os
import helpers
import google_tools
from db.repositories import (
    get_messages_payload,
    get_card_payload,
    claim_attachment,
    return_attachment,
    get_analytics_payload,
    get_attachment_pref as get_attachment_pref_repo,
    list_attachments_for_message_group,
    update_attachment_pref,
    create_attachment_pref,
    get_attachment_pref_by_id,
    delete_attachment_pref_by_id,
    get_google_slides_presentation_id,
    update_message_by_id,
    delete_message_by_id,
    insert_recently_deleted_message,
    get_swap_pref,
    insert_message,
    update_messages_group_for_recipient,
    create_swap_pref,
)

from app import get_admin_permissions_for_netid, db_call
import json

core = Blueprint('core', __name__, static_folder='static')

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
                     "is_admin": current_user.is_admin,
                     "admin_write_perm": current_user.admin_write_perm}
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
    stats = helpers.get_lifted_stats()

    return jsonify({
        "stats": {
            "total_received": stats["total_received"],
            "unique_received": stats["unique_received"],
            "unique_sent": stats["unique_sent"]
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

@core.get("/api/messages")
@login_required
def get_messages():
    if current_user.is_authenticated: # changed from "g.oidc_user.logged_in"
        current_attachment_message_group = current_app.config["lifted_config"]["attachment_message_group"]

        data = db_call(
            get_messages_payload,
            target_email=current_user.email,
            message_group_filter=current_attachment_message_group,
        )

        received_cards = data['received_cards']
        sent_cards = data['sent_cards']
        received_ranks = data['received_ranks']
        sent_ranks = data['sent_ranks']
        hidden_card_overrides = data['hidden_card_overrides'] # Already a list of strings
        attachments = data['attachments']
        attachment_prefs = data['attachment_prefs']

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
            build["event"] = event

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
    attachment_pref = db_call(get_attachment_pref_repo, current_user.email, message_group)

    if attachment_pref is None:
        return jsonify({"attachment_pref": None})
    return jsonify({"attachment_pref": attachment_pref})

@core.route("/api/get-attachments/<message_group>")
@login_required
def get_attachments(message_group):
    attachments = db_call(list_attachments_for_message_group, message_group)

    return jsonify({"attachments": attachments})

@core.post("/api/set-attachment-pref")
@login_required
def set_attachment():
    attachment_id = request.form["id"]
    message_group = current_app.config["lifted_config"]["attachment_message_group"]

    # 2. Try to CLAIM the attachment atomically
    claim_success = db_call(claim_attachment, attachment_id)

    # claim_response.data will be True if successful, False if count was 0
    if not claim_success:
        return f"Sorry, there are no more of this attachment left :("

    # 3. Check for existing preference (to swap)
    prev_attachment = db_call(get_attachment_pref_repo, current_user.email, message_group)

    if prev_attachment:
        # 4A. SWAP: Update existing preference
        db_call(update_attachment_pref, current_user.email, message_group, attachment_id)

        # 4B. RESTOCK: Return the old attachment to inventory
        old_attachment_id = prev_attachment["attachment_id"]
        db_call(return_attachment, old_attachment_id)

    else:
        # 5. INSERT: New preference
        config_msg_group = current_app.config["lifted_config"]["attachment_message_group"]
        
        db_call(create_attachment_pref, current_user.email, config_msg_group, attachment_id)

    return jsonify({"status": "success"})

@core.route("/api/delete-attachment-pref/<id>")
@login_required
def delete_attachment_pref(id):
    attachment_pref = db_call(get_attachment_pref_by_id, id)

    if attachment_pref is None:
        abort(404, "Attachment preference DNE")

    if attachment_pref["recipient_email"] == current_user.email or current_user.admin_write_perm:
        db_call(return_attachment, attachment_pref["attachment_id"])
        db_call(delete_attachment_pref_by_id, id)

        return jsonify({"status": "success"})

    abort(401, "Not your account")

def get_card(id):
    data = db_call(
        get_card_payload,
        card_id=id,
        lookup_email=current_user.email,
    )

    card = data['card']
    # This will automatically be None if the row doesn't exist
    hidden_card_overrides = data['overrides']

    if card is None:
        abort(404, "Card DNE")
    
    return card, hidden_card_overrides

@core.route("/api/get-card-json/<id>")
@login_required
def get_card_json(id):
    card, hidden_card_overrides = get_card(id)

    # First check if the user is an admin.  If so, they can bypass all the remaining checks
    if current_user.is_admin == False:
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
        "sender_email": card["sender_email"] if current_user.email == card["sender_email"] or current_user.is_admin else "nice try :)",
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
    if current_user.is_admin == False:
        # Ok, so we know the user is not an admin.  Now, if the user is not either a sender or a recipient of the message, abort
        if card["sender_email"] != current_user.email and card["recipient_email"] != current_user.email:
            abort(401, "Not your card")
        # So now we know the user is affiliated with the message in some way.  However, if the cards are hidden, abort
        elif card["message_group"] in current_app.config["lifted_config"]["hidden_cards"] and card["message_group"] not in hidden_card_overrides:
            abort(401, "Hidden Card")

    override_template = request.args.get("override-template", False)
    message_group = override_template if override_template else card['message_group']

    # Get the Google Slides presentation ID for this message group
    presentation_id = db_call(get_google_slides_presentation_id, message_group)
    
    if not presentation_id:
        abort(404, "No Google Slides template found for this message group")
    
    # Check if this is a test card (IDs 12870 or 16193) and we need to generate for all attachment templates
    is_test_card = id in ["12870", "16193"]
    
    if is_test_card and override_template:
        # Fetch all attachments for this message group
        attachments = db_call(list_attachments_for_message_group, message_group)
        
        # Create test cards for default + each attachment
        test_cards = []
        
        # Default card (no attachment)
        base_message = card['message_content']
        default_card = dict(card)
        default_card['message_content'] = f"This slide is for template: Default (no attachment)\n\n{base_message}"
        default_card['attachment_id'] = None
        test_cards.append(default_card)
        
        # Attachment-specific cards
        for attachment in attachments:
            attachment_card = dict(card)
            attachment_card['message_content'] = f"This slide is for template: {attachment['attachment']} ({attachment['id']})\n\n{base_message}"
            attachment_card['attachment_id'] = attachment['id']
            test_cards.append(attachment_card)
        
        # Generate PDF with all test cards
        filepath = os.path.join("single_card_output", message_group, f"test_{id}")
        download_name = f"Test Card {id} - All Templates"
        
        google_tools.cards_to_pdf(
            presentation_id=presentation_id,
            cards=test_cards,
            output_filepath=filepath,
            message_group=message_group  # Use the override template's message_group
        )
        
        return send_file(filepath + ".pdf", download_name=download_name, mimetype='application/pdf')
        
    # Normal single card handling
    filepath = os.path.join("single_card_output", message_group, str(id))
    download_name=f"Lifted Message #{id} From {card['sender_email']}"

    # Get a cached version if it exists, otherwise get a fresh copy via Google Slides
    if os.path.isfile(filepath + ".pdf") and not override_template:
        return send_file(filepath + ".pdf", download_name=download_name, mimetype='application/pdf')

    # Generate PDF using Google Slides
    google_tools.cards_to_pdf(
        presentation_id=presentation_id,
        cards=[dict(card)],  # Pass as single-item list
        output_filepath=filepath
    )

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Viewed PDF Card ID {id}")

    return send_file(filepath + ".pdf", download_name=download_name, mimetype='application/pdf')

def check_if_can_edit_or_delete(card):
    if current_user.admin_write_perm == False:
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
    if current_user.is_authenticated and current_user.admin_write_perm and request.args.get("show_admin_overrides") == "true":
        show_admin_overrides = True

    # (Disable validation for editing...due to complications with NetID validation, and also, if someone is savvy enough to bypass server-side validation, well, they can have their way)
    sender_name = form["sender_name"].strip()
    recipient_name = form["recipient_name"].strip()
    message_content = form["message_content"].strip()

    recipient_email = card["recipient_email"]

    if show_admin_overrides:
        message_group = form["message_group"].strip()
        if message_group == "none" or message_group == "":
            return "message group cannot be empty!"
        sender_email = form["sender_email"].strip()
        recipient_email = form["recipient_email"].strip()
        send_ybl_email = form["send_ybl_email"]

        db_call(update_message_by_id, card["id"], {
            "message_group": message_group,
            "sender_email": sender_email,
            "sender_name": sender_name,
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "message_content": message_content,
        })
        
        if send_ybl_email:
            helpers.send_email(message_group=message_group, type="recipient", to=[recipient_email])
    else:
        message_group = current_app.config["lifted_config"]["form_message_group"]
        if message_group == "none":
            return "Sorry - the form is closed!"
        
        db_call(update_message_by_id, card["id"], {
            "sender_name": sender_name,
            "recipient_name": recipient_name,
            "message_content": message_content,
        })

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Edited Card ID {id}") 

    return jsonify({"message_confirmation": True, "recipient_email": recipient_email})

@core.post("/api/delete-message/<id>")
@login_required
def delete_message(id):
    card, hidden_card_overrides = get_card(id)

    check_if_can_edit_or_delete(card)

    db_call(delete_message_by_id, id)
    db_call(insert_recently_deleted_message, card)

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Deleted Card ID {id}")

    return jsonify({"deleted": True})


def validate_form(form):
    return form["sender_name"] and form["recipient_name"] and form["recipient_netid"] and form["message_content"]

@core.route("/api/send-message", methods=["POST"])
def send_message():
    form = json.loads(request.data)

    show_admin_overrides = False
    if current_user.is_authenticated and current_user.admin_write_perm and request.args.get("show_admin_overrides") == "true":
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
            swap_pref = db_call(get_swap_pref, recipient_email, message_group)

            # If there is a swap pref, honor it
            if swap_pref:
                message_group = swap_pref["message_group_to"]

        db_call(insert_message, {
            "message_group": message_group,
            "sender_email": sender_email,
            "sender_name": sender_name,
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "message_content": message_content,
        })

        # helpers.send_email(message_group=message_group, type="recipient", to=[recipient_email])

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

    permissions = get_admin_permissions_for_netid(netID)

    if permissions["admin_write_perm"]:
        result = " 🎈🌸"
    elif permissions["is_admin"]:
        result = " 🎈"

    return jsonify({"result": result})

@core.post("/api/swap-messages")
@login_required
def swap_messages():
    swap_from = current_app.config["lifted_config"]["swap_from"]
    swap_to = current_app.config["lifted_config"]["swap_to"]

    if swap_from == "none":
        return "Cannot swap at this time.  swap_from=none in Lifted config."

    # Delete attachment pref if there is one
    attachment_pref = db_call(get_attachment_pref_repo, current_user.email, current_app.config["lifted_config"]["swap_from"])
    if attachment_pref:
        db_call(return_attachment, attachment_pref["attachment_id"])
        db_call(delete_attachment_pref_by_id, attachment_pref["id"])

    db_call(update_messages_group_for_recipient, current_user.email, swap_from, swap_to)
    db_call(create_swap_pref, current_user.email, swap_from, swap_to)

    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Swapped Cards to eLifted")
    
    return jsonify({"swapped": True})

@core.get("/api/analytics")
def get_analytics():
    """Get analytics data for Lifted messages"""
    semester = request.args.get("semester", "all")
    analytics_data = db_call(get_analytics_payload, semester)
    return jsonify(analytics_data)
