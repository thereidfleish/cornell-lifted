"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import ReactQuill so it never runs during SSR
const ReactQuill = dynamic(async () => (await import("react-quill-new")).default, {
  ssr: false,
  loading: () => <div>Loading editor…</div>,
});

type Props = { messageGroup: string; type: string };

const toolbarOptions = [
  [{ 'font': ['georgia', 'arial', 'verdana', 'schoolbell', 'tenor-sans'] }],
  [{ 'size': ['10px', '11px', '12px', '14px', '16px', '18px', '20px'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'align': [] }],
  ['link'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'color': [] }, { 'background': [] }],
  ['clean']
];

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
  "color",
  "background",
];

export default function RichTextEditor({ messageGroup, type }: Props) {
  const [ready, setReady] = useState(false);
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const quillRef = useRef<any>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Register Quill attributors **on the client** before mounting the editor
  useEffect(() => {
    (async () => {
      const { Quill } = await import("react-quill-new");

      // Prefer class-based fonts (easier CSS + no spaces in tokens)
      const Font = Quill.import("attributors/class/font") as any;
      Font.whitelist = ["georgia", "arial", "verdana", "schoolbell", "tenor-sans"];
      Quill.register(Font, true);

      // Use style-based sizes to get pixel values
      const Size = Quill.import("attributors/style/size") as any;
      Size.whitelist = ["10px", "11px", "12px", "14px", "16px", "18px", "20px"];
      Quill.register(Size, true);

      const Align = Quill.import("attributors/style/align") as any;
      Quill.register(Align, true);

      setReady(true);
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/get-rich-text/${messageGroup}/${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        const htmlContent = data.html || "";
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
    const editor = quillRef.current?.getEditor?.();
    const currentHtml = editor ? editor.root.innerHTML : html;
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

  if (!ready) return null; // wait until Quill attributors are registered

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
            <>
              <ReactQuill
                // ref={quillRef}
                value={html}
                onChange={setHtml}
                formats={formats}
                modules={{ toolbar: toolbarOptions }}
                theme="snow"
                className="bg-white"
              />
            </>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded bg-cornell-red text-white font-semibold shadow hover:bg-red-700 border border-cornell-red transition-colors duration-150"
            >
              Save
            </button>
            {type !== "form" && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded bg-white text-cornell-red font-semibold shadow border border-cornell-red hover:bg-gray-100 transition-colors duration-150"
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
                Live Preview
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
              <p className="text-xs text-gray-500 mt-2">
                Preview updates automatically as you type (with 1 second delay)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
