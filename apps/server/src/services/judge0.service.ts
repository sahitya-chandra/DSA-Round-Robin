import fetch from "node-fetch";
import { JUDGE0_URL, JUDGE0_API_KEY } from "../config/config";

const LANGUAGE_MAP: Record<string, number> = {
  cpp: 76, // C++ (GCC 10.2.0)
  python: 92, // Python (3.11.2)
  javascript: 93, // Node.js (18.15.0)
};

export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

export interface Judge0Result {
  stdout: string | null;
  time: string | null;
  memory: number | null;
  stderr: string | null;
  token: string;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export class Judge0Service {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (JUDGE0_API_KEY) {
      headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
      headers["X-RapidAPI-Host"] = new URL(JUDGE0_URL).hostname;
    }
    return headers;
  }

  static async submitBatch(submissions: Judge0Submission[]): Promise<string[]> {
    const url = `${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=false`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ submissions }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Judge0 batch submission failed: ${error}`);
    }

    const data = (await response.json()) as { token: string }[];
    return data.map((d) => d.token);
  }

  static async getBatchResults(tokens: string[]): Promise<Judge0Result[]> {
    const url = `${JUDGE0_URL}/submissions/batch?tokens=${tokens.join(",")}&base64_encoded=false&fields=stdout,time,memory,stderr,token,compile_output,message,status`;
    
    // Poll until all are finished or timeout
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Judge0 batch result retrieval failed: ${error}`);
      }

      const data = (await response.json()) as { submissions: Judge0Result[] };
      const results = data.submissions;

      const allFinished = results.every(
        (r) => r.status.id !== 1 && r.status.id !== 2 // 1: In Queue, 2: Processing
      );

      if (allFinished) {
        return results;
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Judge0 batch execution timed out");
  }

  static getLanguageId(lang: string): number {
    return LANGUAGE_MAP[lang] || 76;
  }
}
