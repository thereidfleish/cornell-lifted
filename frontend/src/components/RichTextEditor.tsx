"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(async () => (await import("./TiptapEditor")).default, {
  ssr: false,
  loading: () => <div>Loading editor…</div>,
});

type RichTextContent = {
  html: string;
  subject: string;
};

type RichTextEditorProps = {
  type: string;
  disableSaveButtons?: boolean;
  initialContent?: RichTextContent | null;
  isLoading?: boolean;
  previewHtml?: string;
  previewLoading?: boolean;
  onContentChange?: (content: RichTextContent) => void;
  onSave?: (content: RichTextContent, sendEmail: boolean) => void | Promise<void>;
};

export default function RichTextEditor({
  type,
  disableSaveButtons = false,
  initialContent,
  isLoading = false,
  previewHtml,
  previewLoading = false,
  onContentChange,
  onSave,
}: RichTextEditorProps) {
  const [html, setHtml] = useState("");
  const [jsonContent, setJsonContent] = useState<any>("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const htmlContent = initialContent?.html || "";
    setHtml(htmlContent);
    setJsonContent(htmlContent);
    setSubject(initialContent?.subject || "");
  }, [initialContent, type]);

  useEffect(() => {
    if (onContentChange) {
      onContentChange({ html, subject });
    }
  }, [html, subject, onContentChange]);

  const handleSave = async (sendEmail = false) => {
    if (!onSave) return;

    setStatus("Saving…");
    try {
      await onSave({ html, subject }, sendEmail);
      setStatus("Saved successfully!");
    } catch {
      setStatus("Failed to save.");
    }
    setTimeout(() => setStatus(""), 2000);
  };

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
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            <TiptapEditor value={jsonContent} onChange={setJsonContent} onHtmlChange={setHtml} />
          )}

          {onSave && (
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
          )}
          {status && <div className="mt-2 text-sm text-green-600">{status}</div>}
        </div>

        {/* Live Preview Section - Only for email types */}
        {type !== "form" && !isLoading && previewHtml !== undefined && (
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
