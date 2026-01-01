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
      backgroundColor: "oklch(0.25 0.03 40)", // Dirt brown background
      color: "oklch(0.95 0 0)", // Light foreground
      height: "100%",
      fontSize: "14px",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },
    ".cm-content": {
      caretColor: "oklch(0.7 0.15 140)", // Grass green caret
      padding: "16px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "oklch(0.7 0.15 140)", // Grass green cursor
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "oklch(0.6 0.12 220) !important", // Diamond blue selection
    },
    ".cm-activeLine": {
      backgroundColor: "oklch(0.35 0.02 40)", // Slightly lighter dirt brown
    },
    ".cm-gutters": {
      backgroundColor: "oklch(0.3 0.02 0)", // Darker stone gray
      color: "oklch(0.5 0 0)", // Cobblestone gray
      border: "none",
      borderRight: "2px solid oklch(0.5 0.01 0)", // Cobblestone border
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "oklch(0.35 0.02 40)",
      color: "oklch(0.7 0.15 140)", // Grass green
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
      "&::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "oklch(0.25 0.03 40)",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "oklch(0.7 0.15 140)",
        borderRadius: "4px",
        border: "1px solid oklch(0.3 0.02 0)",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "oklch(0.75 0.15 140)",
      },
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "oklch(0.45 0.05 40)", // Wood brown
      border: "none",
      color: "oklch(0.75 0.15 220)", // Diamond blue
    },
  });


  return (
    <div className="h-full w-full bg-card overflow-hidden border-2 border-border minecraft-texture pixel-border-outset">
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