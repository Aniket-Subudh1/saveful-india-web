"use client";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faLink,
  faParagraph,
  faListUl,
  faListOl,
} from "@fortawesome/free-solid-svg-icons";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  rows = 3,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      formatText("createLink", url);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    
    if (html) {
      // If HTML is available, insert it
      document.execCommand("insertHTML", false, html);
    } else {
      // Otherwise insert plain text
      document.execCommand("insertText", false, text);
    }
    handleInput();
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => formatText("bold")}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Bold"
        >
          <FontAwesomeIcon icon={faBold} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("italic")}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Italic"
        >
          <FontAwesomeIcon icon={faItalic} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Insert Link"
        >
          <FontAwesomeIcon icon={faLink} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("insertUnorderedList")}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Bullet List"
        >
          <FontAwesomeIcon icon={faListUl} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("insertOrderedList")}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Numbered List"
        >
          <FontAwesomeIcon icon={faListOl} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("formatBlock", "<p>")}
          className="rounded px-3 py-1 hover:bg-gray-200"
          title="Paragraph"
        >
          <FontAwesomeIcon icon={faParagraph} className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full rounded-b-lg border border-gray-300 px-3 py-2 outline-none prose prose-sm max-w-none ${
          isFocused ? "border-blue-500 ring-1 ring-blue-500" : ""
        }`}
        style={{
          minHeight: `${rows * 1.5}rem`,
          maxHeight: "300px",
          overflowY: "auto",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        
        [contentEditable] {
          white-space: pre-wrap;
        }
        
        [contentEditable] ul,
        [contentEditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        [contentEditable] ul {
          list-style-type: disc;
        }
        
        [contentEditable] ol {
          list-style-type: decimal;
        }
        
        [contentEditable] li {
          margin: 0.25em 0;
          display: list-item;
        }
        
        [contentEditable] p {
          margin: 0.5em 0;
        }
        
        [contentEditable] strong,
        [contentEditable] b {
          font-weight: bold;
        }
        
        [contentEditable] em,
        [contentEditable] i {
          font-style: italic;
        }
        
        [contentEditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contentEditable] br {
          display: block;
          content: "";
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
}
