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
  const quillRef = useRef<any>(null);

  // Register Quill attributors **on the client** before mounting the editor
  useEffect(() => {
    (async () => {
      const { Quill } = await import("react-quill-new");

      // Prefer class-based fonts (easier CSS + no spaces in tokens)
      const Font = Quill.import("attributors/class/font");
      Font.whitelist = ["georgia", "arial", "verdana", "schoolbell", "tenor-sans"];
      Quill.register(Font, true);

      // Use style-based sizes to get pixel values
      const Size = Quill.import("attributors/style/size");
      Size.whitelist = ["10px", "11px", "12px", "14px", "16px", "18px", "20px"];
      Quill.register(Size, true);

      Quill.register(Quill.import("attributors/style/align"), true);

      setReady(true);
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/get-rich-text/${messageGroup}/${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setHtml(data.html || "");
        setSubject(data.subject || "");
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
  };

  if (!ready) return null; // wait until Quill attributors are registered

  return (
    <div className="w-full">
      {type === "email" && (
        <div className="mb-2">
          <label htmlFor={`${type}-subject-input`} className="font-semibold">
            Subject:
          </label>
          <input
            id={`${type}-subject-input`}
            type="text"
            className="border rounded px-2 py-1 ml-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      )}

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
  );
}
