"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import CodeEditor from "@/components/editor/editor";
import { authClient } from "@repo/auth";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Zap,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useSubmissionsStore } from "@/store/submissionStore";
import { useSocket } from "@/hooks/useSocket";

// --- Types ---
interface TestCase {
  input: string;
  expected_output: string;
}
interface Question {
  id: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  question: string;
  testcases: TestCase[];
}
interface QuestionData {
  questionData: Question;
}
type SubmissionStatus = "idle" | "running" | "complete";
type CodeMap = {
  [questionId: string]: {
    [language: string]: string;
  };
};

// --- Helper Functions (moved for cleanliness) ---
const getDifficultyStyles = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return {
        bg: "bg-emerald-600/10",
        border: "border-emerald-500/50",
        text: "text-emerald-300",
      };
    case "medium":
      return {
        bg: "bg-amber-600/10",
        border: "border-amber-500/50",
        text: "text-amber-300",
      };
    case "hard":
      return {
        bg: "bg-rose-600/10",
        border: "border-rose-500/50",
        text: "text-rose-300",
      };
    default:
      return {
        bg: "bg-slate-700/50",
        border: "border-slate-500/50",
        text: "text-slate-400",
      };
  }
};

const getDefaultCode = (lang: string): string => {
  switch (lang) {
    case "javascript":
      return `function solve(input) {\n  // Implement your logic here\n  return input;\n}\n`;
    case "python":
      return `def solve(input):\n  # Implement your logic here\n  return input\n`;
    case "cpp":
    default:
      return `#include <iostream>\nusing namespace std;\n\nint main() {\n  // Implement your logic here\n  cout << "Hello, world!" << endl;\n  return 0;\n}`;
  }
};

