"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(async () => (await import("./TiptapEditor")).default, {
  ssr: false,
  loading: () => <div>Loading editor…</div>,
});

type Props = { messageGroup: string; type: string; disableSaveButtons?: boolean };

export default function RichTextEditor({ messageGroup, type, disableSaveButtons = false }: Props) {
  const [html, setHtml] = useState("");
  const [jsonContent, setJsonContent] = useState<any>("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/get-rich-text/${messageGroup}/${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const htmlContent = data.html || "";
        const loadedJsonContent = data.json ?? htmlContent;
        setJsonContent(loadedJsonContent);
        setHtml(htmlContent);
        setSubject(data.subject || "");
        
        // Load initial preview for email types
        if (type !== "form" && htmlContent) {
          updatePreview(htmlContent);
        }
      })
      .finally(() => setLoading(false));
  }, [messageGroup, type]);

  const handleSave = async (sendEmail = false) => {
    const currentHtml = html;
    setStatus("Saving…");
    const res = await fetch(
      `/api/admin/save-rich-text/${messageGroup}/${type}?send_email=${sendEmail}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: currentHtml, subject }),
      }
    );
    setStatus(res.ok ? "Saved successfully!" : "Failed to save.");
    setTimeout(() => setStatus(""), 2000);
    
    // Refresh preview after saving
    if (res.ok && type !== "form") {
      updatePreview(currentHtml);
    }
  };

  // Function to fetch live preview
  const updatePreview = async (content: string) => {
    if (type === "form" || !content) return;
    
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/preview-email-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: content }),
      });
      
      if (res.ok) {
        const previewHtmlText = await res.text();
        setPreviewHtml(previewHtmlText);
      }
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounced preview update for live editing (only for email types)
  useEffect(() => {
    if (type === "form" || !html) return;
    
    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    // Set new timeout to refresh preview after 1 second of no edits
    previewTimeoutRef.current = setTimeout(() => {
      updatePreview(html);
    }, 1000);
    
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [html, type]);

  return (
    <div className="w-full">
      {/* Show a Subject input for any email-like editor (recipient/sender/etc.), not only when type === 'email' */}
      {type !== "form" && (
        <div className="mb-2 flex items-center gap-3">
          <label htmlFor={`${type}-subject-input`} className="font-semibold w-36">
            Subject:
          </label>
          <input
            id={`${type}-subject-input`}
            type="text"
            className="border rounded px-3 py-2 flex-1"
            value={subject}
            placeholder="Email subject"
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Editor Section */}
        <div className="flex-1">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <TiptapEditor value={jsonContent} onChange={setJsonContent} onHtmlChange={setHtml} />
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded bg-cornell-red text-white font-semibold shadow hover:bg-red-700 border border-cornell-red transition-colors duration-150"
              disabled={disableSaveButtons}
            >
              Save
            </button>
            {type !== "form" && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded bg-white text-cornell-red font-semibold shadow border border-cornell-red hover:bg-gray-100 transition-colors duration-150"
                disabled={disableSaveButtons}
              >
                Save and Send Test Email to Yourself
              </button>
            )}
          </div>
          {status && <div className="mt-2 text-sm text-green-600">{status}</div>}
        </div>

        {/* Live Preview Section - Only for email types */}
        {type !== "form" && !loading && (
          <div className="flex-1 lg:max-w-[50%]">
            <div className="sticky top-4">
              <h4 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                {previewLoading && (
                  <span className="text-xs text-gray-500">(updating...)</span>
                )}
              </h4>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[600px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="w-full h-[600px] flex items-center justify-center text-gray-500">
                    <p>Preview will appear here...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
