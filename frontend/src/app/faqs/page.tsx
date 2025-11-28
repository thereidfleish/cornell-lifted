"use client"
import Image from "next/image";
import React, { useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import SnowAccumulation from "@/components/SnowAccumulation";

// FAQ data from helpers.py
const faqs = {
  General: {
    "How does Lifted work?": "Write a thank-you message to a friend, professor, or staff member at Cornell who has uplifted you!  We will print it out and display it amongst thousands of other messages on the last day of classes!",
    "When does the Lifted submission form open?  When does it close?": "The form usually opens 3-4 weeks before the last day of classes.  The last day to send a physical Lifted card is usually about 1-2 weeks before the last day of classes, and the last day to send an eLifted card is usually the day before.  Keep an eye on our website and Instagram for updates!",
    "What is the difference between a physical Lifted card and an eLifted card?": "Physical Lifted cards will be printed and displayed (for you to pick up and keep!) on the last day of classes.  eLifted cards are virtual cards that you will receive via email on the last day of classes (you can still print them out to create a physical card!).  Whether you get a physical or eLifted card depends on when the sender wrote their message to you.",
  },
  "Receiving Messages": {
    "I know in advance that I won't be able to pick up my physical Lifted card on the last day of classes.  Can I request a virtual copy instead?": "Yes!  New for the Spring 2025 semester, when you receive an email that someone wrote you a physical Lifted card, you can choose whether you'd like to receive an eLifted (virtual) copy of this message (and any new messages you receive) instead of a physical card on the last day of classes.  <b>You must do this by the stated deadline, though.  Check your 'You've been Lifted' email for details</b><br><br>If you are unsure of whether you can pick it up, we ask that you to request a virtual copy so we don't print and display cards that won't be picked up.",
    "Oops!  I forgot to pick up my physical Lifted card on the last day of classes.  Can I still see the card?": "In most cases, no.  Previously, we have allowed people to view their physical cards as eLifted cards, but as the number of Lifted submissions grow, this becomes logistically complicated on our end.  See the previous FAQ for info on how to request a virtual card in advance.",
    "I can't find my card on the last day of classes!": "Check your email from the morning of!  We always send instructions on how to find your messages.  If you can't find the email or still need help, find one of our volunteers or send us an email at lifted@cornell.edu.  During Lifted Day, we'll respond within 1-15 minutes.",
    "I received an anonymous Lifted message, but I'd like to know who wrote it.  Can I know?": "Nope!  This is part of the fun of Lifted!  If you have a concern, send us an email, or if you really want to know who your 'secret admirer' is, send us an email and we can ask them for permission to reveal it :)",
  },
  "Sending Messages": {
    "Who can I send a message to?": "You can send a message to anyone with a NetID, such as a friend, professor, or staff member!  If someone does not have a NetID but is affiliated with Cornell, send us an email and we'll send a message on your behalf. You can also send a message to an alumnus, but be sure to send an eLifted card (wait until the physical Lifted submission form closes, and then you will be able to send an eLifted card). Please note that you will need to type an alumnus's NetID manually, as searching for their name will not work.",
    "How many messages can I send?": "Technically, you can send as many as you'd like.  However, we <b>strongly encourage you to send no more than 5 physical cards</b>, as there are physical limits each semester on how many balloons we can inflate, flowers we can order, or cards that we can hang.  We may need to close the form early if too many cards are submitted, so please be conscious of your peers who also want to submit messages!<br><br>That being said, we encourage you to send as many <b>eLifted</b> cards as you'd like!  Simply wait until the physical Lifted card submission form closes, and then send away (to the rest of your friends, professors, or even your entire club!)",
    "I want to send a message, but I don't have a NetID (e.g., I am a parent or community member).  Can I still send a message?": "Of course!  Send us an email telling us the recipient's NetID, your name that you want to appear on the card, the recipient's name that you want to appear on the card, and the message and we'll send it on your behalf :)",
    "Can I send a message to someone who is not in Ithaca?": "Yes, but please do not send a physical Lifted card.  Instead, wait until the physical Lifted submission form closes, and then you will be able to send an eLifted card.",
    "Can I send an anonymous message?": "Yes!  That being said, we've seen many cards signed 'your secret admirer' - now, we're no experts on love, unlike our friends at Perfect Match, but we do suggest you shoot your shot!",
    "Can my message exceed the word count?": "It can, but we cannot guarantee that it will fit onto the card or be legible.  The messages are converted to card PDFs programmatically, and while our code attempts to shrink the text to fit on the card, it is not guaranteed to work or be legible.  If you have any questions or would like to confirm that your message fits on the card, send us an email in advance of the submission deadline and we can check for you.",
    "Can I write my message in other languages or use non-standard characters?": "Yes, generally this will work.  If you are unsure, send us an email in advance of the submission deadline and we can check your card for you.",
    "Can I include images or special formatting on my card?": "Generally, no, but if you send us an email well in advance of the submission deadline, we can try to make it happen!",
    "Can I edit or delete a message I wrote after submitting it?": "Yes, you can do this through our website until the submission deadline.  If you need to do this after, send us an email and we'll try our best to make it happen, but we cannot guarantee because we send our print order a few hours after the form closes.<br><br>Please note that if you delete a message, the recipient might still expect to receive a card because they already received an automated 'You've been Lifted' email when you originally submitted the message.  Send us an email if you'd like us to (anonymously) tell your recipient that they are no longer Lifted.",
    "Why did my sent physical message turn into an eLifted message?": "Recipients have the option to receive their cards virtually if they can't make it on the last day of classes.  If your recipient does this, that's why your physical message was swapped to an eLifted message!",
    "The recipient's name doesn't show up when I search for them on the submission form.  What should I do?": "We pull the results directly from the official Cornell Directory.  Because it's so large, we automatically filter out less common queries from the search (such as alumni and former faculty/staff).  To get around this, try typing their exact NetID, which should work.  If not, send us an email and we can help!",
    "Will the recipient know I sent them a card before the last day of classes?": "Nope!  When you submit a message, the recipient will immediately receive an automated email saying that they've been Lifted, but it won't tell them who it was!  If you included your name on your message, the recipient will find out on the last day of classes!",
  },
  Other: {
    "Who runs Lifted?  How can I get in contact?": "Lifted is fully planned, organized, and executed by a small group of students passionate about making campus a better place.  If you need to get in contact with us for any reason, send us an email at lifted@cornell.edu (during Lifted season, you should expect to hear back within a few hours; otherwise, expect up to a week).",
    "How is Lifted funded?  How can I support Lifted?": "Lifted, as a registered student organization on campus, is primarily funded through SAFC and often supplementary funding sources such as the Public Events Fund and Giving Day.  Putting on Lifted costs thousands of dollars each year, and if you would like to help offset some costs, we would greatly appreciate any donations during <a href='https://givingday.cornell.edu/campaigns/lifters-at-cornell-university' target='_blank'>Cornell Giving Day</a> and throughout the year!",
    "Will you continue to do a Fall version of Lifted?": "Yes, we plan to!  Historically, Lifted has been a Spring-only event on the Arts Quad.  In Fall 2024, we decided to experiment with an indoor winter-themed version in WSH for the Fall semester, which turned out to be a big success!",
    "Will you use balloons, flowers, or something else in the Spring?": "This depends on interest within our group, our budget, the number of volunteers we have, how many Lifted submissions we get, the weather, and approvals from Cornell -- planning a large-scale event like Lifted is quite complex!  We'll hide some hints on our website, submission form, and emails as Lifted gets closer, but consider whatever we use to be a surprise!",
    "I just realized that I never picked up my card from a previous semester!  Is there any possibility of seeing the message?": "If it was an eLifted card, you can view it anytime by signing into our website.  If it was a physical card, it depends - send us an email."
  }
};

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        className="w-full text-left px-4 py-3 bg-gray-100 rounded-lg font-semibold text-cornell-blue flex justify-between items-center"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span dangerouslySetInnerHTML={{ __html: question }} />
        <span className="ml-2 text-cornell-red text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`inline-block transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
            width="1.5em"
            height="1.5em"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.586l3.71-3.356a.75.75 0 1 1 1.02 1.1l-4.25 3.85a.75.75 0 0 1-1.02 0l-4.25-3.85a.75.75 0 0 1 .02-1.06z" clipRule="evenodd"/>
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 py-3 text-gray-700 bg-white border rounded-b-lg border-gray-200" dangerouslySetInnerHTML={{ __html: answer }} />
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { isWinter } = useGlobal();
  const logoSrc = isWinter ? "../images/logo_winter.png" : "../images/logo.png";

  return (
    <main className={`${isWinter ? 'bg-[#e3eeff]' : 'bg-[#f4fbf3]'} font-tenor`}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-8">
            <img
            src={logoSrc}
            width={250}
            alt="Cornell Lifted Logo"
            className="mx-auto mb-8 transition-transform duration-300 hover:scale-105"
          />
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-2 font-bold text-center">Frequently Asked Questions</h2>
          <p className="text-lg text-center text-gray-700 mb-6">Find answers to common questions about Lifted</p>
        </div>
        <div className="relative bg-white rounded-xl shadow-lg p-6" style={{ overflow: 'visible' }}>
          <SnowAccumulation />
          {/* Balloon decorations */}
          <div className="absolute -top-8 left-8 w-12 h-16 balloon balloon-red opacity-70" />
          <div className="absolute -top-8 right-8 w-12 h-16 balloon balloon-blue opacity-70" />
          {Object.entries(faqs).map(([category, questions]) => (
            <div key={category} className="mb-8">
              <h3 className="text-cornell-blue text-2xl font-bold mb-4">{category}</h3>
              {Object.entries(questions).map(([q, a]) => (
                <Accordion key={q} question={q} answer={a} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
