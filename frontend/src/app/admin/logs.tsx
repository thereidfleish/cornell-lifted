import React, { useEffect, useState } from "react";
import Table, { TableHeader } from "@/components/Table";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("AdminLogsPage mounted");
    async function fetchLogs() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/logs");
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data.logs || []);
        setRecentlyDeleted(data.recently_deleted_messages || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const logHeaders: TableHeader[] = [
    { key: "id", label: "ID" },
    { key: "log_timestamp", label: "Timestamp" },
    { key: "user_email", label: "NetID" },
    { key: "user_name", label: "Name" },
    { key: "log_type", label: "Type" },
    { key: "error_code", label: "Error Code" },
    { key: "log_content", label: "Content" },
  ];
  const deletedHeaders: TableHeader[] = [
    { key: "id", label: "ID" },
    { key: "created_timestamp", label: "Created Timestamp" },
    { key: "deleted_timestamp", label: "Deleted Timestamp" },
    { key: "message_group", label: "Message Group" },
    { key: "sender_email", label: "Sender Email" },
    { key: "sender_name", label: "Sender Name" },
    { key: "recipient_email", label: "Recipient Email" },
    { key: "recipient_name", label: "Recipient Name" },
    { key: "message_content", label: "Message Content" },
  ];

  return (
    <main className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Logs</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2">Logs</h2>
          <p className="mb-2 text-gray-700">The logs table. Num entries: {logs.length}</p>
          <Table headers={logHeaders} data={logs} className="mb-8" style={{ maxHeight: 600 }} />

          <h2 className="text-xl font-semibold mb-2">Recently Deleted Messages</h2>
          <p className="mb-2 text-gray-700">The recently deleted messages table. Num entries: {recentlyDeleted.length}</p>
          <Table headers={deletedHeaders} data={recentlyDeleted} style={{ maxHeight: 600 }} />
        </>
      )}
    </main>
  );
}
