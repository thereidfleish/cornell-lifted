# SPDX-FileCopyrightText: 2014-2015 Erica Ehrhardt
# SPDX-FileCopyrightText: 2016-2022 Patrick Uiterwijk <patrick@puiterwijk.org>
# SPDX-FileCopyrightText: 2023 Aurélien Bompard <aurelien@bompard.org>
#
# SPDX-License-Identifier: BSD-2-Clause

import logging
import warnings
from urllib.parse import urlparse

from authlib.integrations.base_client.errors import OAuthError
from flask import (
    Blueprint,
    abort,
    current_app,
    flash,
    g,
    jsonify,
    redirect,
    request,
    session,
    url_for,
)

from .signals import (
    after_authorize,
    after_logout,
    before_authorize,
    before_login_redirect,
    before_logout,
)

logger = logging.getLogger(__name__)

auth_routes = Blueprint("oidc_auth", __name__)

# In-memory ticket store for native app handoff (ticket -> auth payload)
ticket_store = {}


@auth_routes.route("/login", endpoint="login")
def login_view():
    if current_app.config["OIDC_OVERWRITE_REDIRECT_URI"]:
        redirect_uri = current_app.config["OIDC_OVERWRITE_REDIRECT_URI"]
    elif current_app.config["OIDC_CALLBACK_ROUTE"]:
        redirect_uri = (
            f"{request.url_root.rstrip('/')}{current_app.config['OIDC_CALLBACK_ROUTE']}"
        )
    else:
        redirect_uri = url_for("oidc_auth.authorize", _external=True)
    session["next"] = request.args.get("next", request.url_root)
    before_login_redirect.send(
        g._oidc_auth,
        redirect_uri=redirect_uri,
        next=session["next"],
    )
    # print(redirect_uri)
    return g._oidc_auth.authorize_redirect(redirect_uri)


@auth_routes.route("/authorize", endpoint="authorize")
def authorize_view():
    before_authorize.send(g._oidc_auth)
    
    code = request.args.get("code")
    
    # Debug logging
    # print(f"Authorize called. URL: {request.url}, code present: {code is not None}, all args: {dict(request.args)}")
    
    if not code:
        abort(400, "Missing authorization code")
    
    try:
        # Direct code exchange (works for both web and native flows)
        metadata = g._oidc_auth.load_server_metadata()
        with g._oidc_auth._get_oauth_client(**metadata) as client:
            token = client.fetch_token(
                metadata["token_endpoint"],
                grant_type="authorization_code",
                code=code,
                redirect_uri=request.url_root.rstrip('/') + request.path,
                client_id=current_app.config.get("OIDC_CLIENT_ID"),
                client_secret=current_app.config.get("OIDC_CLIENT_SECRET"),
                include_client_id=True,
            )
    except OAuthError as e:
        logger.exception("Could not get the access token")
        abort(401, str(e))
    except Exception as e:
        logger.exception("Token exchange failed")
        abort(401, f"{e.__class__.__name__}: {e}")
    
    session["oidc_auth_token"] = token
    g.oidc_id_token = token
    if current_app.config["OIDC_USER_INFO_ENABLED"]:
        profile = g._oidc_auth.userinfo(token=token)
        session["oidc_auth_profile"] = profile
    try:
        return_to = session["next"]
        del session["next"]
    except KeyError:
        return_to = request.url_root
    
    # Check if return_to is a custom URL scheme (deep link) or web URL
    if "://" not in return_to or return_to.startswith(("/", "http")):
        # It's a relative web path, prepend the current request's domain
        return_to = "https://cornelllifted.com" + return_to
    # Otherwise it's already a full URL with custom scheme (lifted://, etc.)
    
    after_authorize.send(g._oidc_auth, token=token, return_to=return_to)
    
    # For native app with custom scheme (lifted://), generate a one-time ticket
    if return_to.startswith("lifted://"):
        import secrets
        ticket = secrets.token_urlsafe(32)
        # Store ticket payload in memory (avoid relying on browser session cookie)
        ticket_store[ticket] = {
            "token": token,
            "profile": session.get("oidc_auth_profile", {}),
        }
        # Append ticket to return_to
        separator = "&" if "?" in return_to else "?"
        return_to = f"{return_to}{separator}ticket={ticket}"
        # print(f"Generated auth ticket: {ticket[:10]}... (store size={len(ticket_store)})")
        # print(f"Redirecting to: {return_to}")
    
    return redirect(return_to)


@auth_routes.route("/api/auth/claim-ticket", methods=["POST"], endpoint="claim_ticket")
def claim_ticket_view():
    """
    Native app claims a one-time auth ticket to establish session cookie.
    """
    data = request.get_json(silent=True) or {}
    ticket = data.get("ticket")
    
    # print(f"Claim ticket called. Received ticket: {ticket}")
    
    if not ticket:
        abort(400, "Missing ticket")
    
    payload = ticket_store.pop(ticket, None)

    # print(f"Ticket store lookup: found={payload is not None}, store size={len(ticket_store)}")
    # print(f"Session ID on claim: {request.cookies.get('session', 'no session cookie')}")

    if payload is None:
        abort(401, "Invalid or expired ticket")

    # Rehydrate session for this client
    session["oidc_auth_token"] = payload.get("token")
    session["oidc_auth_profile"] = payload.get("profile", {})
    profile = session.get("oidc_auth_profile", {})
    # print(f"Ticket claimed successfully for user: {profile.get('sub', 'unknown')}")
    
    # Trigger after_authorize to log the user in via Flask-Login
    after_authorize.send(g._oidc_auth, token=payload.get("token"), return_to="")
    
    return jsonify({
        "status": "authenticated",
        "user": profile
    }), 200


@auth_routes.route("/logout", endpoint="logout")
def logout_view():
    """
    Request the browser to please forget the cookie we set, to clear the
    current session.

    Note that as described in [1], this will not log out in the case of a
    browser that doesn't clear cookies when requested to, and the user
    could be automatically logged in when they hit any authenticated
    endpoint.

    [1]: https://github.com/puiterwijk/flask-oidc/issues/5#issuecomment-86187023

    .. versionadded:: 1.0
    """
    before_logout.send(g._oidc_auth)
    session.pop("oidc_auth_token", None)
    session.pop("oidc_auth_profile", None)
    g.oidc_id_token = None
    reason = request.args.get("reason")
    if reason == "expired":
        flash("Your session expired, please reconnect.")
    else:
        flash("You were successfully logged out.")
    return_to = request.args.get("next", request.url_root)
    after_logout.send(g._oidc_auth, reason=reason, return_to=return_to)
    return redirect(return_to)


def legacy_oidc_callback():
    warnings.warn(
        "The {callback_url} route is deprecated, please use {authorize_url}".format(
            callback_url=current_app.config["OIDC_CALLBACK_ROUTE"],
            authorize_url=url_for("oidc_auth.authorize"),
        ),
        DeprecationWarning,
        stacklevel=2,
    )
    return redirect(
        "{url}?{qs}".format(
            url=url_for("oidc_auth.authorize"), qs=urlparse(request.url).query
        )
    )
