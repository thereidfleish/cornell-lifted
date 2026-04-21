import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export type RichTextContent = {
  html: string;
  subject: string;
};

type UseRichTextDocumentResult = {
  initialContent: RichTextContent;
  content: RichTextContent;
  setContent: Dispatch<SetStateAction<RichTextContent>>;
  loading: boolean;
  previewHtml: string;
  previewLoading: boolean;
  saveContent: (content: RichTextContent, sendEmail: boolean) => Promise<void>;
};

export function useRichTextDocument(messageGroup: string, type: string): UseRichTextDocumentResult {
  const [initialContent, setInitialContent] = useState<RichTextContent>({ html: "", subject: "" });
  const [content, setContent] = useState<RichTextContent>({ html: "", subject: "" });
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!messageGroup) {
      const emptyContent = { html: "", subject: "" };
      setInitialContent(emptyContent);
      setContent(emptyContent);
      setPreviewHtml("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRichText() {
      setLoading(true);

      try {
        const res = await fetch(`/api/admin/get-rich-text/${messageGroup}/${type}`);
        const data = res.ok ? await res.json() : {};
        if (!cancelled) {
          const loadedContent = { html: data.html || "", subject: data.subject || "" };
          setInitialContent(loadedContent);
          setContent(loadedContent);
        }
      } catch {
        if (!cancelled) {
          const emptyContent = { html: "", subject: "" };
          setInitialContent(emptyContent);
          setContent(emptyContent);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRichText();

    return () => {
      cancelled = true;
    };
  }, [messageGroup, type]);

  useEffect(() => {
    if (type === "form") {
      setPreviewHtml("");
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!content.html) {
        setPreviewHtml("");
        return;
      }

      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/preview-email-live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: content.html }),
        });
        if (!cancelled && res.ok) {
          setPreviewHtml(await res.text());
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, type]);

  async function saveContent(content: RichTextContent, sendEmail: boolean) {
    if (!messageGroup) {
      throw new Error("No message group selected.");
    }

    const res = await fetch(`/api/admin/save-rich-text/${messageGroup}/${type}?send_email=${sendEmail}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.status || "Failed to save.");
    }
  }

  return { initialContent, content, setContent, loading, previewHtml, previewLoading, saveContent };
}