// --- Sub-Components (ResultHeader - kept same) ---
interface ResultHeaderProps {
  toggleCollapse: () => void;
  isCollapsed: boolean;
  submissionResult: any;
  status: SubmissionStatus;
}
const ResultHeader: React.FC<ResultHeaderProps> = ({
  toggleCollapse,
  isCollapsed,
  submissionResult,
  status,
}) => {
  const isPassed = submissionResult?.passed;
  const passedCount = submissionResult?.passedCount ?? 0;
  const totalTests = submissionResult?.total ?? 0;

  let icon;
  let title;
  let classes;

  if (status === "running") {
    icon = <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />;
    title = "Running Code...";
    classes = "text-violet-300";
  } else if (submissionResult) {
    if (isPassed) {
      icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
      title = `Accepted (${totalTests}/${totalTests})`;
      classes = "text-emerald-300";
    } else {
      icon = <XCircle className="w-5 h-5 text-rose-400" />;
      title = `Failed (${passedCount}/${totalTests})`;
      classes = "text-rose-300";
    }
  } else {
    icon = <Code2 className="w-5 h-5 text-slate-400" />;
    title = "Output Panel";
    classes = "text-slate-300";
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-b border-slate-800/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 transition-colors">
      <div className={`flex items-center gap-2 font-semibold ${classes}`}>
        {icon}
        <h2 className="text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <button
        onClick={toggleCollapse}
        aria-label={
          isCollapsed ? "Expand Result Panel" : "Collapse Result Panel"
        }
        className="text-slate-400 hover:text-white transition-all p-1 rounded-md hover:bg-slate-700/50 active:scale-95"
      >
        {isCollapsed ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

// --- Main Component ---

const DsaPracticeApp: React.FC = () => {
  /*
  ********************************************************************************
  * START: ALL HOOKS MUST BE DECLARED HERE (UNCONDITIONAL)
  ********************************************************************************
  */
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";

  const practiceMatchId = `practice:${userId}`;
  const submissions = useSubmissionsStore((state) => state.submissions);

  // Custom Socket Hook
  useSocket(userId, practiceMatchId);

  // Question and Code State Management
  const [questionData, setQuestionData] = useState<QuestionData[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null); // New Error State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("cpp");

  // Code persistence across questions/languages
  const [codeMap, setCodeMap] = useState<CodeMap>({});

  // Submission State
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");

  // Result Panel Management
  const resultPanelRef = useRef<ImperativePanelHandle>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);

  // Derived State (Must be based on state defined above)
  const currentQuestion = questionData[currentQIndex];
  const currentQId = currentQuestion?.questionData.id ?? "";
  const currentCode = codeMap[currentQId]?.[selectedLang] ?? getDefaultCode(selectedLang);

  /* ---------------- Handlers (useCallback) ---------------- */

  const handleSetCode = useCallback((newCode: string) => {
    // Update the code in the map and keep it in sync
    if (currentQId) {
      setCodeMap((prev) => ({
        ...prev,
        [currentQId]: {
          ...(prev[currentQId] ?? {}),
          [selectedLang]: newCode,
        },
      }));
    }
  }, [currentQId, selectedLang]);


  const handleToggleResultPanel = useCallback(() => {
    if (resultPanelRef.current) {
      if (isResultCollapsed) {
        resultPanelRef.current.expand();
      } else {
        resultPanelRef.current.collapse();
      }
    }
  }, [isResultCollapsed]);

  const handleSubmit = useCallback(async () => {
    // 🛑 CRITICAL CHECK: Guard against invalid state and concurrent submissions
    if (!currentQId || !userId || submissionStatus === "running") {
        console.warn("Submission blocked: Invalid state or already running.");
        return;
    }

    setSubmissionStatus("running");

    try {
      // Micro-interaction: Ensure result panel is visible upon submission
      if (resultPanelRef.current && isResultCollapsed) {
        resultPanelRef.current.expand();
      }

      await fetch("http://localhost:5000/api/submit/solo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQId,
          code: currentCode, // Use the derived currentCode
          language: selectedLang,
          mode: "practice",
          matchId: practiceMatchId,
        }),
      });
      
    } catch (err) {
      console.error("Submit error:", err);
      // If the fetch fails completely (e.g., network error), reset status
      setSubmissionStatus("idle"); 
      alert("Submission failed. Please check network and server status.");
    }
    // Status will be set to 'complete' in the monitoring useEffect when the result arrives
  }, [currentQId, userId, submissionStatus, isResultCollapsed, currentCode, selectedLang, practiceMatchId]);

  const handleNextQuestion = useCallback(() => {
    setCurrentQIndex((i) => (i + 1) % questionData.length);
  }, [questionData.length]);

  const handlePrevQuestion = useCallback(() => {
    setCurrentQIndex((i) => (i > 0 ? i - 1 : questionData.length - 1));
  }, [questionData.length]);
  
  const handleSelectLang = useCallback((lang: string) => {
    setSelectedLang(lang);
  }, []);

  /* ---------------- useEffects (Side Effects) ---------------- */
  
  // 1. Fetch Questions on Mount/UserID Change
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setQuestionError(null);
      try {
        const res = await fetch("http://localhost:5000/api/setquestions", {
          method: "POST",
          credentials: "include",
        });

        const data = await res.json();
        if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          const formattedQuestions: QuestionData[] = data.questions.map((q: any) => ({
            questionData: {
              id: q.id,
              difficulty: q.difficulty,
              question: q.question,
              testcases: q.testcases ?? [],
            },
          }));
          setQuestionData(formattedQuestions);
        } else {
            setQuestionError("No questions received from the server.");
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setQuestionError("Failed to fetch questions. Server unreachable or API error.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (userId) {
      fetchQuestions();
    }
  }, [userId]);
  
  // 2. Synchronize Code and Status when Question/Language Changes
  useEffect(() => {
    // This runs when the index or language changes
    setSubmissionStatus("idle");
    
    if (currentQId) {
        const storedCode = codeMap[currentQId]?.[selectedLang];
        
        // If no stored code exists, initialize it with the default code
        if (storedCode === undefined) {
            const defaultCode = getDefaultCode(selectedLang);
            handleSetCode(defaultCode);
        }
    }
    
  // We use currentQId and selectedLang in the dependency array to trigger this on context switch
  // handleSetCode is stable via useCallback, and codeMap is implicitly used via handleSetCode
  }, [currentQId, selectedLang, handleSetCode]);


  // 3. Monitor Submission Store for Result & Update Status
  useEffect(() => {
    if (submissionStatus !== "running" || !currentQId) return;

    if (submissions[currentQId]?.result) {
      setSubmissionStatus("complete");
      // Micro-interaction: Auto-expand result panel on submission completion
      if (isResultCollapsed && resultPanelRef.current) {
        resultPanelRef.current.expand();
      }
    }
  }, [submissions, submissionStatus, currentQId, isResultCollapsed]);

  /*
  ********************************************************************************
  * END: ALL HOOKS SECTION
  * START: CONDITIONAL RENDER/EARLY EXITS
  ********************************************************************************
  */
  
  if (!userId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4 p-10 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
          <AlertCircle className="w-10 h-10 text-amber-400 animate-pulse" />
          <h2 className="text-2xl font-extrabold text-white">Authentication Required</h2>
          <p className="text-base text-slate-400 font-medium">
            Please log in to start your DSA practice session.
          </p>
        </div>
      </div>
    );
  }

  if (loadingQuestions) {
    // Enhanced loading screen
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white text-xl font-bold">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-400" />
        <p className="tracking-widest text-slate-300">LOADING QUESTIONS...</p>
        <div className="mt-4 w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full w-full bg-violet-500 origin-left animate-[loading-bar_2s_infinite_cubic-bezier(0.4,0,0.2,1)]"></div>
        </div>
      </div>
    );
  }
  
  // New: Error state for question fetching
  if (questionError) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-rose-300 text-xl font-bold">
            <div className="flex flex-col items-center gap-4 p-10 bg-slate-800 rounded-xl shadow-2xl border border-rose-700/50">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <h2 className="text-2xl font-extrabold text-white">Question Load Error</h2>
                <p className="text-base text-rose-300 font-medium">
                    {questionError}
                </p>
            </div>
        </div>
    );
  }

  // The critical check that ensures currentQuestion is available before continuing
  if (!currentQuestion) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-500 text-xl font-bold">
        <AlertCircle className="w-6 h-6 mr-3" />
        No questions available. Please try refreshing or check the server status.
      </div>
    );
  }
  
  // Final derived states after all checks
  const difficultyStyles = getDifficultyStyles(currentQuestion.questionData.difficulty);
  const curQuesSub = submissions[currentQId] ?? null;
  const result = curQuesSub?.result ?? null;
  const details = curQuesSub?.details ?? [];


  // --- Rendered Structure ---

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* HEADER */}
      <header className="relative bg-gradient-to-br from-slate-900 to-slate-950 border-b border-violet-800/40 shadow-2xl z-20">
        <div className="relative px-6 py-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 transform hover:scale-105 transition-transform duration-300">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              DSA Practice Platform
            </h1>
            <p className="text-xs text-slate-400 font-medium uppercase">Solo Coding Mode</p>
          </div>
        </div>
      </header>

      {/* BODY - Split Panels */}
      <div className="flex flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Question Panel */}
          <Panel defaultSize={40} minSize={25} className="bg-slate-900">
            <div className="h-full flex flex-col border-r border-slate-800/50">
              {/* Question Navigation/Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white/95 tracking-tight">
                    Problem {currentQIndex + 1}
                  </h2>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${difficultyStyles.bg} ${difficultyStyles.border} ${difficultyStyles.text} transition-colors duration-300 shadow-md`}
                  >
                    {currentQuestion.questionData.difficulty}
                  </div>
                </div>

                {/* Navigation Controls */}
                {questionData.length > 1 && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handlePrevQuestion}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700/70 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:border-violet-500/50 transition-all duration-200 active:scale-[0.98] font-semibold disabled:opacity-50"
                      aria-label="Previous Problem"
                      disabled={currentQIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1 text-violet-400" />
                      Previous
                    </button>

                    <div className="px-4 py-2 border border-violet-600 rounded-lg text-sm font-bold text-violet-300 bg-violet-900/20 shadow-inner min-w-[80px] text-center">
                      {currentQIndex + 1} / {questionData.length}
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700/70 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:border-violet-500/50 transition-all duration-200 active:scale-[0.98] font-semibold disabled:opacity-50"
                      aria-label="Next Problem"
                      disabled={currentQIndex === questionData.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1 text-violet-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-inner transition-shadow duration-300">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-violet-400 mb-4 border-b border-slate-800 pb-2">
                    Problem Statement
                  </h3>
                  <div
                    className="text-slate-300 leading-relaxed prose prose-invert max-w-none text-base"
                    dangerouslySetInnerHTML={{
                      __html: currentQuestion.questionData.question,
                    }}
                  />
                </div>

                {/* Sample Test Cases */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-violet-400 border-b border-slate-800 pb-2">
                    Sample Test Cases
                  </h3>
                  {currentQuestion.questionData.testcases.map(
                    (t: TestCase, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md transition-shadow duration-300 hover:border-violet-500/30"
                      >
                        <div className="text-xs font-bold text-slate-500 mb-3 pb-2 uppercase tracking-wider">
                          Example {i + 1}
                        </div>
                        <div className="space-y-3 font-mono text-sm">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <span className="min-w-[70px] text-slate-400 font-semibold">
                              Input:
                            </span>
                            <pre className="whitespace-pre-wrap break-all bg-slate-800/70 p-2 rounded text-amber-300 flex-1 border border-slate-700/50">
                              {t.input}
                            </pre>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <span className="min-w-[70px] text-slate-400 font-semibold">
                              Output:
                            </span>
                            <pre className="whitespace-pre-wrap break-all bg-slate-800/70 p-2 rounded text-emerald-300 flex-1 border border-slate-700/50">
                              {t.expected_output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="bg-slate-800 w-2 hover:bg-violet-600 transition-colors duration-150 relative group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-slate-700 rounded-full group-hover:bg-white transition-colors duration-150"></div>
          </PanelResizeHandle>

          {/* Code Editor and Results Panel */}
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col bg-slate-900">
              <PanelGroup direction="vertical">
                {/* Code Editor */}
                <Panel defaultSize={70} minSize={20}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 shadow-lg">
                      <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                        Code Editor
                      </h2>

                      <div className="flex items-center gap-3">
                        <select
                          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-violet-500 focus:border-violet-500 transition-colors cursor-pointer appearance-none shadow-inner hover:border-violet-500 active:scale-[0.99]"
                          value={selectedLang}
                          onChange={(e) => handleSelectLang(e.target.value)}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                        </select>
                        
                        <button
                          onClick={() => handleSetCode(getDefaultCode(selectedLang))}
                          className="p-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-200 active:scale-95"
                          aria-label="Reset Code"
                          title="Reset Code"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleSubmit}
                          disabled={submissionStatus === "running"}
                          className={`px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-violet-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm active:scale-[0.98] transform ${
                            submissionStatus === "running" ? 'animate-pulse' : 'hover:from-violet-500 hover:to-fuchsia-500'
                          }`}
                          aria-label="Submit Code"
                        >
                          {submissionStatus === "running" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              EVALUATING...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              SUBMIT CODE
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <CodeEditor
                        code={currentCode} // Use the derived currentCode
                        setCode={handleSetCode} // Use the specific handler
                        language={selectedLang}
                      />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-2 bg-slate-800 cursor-ns-resize hover:bg-violet-600/50 transition-colors duration-150 relative group">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-slate-700 rounded-full group-hover:bg-white transition-colors duration-150"></div>
                </PanelResizeHandle>

                {/* Results Panel */}
                <Panel
                  ref={resultPanelRef}
                  collapsible
                  defaultSize={30}
                  minSize={10}
                  onCollapse={() => setIsResultCollapsed(true)}
                  onExpand={() => setIsResultCollapsed(false)}
                >
                  <div className="h-full flex flex-col bg-slate-900">
                    <ResultHeader
                      toggleCollapse={handleToggleResultPanel}
                      isCollapsed={isResultCollapsed}
                      submissionResult={result}
                      status={submissionStatus}
                    />

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
                      {submissionStatus === "running" && !result ? (
                        // Running State (Submission Status Card)
                        <div className="p-6 rounded-xl border border-violet-500/40 bg-violet-900/15 shadow-2xl shadow-violet-900/40 animate-pulse-slow">
                          <div className="flex items-center gap-4">
                            <Clock className="w-6 h-6 text-violet-400 shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Code Evaluation in Progress</h3>
                                <p className="text-sm text-slate-400">
                                  Your code has been submitted and is currently being executed against the test cases. Please wait...
                                </p>
                            </div>
                          </div>
                          {/* Subtle progress bar that moves */}
                          <div className="mt-4 w-full h-1 bg-violet-800/50 rounded-full overflow-hidden">
                              <div className="h-full w-1/4 bg-violet-500 animate-[submission-progress_2s_infinite_linear]"></div>
                          </div>
                        </div>
                      ) : result ? (
                        <>
                          {/* Summary Card */}
                          <div className={`submission-summary p-6 rounded-xl border transition-all duration-300 shadow-2xl transform hover:scale-[1.005] ${result.passed ? 'bg-emerald-500/15 border-emerald-500/40 shadow-emerald-900/40' : 'bg-rose-500/15 border-rose-500/40 shadow-rose-900/40'}`}>
                            <div className={`text-3xl font-extrabold tracking-tight ${result.passed ? 'text-emerald-400' : 'text-rose-400'} mb-2`}>
                              {result.passed ? "Accepted! 🎉" : "Wrong Answer/Error ❌"}
                            </div>
                            <div className="text-sm text-slate-300 font-medium">
                              <span className="font-bold text-white">
                                {result.passedCount}
                              </span>{" "}
                              out of {result.total} Test Cases Passed
                            </div>
                            <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                              Execution Time:{" "}
                              <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                                {result.timeMs}ms
                              </span>
                            </div>
                            {result.error && (
                                <div className="text-sm text-rose-400 mt-3 p-3 bg-rose-900/30 rounded-lg border border-rose-700 font-mono overflow-auto max-h-24">
                                    <span className="font-bold text-rose-300">Runtime Error:</span> {result.error}
                                </div>
                            )}
                          </div>

                          {/* Test Case Details */}
                          <div className="space-y-4 pt-2">
                            {details.map((r: any, i: number) => (
                              <div
                                key={i}
                                className={`rounded-xl p-5 border transition-all duration-200 shadow-lg ${
                                  r.passed
                                    ? "bg-emerald-500/10 border-emerald-500/40 hover:shadow-emerald-900/30"
                                    : "bg-rose-500/10 border-rose-500/40 hover:shadow-rose-900/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                                    TEST CASE {i + 1}
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                                      r.passed
                                        ? "bg-emerald-500/30 text-emerald-300"
                                        : "bg-rose-500/30 text-rose-300"
                                    }`}
                                  >
                                    {r.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>

                                <div className="space-y-3 font-mono text-sm border-t border-slate-700/50 pt-3">
                                  <div className="flex gap-3">
                                    <span className="text-slate-400 min-w-[70px] font-semibold">
                                      Input:
                                    </span>
                                    <pre className="whitespace-pre-wrap break-all text-amber-300 flex-1">
                                      {r.input}
                                    </pre>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-slate-400 min-w-[70px] font-semibold">
                                      Expected:
                                    </span>
                                    <pre className="whitespace-pre-wrap break-all text-emerald-300 flex-1">
                                      {r.expected}
                                    </pre>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="text-slate-400 min-w-[70px] font-semibold">
                                      Output:
                                    </span>
                                    <pre className={`whitespace-pre-wrap break-all flex-1 ${r.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                                      {r.output}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        // Initial/Idle State
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-80">
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700 transform transition-all duration-300 hover:scale-105 shadow-xl">
                            <Code2 className="w-10 h-10 text-slate-600" />
                          </div>
                          <p className="text-slate-500 text-base font-medium">
                            The evaluation results will appear here after you
                            submit your code.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Custom Scrollbar Styles and Animations */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569; /* slate-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b; /* slate-500 */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #0f172a; /* slate-950 */
        }
        body {
          background-color: #0f172a;
        }
        /* Ensure the prose styles don't look too jarring if they exist */
        .prose-invert code {
            color: #f472b6 !important; /* fuchsia-400 */
            background-color: #1e293b !important; /* slate-800 */
            border-radius: 0.25rem;
            padding: 0.2em 0.4em;
            font-weight: 600;
        }
        
        /* Submission Progress Animation */
        @keyframes submission-progress {
          0% { transform: translateX(-100%) scaleX(0); }
          50% { transform: translateX(0%) scaleX(0.75); }
          100% { transform: translateX(100%) scaleX(0); }
        }

        /* Slow Pulse for running status card */
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Loading Bar Animation */
        @keyframes loading-bar {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.75); }
            100% { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

export default DsaPracticeApp;