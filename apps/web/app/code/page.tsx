"use client";
import React, { useState, useEffect } from "react";
import CodeEditor from "@/components/editor/editor";
import axios from "axios";
import { questionSchema } from "@repo/types";
import ChatBox from "../components/chat";

const App = () => {
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [opponentSolved, setOpponentSolved] = useState(2);
  const [questions, setQuestions] = useState<questionSchema[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [code, setCode] = useState<string>(`#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);
  const [userSolved, setUserSolved] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // // Timer
  // useEffect(() => {
  //   const id = setInterval(() => setTimer((t) => t + 1), 1000);
  //   return () => clearInterval(id);
  // }, []);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:5000/set-questions");
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, []);

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
      console.log(res.data);
      const newResults = questions[currentQIndex].testcases.map(() => ({
        passed: Math.random() > 0.3,
      }));
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
            {/* ⏱️ {formatTime(timer)} */}
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
                  <li key={i} className="flex items-center justify-between">
                    <span>
                      Input: {t.input}
                      <br />
                      Expected: {JSON.stringify(t.expected_output)}
                    </span>
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
                setCurrentQIndex((i) => (i > 0 ? i - 1 : questions.length - 1))
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
              <ul className="space-y-2 text-sm font-mono">
                {result.results.map((r: any, i: number) => (
                  <li
                    key={i}
                    className={`p-2 rounded-lg ${
                      r.passed
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-red-500/20 text-red-100"
                    }`}
                  >
                    <div>Input: {r.input}</div>
                    <div>Expected: {r.expected}</div>
                    <div>Output: {r.output}</div>
                    <div>Status: {r.passed ? "✔️ Passed" : "❌ Failed"}</div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="p-4 bg-slate-800 rounded-xl shadow-md mt-4">
              <h3 className="text-cyan-300 font-semibold mb-3">
                📜 Battle Rules
              </h3>
              ...
            </div>
          )}
        </div>
      </div>

      <ChatBox messages={chatMessages} onSend={sendChat} />
      {/* Run Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-400 
          text-slate-900 font-semibold rounded-xl shadow-lg"
      >
        {loading ? "⏳ Compiling..." : "🚀 Run All Tests"}
      </button>
    </div>
  );
};

export default App;
