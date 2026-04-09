import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import FontFamily from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";

// Custom FontSize extension
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

const fontFamilies = ["georgia", "arial", "verdana", "schoolbell", "tenor-sans"];
const fontSizes = ["10px", "11px", "12px", "14px", "16px", "18px", "20px"];

type Props = {
  value: JSONContent | string;
  onChange: (value: JSONContent) => void;
  onHtmlChange?: (value: string) => void;
};

export default function TiptapEditor({ value, onChange, onHtmlChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      FontFamily,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
      onHtmlChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl tiptap-editor-content mx-auto focus:outline-none min-h-[300px] p-4 bg-white border border-t-0 border-gray-300 rounded-b-lg",
      },
    },
  });

  // Keep editor content in sync if value matches (useful for initial load)
  React.useEffect(() => {
    if (editor && value) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(value) !== JSON.stringify(currentContent)) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return (
    <div className="tiptap-container w-full shadow-sm rounded-lg">
      {editor && (
        <div className="flex flex-wrap gap-2 p-2 border border-gray-300 border-b-0 bg-gray-50 rounded-t-lg items-center">
          <select
            className="border rounded p-1 text-sm bg-white"
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            value={editor.getAttributes("textStyle").fontFamily || ""}
          >
            <option value="">Default Font</option>
            {fontFamilies.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>

          <select
            className="border rounded p-1 text-sm bg-white"
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
            value={editor.getAttributes("textStyle").fontSize || ""}
          >
            <option value="">Default Size</option>
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("bold") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("italic") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("underline") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("strike") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleStrike().run()}>Strike</button>

          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive({ textAlign: "left" }) ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().setTextAlign("left").run()}>Left</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive({ textAlign: "center" }) ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().setTextAlign("center").run()}>Center</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive({ textAlign: "right" }) ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().setTextAlign("right").run()}>Right</button>

          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("bulletList") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" className={`px-2 py-1 border rounded ${editor.isActive("orderedList") ? "bg-blue-200" : "bg-white"}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>

          <input
            type="color"
            className="w-8 h-8 rounded p-0 border"
            title="Text Color"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
          <input
            type="color"
            className="w-8 h-8 rounded p-0 border"
            title="Background Color"
            defaultValue="#ffffff"
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          />

          <button
            type="button"
            className={`px-2 py-1 border rounded ${editor.isActive("link") ? "bg-blue-200" : "bg-white"}`}
            onClick={() => {
              const url = window.prompt("URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              } else if (url === "") {
                editor.chain().focus().unsetLink().run();
              }
            }}
          >
            Link
          </button>

          <button
            type="button"
            className="px-2 py-1 border rounded bg-white"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Unset Link
          </button>

          <button type="button" className="px-2 py-1 border rounded bg-white" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Clear</button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
