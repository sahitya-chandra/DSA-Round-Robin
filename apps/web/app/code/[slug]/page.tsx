"use client";
import React, { useState, useEffect } from "react";
import CodeEditor from "@/components/editor/editor";
import axios from "axios";
import { questionSchema } from "@repo/types";
import ChatBox from "../../../components/chat";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { authClient } from "@repo/auth";
import { useMatchStore } from "@/store/matchStore";

// Type for chat messages
type ChatMessage = { id: number; sender: string; message: string };

// Type for result from API
type TestResult = {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
};

type SubmissionResult = {
  jobId: string;
  results: TestResult[];
  status: string;
};

const App: React.FC = () => {
  const params = useParams()
  const { questions } = useMatchStore();
  const [questionData, setQuestionData] = useState<questionSchema[]>([]);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // const [questions, setQuestions] = useState<questionSchema[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const { data: session } = authClient.useSession()
  const [code, setCode] = useState<string>(`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    console.log("questions", questions)
  })

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!questions.length) return;

      const ids = questions.map((q) => q.questionId);

      try {
        const res = await fetch("http://localhost:5000/api/setquestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();

        const sorted = questions.map(
          (q) => data.questions.find((d: any) => d.id === q.questionId)
        );

        setQuestionData(sorted);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [questions]);

  const currentQuestion = questionData[currentQIndex];

  const handleSubmit = async () => {
    const currentQuestion = questionData[currentQIndex];
    if (!currentQuestion) return;
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/submit", {
        id: currentQuestion.id,
        code,
        language: selectedLang,
      });

      setResult(res.data as SubmissionResult);
      
      const newResults =
        questionData[currentQIndex]?.testcases.map(() => ({
          passed: Math.random() > 0.3,
        })) || [];
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = (msg: string) => {
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "You", message: msg },
    ]);
  };

  const finish = async () => {
    const matchId = params.slug
    console.log("matchIO", matchId)
    if (!matchId) return
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/match/finish/${matchId}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ winnerId: session?.user.id})
      });
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-gray-100 font-sans relative overflow-hidden">
      {/* Left Column */}
      <div className="col-span-1 p-6 space-y-6 bg-slate-900 border-r border-slate-800 overflow-y-auto md:overflow-visible">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-cyan-400">
            ⚔️ DSA Round Robin
          </h2>
          <Button onClick={finish}>Finsih Match</Button>
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
            {currentQuestion ? (
              <ul className="space-y-2 text-sm text-gray-300 font-mono mt-2">
                {currentQuestion.testcases.map((t, i) => (
                  <li key={i} className="flex flex-col">
                    <div>Input: {t.input}</div>
                    <div>Expected: {JSON.stringify(t.expected_output)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No test cases available</p>
            )}
          </details>
        </section>

        {/* Navigation */}
        {questionData.length > 0 && (
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

        {/* Result / Rules */}
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
                {result.results.map((r, i) => (
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
      </div>

      <ChatBox messages={chatMessages} onSend={sendChat} />

      {/* Run Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 font-semibold rounded-xl shadow-lg"
      >
        {loading ? "⏳ Compiling..." : "🚀 Run All Tests"}
      </button>
    </div>
  );
};

export default App;
