"use client";

import React, { useState, useEffect } from "react";
import CodeEditor from "@/components/editor/editor";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@repo/auth";
import { useMatchStore } from "@/store/matchStore";
import ChatBox from "../../../components/chat";

type TestResult = {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
};

type SubmissionResult = {
  submissionId: string;
  result: {
    passed: boolean;
    passedCount: number;
    total: number;
    timeMs: number;
  };
  details: TestResult[];
};

const App: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { questions, hydrated } = useMatchStore();
  const [questionData, setQuestionData] = useState<any[]>(questions);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const { data: session } = authClient.useSession();
  const [code, setCode] = useState<string>(`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);

  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    if (!hydrated || questions.length === 0) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/match/getmatch/${params.slug}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setQuestionData(data.questions);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchMatch();
  }, [hydrated, questions, params.slug]);

  const currentQuestion = questionData[currentQIndex];

  useEffect(() => {
    const handleResult = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.event === "submission_result") {
        setResult(data.data);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!currentQuestion || !session?.user.id) return;
    setLoading(true);
    setResult(null);

    try {
      console.log("currentQuestion.questionData.id", currentQuestion.questionData.id)
      const res = await axios.post(
        "http://localhost:5000/api/submit",
        {
          matchId: params.slug,
          questionId: currentQuestion.questionData.id,
          code,
          language: selectedLang,
        },
        { withCredentials: true }
      );

      console.log("Submission queued:", res.data);
      // Result will come via socket submission_result
    } catch (err: any) {
      console.error("Submit error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!params.slug || !session?.user.id) return;
    setLoading(true);

    try {
      await fetch(`http://localhost:5000/api/match/finish/${params.slug}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      console.log("Manual finish requested");
    } catch (err) {
      console.error("Finish error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-gray-100 font-sans relative overflow-hidden">
      {/* Left Column */}
      <div className="col-span-1 p-6 space-y-6 bg-slate-900 border-r border-slate-800 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-cyan-400">
            DSA Round Robin
          </h2>
          <Button onClick={finish} variant="destructive">
            Give Up
          </Button>
        </div>

        {/* Problem */}
        <section className="p-4 bg-slate-800 rounded-xl shadow">
          <h3 className="text-cyan-300 font-semibold mb-2">Problem</h3>
          {loadingQuestions ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-slate-700 rounded w-3/4"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
          ) : currentQuestion ? (
            <>
              <p className="text-gray-300 leading-6">{currentQuestion.questionData.question}</p>
              <p className="text-sm text-gray-400 mt-2">
                Difficulty: {currentQuestion.questionData.difficulty}
              </p>
            </>
          ) : (
            <p className="text-gray-400">No question</p>
          )}
        </section>

        {/* Test Cases */}
        <section className="p-4 bg-slate-800 rounded-xl shadow">
          <details open>
            <summary className="text-cyan-300 font-semibold mb-2 cursor-pointer">
              Test Cases
            </summary>
            {currentQuestion && (
              <ul className="space-y-2 text-sm text-gray-300 font-mono mt-2">
                {currentQuestion.questionData.testcases.map((t: any, i: number) => (
                  <li key={i} className="flex flex-col">
                    <div>Input: {t.input}</div>
                    <div>Expected: {JSON.stringify(t.expected_output)}</div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </section>

        {/* Navigation */}
        {questionData.length > 1 && (
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentQIndex((i) => (i > 0 ? i - 1 : questionData.length - 1))}
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              Prev
            </button>
            <span className="text-sm text-gray-400">
              {currentQIndex + 1} / {questionData.length}
            </span>
            <button
              onClick={() => setCurrentQIndex((i) => (i + 1) % questionData.length)}
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600"
            >
              Next
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

        {/* Result */}
        <div className="bg-slate-900 p-5 rounded-xl shadow border border-slate-800 min-h-[200px] max-h-[400px] overflow-y-auto">
          {result ? (
            <>
              <div className="flex justify-between mb-3 items-center">
                <span className={`font-semibold ${result.result.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {result.result.passed ? "All Passed!" : `${result.result.passedCount}/${result.result.total} Passed`}
                </span>
                <span className="text-gray-400 text-sm">
                  Time: {result.result.timeMs}ms
                </span>
              </div>
              <ul className="space-y-2 text-sm font-mono">
                {result.details.map((r, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded-lg ${r.passed ? "bg-emerald-500/20 text-emerald-100" : "bg-red-500/20 text-red-100"}`}
                  >
                    <div>Input: {r.input}</div>
                    <div>Expected: {r.expected}</div>
                    <div>Output: {r.output}</div>
                    <div>Status: {r.passed ? "Passed" : "Failed"}</div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="p-4 bg-slate-800 rounded-xl">
              <h3 className="text-cyan-300 font-semibold mb-3">Battle Rules</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                <li><span className="text-white font-medium">No Cheating:</span> Use only your own logic.</li>
                <li><span className="text-white font-medium">Speed Matters:</span> Faster = better tiebreaker.</li>
                <li><span className="text-white font-medium">Accuracy First:</span> Wrong answers hurt.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <ChatBox messages={[]} onSend={() => {}} />

      {/* Run Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 font-semibold rounded-xl shadow-lg hover:scale-105 transition"
      >
        {loading ? "Compiling..." : "Run All Tests"}
      </button>
    </div>
  );
};

export default App;