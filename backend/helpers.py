from comtypes import client, CoInitialize, CoUninitialize
import win32com.client
import csv
import os
from datetime import datetime
from flask import current_app
from app import get_logs_connection, get_db_connection

def log(user_email, user_name, log_type, error_code, log_content):
    conn = get_logs_connection()
    timestamp = datetime.now().replace(microsecond=0)
    conn.execute("insert into logs (log_timestamp, user_email, user_name, log_type, error_code, log_content) values (?, ?, ?, ?, ?, ?)",
                 (timestamp, user_email, user_name, log_type, error_code, log_content))
    conn.commit()
    conn.close()

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

def cards_to_pptx_and_pdf(cards, message_group, output_filepath, override_template=False):
    if current_app.config["is_windows"]:
        # print("Beginning replacing placeholders")
        CoInitialize()

        powerpoint = client.CreateObject("PowerPoint.Application")

        # Eventually remove this once we migrate over to using dicts instead of SQLite Row objects everywhere
        cards = [dict(row) for row in cards]

        num_cards = len(cards)

        conn = get_db_connection()
        attachments = conn.execute("select * from attachments where message_group=? order by id desc",
                                        (message_group,)).fetchall()
        conn.close()

        attachment_id_to_slide_num_dict = {
            "default": 1
        }
        
        for idx, attachment in enumerate(attachments):
            attachment_id_to_slide_num_dict[attachment['id']] = idx + 2

            if override_template:
                new_card = cards[0].copy()
                new_card["attachment_id"] = attachment['id']
                new_card["attachment"] = attachment['attachment']
                cards.append(new_card)
                
        # NEED with window to be true for text resizing to work!!!!
        input_pptx = f"pptx_templates/{message_group}.pptx"
        presentation = powerpoint.Presentations.Open(os.path.abspath(input_pptx), WithWindow=True, ReadOnly=False)
        
        for i, card in enumerate(cards):
            if num_cards > 1 and not override_template:
                if i % 100 == 0:
                    progress = round(i/num_cards*100 ,2)
                    with open(f"{output_filepath}.txt", "a") as file:
                        file.write(f"\n{progress}%")
                    print(f"{progress}% converting cards to pptx")

            card_attachment_id = card["attachment_id"] if card["attachment_id"] else "default"
            card_attachment_name = card["attachment"] if card["attachment_id"] else "default"
            message_content = "This template is for: " + card_attachment_name + "\n\n" + card["message_content"] if override_template else card["message_content"]

            presentation.Slides(attachment_id_to_slide_num_dict[card_attachment_id]).Duplicate().MoveTo(presentation.Slides.Count)

            replacements_dict = {
                            "{{NET_ID}}": card["recipient_email"].split("@")[0],
                            "{{RECIPIENT_NAME}}": card["recipient_name"],
                            "{{SENDER_NAME}}": card["sender_name"],
                            "{{MESSAGE}}": message_content
                        }
            # Iterate through shapes
            for shape in presentation.Slides(presentation.Slides.Count).Shapes:
                if shape.HasTextFrame:
                    text_frame = shape.TextFrame2
                    text_range = text_frame.TextRange
                    # for paragraph in text_range.Paragraphs():
                        # print(paragraph.Text)
                    for run in text_range.Runs():
                        # print(run.Text)
                        for placeholder, replacement in replacements_dict.items():
                            if placeholder in ''.join(run.Text.split()):
                                run.Text = run.Text.replace(placeholder, replacement)

                    text_frame.AutoSize = 2

        for i in range(len(attachments)+1):
            presentation.Slides(1).Delete()
        
        if not os.path.exists(os.path.dirname(output_filepath)):
            os.makedirs(os.path.dirname(output_filepath))
        
        if num_cards > 1 and not override_template:
            print("Saving PPTX...")
            presentation.SaveAs(os.path.abspath(f"{output_filepath}.pptx"))
        # print("Converting and Saving PPTX to PDF...")
        presentation.SaveAs(os.path.abspath(f"{output_filepath}.pdf"), 32)
        presentation.Close()
        # print("Done!")
        # powerpoint.Quit()
        CoUninitialize()
    else:
        print("Mac - no functionality")

def create_csv(cards, output_path):
    with open(output_path + ".csv", 'w', newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)

        # Write header row (optional)
        writer.writerow(cards[0].keys())

        # Write data rows
        writer.writerows(cards)

def send_email(message_group, type, to, cc=None, bcc=None):
    if current_app.config["is_windows"]:
        CoInitialize()
        o = win32com.client.Dispatch("Outlook.Application")
        oacctouse = None
        for oacc in o.Session.Accounts:
            if oacc.SmtpAddress == "lifted@cornell.edu":
                oacctouse = oacc
                break
        Msg = o.CreateItem(0)
        if oacctouse:
            Msg._oleobj_.Invoke(*(64209, 0, 8, 0, oacctouse))  # Msg.SendUsingAccount = oacctouse

        Msg.To = ";".join(to)
        if cc is not None:
            Msg.CC = ";".join(cc)
        if bcc is not None:
            Msg.BCC = ";".join(bcc)
        
        dir_path = f"templates/rich_text/{message_group}/{type}"

        with open(f'{dir_path}.txt', 'r', encoding='utf-8') as file:
            Msg.Subject = file.read()

        with open(f'{dir_path}.html', 'r', encoding='utf-8') as file:
            html_content = file.read()
            html_content = html_content.replace("{{LOGO}}", """<img src='https://cornelllifted.com/images/logo.png'
                                            style='display: block; max-width: 200px; margin-left: auto; margin-right: auto;'>
                                            """)

            Msg.HTMLBody = html_content

        Msg.Send()
    else:
        """
        Mac-compatible version - just logs email that would be sent
        For development/testing purposes only
        """
        print(f"Mac-compatible version: Would send email from 'lifted@cornell.edu'")
        print(f"To: {'; '.join(to)}")
        if cc is not None:
            print(f"CC: {'; '.join(cc)}")
        if bcc is not None:
            print(f"BCC: {'; '.join(bcc)}")
        
        dir_path = f"templates/rich_text/{message_group}/{type}"
        
        try:
            with open(f'{dir_path}.txt', 'r', encoding='utf-8') as file:
                subject = file.read()
                print(f"Subject: {subject}")
        except FileNotFoundError:
            print(f"Subject template not found: {dir_path}.txt")
        
        try:
            with open(f'{dir_path}.html', 'r', encoding='utf-8') as file:
                body = file.read()
                print(f"Email body length: {len(body)} characters")
        except FileNotFoundError:
            print(f"Email body template not found: {dir_path}.html")
        
        print("Email would be sent!")

college_dict = {
        "AG": "Agriculture and Life Sciences",
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
        "IL": "Industrial and Labor Relations",
        "LA": "Law",
        "VM": "Veterinary Medicine",
        "PPHE": "Public Policy",
    }