"use client";
import React, { useState, useEffect } from "react";
import CodeEditor from "@/components/editor/editor";
import axios from "axios";
import { questionSchema } from "@repo/types";

const App = () => {
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [opponentSolved, setOpponentSolved] = useState(2);
  const [questions, setQuestions] = useState<questionSchema[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatVisible, setChatVisible] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [code, setCode] = useState<string>(`#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);
  const [userSolved, setUserSolved] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:5000/set-questions");
        const data = await response.json();
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setResults(data.questions[0].testcases.map(() => null));
        }
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, []);

  const runTest = async (index: number) => {
    if (!questions.length) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const passed = Math.random() > 0.3;
    const newResults = [...results];
    newResults[index] = { passed };
    setResults(newResults);
    if (passed) {
      setUserSolved((prev) => prev + 1);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!questions.length) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/submit", {
        id: questions[currentQIndex].id,
        code,
        language: selectedLang,
      });
      setResult(res.data);

      const newResults = questions[currentQIndex].testcases.map(() => ({
        passed: Math.random() > 0.3,
      }));
      setResults(newResults);
      setUserSolved(newResults.filter((r) => r.passed).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = (msg: string) =>
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "You", message: msg },
    ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-gray-100 font-sans relative overflow-hidden">
      {/* Left Column */}
      <div className="col-span-1 p-6 space-y-6 bg-slate-900 border-r border-slate-800 overflow-y-auto md:overflow-visible">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-cyan-400">
            ⚔️ DSA Round Robin
          </h2>
          <div className="text-purple-400 font-semibold text-lg">
            ⏱️ {formatTime(timer)}
          </div>
        </div>

        {/* Problem */}
        <section className="p-4 bg-slate-800 rounded-xl shadow">
          <h3 className="text-cyan-300 font-semibold mb-2">💻 Problem</h3>
          {loadingQuestions ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
          ) : currentQuestion ? (
            <>
              <p className="text-gray-300 leading-6 tracking-wide">
                {currentQuestion.question}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Difficulty: {currentQuestion.difficulty}
              </p>
            </>
          ) : (
            <p className="text-gray-400">No questions available</p>
          )}
        </section>

        {/* Test Cases */}
        <section className="p-4 bg-slate-800 rounded-xl shadow">
          <details open>
            <summary className="text-cyan-300 font-semibold mb-2 cursor-pointer">
              ✅ Test Cases
            </summary>
            {loadingQuestions ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              </div>
            ) : currentQuestion ? (
              <ul className="space-y-2 text-sm text-gray-300 font-mono mt-2">
                {currentQuestion.testcases.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <span>
                      Input: {t.input}
                      <br />
                      Expected:{" "}
                      {JSON.stringify(t.expected_output)}
                    </span>
                    <button
                      onClick={() => runTest(i)}
                      className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/40 transition duration-200"
                      disabled={isLoading}
                    >
                      Run
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No test cases available</p>
            )}
          </details>
        </section>

        {/* Opponent / Progress */}
        <section className="p-4 bg-slate-800 rounded-xl shadow space-y-3">
          <h3 className="text-cyan-300 font-semibold">🏆 Progress</h3>
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl shadow-lg">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center text-slate-900 text-xl font-bold shadow-md">
                👤
              </div>
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-800 rounded-full"></span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">
                Opponent: <span className="text-cyan-400">OPP123</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Solved: {opponentSolved}/5
              </p>
              <button className="mt-2 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold rounded-lg shadow-md">
                ➕ Add Friend
              </button>
            </div>
          </div>
        </section>

        {/* Navigation */}
        {questions.length > 0 && (
          <div className="flex justify-between mt-4">
            <button
              onClick={() =>
                setCurrentQIndex(
                  (i) => (i > 0 ? i - 1 : questions.length - 1)
                )
              }
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              ⬅ Prev
            </button>
            <button
              onClick={() =>
                setCurrentQIndex((i) => (i + 1) % questions.length)
              }
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              Next ➡
            </button>
          </div>
        )}
      </div>

       {/* Right Column */}
      <div className="col-span-1 md:col-span-2 p-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Code Editor</h2>
          <select
            className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-1 text-sm"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <div className="flex-1 min-h-[50vh] md:min-h-[60vh] custom-scrollbar">
          <CodeEditor code={code} setCode={setCode} />
        </div>

        <div className="bg-slate-900 p-5 rounded-xl shadow border border-slate-800 min-h-[200px] max-h-[400px] overflow-y-auto">
          {result ? (
            <>
              <div className="flex justify-between mb-3 items-center">
                <span className="text-emerald-400 font-semibold">
                  Status: {result.status}
                </span>
                <span className="text-gray-400 text-sm">
                  Job ID: {result.jobId}
                </span>
              </div>
              <pre className="whitespace-pre-wrap bg-slate-800 p-4 rounded-lg text-gray-100 font-mono text-sm">
                {result.result}
              </pre>
            </>
          ) : (
            <div className="p-4 bg-slate-800 rounded-xl shadow-md mt-4">
              <h3 className="text-cyan-300 font-semibold mb-3">
                📜 Battle Rules
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                <li>
                  <span className="text-white font-medium">No Cheating:</span>{" "}
                  Use only your own logic and skills.
                </li>
                <li>
                  <span className="text-white font-medium">Speed Matters:</span>{" "}
                  Faster solutions earn more points.
                </li>
                <li>
                  <span className="text-white font-medium">
                    Accuracy First:
                  </span>{" "}
                  Wrong submissions reduce chances.
                </li>
                <li>
                  <span className="text-white font-medium">
                    Chat Respectfully:
                  </span>{" "}
                  Use chat to discuss, not distract.
                </li>
                <li>
                  <span className="text-white font-medium">Make Friends:</span>{" "}
                  Add opponents as friends after the battle.
                </li>
              </ol>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition duration-200 shadow ${
                r ? (r.passed ? "bg-emerald-500" : "bg-red-500") : "bg-gray-700"
              }`}
              title={`Test ${i + 1}: ${
                r ? (r.passed ? "Passed" : "Failed") : "Not Run"
              }`}
            >
              {r ? (r.passed ? "✔️" : "❌") : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Box */}
      <div
        className="fixed bottom-4 left-4 w-106 bg-slate-900 border border-slate-800 rounded-xl shadow-lg text-sm"
        style={{ height: chatVisible ? "22rem" : "4rem" }}
      >
        <div
          className="flex justify-between items-center px-4 py-2 cursor-pointer bg-slate-800 rounded-t-xl"
          onClick={() => setChatVisible((v) => !v)}
        >
          <h3 className="text-cyan-300 font-semibold">💬 Chat</h3>
          <span className="text-gray-400 text-2xl">
            {chatVisible ? "−" : "+"}
          </span>
        </div>
        {chatVisible && (
          <div className="p-4 space-y-3">
            <div className="bg-slate-800 max-h-48 overflow-y-auto p-3 rounded-lg">
              {chatMessages.length ? (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg mb-2 text-sm max-w-[80%] ${
                      m.sender === "You"
                        ? "bg-cyan-500/20 text-cyan-100 ml-auto"
                        : "bg-purple-500/20 text-purple-100"
                    }`}
                  >
                    <b>{m.sender}:</b> {m.message}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-center">
                  No messages yet.
                </div>
              )}
            </div>
            <ChatInput onSend={sendChat} />
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || isLoading}
        className="fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-400 
          text-slate-900 font-semibold rounded-xl shadow-lg"
      >
        {loading ? "⏳ Compiling..." : "🚀 Run All Tests"}
      </button>
    </div>
  );
};

const ChatInput = ({ onSend }: { onSend: (msg: string) => void }) => {
  const [val, setVal] = useState("");
  const submit = (e: any) => {
    e.preventDefault();
    if (val.trim()) {
      onSend(val);
      setVal("");
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 px-3 py-2 bg-slate-800 text-gray-200 rounded border border-slate-700"
        placeholder="Type your message..."
      />
      <button
        type="submit"
        className="px-4 py-2 bg-cyan-400 text-slate-900 font-semibold rounded"
      >
        Send
      </button>
    </form>
  );
};

export default App;
