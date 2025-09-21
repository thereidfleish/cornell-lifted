from flask import redirect, send_file, render_template, abort, jsonify, request, url_for, Blueprint, current_app
from flask_login import login_required, current_user
import ldap3
from datetime import datetime
from pathlib import Path
from wtforms import Form, BooleanField, StringField, HiddenField, TextAreaField, RadioField, validators

import os
import helpers

from app import is_admin, get_db_connection, get_logs_connection, admin_required
from core import rows_to_dicts

circle = Blueprint('circle', __name__, template_folder='templates', static_folder='static')

def validate_user_is_tapped_or_admin():
    helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Tried to access the Tap Page!")

    # Taps Table
    conn = get_db_connection()
    user = conn.execute("select * from cp_taps where netid=?", (current_user.id,)).fetchone()
    conn.close()

    # If the user was not tapped, abort
    if not user and not is_admin(write_required=False):
        abort(401, "No Circle!")
        # return "We're sorry, but you do not have access to this page."
    return user

@circle.route("/api/circle/get-user")
@login_required
def get_user():
    user = validate_user_is_tapped_or_admin()
    if user:
        return jsonify(dict(user))
    return jsonify("user not tapped")

@circle.route("/api/circle/get-taps")
@login_required
@admin_required(write_required=False)
def get_taps():
    validate_user_is_tapped_or_admin()
    conn = get_db_connection()
    taps = rows_to_dicts(conn.execute("select * from cp_taps").fetchall())
    conn.close()
    return jsonify(taps)

@circle.post("/api/circle/update-tap-response")
@login_required
def update_tap_response():
    validate_user_is_tapped_or_admin()
    
    form = request.form

    netid = current_user.id
    accept_tap = True if form["accept_tap"] == "accept" else False
    clear_schedule = form["clear_schedule"]
    wear_clothing = form["wear_clothing"]
    monitor_inbox = form["monitor_inbox"]
    phonetic_spelling = form["phonetic_spelling"]
    allergens = form["allergens"]
    physical_accommodations = form["physical_accommodations"]
    pronouns = form["pronouns"]
    notes = form["notes"]

    timestamp = datetime.now().replace(microsecond=0)

    conn = get_db_connection()
    conn.execute('update cp_taps set responded_timestamp=?, accept_tap=?, clear_schedule=?, wear_clothing=?, monitor_inbox=?, pronouns=?, phonetic_spelling=?, allergens=?, physical_accommodations=?, notes=?  where netid=?',
                    (timestamp, accept_tap, clear_schedule, wear_clothing, monitor_inbox, pronouns, phonetic_spelling, allergens, physical_accommodations, notes, netid))
    # conn.execute('insert into cp_taps (netid, tap_name, created_timestamp, accept_tap, clear_schedule, wear_clothing, phonetic_spelling, monitor_inbox, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    # (netid, current_user.name, timestamp, accept_tap, clear_schedule, wear_clothing, phonetic_spelling, monitor_inbox, notes))
    conn.commit()
    conn.close()

    return jsonify({"success": True})


class TapResponseForm(Form):
    accept_tap = RadioField("Accept or Reject the Tap",
                            choices=[("accept", "I accept this tap, and confirm the following"), ("reject", "I reject this tap, will return this parcel, and shall maintain the society's secrecy.")],
                            validators=[validators.DataRequired(message="Please accept or reject this tap.")])
    clear_schedule = BooleanField("I will clear my schedule from 7:00 pm onward on Wednesday, March 26th.")
    wear_clothing = BooleanField("I will wear white/light colors from 7:00 pm onward on Wednesday, March 26th.")
    monitor_inbox = BooleanField("I will monitor my email inbox closely from now to March 26th.")
    notes = StringField("If I did not check all the boxes above, explain any conflicts/concerns:")
    pronouns = StringField("Preferred pronouns:")
    phonetic_spelling = StringField("Phonetic pronunciation of my name:")
    allergens = StringField("Any Allergens:")

@circle.post("/api/circle/add-tap")
@login_required
@admin_required(write_required=True)
def add_tap():
    netID = request.form['netID-input'].strip().lower()
    name = request.form['name-input'].strip()

    conn = get_db_connection()
    conn.execute('insert into cp_taps (netid, tap_name) VALUES (?, ?)',
                            (netID, name))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

@circle.get("/api/admin/delete-tap/<netID>")
@login_required
@admin_required(write_required=True)
def delete_tap(netID):
    conn = get_db_connection()
    conn.execute('delete from cp_taps where netid = ?', (netID,))
    conn.commit()
    conn.close()

    return jsonify({"success": True})