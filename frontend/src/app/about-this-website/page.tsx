import React from "react";

export default function AboutThisWebsitePage() {
  return (
    <div className="faq-page min-h-screen bg-gray-50">
      {/* Sticky Navigation Bar - replace with your NavBar component if needed */}
      {/* <NavBar /> */}
      <div className="container mx-auto p-4 max-w-3xl">
        <h3 className="text-2xl font-bold mb-4">About this Website</h3>
        <p className="mb-6">Lifted is a really special project to work on, and this web app is one small part of the entire Lifted experience.  We hope you've enjoyed!</p>

        <h5 className="text-lg font-semibold my-2">Web App Credits</h5>
        <p className="mb-2">Special thanks to Cornell IT for working with us on implementing NetID authentication and LDAP querying!</p>
        <p className="mb-2">Powered by Next.js, React, Flask, SQLite, Powerpoint, Outlook, and a trusted mini Windows PC hosting the whole thing :)</p>
        <p className="mb-2">To report any bugs or issues, please email <a href="mailto:lifted@cornell.edu">lifted@cornell.edu</a>.</p>
        <p className="mb-6">~ RF, NS, VW</p>


        <h5 className="text-lg font-semibold my-2">Changelog</h5>
        <div className="space-y-4">
          <div>
            <b>Version 4.2 (11/14/25)</b>
            <ul className="list-disc ml-6">
              <li>New winter theme for Fall 2025 Lifted!</li>
              <li>Misc. changes to get ready and open form for Fall 2025 Lifted!</li>
            </ul>
          </div>
          <div>
            <b>Version 4.1 (10/11/25)</b>
            <ul className="list-disc ml-6">
              <li>Various quality of life improvements, such as migration to better tables</li>
              <li>New You've Been Lifted email template!</li>
            </ul>
          </div>
          <div>
            <b>Version 4.0 (8/23/25)</b>
            <ul className="list-disc ml-6">
              <li>We've migrated the web app from pure Flask/Jinja2 to Next.js/React frontend and Flask backend!  This improves the overall user experience and maintainability of the web app.</li>
            </ul>
          </div>
          <div>
            <b>Version 3.2.3 (6/4/25)</b>
            <ul className="list-disc ml-6">
              <li>Want to see some fun stats about Lifted?  Well, now you can!  We've added a Lifted Popped tab!</li>
            </ul>
          </div>
          <div>
            <b>Version 3.2.2 (5/7/25)</b>
            <ul className="list-disc ml-6">
              <li>To make it easier for us on the backend, we've added a hidden card override option to the Admin Dashboard.  Now, if you request access to your Lifted cards that you forgot to pick up three years ago, we can reveal them on your Messages page in one click, rather than digging through our archives!</li>
            </ul>
          </div>
          <div>
            <b>Version 3.2.1 (5/3/25)</b>
            <ul className="list-disc ml-6">
              <li>Card PDF caching for quicker retrievals of card PDFs.  What does this mean?  Well, we no longer have to generate a PDF of your card from scratch every time you want to download it.  Instead, we do this once, and you can download it once, twice, or a thousand times more without any delay!</li>
              <li>Minor bug fixes and improvements</li>
            </ul>
          </div>
          <div>
            <b>Version 3.2 (4/27/25)</b>
            <ul className="list-disc ml-6">
              <li>We've added support for different card templates per card attachment (both on single and bulk message PPTX/PDF export).  This means we can now customize the appearance of each card depending on what attachment you chose!</li>
              <li>Now you can see which attachment your recipient selected (if any) by clicking on your sent messages.  Happy snooping!</li>
              <li>Minor bug fixes and improvements</li>
            </ul>
          </div>
          <div>
            <b>Version 3.1.3 (4/25/25)</b>
            <ul className="list-disc ml-6">
              <li>Y'all didn't understand what message swapping was, so we've made this more clear (new FAQ, notice on sent messages tab)</li>
              <li>Attachment selection improvements and bug fixes</li>
            </ul>
          </div>
          <div>
            <b>Version 3.1.2 (4/21/25)</b>
            <ul className="list-disc ml-6">
              <li>Minor content-related changes</li>
            </ul>
          </div>
          <div>
            <b>Version 3.1.1 (4/18/25)</b>
            <ul className="list-disc ml-6">
              <li>Minor changes</li>
            </ul>
          </div>
          <div>
            <b>Version 3.1 (4/17/25)</b>
            <ul className="list-disc ml-6">
              <li>Oops!  Upon opening up the Lifted submission form, we've identified cases where it will log users out prematurely.  We've implemented a temporary workaround for this OIDC auth refresh token issue</li>
            </ul>
          </div>
          <div>
            <b>Version 3.0.1 (4/15/25)</b>
            <ul className="list-disc ml-6">
              <li>Minor UI improvements</li>
              <li>Logging and Recently Deleted on Admin Dashboard</li>
            </ul>
          </div>
          <div>
            <b>Version 3.0 (4/14/25)</b>
            <ul className="list-disc ml-6">
              <li>We've completely redesigned the web app!  It looks a lot nicer now!</li>
              <li>Now, you can choose an attachment with your cards!</li>
            </ul>
          </div>
          <div>
            <b>Version 2.0 (1/14/25)</b>
            <ul className="list-disc ml-6">
              <li>Completely re-worked the entire web app, switching to OIDC Auth, LDAP people search, new SQLite DB, automated emails via Outlook, and more</li>
              <li>Web app allows sending messages, viewing messages, editing/deleting messages, swapping messages, and much more</li>
              <li>Admin dashboard with Lifted config settings, form/email rich text editor, automated card PDF conversions via PPTX, viewing/managing messages, viewing aux tables, and more.  Running Lifted at scale is now much easier for us!</li>
            </ul>
          </div>
          <div>
            <b>Version 1.0 (12/9/24)</b>
            <ul className="list-disc ml-6">
              <li>We made a web app with the ability to view most existing Lifted cards!  This makes it easier for us so we don't do things super manually.</li>
              <li>Cornell NetID SAML2 Authentication</li>
            </ul>
          </div>
          <div>
            <b>Version 0 (2016-2024)</b>
            <ul className="list-disc ml-6">
              <li>Static Website with various minor edits over the years</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
