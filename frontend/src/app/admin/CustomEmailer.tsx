import React, { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import useAdminReadOnly from "./useAdminReadOnly";
import { useRichTextDocument } from "./useRichTextDocument";

export default function CustomEmailer() {
  const isReadOnlyAdmin = useAdminReadOnly();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const draftDocument = useRichTextDocument("_custom_emailer", "draft");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("");
    setSending(true);

    try {
      const res = await fetch("/api/admin/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          cc,
          bcc,
          subject: draftDocument.content.subject,
          html: draftDocument.content.html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.status || "Failed to send custom email");
      } else {
        setStatus(data.status || "Custom email sent successfully!");
      }
    } catch {
      setError("Failed to send custom email");
    }

    setSending(false);
  }

  return (
    <section className="mb-8 space-y-6">
      <h5 className="font-bold text-lg mb-2">Custom Emailer</h5>
      <p className="text-gray-700">
        Compose and send a custom email using the same Lifted email template and live preview. Recipients support comma-separated emails.
      </p>

      <form className="space-y-4" onSubmit={handleSendEmail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">To (comma-separated)</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="a@cornell.edu, b@cornell.edu"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">CC (comma-separated)</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="optional"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">BCC (comma-separated)</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="optional"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded p-2 bg-white">
          <React.Suspense fallback={<div>Loading editor...</div>}>
            <RichTextEditor
              type="draft"
              disableSaveButtons={isReadOnlyAdmin}
              initialContent={draftDocument.initialContent}
              isLoading={draftDocument.loading}
              previewHtml={draftDocument.previewHtml}
              previewLoading={draftDocument.previewLoading}
              onContentChange={draftDocument.setContent}
              onSave={draftDocument.saveContent}
            />
          </React.Suspense>
        </div>

        <button
          type="submit"
          className="bg-cornell-blue text-white rounded px-4 py-2 font-semibold shadow hover:bg-cornell-red transition"
          disabled={isReadOnlyAdmin || sending}
        >
          {sending ? "Sending..." : "Send Custom Email"}
        </button>
      </form>

      {status && <div className="text-green-700 font-semibold">{status}</div>}
      {error && <div className="text-red-600 font-semibold">{error}</div>}
    </section>
  );
}
