import React, { useEffect, useState } from "react";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import Table, { TableHeader } from "@/components/Table";
import MessageGroupSelector from "@/components/MessageGroupSelector";

interface HiddenCardOverride {
  id: number;
  recipient_email: string;
  message_group: string;
}

const headers: TableHeader[] = [
    { key: "id", label: "ID" },
  { key: "recipient_email", label: "Recipient Email" },
  { key: "message_group", label: "Message Group" },
  { key: "delete", label: "Delete" },
];

export default function HiddenCardOverridesSection() {
  const [overrides, setOverrides] = useState<HiddenCardOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [dataUpdated, setDataUpdated] = useState(false);

  // Fetch overrides
  useEffect(() => {
    async function fetchOverrides() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/get-hidden-card-overrides");
        const data = await res.json();
        setOverrides(data.hidden_card_overrides || []);
      } catch (err: any) {
        setError("Failed to load hidden card overrides");
      }
      setLoading(false);
    }
    fetchOverrides();
  }, []);

  // Add override
  async function handleAddOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail || !selectedGroup) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("hidden-card-message-group-input", selectedGroup);
      formData.append("hidden-card-email-input", recipientEmail);
      const res = await fetch("/api/admin/add-hidden-card-override", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setRecipientEmail("");
        setSelectedGroup("");
        const data = await res.json();
        setOverrides(data.hidden_card_overrides || []);
        setDataUpdated(true);
        setTimeout(() => setDataUpdated(false), 2000);
      } else {
        setError("Failed to add override");
      }
    } catch (err) {
      setError("Failed to add override");
    }
    setSubmitting(false);
  }

  // Remove override with confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [overrideToDelete, setOverrideToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDeleteDialog(id: number) {
    setOverrideToDelete(id);
    setConfirmOpen(true);
  }

  async function handleRemoveOverrideConfirmed() {
    if (overrideToDelete === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/remove-hidden-card-override/${overrideToDelete}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setOverrides(data.hidden_card_overrides || []);
        setDataUpdated(true);
        setTimeout(() => setDataUpdated(false), 2000);
      } else {
        setError("Failed to remove override");
      }
    } catch (err) {
      setError("Failed to remove override");
    }
    setDeleting(false);
    setConfirmOpen(false);
    setOverrideToDelete(null);
  }

  const tableData = overrides.map((override) => ({
    id: override.id,
    recipient_email: override.recipient_email,
    message_group: override.message_group,
    delete: (
      <button
        title="Remove override"
        className="text-red-600 hover:text-red-800 text-lg px-2"
        onClick={() => openDeleteDialog(override.id)}
      >
        🗑️
      </button>
    ),
  }));

  return (
    <section className="mb-8">
      <h5 className="font-bold text-lg mb-2">Hidden Card Overrides</h5>
      <p className="mb-4 text-gray-700">Override hidden cards for specific message groups. Add a recipient email and select a message group to hide their card.</p>
      <form className="flex flex-col gap-4 items-start mb-6" onSubmit={handleAddOverride}>
        <label htmlFor="message-group" className="font-medium text-gray-700">Message Group</label>
        <MessageGroupSelector
          initialValue={selectedGroup}
          onChange={val => setSelectedGroup(val.key)}
          dropdown={true}
          className="w-full"
        />
        <label htmlFor="recipient-email" className="font-medium text-gray-700">Recipient Email (e.g. rf377@cornell.edu)</label>
        <input
          id="recipient-email"
          type="email"
          className="border rounded px-3 py-2"
          placeholder="rf377@cornell.edu"
          value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-cornell-blue text-white rounded px-4 py-2 font-semibold shadow hover:bg-cornell-red transition"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Override"}
        </button>
      </form>
      {dataUpdated && <div className="text-green-600 mb-2">Data updated</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-500">Loading overrides...</div>
      ) : (
        <>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <Table headers={headers} data={tableData} maxHeight={400} />
          </div>
          <DeleteConfirmation
            open={confirmOpen}
            onConfirm={handleRemoveOverrideConfirmed}
            onCancel={() => { setConfirmOpen(false); setOverrideToDelete(null); }}
            deleting={deleting}
            title="Remove hidden card override?"
            description="Are you sure you want to remove this override? This action cannot be undone."
          />
        </>
      )}
    </section>
  );
}
