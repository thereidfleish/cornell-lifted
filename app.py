from flask import Flask, render_template, session, abort, current_app, request
from flask_login import LoginManager, UserMixin, login_user, current_user
from flask_oidc import OpenIDConnect, signals
from werkzeug.exceptions import HTTPException
from waitress import serve
from functools import wraps
from dotenv import load_dotenv

import json
import sqlite3
import os
import helpers

load_dotenv()

login_manager = LoginManager()

def create_app():
    app = Flask(__name__)

    ### COMMENT OUT BEFORE DEPLOYING!!!!! ###
    app.debug = True

    ### Put T/F for if windows or mac!!!!! ###
    is_windows = True

    app.config.update({
    'SECRET_KEY': os.getenv("SECRET_KEY"),
    "OIDC_CLIENT_SECRETS": "client_secrets_test.json" if app.debug else "client_secrets.json",
    "lifted_config": load_lifted_config(),
    "is_windows": is_windows
    })

    app.jinja_env.globals['lifted_config'] = app.config["lifted_config"]
    app.jinja_env.globals.update(zip=zip)
    app.jinja_env.globals.update(is_admin=is_admin)
    app.jinja_env.globals.update(get_impersonating_status=get_impersonating_status)

    oidc = OpenIDConnect(app)
    login_manager.init_app(app)

    from core import core
    from admin import admin
    from circle import circle
    app.register_blueprint(core)
    app.register_blueprint(admin)
    app.register_blueprint(circle)

    return app

def after_setup(app):
    @app.errorhandler(HTTPException)
    def handle_exception(e):    
        error_code = e.code
        error_message_title = e.name
        error_message_body = e.description
        
        if hasattr(current_user, "id"):
            # print(current_user.id, "(", current_user.name, ")", "had an error", e.code)
            helpers.log(current_user.id, current_user.full_name, "ERROR", str(e.code), error_message_body)

        
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

    @app.template_filter('ordinal')
    def ordinal(num):
        if 10 <= num % 100 <= 20:
            suffix = 'th'
        else:
            suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(num % 10, 'th')
        return str(num) + suffix
    
    @app.template_filter('pluralize')
    def pluralize(number, singular = '', plural = 's'):
        if number == 1:
            return singular
        else:
            return plural

# Load Lifted configuration
def load_lifted_config():
    with open('lifted_config.json', 'r') as file:
        return json.load(file)


# Update Lifted configuration
def update_lifted_config(new_config):
    with open('lifted_config.json', 'w') as file:
        json.dump(new_config, file, indent=4)

def get_db_connection():
    conn = sqlite3.connect("db/database.db")
    conn.row_factory = sqlite3.Row
    return conn

def get_logs_connection():
    conn = sqlite3.connect("db/logs.db")
    conn.row_factory = sqlite3.Row
    return conn

class User(UserMixin):
    def __init__(self, name, full_name, id):
        self.name = name
        self.full_name = full_name
        self.id = id
        self.email = id + "@cornell.edu"

    def is_authenticated(self):
        return True

def admin_required(write_required):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if is_admin(write_required) == False:
                abort(401, "Not an admin!" + " Also, write is required." if write_required else "")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def is_admin(write_required):
    conn = get_db_connection()
    admins = conn.execute("select * from admins where id=?", (current_user.id,)).fetchone()
    conn.close()

    if write_required:
        return admins != None and admins["write"] == True

    return admins != None

def get_impersonating_status():
    return session.get("impersonating")

@login_manager.user_loader
def load_user(user_id):
    # user_id = "atn45" # use to TEST a user!
    user = User(name=session["given_name"], full_name=session["full_name"], id=user_id)
    return user

def after_oidc_authorize(sender, **extras):
    oidc_profile = session["oidc_auth_profile"]
    session["given_name"] = oidc_profile["given_name"]
    session["full_name"] = oidc_profile["name"]
    user = load_user(oidc_profile["sub"])
    login_user(user)
    # app.logger.info(current_user.id, ' logged in successfully')
    # print(current_user.id, ' logged in successfully')

    # helpers.log(current_user.id, current_user.full_name, "INFO", None, "OIDC Auth Success")
    
signals.after_authorize.connect(after_oidc_authorize)


if __name__ == '__main__':
    app = create_app()
    after_setup(app)
    # app.run(host='127.0.0.1', debug=app.debug, ssl_context="adhoc")
    if app.debug:
        app.run(host='127.0.0.1', debug=app.debug, ssl_context=('cert.pem', 'key.pem'))
    else:
        serve(app, host='0.0.0.0', port=5000, url_scheme='https', threads=100)