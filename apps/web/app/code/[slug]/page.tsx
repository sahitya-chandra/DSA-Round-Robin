"use client";

import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "@/components/editor/editor";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@repo/auth";
import { useMatchStore } from "@/store/matchStore";
import { useMatchResultStore } from "@/store/matchResultStore";
import { Loader2, Play, ChevronDown, ChevronUp, Code2, Clock, Zap, AlertCircle, Trophy } from "lucide-react";
import { useSubmissionsStore } from "@/store/submissionStore";
import { useMatchProgressStore } from "@/store/matchProgressStore";
import { useSocket } from "@/hooks/useSocket";

const App: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { questions, hydrated, startedAt, duration } = useMatchStore();
  const { visible, winnerId, hideResult } = useMatchResultStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const submissions = useSubmissionsStore((state) => state.submissions)
  const myProgress = useMatchProgressStore((state) => state.myProgress)
  const opponentProgress = useMatchProgressStore((state) => state.opponentProgress)
  const [questionData, setQuestionData] = useState<any[]>(questions);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [opponent, setOpponent] = useState<{ name: string } | null>(null);
  const { data: session } = authClient.useSession();
  useSocket(session?.user.id as string, params.slug as string)
  const [code, setCode] = useState<string>(`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [resultPanelOpen, setResultPanelOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || questions.length === 0) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/match/getmatch/${params.slug}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOpponent(data.opponent);  
        setQuestionData(data.questions);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchMatch();
  }, [hydrated, questions, params.slug]);

  useEffect(() => {
    if (!startedAt || !duration) return;

    const start = new Date(startedAt).getTime();
    const end = start + duration * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration]);

  // useEffect(() => {
  //   if (!startedAt || !duration) return;
  //   if (timeLeft === 0) {
  //     finish();
  //   }
  // }, [timeLeft, startedAt, duration]);

  const currentQuestion = questionData[currentQIndex];
  const curQuesSub = Object.values(submissions).find((sub, i) => sub.questionId === currentQuestion?.questionData.id) || null

  const handleSubmit = async () => {
    if (!currentQuestion || !session?.user.id) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: params.slug,
          questionId: currentQuestion.questionData.id,
          code,
          language: selectedLang,
        }),
      });

      const data = await res.json();
      console.log("Submission queued:", data);
    } catch (err: any) {
      console.error("Submit error:", err);
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

  interface DifficultyStyles {
    bg: string;
    border: string;
    text: string;
  }

  const getDifficultyStyles = (difficulty: string): DifficultyStyles => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return { bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/40", text: "text-emerald-400" };
      case "medium":
        return { bg: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/40", text: "text-amber-400" };
      case "hard":
        return { bg: "from-rose-500/10 to-red-500/10", border: "border-rose-500/40", text: "text-rose-400" };
      default:
        return { bg: "from-slate-500/10 to-slate-600/10", border: "border-slate-500/40", text: "text-slate-400" };
    }
  };

  const difficultyStyles: DifficultyStyles = currentQuestion ? getDifficultyStyles(currentQuestion.questionData.difficulty) : { bg: "from-slate-500/10 to-slate-600/10", border: "border-slate-500/40", text: "text-slate-400" };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor = timeLeft <= 60 ? "text-rose-400" : timeLeft <= 120 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Battle Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        <div className="relative px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Zap className="w-4 h-4 text-white" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">DSA RR</h1>
                <p className="text-[10px] text-slate-400 font-medium">1v1 Battle Mode</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-center">
              {/* ----- YOU ----- */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg px-4 py-2 border border-emerald-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/30">
                    YOU
                  </div>

                  <div className="flex gap-1.5">
                    {questionData.map((q, i) => {
                      const solved = myProgress[q.questionData.id] ?? false
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            solved ? "bg-emerald-500/30" : "bg-slate-700/40"
                          }`}
                        >
                          {solved ? (
                            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-600 to-red-700 rounded-lg p-[2px] shadow-lg">
                <div className="bg-slate-900 rounded-[6px] px-5 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-3.5 h-3.5 ${timerColor}`} />
                    <div className={`text-2xl font-black font-mono ${timerColor} tracking-wider`}>
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ----- OPPONENT ----- */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-lg px-4 py-2 border border-violet-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-violet-500/30">
                    {opponent?.name?.[0]?.toUpperCase() ?? "OPP"}
                  </div>

                  <div className="flex gap-1.5">
                    {questionData.map((q, i) => {
                      const oppSolved = opponentProgress[q.questionData.id] ?? false;
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            oppSolved ? "bg-violet-500/30" : "bg-slate-700/40"
                          }`}
                        >
                          {oppSolved ? (
                            <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={finish}
              className="px-4 py-2 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all border border-rose-500/20 hover:border-rose-500/40"
            >
              Give up
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <div className="w-[440px] flex flex-col border-r border-slate-800/50 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="px-5 py-4 border-b border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white">Problem {currentQIndex + 1}</h2>
              </div>
              {currentQuestion && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${difficultyStyles.bg} ${difficultyStyles.border} ${difficultyStyles.text} uppercase tracking-wide`}>
                  {currentQuestion.questionData.difficulty}
                </div>
              )}
            </div>

            {questionData.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentQIndex((i) => (i > 0 ? i - 1 : questionData.length - 1))}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600 group"
                >
                  <ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-sm font-semibold">Prev</span>
                </button>
                <div className="px-4 py-2.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-center min-w-[80px]">
                  <span className="text-sm font-bold text-violet-400">{currentQIndex + 1} / {questionData.length}</span>
                </div>
                <button
                  onClick={() => setCurrentQIndex((i) => (i + 1) % questionData.length)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600 group"
                >
                  <span className="text-sm font-semibold">Next</span>
                  <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {loadingQuestions ? (
              <div className="space-y-4">
                <div className="h-4 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : currentQuestion ? (
              <>
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                  <h3 className="text-xs font-bold text-violet-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Problem Statement
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-[15px]">{currentQuestion.questionData.question}</p>
                </div>

                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                  <h3 className="text-xs font-bold text-violet-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Sample Test Cases
                  </h3>
                  <div className="space-y-3">
                    {currentQuestion.questionData.testcases.slice(0, 3).map((t: any, i: number) => (
                      <div key={i} className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/30">
                        <div className="text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wide">Test {i + 1}</div>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[65px]">Input:</span>
                            <span className="text-amber-300 font-medium">{t.input}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[65px]">Output:</span>
                            <span className="text-emerald-300 font-medium">{JSON.stringify(t.expected_output)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 rounded-xl p-5 border border-violet-500/30">
                  <h3 className="text-xs font-bold text-violet-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Battle Rules
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-violet-400 mt-1 text-lg leading-none">•</span>
                      <span><strong className="text-white font-semibold">Speed Wins:</strong> Solve faster to break ties</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-violet-400 mt-1 text-lg leading-none">•</span>
                      <span><strong className="text-white font-semibold">Accuracy Counts:</strong> Wrong answers lose points</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-violet-400 mt-1 text-lg leading-none">•</span>
                      <span><strong className="text-white font-semibold">Fair Play:</strong> No external help allowed</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-center">No question available</p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col" ref={containerRef}>
          {/* Editor Header with Submit Inline */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Code Editor</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="bg-slate-800/60 text-white border border-slate-700/50 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" fill="white" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Editor - Full Height */}
          <div className={`flex-1 min-h-0 transition-all duration-300 ${resultPanelOpen ? 'h-[calc(100%-3rem)]' : 'h-full'}`}>
            <CodeEditor code={code} setCode={setCode} language={selectedLang} />
          </div>

          {/* Collapsed Result Bar */}
          <div
            className={`h-12 border-t border-slate-800/50 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-between px-6 cursor-pointer transition-all ${
              resultPanelOpen ? 'border-b' : ''
            }`}
            onClick={() => setResultPanelOpen(!resultPanelOpen)}
          >
            <div className="flex items-center gap-3">
              {curQuesSub ? (
                curQuesSub.result.passed ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-300">
                  {curQuesSub
                    ? curQuesSub.result.passed
                      ? "All Tests Passed!"
                      : `${curQuesSub.result.passedCount}/${curQuesSub.result.total} Passed`
                    : "No results yet"}
                </p>
                {curQuesSub && <p className="text-xs text-slate-500">Click to expand • {curQuesSub.result.timeMs}ms</p>}
              </div>
            </div>
            <button className="p-1 hover:bg-slate-800 rounded transition-colors">
              {resultPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Result Panel */}
          {resultPanelOpen && (
            <div className="h-96 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800/50 px-6 py-5 space-y-4 transition-all">
              {curQuesSub ? (
                <>
                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      {curQuesSub.result.passed ? (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className={`text-xl font-black ${curQuesSub.result.passed ? "text-emerald-400" : "text-rose-400"} mb-1`}>
                          {curQuesSub.result.passed ? "Perfect! All Tests Passed!" : `${curQuesSub.result.passedCount}/${curQuesSub.result.total} Tests Passed`}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          Execution time: <span className="text-white font-bold">{curQuesSub.result.timeMs}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {curQuesSub.details.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-4 border backdrop-blur-sm ${
                          r.passed ? "bg-emerald-500/5 border-emerald-500/30" : "bg-rose-500/5 border-rose-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Case {i + 1}</span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${r.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {r.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[70px]">Input:</span>
                            <span className="text-amber-300 font-medium">{r.input}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[70px]">Expected:</span>
                            <span className="text-emerald-300 font-medium">{r.expected}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[70px]">Output:</span>
                            <span className={`font-medium ${r.passed ? "text-emerald-300" : "text-rose-300"}`}>{r.output}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                    <Code2 className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Submit your code to see test results</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {visible && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-8 w-[380px] text-center shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                winnerId === session?.user.id
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
                  : winnerId
                  ? "bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-500/30"
                  : "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/30"
              }`}>
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white mb-2">
                  {winnerId === session?.user.id
                    ? "🏆 You Won!"
                    : winnerId
                    ? "😞 You Lost!"
                    : "🤝 It's a Draw!"}
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  {winnerId ? "Good game!" : "Both players performed equally well."}
                </p>
              </div>

              <button
                onClick={() => {
                  hideResult();
                  router.push("/");
                }}
                className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;