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

def normalize_rich_text_html(html_content):
    return html_content.replace("<p><br></p>", "<p>&nbsp;</p>").replace("<p></p>", "<p>&nbsp;</p>")

def process_html_for_email(html_content, message_group=None):
    """
    Process HTML content and wrap it in a beautiful email template
    similar to the Cornell Lifted website design
    """
    from flask import current_app
    
    # Preserve intentional blank lines from the editor while keeping normal paragraph spacing tight
    html_content = normalize_rich_text_html(html_content)

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

    email_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: {bg_color};
                margin: 0;
                padding: 0;
            }}
            .email-wrapper {{
                width: 100%;
                background-color: {bg_color};
                padding: 20px 0;
            }}
            .email-container {{
                max-width: 700px;
                margin: 0 auto;
                padding: 0 20px;
            }}
            .email-content {{
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .logo-container {{
                text-align: center;
                margin-bottom: 20px;
            }}
            .logo-container img {{
                max-height: 60px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                font-size: 13px;
                color: #6b7280;
            }}
            .footer a {{
                color: #b31b1b;
                text-decoration: none;
            }}
            .footer a:hover {{
                text-decoration: underline;
            }}
            .rich-text-content {{
                word-wrap: break-word;
            }}
            .rich-text-content p {{
                margin: 0;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="logo-container">
                    <img src="{logo_url}" alt="Cornell Lifted Logo">
                </div>
                
                <div class="email-content">
                    <div class="rich-text-content">
                        {html_content}
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong style="color: #b31b1b">Made with 💌 by the Lifted Team</strong></p>
                    <p>Join {stats['unique_sent']:,} others in writing {stats['total_received']:,} messages of gratitude across the Cornell community since 2016.</p>
                    <p><a href="https://news.cornell.edu/stories/2021/05/cornell-lifted-raises-spirits-prior-finals">Read more about Lifted on the Cornell Chronicle</a></p>
                    <p style="margin-top: 15px;">
                        <a href="https://cornelllifted.com">Website</a> | 
                        <a href="https://cornelllifted.com/faqs">FAQs</a> | 
                        <a href="https://www.instagram.com/cornelllifted">Instagram - @cornelllifted</a>
                    </p>
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
        "From": "Cornell Lifted <hello@cornelllifted.com>",
        "To": ",".join(to),
        "Subject": subject,
        "HtmlBody": html_content,
        "MessageStream": "outbound"
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