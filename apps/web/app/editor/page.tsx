'use client';

import CodeEditor from "@/components/editor/editor";
import axios from "axios";
import { useState } from "react";

export default function Page() {
    const [code, setCode] = useState<string>(`#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);
	const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState<string | null>(null);

	const handleSubmit = async () => {
		const res = await axios.post('', {
				problemId: "two-sum",
        language,
        code,
			}, 
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		)

		console.log(res.data)
		setResult(code);
	}

  return (
		<div>
			<CodeEditor code={code} setCode={setCode}/>

			<button onClick={handleSubmit}>Run Code</button>

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
		</div>
	)
}
