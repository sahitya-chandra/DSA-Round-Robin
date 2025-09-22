"use client";
import React, { useState, useEffect } from "react";

const testCases = [
  { input: "madam", expected: true },
  { input: "hello", expected: false },
  { input: "racecar", expected: true },
  { input: "A man, a plan, a canal: Panama", expected: true },
  { input: "No lemon, no melon", expected: true },
];

const App = () => {
  const [code, setCode] = useState(`const isPalindrome = (str) => {
  const cleanedStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanedStr === cleanedStr.split('').reverse().join('');
};`);
  const [results, setResults] = useState(testCases.map(() => null));
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [opponentSolved, setOpponentSolved] = useState(2);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const runTest = async (index: number) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const passed = Math.random() > 0.3;
    const newResults = [...results];
    newResults[index] = { passed };
    setResults(newResults);
    setIsLoading(false);
  };

  const submitAll = async () => {
    setIsLoading(true);
    for (let i = 0; i < testCases.length; i++) {
      await runTest(i);
    }
    setIsLoading(false);
  };

  const sendChat = (msg: string) => setChatMessages(prev => [...prev, { id: Date.now(), sender: "You", message: msg }]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#03061a] text-gray-100">

      {/* Left Column */}
      <div className="flex-1 p-4 space-y-4 bg-[#071028]">
        <h2 className="text-xl font-bold text-white">DSA Round_Robin</h2>

        <div className="p-3 bg-[#07172a] rounded border border-[#083049]">
          <h3 className="text-[#00F6FF]">💻 Problem</h3>
          <p>Write <code className="text-[#00F6FF]">isPalindrome</code> that checks palindromes ignoring punctuation/case/spacing.</p>
        </div>

        <div className="p-3 bg-[#07172a] rounded border border-[#083049]">
          <h3 className="text-[#00F6FF]">✅ Test Cases</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {testCases.map((t, i) => <li key={i}>Input: "{t.input}" — Out: {JSON.stringify(t.expected)}</li>)}
          </ul>
        </div>

        <div className="p-3 bg-[#071a2a] rounded border border-[#083049] space-y-2">
          <h3 className="text-[#00F6FF] font-semibold">🏆 Opponent</h3>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#00F6FF] rounded-full flex items-center justify-center text-[#021428]">👤</div>
            <div>
              <div className="font-bold text-white">ID: OPP123</div>
              <div className="text-sm text-gray-300">Solved: {opponentSolved}/5</div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) =>
              <button key={i} onClick={() => setOpponentSolved(i + 1)} className={`w-4 h-4 rounded-full ${i < opponentSolved ? "bg-[#ff4d4d]" : "bg-gray-700"}`} />
            )}
          </div>

          {/* Open chat button if chat is hidden */}
          {!chatVisible && (
            <button onClick={() => setChatVisible(true)} className="mt-4 px-3 py-1 bg-[#00F6FF] rounded text-sm">Open Chat 💬</button>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-[2] p-4 flex flex-col space-y-4 relative">
        <h2 className="text-xl font-bold text-white">Code Editor</h2>
        <textarea
          className="w-full h-96 p-3 bg-[#021428] text-[#7ffcff] font-mono rounded border border-[#083049]"
          value={code}
          onChange={e => setCode(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => runTest(0)} disabled={isLoading} className="px-3 py-1 bg-[#00F6FF] text-[#041425] rounded">▶️ Run</button>
          <button onClick={submitAll} disabled={isLoading} className="px-3 py-1 bg-[#ff4d4d] text-white rounded">Submit All</button>
          <span>{timer}s</span>
        </div>

        <div className="flex gap-1 mt-2">
          {results.map((r, i) =>
            <div key={i} className={`w-6 h-6 rounded flex items-center justify-center ${r ? (r.passed ? "bg-green-500" : "bg-red-500") : "bg-gray-700"}`}>
              {r ? (r.passed ? "✔️" : "❌") : i + 1}
            </div>
          )}
        </div>

        {/* Chat pinned to right-bottom */}
        {chatVisible && (
          <div className="fixed bottom-4 right-4 w-80 p-3 bg-[#071a2a] rounded border border-[#083049] z-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[#00F6FF]">💬 Chat</h3>
              <button onClick={() => setChatVisible(false)} className="px-2 py-1 rounded bg-[#00F6FF]">Hide</button>
            </div>
            <div className="bg-[#021428] max-h-40 overflow-auto p-2 text-sm rounded">
              {chatMessages.length ? chatMessages.map(m => <div key={m.id}><b>{m.sender}:</b> {m.message}</div>) : <div className="text-gray-400">No messages yet.</div>}
            </div>
            <ChatInput onSend={sendChat} />
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInput = ({ onSend }: { onSend: (msg: string) => void }) => {
  const [val, setVal] = useState("");
  const submit = (e: any) => { e.preventDefault(); if (val.trim()) { onSend(val); setVal(""); } };
  return (
    <form onSubmit={submit} className="flex gap-2 mt-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        className="flex-1 px-2 py-1 bg-[#021428] text-gray-200 rounded border border-[#083049]"
        placeholder="Type a message..."
      />
      <button type="submit" className="px-3 py-1 bg-[#00F6FF] text-[#041425] rounded">Send</button>
    </form>
  );
};

export default App;
