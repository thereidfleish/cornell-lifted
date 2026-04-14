export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: "4.6",
    date: "4/13/26",
    changes: [
      "Changes for Spring 2026 Lifted, including magic link sign-in, bi-directional swapping, email analytics, and more!",
      "Migrated email sending from Outlook to Postmark",
      "Added Blog page",
      "Miscellaneous content updates and improvements across the web app",
    ],
  },
  {
    version: "4.5",
    date: "3/24/26",
    changes: [
      "Directly using the Supabase API was quite slow, so we've implemented a direct Postgres connection via SQLAlchemy to speed things up!",
    ],
  },
  {
    version: "4.4",
    date: "2/21/26",
    changes: [
      "We've migrated our backend database from a local SQLite DB to Supabase!  If you don't know what this means, you can stop reading.  If you do, then feel free to email us to geek out about databases!  Fun fact - as of right now, the Lifted database of about 30,000 cards is about 25 MB.  The more you know!",
    ],
  },
  {
    version: "4.3.1",
    date: "2/10/26",
    changes: [
      "Added Fall 2025 Popped!",
      "Updated content on various pages",
    ],
  },
  {
    version: "4.3",
    date: "12/25/25",
    changes: [
      "Cards are now created and exported via Google Slides API instead of Powerpoint.  This will make card PDF exporting much more reliable!",
    ],
  },
  {
    version: "4.2",
    date: "11/14/25",
    changes: [
      "New winter theme for Fall 2025 Lifted!",
      "Misc. changes to get ready for Fall 2025 Lifted!",
    ],
  },
  {
    version: "4.1",
    date: "10/11/25",
    changes: [
      "Various quality of life improvements, such as migration to nicer looking tables",
      "New You've Been Lifted email template!",
    ],
  },
  {
    version: "4.0",
    date: "8/23/25",
    changes: [
      "We've migrated the web app from pure Flask/Jinja2 to Next.js/React frontend and Flask backend!  This improves the overall user experience and maintainability of the web app.",
    ],
  },
  {
    version: "3.2.3",
    date: "6/4/25",
    changes: [
      "Want to see some fun stats about Lifted?  Well, now you can!  We've added a Lifted Popped tab!",
    ],
  },
  {
    version: "3.2.2",
    date: "5/7/25",
    changes: [
      "To make it easier for us on the backend, we've added a hidden card override option to the Admin Dashboard.  Now, if you request access to your Lifted cards that you forgot to pick up three years ago, we can reveal them on your Messages page in one click, rather than digging through our archives!",
    ],
  },
  {
    version: "3.2.1",
    date: "5/3/25",
    changes: [
      "Card PDF caching for quicker retrievals of card PDFs.  What does this mean?  Well, we no longer have to generate a PDF of your card from scratch every time you want to download it.  Instead, we do this once, and you can download it once, twice, or a thousand times more without any delay!",
      "Minor bug fixes and improvements",
    ],
  },
  {
    version: "3.2",
    date: "4/27/25",
    changes: [
      "We've added support for different card templates per card attachment (both on single and bulk message PPTX/PDF export).  This means we can now customize the appearance of each card depending on what attachment you chose!",
      "Now you can see which attachment your recipient selected (if any) by clicking on your sent messages.  Happy snooping!",
      "Minor bug fixes and improvements",
    ],
  },
  {
    version: "3.1.3",
    date: "4/25/25",
    changes: [
      "Y'all didn't understand what message swapping was, so we've made this more clear (new FAQ, notice on sent messages tab)",
      "Attachment selection improvements and bug fixes",
    ],
  },
  {
    version: "3.1.2",
    date: "4/21/25",
    changes: ["Minor content-related changes"],
  },
  {
    version: "3.1.1",
    date: "4/18/25",
    changes: ["Minor changes"],
  },
  {
    version: "3.1",
    date: "4/17/25",
    changes: [
      "Oops!  Upon opening up the Lifted submission form, we've identified cases where it will log users out prematurely.  We've implemented a temporary workaround for this OIDC auth refresh token issue",
    ],
  },
  {
    version: "3.0.1",
    date: "4/15/25",
    changes: [
      "Minor UI improvements",
      "Logging and Recently Deleted on Admin Dashboard",
    ],
  },
  {
    version: "3.0",
    date: "4/14/25",
    changes: [
      "We've completely redesigned the web app!  It looks a lot nicer now!",
      "Now, you can choose an attachment with your cards!",
    ],
  },
  {
    version: "2.0",
    date: "1/14/25",
    changes: [
      "Completely re-worked the entire web app, switching to OIDC Auth, LDAP people search, new SQLite DB, automated emails via Outlook, and more",
      "Web app allows sending messages, viewing messages, editing/deleting messages, swapping messages, and much more",
      "Admin dashboard with Lifted config settings, form/email rich text editor, automated card PDF conversions via PPTX, viewing/managing messages, viewing aux tables, and more.  Running Lifted at scale is now much easier for us!",
    ],
  },
  {
    version: "1.0",
    date: "12/9/24",
    changes: [
      "We made a web app with the ability to view most existing Lifted cards!  This makes it easier for us so we don't do things super manually.",
      "Cornell NetID SAML2 Authentication",
    ],
  },
  {
    version: "0",
    date: "2016-2024",
    changes: ["Static Website with various minor edits over the years"],
  },
];

export const latestChangelogEntry = changelogEntries[0];
