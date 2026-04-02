import csv
import os
from datetime import datetime
from flask import current_app
from postmarker.core import PostmarkClient
from app import SessionLocal
from db.repositories import get_lifted_stats as get_lifted_stats_repo
from db.repositories import insert_log

def log(user_email, user_name, log_type, error_code, log_content):
    with SessionLocal() as db_session:
        insert_log(
            user_email=user_email,
            user_name=user_name,
            log_type=log_type,
            error_code=error_code,
            log_content=log_content,
            db_session=db_session,
        )

def process_cards_to_dict(cards):
    dict = {}
    
    for card in cards:
        if card["message_group"] in dict:
            dict[card["message_group"]].append(card)
        else:
            dict[card["message_group"]] = [card]
    
    return dict

def process_ranks_to_dict(ranks):
    dict = {}

    for rank in ranks:
        dict[rank["message_group"]] = rank["rank"]

    return dict

def process_attachment_prefs_to_dict(attachment_prefs):
    dict = {}

    for attachment_pref in attachment_prefs:
        dict[attachment_pref["message_group"]] = attachment_pref

    return dict

def create_csv(cards, output_path):
    with open(output_path + ".csv", 'w', newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)

        # Write header row (optional)
        writer.writerow(cards[0].keys())

        # Write data rows
        writer.writerows(cards)

def get_lifted_stats():
    with SessionLocal() as db_session:
        return get_lifted_stats_repo(db_session)

def process_html_for_email(html_content, message_group=None):
    """
    Process HTML content and wrap it in a beautiful email template
    similar to the Cornell Lifted website design
    """
    from flask import current_app
    
    # Get current stats for the email
    stats = get_lifted_stats()
    
    # Determine if winter theme should be used based on theme config
    is_winter = False
    if current_app:
        # Check the theme setting in lifted_config
        theme = current_app.config.get("lifted_config", {}).get("theme", "spring")
        is_winter = theme == "fall"
    
    # Select the appropriate logo and background colors
    logo_url = "https://cornelllifted.com/images/logo_winter.png" if is_winter else "https://cornelllifted.com/images/logo.png"
    bg_color = "#e3eeff" if is_winter else "#f4fbf3"
    
    # Add line spacing for email content
    # processed_html = html_content.replace("<p>", "<p style='margin: 0px 0px 12px 0px; line-height: 1.6;'>")
    
    # Create the email template with Cornell Lifted branding
    email_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cornell Lifted</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                background-color: {bg_color};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.4;
                color: #374151;
            }}
            .email-container {{
                max-width: 800px;
                margin: 0 auto;
                background-color: {bg_color};
                padding: 20px;
            }}
            .email-container p {{
                margin: 0 0 2px 0;
            }}
            .header {{
                text-align: center;
                padding: 30px 20px;
                background-color: {bg_color};
            }}
            .logo {{
                max-width: 200px;
                height: auto;
            }}
            .content-card {{
                background-color: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin: 20px 0;
                border: 1px solid #e5e7eb;
            }}
            .footer {{
                text-align: center;
                padding: 5px 20px;
                background-color: {bg_color};
                font-size: 14px;
                color: #6b7280;
            }}
            .footer p {{
                margin: 15px 0;
                line-height: 1.6;
            }}
            .footer-links {{
                margin-top: 20px;
            }}
            .footer-links a {{
                color: #b31b1b;
                text-decoration: none;
                margin: 0 10px;
            }}
            .footer-links a:hover {{
                text-decoration: underline;
            }}
            .chronicle-link {{
                color: #b31b1b !important;
                text-decoration: none;
            }}
            .chronicle-link:hover {{
                text-decoration: underline;
            }}
            .cornell-blue {{
                color: #003d82;
            }}
            .cornell-red {{
                color: #b31b1b;
            }}
            .highlight-box {{
                background-color: #dbeafe;
                border-left: 4px solid #003d82;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <img src="{logo_url}" alt="Cornell Lifted Logo" class="logo">
            </div>
            
            <!-- Main Content -->
            <div class="content-card">
                <div class="content-body">
                    {html_content}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p style="margin-bottom: 20px;">
                    <strong class="cornell-red">Made with 💌 by the Lifted Team</strong>
                </p>
                <p>
                    Join {stats['unique_sent']:,} others in writing {stats['total_received']:,} messages of gratitude across the Cornell community since 2016.
                </p>
                <p>
                    <a class="chronicle-link" href="https://news.cornell.edu/stories/2021/05/cornell-lifted-raises-spirits-prior-finals">Read more about Lifted on the Cornell Chronicle</a>
                </p>
                <div class="footer-links">
                    <a href="https://cornelllifted.com">Website</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://cornelllifted.com/faqs">FAQs</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://www.instagram.com/cornelllifted">Instagram - @cornelllifted</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return email_template

def send_email(message_group, type, to, cc=None, bcc=None):
    token = os.getenv("SENDGRID_KEY")

    dir_path = f"templates/rich_text/{message_group}/{type}"

    with open(f"{dir_path}.txt", "r", encoding="utf-8") as file:
        subject = file.read()

    with open(f"{dir_path}.html", "r", encoding="utf-8") as file:
        raw_html_content = file.read()
        html_content = process_html_for_email(raw_html_content, message_group)

    postmark = PostmarkClient(server_token=token)
    payload = {
        "From": "lifted@cornell.edu",
        "To": ",".join(to),
        "Subject": subject,
        "HtmlBody": html_content,
    }

    if cc:
        payload["Cc"] = ",".join(cc)
    if bcc:
        payload["Bcc"] = ",".join(bcc)

    postmark.emails.send(**payload)

college_dict = {
        "AG": "CALS",
        "AR": "Architecture, Art and Planning",
        "AS": "Arts and Sciences",
        "BU": "Business",
        "BUAG": "Business",
        "BUGM": "Business",
        "CE": "Continuing Education",
        "EE": "Extended Education",
        "EN": "Engineering",
        "GR": "Graduate",
        "HE": "Human Ecology",
        "IL": "ILR",
        "LA": "Law",
        "VM": "Veterinary Medicine",
        "PPHE": "Public Policy",
    }