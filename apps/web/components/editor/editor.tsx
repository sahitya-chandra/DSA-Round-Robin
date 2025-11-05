import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";

export default function CodeEditor({ 
  code, 
  setCode,
  language = "cpp"
}: { 
  code: string;
  setCode: (val: string) => void;
  language?: string;
}) {

  const getLanguageExtension = () => {
    switch (language) {
      case "javascript":
        return javascript({ jsx: true });
      case "python":
        return python();
      case "cpp":
      default:
        return cpp();
    }
  };

  const customTheme = EditorView.theme({
    "&": {
      backgroundColor: "#0f1419",
      color: "#e5e7eb",
      height: "100%",
      fontSize: "14px",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-content": {
      caretColor: "#818cf8",
      padding: "16px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#818cf8",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "#4c1d95 !important",
    },
    ".cm-activeLine": {
      backgroundColor: "#1a1f2e",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0e1a",
      color: "#6b7280",
      border: "none",
      borderRight: "1px solid #1f2937",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#1a1f2e",
      color: "#818cf8",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 12px 0 8px",
      minWidth: "40px",
    },
    ".cm-line": {
      padding: "0 16px",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      lineHeight: "1.6",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "#4c1d95",
      border: "none",
      color: "#a5b4fc",
    },
  });

  return (
    <div className="h-full w-full bg-[#0f1419] rounded-lg overflow-hidden border border-gray-800/50">
      <CodeMirror
        value={code}
        height="100%"
        theme={vscodeDark}
        extensions={[getLanguageExtension(), customTheme]}
        onChange={(value) => setCode(value)}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        className="h-full w-full"
      />
    </div>
  );
}