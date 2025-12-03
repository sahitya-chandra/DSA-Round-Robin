"use client";

import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "@/components/editor/editor";
import { authClient } from "@repo/auth";
import {
  Loader2,
  Play,
  ChevronDown,
  Code2,
  Zap,
  AlertCircle,
  ChevronUp,
} from "lucide-react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useSubmissionsStore } from "@/store/submissionStore";
import { useSocket } from "@/hooks/useSocket";

const App: React.FC = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Treat practice as a "virtual match"
  const practiceMatchId = userId ? `practice:${userId}` : "";

  // Same hook as 1v1 but with practice match id
  useSocket(userId ?? "", practiceMatchId);

  const submissions = useSubmissionsStore((state) => state.submissions);

  const [questionData, setQuestionData] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [code, setCode] = useState<string>(`#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`);

  const resultPanelRef = useRef<ImperativePanelHandle>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/setquestions", {
          method: "POST",
          credentials: "include",
        });

        const data = await res.json();
        if (data?.questions) {
          const formatted = data.questions.map((q: any) => ({
            questionData: {
              id: q.id,
              difficulty: q.difficulty,
              question: q.question,
              testcases: q.testcases ?? [],
            },
          }));
          setQuestionData(formatted);
        }
      } catch (err) {
        console.error("Error fetching random questions:", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // Stop loading when any submission update arrives
  useEffect(() => {
    if (loading) setLoading(false);
  }, [submissions, loading]);

  if (!userId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <p className="text-lg font-semibold">
            Please log in to use practice mode.
          </p>
        </div>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white text-xl font-bold">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-violet-400" />
        Loading Questions...
      </div>
    );
  }

  const currentQuestion = questionData[currentQIndex];

  if (!currentQuestion) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-500 text-xl font-bold">
        <AlertCircle className="w-6 h-6 mr-3" />
        No questions available
      </div>
    );
  }

  // Find submission for the current question
  const curQuesSub =
    Object.values(submissions).find(
      (sub: any) =>
        sub.questionId === currentQuestion.questionData.id &&
        sub.matchId === practiceMatchId // important so 1v1 and practice don't clash
    ) || null;

  const handleSubmit = async () => {
    if (!currentQuestion || !userId) return;

    setLoading(true);

    try {
      // IMPORTANT: make sure backend sets matchId = practiceMatchId when enqueuing
      // job so worker will publish events with that same matchId.
      const res = await fetch("http://localhost:5000/api/submit/solo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.questionData.id,
          code,
          language: selectedLang,
          mode: "practice",
          matchId: practiceMatchId, // <-- backend should respect this
        }),
      });

      const data = await res.json();
      console.log("Submission queued (practice):", data);
    } catch (err) {
      console.error("Submit error (practice):", err);
      setLoading(false);
    }
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return {
          bg: "from-emerald-600/15 to-teal-600/15",
          border: "border-emerald-500/50",
          text: "text-emerald-300",
        };
      case "medium":
        return {
          bg: "from-amber-600/15 to-orange-600/15",
          border: "border-amber-500/50",
          text: "text-amber-300",
        };
      case "hard":
        return {
          bg: "from-rose-600/15 to-red-600/15",
          border: "border-rose-500/50",
          text: "text-rose-300",
        };
      default:
        return {
          bg: "from-slate-500/15 to-slate-600/15",
          border: "border-slate-500/50",
          text: "text-slate-400",
        };
    }
  };

  const difficultyStyles = getDifficultyStyles(
    currentQuestion.questionData.difficulty
  );

  const ResultHeader = () => {
    const result = curQuesSub?.result;
    const headerText = result
      ? result.passed
        ? "All Tests Passed!"
        : `${result.passedCount}/${result.total} Tests Passed`
      : "Code Output / Results";

    return (
      <div
        className="h-12 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-between px-6 border-b border-slate-800/50 shadow-inner"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
            <Code2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-slate-300">
              {result ? (
                result.passed ? (
                  <span className="text-emerald-400">{headerText}</span>
                ) : (
                  <span className="text-amber-400">{headerText}</span>
                )
              ) : (
                headerText
              )}
            </p>
            {result && (
              <p className="text-xs text-slate-500">
                Execution: {result.timeMs}ms
              </p>
            )}
          </div>

          <button
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-violet-400"
            onClick={() => {
              const panel = resultPanelRef.current;
              if (panel) {
                if (isResultCollapsed) panel.expand();
                else panel.collapse();
              }
            }}
          >
            {isResultCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const result = curQuesSub?.result;
  const details =
    curQuesSub?.details ?? curQuesSub?.detailedResults ?? []; // be tolerant to both names

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700/50 shadow-xl z-10">
        <div className="relative px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  DSA Practice Platform
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  Solo Coding Mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left: Question */}
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col border-r border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-inner">
              <div className="px-5 py-4 border-b border-slate-800/50 bg-slate-800/50 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-violet-400" />
                    <h2 className="text-lg font-extrabold text-white">
                      Problem {currentQIndex + 1}
                    </h2>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${difficultyStyles.bg} ${difficultyStyles.border} ${difficultyStyles.text} uppercase shadow-md`}
                  >
                    {currentQuestion.questionData.difficulty}
                  </div>
                </div>

                {questionData.length > 1 && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() =>
                        setCurrentQIndex(
                          (i) => (i > 0 ? i - 1 : questionData.length - 1)
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-700 rounded-lg border border-slate-700/50 hover:border-violet-500 transition-all active:scale-[0.98] shadow-md"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-300">
                        Prev
                      </span>
                    </button>

                    <div className="px-4 py-2.5 bg-violet-500/15 border border-violet-500/50 rounded-lg text-center min-w-[80px] shadow-lg shadow-violet-500/10">
                      <span className="text-sm font-bold text-violet-300">
                        {currentQIndex + 1} / {questionData.length}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentQIndex((i) => (i + 1) % questionData.length)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-700 rounded-lg border border-slate-700/50 hover:border-violet-500 transition-all active:scale-[0.98] shadow-md"
                    >
                      <span className="text-sm font-semibold text-slate-300">
                        Next
                      </span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-hide">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-5 border border-slate-700/50 shadow-xl">
                  <h3 className="text-xs font-extrabold text-violet-400 mb-3 uppercase flex items-center gap-2 tracking-widest">
                    <AlertCircle className="w-4 h-4" />
                    Problem Statement
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {currentQuestion.questionData.question}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Sample Test Cases
                  </h3>
                  {currentQuestion.questionData.testcases.map(
                    (t: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900/80 rounded-lg p-4 border border-slate-700/40 shadow-inner hover:shadow-lg transition-shadow"
                      >
                        <div className="text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wide border-b border-slate-800/50 pb-2">
                          Case {i + 1}
                        </div>

                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[65px]">
                              Input:
                            </span>
                            <span className="text-amber-400 font-medium">
                              {t.input}
                            </span>
                          </div>

                          <div className="flex gap-3">
                            <span className="text-slate-500 font-semibold min-w-[65px]">
                              Output:
                            </span>
                            <span className="text-emerald-400 font-medium">
                              {t.expected_output}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Divider */}
          <PanelResizeHandle className="bg-slate-800 w-1 hover:bg-violet-600 transition-colors" />

          {/* Right: Editor + Results */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <PanelGroup direction="vertical">
                {/* Editor */}
                <Panel defaultSize={70} minSize={20}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/50 bg-slate-800/50 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse"></div>
                        <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">
                          Code Editor
                        </h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          className="bg-slate-800/80 text-white border border-slate-700/50 rounded-lg px-4 py-2 text-sm font-semibold hover:border-violet-500 transition-colors"
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
                          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold rounded-xl shadow-2xl shadow-violet-500/30 flex items-center gap-2 text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Submit Code
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden bg-slate-900 shadow-inner shadow-slate-950/50">
                      <CodeEditor
                        code={code}
                        setCode={setCode}
                        language={selectedLang}
                      />
                    </div>
                  </div>
                </Panel>

                {/* Divider */}
                <PanelResizeHandle className="h-1 w-full cursor-row-resize bg-slate-800 hover:bg-violet-600 transition-colors" />

                {/* Results */}
                <Panel
                  ref={resultPanelRef}
                  collapsible
                  defaultSize={30}
                  minSize={20}
                  onCollapse={() => setIsResultCollapsed(true)}
                  onExpand={() => setIsResultCollapsed(false)}
                  className={isResultCollapsed ? "hidden" : ""}
                >
                  <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 shadow-inner">
                    <ResultHeader />

                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-hide">
                      {result ? (
                        <>
                          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/40 rounded-xl p-5 border border-emerald-700/50 shadow-xl">
                            <div className="text-2xl font-black text-emerald-400 mb-1">
                              {result.passed
                                ? "Success!"
                                : "Some tests failed"}
                            </div>

                            <div className="text-sm text-slate-400 font-medium">
                              {result.passed
                                ? `All ${result.total} Test Cases Passed`
                                : `${result.passedCount}/${result.total} Test Cases Passed`}
                            </div>
                            <div className="text-sm text-slate-400 font-medium mt-1">
                              Execution time:{" "}
                              <span className="text-white font-bold text-base">
                                {result.timeMs}ms
                              </span>
                            </div>
                          </div>

                          {Array.isArray(details) &&
                            details.map((r: any, i: number) => (
                              <div
                                key={i}
                                className={`rounded-xl p-4 border ${
                                  r.passed
                                    ? "bg-emerald-500/5 border-emerald-500/30"
                                    : "bg-rose-500/5 border-rose-500/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Test Case {i + 1}
                                  </span>
                                  <span
                                    className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                      r.passed
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-rose-500/20 text-rose-400"
                                    }`}
                                  >
                                    {r.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>
                                <div className="space-y-2 font-mono text-sm">
                                  <div className="flex gap-3">
                                    <span className="text-slate-500 font-semibold min-w-[70px]">
                                      Input:
                                    </span>
                                    <span className="text-amber-300 font-medium">
                                      {r.input}
                                    </span>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-slate-500 font-semibold min-w-[70px]">
                                      Expected:
                                    </span>
                                    <span className="text-emerald-300 font-medium">
                                      {r.expected}
                                    </span>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-slate-500 font-semibold min-w-[70px]">
                                      Output:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        r.passed
                                          ? "text-emerald-300"
                                          : "text-rose-300"
                                      }`}
                                    >
                                      {r.output}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="w-20 h-20 rounded-full bg-slate-800/70 flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                            <Code2 className="w-10 h-10 text-slate-600" />
                          </div>
                          <p className="text-slate-500 text-base font-medium">
                            Run your code to see the test results here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>

              {isResultCollapsed && (
                <div className="border-t border-slate-800/50">
                  <ResultHeader />
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        body {
          background-color: #0f172a;
        }
      `}</style>
    </div>
  );
};

export default App;
