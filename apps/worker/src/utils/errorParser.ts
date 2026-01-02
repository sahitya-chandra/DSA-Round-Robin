export interface ParsedError {
  type: "Compilation Error" | "Runtime Error" | "Timeout" | "Memory Limit Exceeded" | "Unknown Error";
  message: string;
  line?: string;
  raw?: string;
}

export function parseError(stderr: string, language: string): ParsedError {
  if (!stderr) return { type: "Unknown Error", message: "No output received" };

  // Handle common Docker/Process errors
  if (stderr.toLowerCase().includes("memory limit exceeded")) {
    return { type: "Memory Limit Exceeded", message: "Your code exceeded the memory limit (128mb)." };
  }
  if (stderr.toLowerCase().includes("timed out") || stderr.toLowerCase().includes("sigterm")) {
    return { type: "Timeout", message: "Execution timed out (10s limit)." };
  }

  const raw = stderr.trim();
  
  switch (language) {
    case "cpp":
      return parseCppError(raw);
    case "python":
      return parsePythonError(raw);
    case "javascript":
      return parseJsError(raw);
    default:
      return { type: "Unknown Error", message: raw, raw };
  }
}

function parseCppError(raw: string): ParsedError {
  // Check if it's a compilation error
  // Format: /code/main.cpp:5:5: error: 'cout' was not declared in this scope
  const compRegex = /main\.cpp:(\d+):(?:\d+:)?\s*(error|warning):\s*(.*)/i;
  const match = raw.match(compRegex);

  if (match) {
    return {
      type: "Compilation Error",
      line: match[1],
      message: `${match[2]}: ${match[3]}`,
      raw
    };
  }

  // Runtime error (e.g., SEGFAULT)
  if (raw.toLowerCase().includes("segmentation fault")) {
    return { type: "Runtime Error", message: "Segmentation Fault (Invalid memory access)", raw };
  }

  return { type: "Runtime Error", message: simplifyPath(raw), raw };
}

function parsePythonError(raw: string): ParsedError {
  // Format:
  // File "/code/main.py", line 2, in <module>
  //    print(x)
  // NameError: name 'x' is not defined
  const lines = raw.split("\n");
  const lastLine = lines[lines.length - 1];
  const lineMatch = raw.match(/File ".*main\.py", line (\d+)/i);

  if (lineMatch) {
    return {
      type: "Runtime Error",
      line: lineMatch[1],
      message: lastLine || "Execution failed",
      raw
    };
  }

  return { type: "Runtime Error", message: simplifyPath(raw), raw };
}

function parseJsError(raw: string): ParsedError {
  // Format:
  // /code/main.js:2
  // console.log(x);
  //             ^
  // ReferenceError: x is not defined
  const lines = raw.split("\n");
  const firstLine = lines[0] || "";
  const lineMatch = firstLine.match(/main\.js:(\d+)/i);
  
  // Find the last non-empty line which is often the error name
  let errorMsg = "Execution failed";
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line && line.includes("Error:")) {
      errorMsg = line;
      break;
    }
  }

  if (lineMatch) {
    return {
      type: "Runtime Error",
      line: lineMatch[1],
      message: errorMsg,
      raw
    };
  }

  return { type: "Runtime Error", message: simplifyPath(raw), raw };
}

function simplifyPath(msg: string): string {
  return msg.replace(/\/code\/main\.(cpp|py|js|ts):?/gi, "Line ")
            .replace(/\/code\//gi, "");
}
