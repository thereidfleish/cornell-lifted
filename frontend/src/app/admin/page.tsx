"use client"
import React, { useState } from "react";
import AdminLogsPage from "./logs";

const sidebarSections = [
  {
    title: "Lifted Config",
    items: ["Essentials", "Attachments", "Swapping", "Hidden Card Overrides"],
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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("Essentials");

  function renderTabContent() {
    if (activeTab === "Logs") {
      return <AdminLogsPage />;
    }
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{activeTab}</h2>
        <div className="text-gray-700">Content for {activeTab} goes here.</div>
      </div>
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
                    onClick={() => setActiveTab(item)}
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
