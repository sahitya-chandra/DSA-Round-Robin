import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { cpp } from "@codemirror/lang-cpp";

export default function CodeEditor({ 
	code, 
	setCode 
}: { 
	code: string, 
	setCode: (val: string) => void
}) {

  return (
    <div className="container mx-auto p-4">
      <CodeMirror
        value={code}
        height="400px"
        theme={vscodeDark}
        extensions={[cpp()]}
        onChange={(value) => setCode(value)}
      />
    </div>
  );
}