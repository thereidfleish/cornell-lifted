"use client"
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGlobal } from "@/utils/GlobalContext";
import AdminLogsPage from "./Logs";
import AdminsSection from "./Admins";
import HiddenCardOverridesSection from "./HiddenCardOverrides";
import BrowseMessagesSection from "./BrowseMessages";
import ProcessCards from "./ProcessCards";

import EssentialsSection from "./MessageGroups";
import FormAndEmailSection from "./FormAndEmail";
import AttachmentOptions from "./AttachmentOptions";
import SwappingOptions from "./SwappingOptions";
import Impersonate from "./Impersonate";

const sidebarSections = [
  {
    title: "Lifted Config",
    items: ["Message Groups", "Form and Email", "Attachments", "Swapping", "Hidden Card Overrides"],
  },
  {
    title: "Messages",
    items: ["Browse", "Process"],
  },
  {
    title: "Advanced",
    items: ["Impersonation", "Admins", "Logs"],
  },
];

// Convert tab name to URL slug
const toSlug = (tab: string) => tab.toLowerCase().replace(/\s+/g, "-");
// Convert URL slug to tab name
const fromSlug = (slug: string) => 
  sidebarSections.flatMap(s => s.items).find(item => toSlug(item) === slug) || "Message Groups";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useGlobal() as any;

  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(() => tabParam ? fromSlug(tabParam) : "Message Groups");

  // Check admin status (user?.user?.is_admin is typical)
  const isAdmin = user?.user?.is_admin;

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/admin?tab=${toSlug(tab)}`);
  };

  function renderTabContent() {
    if (activeTab === "Message Groups") {
      return <EssentialsSection />;
    }
    if (activeTab === "Form and Email") {
      return <FormAndEmailSection />;
    }
    if (activeTab === "Attachments") {
      return <AttachmentOptions />;
    }
    if (activeTab === "Swapping") {
      return <SwappingOptions />;
    }
    if (activeTab === "Logs") {
      return <AdminLogsPage />;
    }
    if (activeTab === "Admins") {
      return <AdminsSection />;
    }
    if (activeTab === "Hidden Card Overrides") {
      return <HiddenCardOverridesSection />;
    }
    if (activeTab === "Browse") {
      return <BrowseMessagesSection />;
    }
    if (activeTab === "Process") {
      return <ProcessCards />;
    }
    if (activeTab === "Impersonation") {
      return <Impersonate />;
    }
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{activeTab}</h2>
        <div className="text-gray-700">Content for {activeTab} goes here.</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          You do not have admin access to this page.
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 border-r border-gray-200 p-6 flex flex-col gap-8">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-cornell-blue font-bold text-lg mb-2">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition font-medium text-gray-700 cursor-pointer ${activeTab === item ? "bg-cornell-blue text-white" : "hover:bg-blue-500 hover:text-white"}`}
                    onClick={() => handleTabChange(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        {renderTabContent()}
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-8"><h1 className="text-4xl font-bold">Loading Admin Dashboard...</h1></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
