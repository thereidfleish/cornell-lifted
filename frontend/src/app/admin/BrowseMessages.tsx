import React, { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from 'ag-grid-community';
import MessageGroupSelector from "@/components/MessageGroupSelector";
import Loading from "@/components/Loading";
import MessageModal from "@/components/messages/MessageModal";
import DeleteConfirmation from "@/components/DeleteConfirmation";

import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export interface Message {
  id: number;
  created_timestamp: string;
  message_group: string;
  sender_email: string;
  recipient_email: string;
  sender_name: string;
  recipient_name: string;
  message_content: string;
  attachment?: string;
}

export default function BrowseMessagesSection() {

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCardId, setModalCardId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initial fetch: set default message group
  useEffect(() => {
    // MessageGroupSelector will auto-select first group
    setSelectedGroup("");
  }, []);

  // Fetch messages
  async function fetchMessages() {
    setLoading(true);
    setError(null);
    setStatus("Loading...");
    try {
      const res = await fetch(`/api/admin/browse-messages?q=${encodeURIComponent(query)}&mg=${encodeURIComponent(selectedGroup || "all")}`);
      const data = await res.json();
      if (data.results === "none") {
        setMessages([]);
        setStatus("No results found. Check your spelling or try typing in the exact NetID.");
      } else {
        setMessages(data.results);
        setStatus(`${data.results.length} result(s) found. There are ${new Set(data.results.map((m: Message) => m.sender_email)).size} unique senders, and ${new Set(data.results.map((m: Message) => m.recipient_email)).size} unique recipients.`);
      }
    } catch (err) {
      setError("Failed to load messages");
      setStatus("");
    }
    setLoading(false);
  }

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedGroup) fetchMessages();
    }, 500);
    return () => clearTimeout(timer);
  }, [query, selectedGroup]);

  const tableData = messages.map((msg) => ({
    tools: (
      <div className="flex gap-2">
        <button title="View message" className="p-0 bg-none border-none text-xl cursor-pointer" onClick={() => { setModalCardId(msg.id); setModalOpen(true); }}>💌</button>
        <a href={`/api/get-card-pdf/${msg.id}`} title="Download PDF" className="px-1 text-xl" target="_blank" rel="noopener noreferrer">⬇️</a>
        <a href={`/edit-message/${msg.id}`} title="Edit message" target="_blank" className="px-1 text-xl">✍️</a>
        <button title="Delete message" className="p-0 bg-none border-none text-xl cursor-pointer" onClick={() => { setDeleteId(msg.id); setConfirmOpen(true); }}>🗑️</button>
      </div>
    ),
    created_timestamp: msg.created_timestamp,
    message_group: msg.message_group,
    sender_email: msg.sender_email,
    recipient_email: msg.recipient_email,
    sender_name: msg.sender_name,
    recipient_name: msg.recipient_name,
    message_content: msg.message_content,
    id: msg.id,
  }));

  // Update columnDefs for message_content column
const columnDefs = [
  { headerName: "Tools", field: "tools", cellRenderer: (params: any) => params.value, sortable: false, filter: false, resizable: false, maxWidth: 150 },
  { headerName: "Timestamp", field: "created_timestamp", wrapText: true, maxWidth: 120 },
  { headerName: "Message Group", field: "message_group", wrapText: true, maxWidth: 120 },
  { headerName: "Sender Email", field: "sender_email", wrapText: true, maxWidth: 160 },
  { headerName: "Recipient Email", field: "recipient_email", wrapText: true, maxWidth: 160 },
  { headerName: "Sender Name", field: "sender_name", wrapText: true, maxWidth: 150 },
  { headerName: "Recipient Name", field: "recipient_name", wrapText: true, maxWidth: 150 },
  {
    headerName: "Message", field: "message_content", wrapText: true, minWidth: 500,
    autoHeight: true,
  },
  { headerName: "ID", field: "id", maxWidth: 100 },
];
  async function handleDeleteConfirmed() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/delete-message/${deleteId}`, { method: "POST" });
      const data = await res.json();
      if (data.deleted === true) {
        setMessages(messages.filter(m => m.id !== deleteId));
        setStatus("Message deleted.");
      } else {
        setError("Failed to delete message");
      }
    } catch {
      setError("Failed to delete message");
    }
    setDeleting(false);
    setConfirmOpen(false);
    setDeleteId(null);
  }

  return (
    <section className="mb-8">
      <h5 className="font-bold text-lg mb-2">Browse Cards</h5>
      <p className="mb-4 text-gray-700">Use this tool to browse and manage Lifted messages, including viewing, editing, deleting, and downloading cards. Filter by NetID or email and select a message group.</p>
      <form className="flex flex-col md:flex-row gap-4 items-start mb-6" onSubmit={e => e.preventDefault()}>
        <div className="flex flex-col">
          <label htmlFor="message-query-input" className="font-medium text-gray-700">Filter by NetID or Email</label>
          <input
            id="message-query-input"
            type="text"
            className="border rounded px-3 py-2"
            placeholder="rf377"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="message-group" className="font-medium text-gray-700">Filter by Message Group</label>
          <MessageGroupSelector
            initialValue={selectedGroup}
            onChange={val => setSelectedGroup(val.key)}
            dropdown={true}
            showAllTimeOption={true}
            className="w-full"
          />
        </div>
      </form>
      <div className="mb-2 text-cornell-blue font-semibold text-base">{status}</div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <Loading />
      ) : (
        <div className="ag-theme-alpine rounded-lg border border-gray-300" style={{ height: 600, width: "100%", minWidth: "1000px" }}>
          <AgGridReact
            columnDefs={columnDefs as any}
            rowData={tableData}
            pagination={tableData.length > 100}
            paginationPageSize={100}
            defaultColDef={{ cellStyle: { lineHeight: "1.5", padding: "8px" } }}
          />
        </div>
      )}
      <MessageModal
        cardId={modalCardId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        overrideHiddenMessage={false}
      />
      <DeleteConfirmation
        open={confirmOpen}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => { setConfirmOpen(false); setDeleteId(null); }}
        deleting={deleting}
        title="Delete message?"
        description="Are you sure you want to delete this message? This action cannot be undone."
      />
    </section>
    );
}
