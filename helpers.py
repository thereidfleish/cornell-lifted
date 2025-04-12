from comtypes import client, CoInitialize, CoUninitialize
import win32com.client
import csv
import os
from flask import current_app

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
    if current_app.config["is_windows"]:
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
    else:
        """
        Mac-compatible version - just logs actions without actually generating files
        For development/testing purposes only
        """
        print("Mac-compatible version: Would generate PPTX and PDF here")
        print(f"Would process {len(cards)} cards for message group '{message_group}'")
        print(f"Would save to {output_filepath}.pptx and {output_filepath}.pdf")
        
        # Create a dummy text file to simulate progress tracking
        with open(f"{output_filepath}.txt", "a") as file:
            file.write(f"\n100%")
        
        # Create empty PDF file for testing purposes
        with open(f"{output_filepath}.pdf", "w") as file:
            file.write("This is a placeholder PDF file for Mac testing")

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
            Msg.HTMLBody = file.read()

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

example_messages = {
        "Friend": {
            "to": "Lillian",
            "from": "Anonymous hehe",
            "message": "HELLOO!!! Lillian lillian lillian...where do I even begin. I wanted to let you know you much I appreciate you in my life and how grateful I am to have you as one of my closest friends. I truly do not know how my Cornell experience would've been like without you there and without the experiences we've had together baking disturbingly ugly matcha brownies, calling about stinkbugs, and never finishing freaks and geeks (when is that happening). You mean so much to me and I am seriously going to miss you sososososoosossssos much like I will cry if I think about it right now. DON'T LEAVE ME!!!! Anyway love you so much <3"
        },
        "Partner": {
            "to": "?",
            "from": "?",
            "message": "..."
            # "message": "To the best, most beautiful girlfriend in the world,<br><br>You are the light of my life and make my heart swell with joy. Merry Christmas and here's to many more spent together. I love you forever.<br><br>Love, your not-so-secret admirer"
        },
        "Professor": {
            "to": "Prof. Harms",
            "from": "Jamie",
            "message": "Thank you Professor Harms for being such an amazing professor! Having the opportunity to work with you this semester was really wonderful, I learned so much. I'm really excited for the opportunity to take another class with you during my final semester at Cornell, you truly teach in a way that helps me understand difficult coding concepts better than any professor I've had. Happy holidays!"
        },
        "Staff Member": {
            "to": "Happy Dave",
            "from": "Anonymous",
            "message": "They say it's the people that make the place. The food at Okenshields may be mid, but the vibes are much better! Okenshields truly would not be what it is without your happiness, dancing, and DJ-ing!"
        },
    }

