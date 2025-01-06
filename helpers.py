from comtypes import client, CoInitialize, CoUninitialize
import win32com.client
import csv
import os

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

def cards_to_pptx_and_pdf(cards, message_group, output_filepath):
    print("Beginning replacing placeholders")
    CoInitialize()

    powerpoint = client.CreateObject("PowerPoint.Application")

    # NEED with window to be true for text resizing to work!!!!
    input_pptx = f"pptx_templates/{message_group}.pptx"
    presentation = powerpoint.Presentations.Open(os.path.abspath(input_pptx), WithWindow=True)

    num_cards = len(cards)

    for i, card in enumerate(cards):
        if num_cards > 1:
            if i % 100 == 0:
                progress = round(i/num_cards*100 ,2)
                with open(f"{output_filepath}.txt", "a") as file:
                    file.write(f"\n{progress}%")
                print(f"{progress}% converting cards to pptx")

            presentation.Slides(presentation.Slides.Count).Duplicate()

        replacements_dict = {
                        "{{NET_ID}}": card["recipient_email"].split("@")[0],
                        "{{RECIPIENT_NAME}}": card["recipient_name"],
                        "{{SENDER_NAME}}": card["sender_name"],
                        "{{MESSAGE}}": card["message_content"]
                    }
        # Iterate through shapes
        for shape in presentation.Slides(presentation.Slides.Count - 1 if num_cards > 1 else presentation.Slides.Count).Shapes:
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

    if num_cards > 1:
        presentation.Slides(presentation.Slides.Count).Delete()
        print("Saving PPTX...")
        presentation.SaveAs(os.path.abspath(f"{output_filepath}.pptx"))
    print("Converting and Saving PPTX to PDF...")
    presentation.SaveAs(os.path.abspath(f"{output_filepath}.pdf"), 32)
    presentation.Close()
    print("Done!")
    # powerpoint.Quit()
    # CoUninitialize()

def create_csv(cards, output_path):
    with open(output_path + ".csv", 'w', newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)

        # Write header row (optional)
        writer.writerow(cards[0].keys())

        # Write data rows
        writer.writerows(cards)

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

def send_email(message_group, type, to, cc=None, bcc=None):
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
        Msg.HTMLBody = file.read()

    Msg.Send()