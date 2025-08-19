from flask import redirect, send_file, render_template, abort, jsonify, request, url_for, Blueprint, current_app
from flask_login import login_required, current_user
import ldap3
from datetime import datetime
from pathlib import Path
from wtforms import Form, BooleanField, StringField, HiddenField, TextAreaField, RadioField, validators

import os
import helpers

from app import is_admin, get_db_connection, get_logs_connection, admin_required

circle = Blueprint('circle', __name__, template_folder='templates', static_folder='static')

@circle.route("/circle", methods=["GET", "POST"])
def circle_home():
    if current_user.is_authenticated: # changed from "g.oidc_user.logged_in"

        helpers.log(current_user.id, current_user.full_name, "INFO", None, f"Tried to access the Tap Page!")

        # Taps Table
        conn = get_db_connection()
        taps = conn.execute("select * from cp_taps").fetchall()
        conn.close()

        # If the user was not tapped, abort
        if current_user.id not in [tap["netid"] for tap in taps] and not is_admin(write_required=False):
            abort(403, "No Circle!")
            # return "We're sorry, but you do not have access to this page."

        form = TapResponseForm(request.form)

        if request.method == 'POST' and form.validate():    
            netid = current_user.id
            accept_tap = True if form.accept_tap.data == "accept" else False
            clear_schedule = form.clear_schedule.data
            wear_clothing = form.wear_clothing.data
            monitor_inbox = form.monitor_inbox.data
            phonetic_spelling = form.phonetic_spelling.data
            allergens = form.allergens.data
            pronouns = form.pronouns.data
            notes = form.notes.data

            timestamp = datetime.now().replace(microsecond=0)

            conn = get_db_connection()
            conn.execute('update cp_taps set responded_timestamp=?, accept_tap=?, clear_schedule=?, wear_clothing=?, monitor_inbox=?, pronouns=?, phonetic_spelling=?, allergens=?, notes=?  where netid=?',
                         (timestamp, accept_tap, clear_schedule, wear_clothing, monitor_inbox, pronouns, phonetic_spelling, allergens, notes, netid))
            # conn.execute('insert into cp_taps (netid, tap_name, created_timestamp, accept_tap, clear_schedule, wear_clothing, phonetic_spelling, monitor_inbox, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            # (netid, current_user.name, timestamp, accept_tap, clear_schedule, wear_clothing, phonetic_spelling, monitor_inbox, notes))
            conn.commit()
            conn.close()

            return redirect(url_for('circle.circle_home'))

        conn = get_db_connection()

        user = conn.execute("select * from cp_taps where netid=?", (current_user.id,)).fetchone()

        conn.close()

        return render_template('circle.html', user=user, taps=taps, form=form)
    else:
        return render_template('circle.html')

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

@circle.post("/add-tap")
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

    return redirect(url_for('circle.circle_home'))

@circle.get("/delete-tap/<netID>")
@login_required
@admin_required(write_required=True)
def delete_tap(netID):
    conn = get_db_connection()
    conn.execute('delete from cp_taps where netid = ?', (netID,))
    conn.commit()
    conn.close()

    return redirect(url_for('circle.circle_home'))