faqs = {
        "General": {
            "How does Lifted work?": "Write a thank-you message to a friend, professor, or staff member at Cornell who has uplifted you!  We will print it out and display it amongst thousands of other messages on the last day of classes!",
            "When does the Lifted submission form open?  When does it close?": "The form usually opens 3-4 weeks before the last day of classes.  The last day to send a physical Lifted card is usually about 1-2 weeks before the last day of classes, and the last day to send an eLifted card is usually the day before.  Keep an eye on our website and Instagram for updates!",
            "What is the difference between a physical Lifted card and an eLifted card?": "Physical Lifted cards will be printed and displayed (for you to pick up and keep!) on the last day of classes.  eLifted cards are virtual cards that you will receive via email on the last day of classes (you can still print them out to create a physical card!).  Whether you get a physical or eLifted card depends on when the sender wrote their message to you.",
        },
        "Receiving Messages": {
            "I know in advance that I won't be able to pick up my physical Lifted card on the last day of classes.  Can I request a virtual copy instead?": "Yes!  New for the Spring 2025 semester, when you receive an email that someone wrote you a physical Lifted card, you can choose whether you'd like to receive an eLifted (virtual) copy of this message (and any new messages you receive) instead of a physical card on the last day of classes.  <b>You must do this by the stated deadline, though.  Check your 'You've been Lifted' email for details</b><br><br>If you are unsure of whether you can pick it up, we ask that you to request a virtual copy so we don't print and display cards that won't be picked up.",
            "Oops!  I forgot to pick up my physical Lifted card on the last day of classes.  Can I still see the card?": "In most cases, no.  Previously, we have allowed people to view their physical cards as eLifted cards, but as the number of Lifted submissions grow, this becomes logistically complicated on our end.  See the previous FAQ for info on how to request a virtual card in advance.",
            "I received an anonymous Lifted message, but I'd like to know who wrote it.  Can I know?": "Nope!  This is part of the fun of Lifted!  If you have a concern, send us an email, or if you really want to know who your 'secret admirer' is, send us an email and we can ask them for permission to reveal it :)",
        },
        "Sending Messages": {
            "Who can I send a message to?": "You can send a message to anyone with a NetID, such as a friend, professor, or staff member!  If someone does not have a NetID but is affiliated with Cornell, send us an email and we'll try our best to send a message on your behalf.  You can also send a message to an alumnus, but be sure to send an eLifted card (wait until the physical Lifted submission form closes, and then you will be able to send an eLifted card).  Please note that you will need to type an alumnus's NetID manually, as searching for their name will not work.",
            "How many messages can I send?": "Technically, you can send as many as you'd like.  However, we <b>strongly encourage you to send no more than 5 physical cards</b>, as there are limits each semester on how many balloons we can inflate, flowers we can order, or cards that we can hang.  We may need to close the form early if too many cards are submitted, so please be conscious of your peers who also want to submit messages!<br><br>That being said, we encourage you to send as many <b>eLifted</b> cards as you'd like!  Simply wait until the physical Lifted card submission form closes, and then send away (to the rest of your friends, professors, or even your entire club!)",
            "I want to send a message, but I don't have a NetID (e.g., I am a parent or community member).  Can I still send a message?": "Of course!  Send us an email telling us the recipient's NetID, your name that you want to appear on the card, the recipient's name that you want to appear on the card, and the message and we'll send it on your behalf :)",
            "Can I send a message to someone who is not in Ithaca?": "Yes, but please do not send a physical Lifted card.  Instead, wait until the physical Lifted submission form closes, and then you will be able to send an eLifted card.",
            "Can I send an anonymous message?": "Yes!  That being said, we've seen many cards signed 'your secret admirer' - now, we're no experts on love, unlike our friends at Perfect Match, but we do suggest you shoot your shot!",
            "Can my message exceed the word count?": "It can, but we cannot guarantee that it will fit onto the card or be legible.  The messages are converted to card PDFs programmatically, and while our code attempts to shrink the text to fit on the card, it is not guaranteed to work or be legible.  If you have any questions or would like to confirm that your message fits on the card, send us an email in advance of the submission deadline and we can check for you.",
            "Can I write my message in other languages or use non-standard characters?": "Yes, generally this will work.  If you are unsure, send us an email in advance of the submission deadline and we can check your card for you.",
            "Can I include images or special formatting on my card?": "Generally, no, but if you send us an email well in advance of the submission deadline, we can try to make it happen!",
            "Can I edit or delete a message I wrote after submitting it?": "Yes, you can do this through our website until the submission deadline.  If you need to do this after, send us an email and we'll try our best to make it happen, but we cannot guarantee because we send our print order a few hours after the form closes.  Please note that if you delete a message, the recipient might still expect to receive a card because they already received an automated 'You've been Lifted' email when you originally submitted the message.",
            "The recipient's name doesn't show up when I search for them on the submission form.  What should I do?": "Because the Cornell Directory is so large, we automatically filter out less common queries from the search (such as alumni and former faculty/staff).  To get around this, try typing their exact NetID, which should work.  If not, send us an email and we can help!",
            "Will the recipient know I sent them a card before the last day of classes?": "Nope!  When you submit a message, the recipient will immediately receive an automated email saying that they've been Lifted, but it won't tell them who it was!  If you included your name on your message, the recipient will find out on the last day of classes!",
        },
        "Other": {
            "Who runs Lifted?  How can I get in contact?": "Lifted is fully planned, organized, and executed by a small group of students passionate about making campus a better place.  If you need to get in contact with us for any reason, send us an email at lifted@cornell.edu (during Lifted season, you should expect to hear back within an hour; otherwise, expect up to a week).",
            "How is Lifted funded?  How can I support Lifted?": "Lifted, as a registered student organization on campus, is primarily funded through SAFC and often supplementary funding sources such as the Public Events Fund and Giving Day.  Putting on Lifted costs thousands of dollars each year, and if you would like to help offset some costs, we would greatly appreciate any donations during <a href='https://givingday.cornell.edu/campaigns/lifters-at-cornell-university' target='_blank'>Cornell Giving Day</a> and throughout the year!",
            "Will you continue to do a Fall version of Lifted?": "Yes, we plan to!  Historically, Lifted has been a Spring-only event on the Arts Quad.  In Fall 2024, we decided to experiment with an indoor winter-themed version in WSH for the Fall semester, which turned out to be a big success!",
            "Will you use balloons, flowers, or something else in the Spring?": "This depends on interest within our group, our budget, the number of volunteers we have, how many Lifted submissions we get, the weather, and approvals from Cornell -- planning a large-scale event like Lifted is quite complex!  We'll hide some hints on our website, submission form, and emails as Lifted gets closer, but consider whatever we use to be a surprise!",
            "I just realized that I never picked up my message from a previous semester!  Is there any possibility of seeing the message?": "Yes.  If it was an eLifted card, you can view it anytime by signing into our website.  If it was a physical card, send us an email."
        }
    }