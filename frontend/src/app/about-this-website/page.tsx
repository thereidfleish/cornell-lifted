import React from "react";
import { changelogEntries } from "@/data/changelog";

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
        <p className="mb-2">Powered by Next.js, React, Flask, Supabase, Google Slides, Outlook, and a trusted mini Windows PC hosting the whole thing :)</p>
        <p className="mb-2">To report any bugs or issues, please email <a href="mailto:lifted@cornell.edu">lifted@cornell.edu</a> or <a href="mailto:rf377@cornell.edu">rf377@cornell.edu</a>.</p>
        <p className="mb-6">~ RF '25, NS '25, VW '25</p>


        <h5 className="text-lg font-semibold my-2">Changelog</h5>
        <div className="space-y-4">
          {changelogEntries.map((entry) => (
            <div key={`${entry.version}-${entry.date}`}>
              <b>Version {entry.version} ({entry.date})</b>
              <ul className="list-disc ml-6">
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
