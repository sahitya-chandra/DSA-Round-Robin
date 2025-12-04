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

interface DifficultyStyles {
  bg: string;
  border: string;
  text: string;
}

const App: React.FC = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";

  const practiceMatchId = `practice:${userId}`;
  useSocket(userId, practiceMatchId);

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

  const curQuesSub = submissions[currentQuestion.questionData.id] ?? null;
  const result = curQuesSub?.result ?? null;
  const details = curQuesSub?.details ?? [];

  const handleSubmit = async () => {
    if (!currentQuestion || !userId) return;
    setLoading(true);

    try {
      await fetch("http://localhost:5000/api/submit/solo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.questionData.id,
          code,
          language: selectedLang,
          mode: "practice",
          matchId: practiceMatchId,
        }),
      });
    } catch (err) {
      console.error("Submit error (practice):", err);
      setLoading(false);
    }
  };

  const getDifficultyStyles = (difficulty: string): DifficultyStyles => {
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
              if (!panel) return;
              isResultCollapsed ? panel.expand() : panel.collapse();
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

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700/50 shadow-xl">
        <div className="relative px-6 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">DSA Practice Platform</h1>
            <p className="text-xs text-slate-400">Solo Coding Mode</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col border-r border-slate-700/50">
              <div className="px-5 py-4 border-b border-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">
                    Problem {currentQIndex + 1}
                  </h2>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${difficultyStyles.bg} ${difficultyStyles.border} ${difficultyStyles.text}`}
                  >
                    {currentQuestion.questionData.difficulty}
                  </div>
                </div>

                {questionData.length > 1 && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() =>
                        setCurrentQIndex((i) =>
                          i > 0 ? i - 1 : questionData.length - 1
                        )
                      }
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                      Prev
                    </button>

                    <div className="px-4 py-2 border border-violet-500 rounded-lg">
                      {currentQIndex + 1} / {questionData.length}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentQIndex((i) => (i + 1) % questionData.length)
                      }
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                  <h3 className="text-xs font-bold text-violet-400 mb-3">
                    Problem Statement
                  </h3>
                  <p className="text-slate-300">
                    {currentQuestion.questionData.question}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-violet-400">
                    Sample Test Cases
                  </h3>
                  {currentQuestion.questionData.testcases.map(
                    (t: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900 p-4 rounded-lg border border-slate-700"
                      >
                        <div className="text-xs font-bold text-slate-500 mb-2 border-b pb-1">
                          Case {i + 1}
                        </div>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex gap-3">
                            <span className="min-w-[65px] text-slate-500">
                              Input:
                            </span>
                            <span className="text-amber-300">{t.input}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="min-w-[65px] text-slate-500">
                              Output:
                            </span>
                            <span className="text-emerald-300">
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

          <PanelResizeHandle className="bg-slate-800 w-1" />

          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <PanelGroup direction="vertical">
                <Panel defaultSize={70} minSize={20}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
                      <h2 className="text-sm font-bold">Code Editor</h2>

                      <div className="flex items-center gap-3">
                        <select
                          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm"
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
                          className="px-6 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Submit Code
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-900">
                      <CodeEditor
                        code={code}
                        setCode={setCode}
                        language={selectedLang}
                      />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 bg-slate-800 cursor-row-resize" />

                <Panel
                  ref={resultPanelRef}
                  collapsible
                  defaultSize={30}
                  minSize={20}
                  onCollapse={() => setIsResultCollapsed(true)}
                  onExpand={() => setIsResultCollapsed(false)}
                  className={isResultCollapsed ? "hidden" : ""}
                >
                  <div className="h-full flex flex-col bg-slate-900">
                    <ResultHeader />

                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                      {result ? (
                        <>
                          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div className="text-2xl font-black text-emerald-400">
                              {result.passed ? "Success!" : "Some tests failed"}
                            </div>
                            <div className="text-sm text-slate-400">
                              {result.passed
                                ? `All ${result.total} Test Cases Passed`
                                : `${result.passedCount}/${result.total} Test Cases Passed`}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              Time:{" "}
                              <span className="font-bold text-white">
                                {result.timeMs}ms
                              </span>
                            </div>
                          </div>

                          {details.map((r: any, i: number) => (
                            <div
                              key={i}
                              className={`rounded-xl p-4 border ${
                                r.passed
                                  ? "bg-emerald-500/10 border-emerald-500/40"
                                  : "bg-rose-500/10 border-rose-500/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-500">
                                  Test Case {i + 1}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-full ${
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
                                  <span className="text-slate-500 min-w-[70px]">
                                    Input:
                                  </span>
                                  {r.input}
                                </div>
                                <div className="flex gap-3">
                                  <span className="text-slate-500 min-w-[70px]">
                                    Expected:
                                  </span>
                                  {r.expected}
                                </div>
                                <div className="flex gap-3">
                                  <span className="text-slate-500 min-w-[70px]">
                                    Output:
                                  </span>
                                  {r.output}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                            <Code2 className="w-10 h-10 text-slate-600" />
                          </div>
                          <p className="text-slate-500 text-base">
                            Run your code to see the results here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>

              {isResultCollapsed && (
                <div className="border-t border-slate-800">
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
