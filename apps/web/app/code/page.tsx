"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import CodeEditor from "@/components/editor/editor";
import { authClient } from "@/lib/auth-client";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Zap,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useSubmissionsStore } from "@/stores/submissionStore";
import { useSocket } from "@/hooks/useSocket";
import { CodeEnvironment } from "@/components/Code/CodeEnvironment";
import { API_BASE_URL } from "@/lib/api";

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
type CodeMap = {
  [questionId: string]: {
    [language: string]: string;
  };
};

const getDefaultCode = (lang: string): string => {
  switch (lang) {
    case "javascript":
      return `console.log("DSA RoundRobin");`;
    case "python":
      return `print("DSA RoundRobin")`;
    case "cpp":
    default:
      return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "DSA RoundRobin" << endl;\n    return 0;\n}`;
  }
};

const DsaPracticeApp: React.FC = () => {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const router = useRouter();

  const practiceMatchId = `practice:${userId}`;
  const submissions = useSubmissionsStore((state) => state.submissions);

  useSocket(userId, practiceMatchId);

  const [questionData, setQuestionData] = useState<QuestionData[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [codeMap, setCodeMap] = useState<CodeMap>({});
  const [submissionStatus, setSubmissionStatus] = useState(false);
  const currentQuestion = questionData[currentQIndex];
  const currentQId = currentQuestion?.questionData.id ?? "";
  const currentCode = codeMap[currentQId]?.[selectedLang] ?? getDefaultCode(selectedLang);
  
  useEffect(() => {
    setSubmissionStatus(false);
  }, [submissions]);

  const handleSetCode = useCallback(
    (newCode: string) => {
      if (currentQId) {
        setCodeMap((prev) => ({
          ...prev,
          [currentQId]: {
            ...(prev[currentQId] ?? {}),
            [selectedLang]: newCode,
          },
        }));
      }
    },
    [currentQId, selectedLang]
  );

  const handleSubmit = useCallback(async () => {
    if (!currentQId || !userId) {
      return;
    }

    setSubmissionStatus(true);

    try {
      await fetch(`${API_BASE_URL}/api/submit/solo`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQId,
          code: currentCode,
          language: selectedLang,
          mode: "practice",
          matchId: practiceMatchId,
        }),
      });
    } catch (err) {
      console.error("Submit error:", err);
      setSubmissionStatus(false);
      alert("Submission failed. Please check network and server status.");
    }
  }, [currentQId, userId, submissionStatus, currentCode, selectedLang, practiceMatchId]);

  const handleNextQuestion = useCallback(() => {
    setCurrentQIndex((i) => (i + 1) % questionData.length);
  }, [questionData.length]);

  const handlePrevQuestion = useCallback(() => {
    setCurrentQIndex((i) => (i > 0 ? i - 1 : questionData.length - 1));
  }, [questionData.length]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setQuestionError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/setquestions`, {
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

  useEffect(() => {
    setSubmissionStatus(false);
    if (currentQId) {
      const storedCode = codeMap[currentQId]?.[selectedLang];
      if (storedCode === undefined) {
        const defaultCode = getDefaultCode(selectedLang);
        handleSetCode(defaultCode);
      }
    }
  }, [currentQId, selectedLang, handleSetCode, codeMap]);


  if (loadingQuestions || isAuthLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground minecraft-texture">
        <div className="flex flex-col items-center gap-6 p-10 bg-card border-4 border-border pixel-border-outset shadow-2xl">
          {/* Minecraft Steve Thinking */}
          <div className="pixel-border-inset bg-muted p-4">
            <Image
              src="/minecraft-steve-thinking.png"
              alt="Steve Thinking"
              width={200}
              height={200}
              className="pixelated animate-bounce"
              priority
            />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="tracking-widest text-foreground font-minecraft font-bold text-lg">
            LOADING QUESTIONS...
          </p>
          <p className="text-muted-foreground text-sm font-minecraft">
            Steve is thinking hard about your challenges
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground minecraft-texture">
        <div className="flex flex-col items-center gap-6 p-10 bg-card border-4 border-border pixel-border-outset shadow-2xl max-w-md">
          {/* Minecraft Steve Thinking */}
          <div className="pixel-border-inset bg-muted p-4">
            <Image
              src="/minecraft-steve-thinking.png"
              alt="Minecraft Steve Thinking"
              width={200}
              height={200}
              className="pixelated"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-destructive animate-pulse" />
            <h2 className="text-2xl font-extrabold text-foreground font-minecraft">
              Access Denied
            </h2>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg text-foreground font-minecraft font-bold">
              🔒 Authentication Required
            </p>
            <p className="text-sm text-muted-foreground font-minecraft">
              Please log in to start your DSA practice session
            </p>
          </div>
          <div className="w-full h-1 bg-border pixel-border-inset"></div>
          <p className="text-xs text-muted-foreground font-minecraft text-center">
            Steve is thinking... where did you go?
          </p>
        </div>
      </div>
    );
  }

  if (questionError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-rose-300 text-xl font-bold">
        <div className="flex flex-col items-center gap-4 p-10 bg-slate-800 rounded-xl shadow-2xl border border-rose-700/50">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <h2 className="text-2xl font-extrabold text-white">Question Load Error</h2>
          <p className="text-base text-rose-300 font-medium">{questionError}</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-500 text-xl font-bold">
        <AlertCircle className="w-6 h-6 mr-3" />
        No questions available. Please try refreshing or check the server status.
      </div>
    );
  }

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return {
          bg: "from-emerald-500/10 to-teal-500/10",
          border: "border-emerald-500/40",
          text: "text-emerald-400",
        };
      case "medium":
        return {
          bg: "from-amber-500/10 to-orange-500/10",
          border: "border-amber-500/40",
          text: "text-amber-400",
        };
      case "hard":
        return {
          bg: "from-rose-500/10 to-red-500/10",
          border: "border-rose-500/40",
          text: "text-rose-400",
        };
      default:
        return {
          bg: "from-slate-500/10 to-slate-600/10",
          border: "border-slate-500/40",
          text: "text-slate-400",
        };
    }
  };

  const curQuesSub = submissions[currentQId] ?? null;

  return (
    <CodeEnvironment
      header={
        <header className="relative bg-card border-b-2 border-border minecraft-texture">
          <div className="relative px-6 py-3 flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 mr-2 bg-secondary hover:bg-secondary/80 border-2 border-border pixel-border-outset active:pixel-border-inset transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 transform hover:scale-105 transition-transform duration-300">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground font-minecraft">
                DSA Practice Platform
              </h1>
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Solo Coding Mode
              </p>
            </div>
          </div>
        </header>
      }
      questionPanel={{
        title: `Problem ${currentQIndex + 1}`,
        difficulty: currentQuestion.questionData.difficulty,
        difficultyStyles: getDifficultyStyles(currentQuestion.questionData.difficulty),
        navigation: questionData.length > 1 && (
          <div className="flex items-center gap-3 mt-4">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevQuestion}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-secondary border-2 border-border pixel-border-outset hover:bg-secondary/80 text-sm font-semibold active:pixel-border-inset disabled:opacity-50"
              disabled={currentQIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1 text-primary" />
              Prev
            </motion.button>
            <div className="px-4 py-2 border-2 border-primary bg-primary/10 rounded-lg text-sm font-bold text-primary pixel-border-inset min-w-[80px] text-center font-minecraft">
              {currentQIndex + 1} / {questionData.length}
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextQuestion}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-secondary border-2 border-border pixel-border-outset hover:bg-secondary/80 text-sm font-semibold active:pixel-border-inset disabled:opacity-50"
              disabled={currentQIndex === questionData.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1 text-primary" />
            </motion.button>

          </div>
        ),
        content: (
          <>
            <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
              <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                <AlertCircle className="w-4 h-4" />
                Problem Statement
              </h3>
              <div
                className="text-card-foreground leading-relaxed prose prose-invert max-w-none text-base"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questionData.question,
                }}
              />
            </div>
            <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                <Code2 className="w-4 h-4" />
                Sample Test Cases
              </h3>
              <div className="space-y-3">
                {currentQuestion.questionData.testcases.map((t: TestCase, i: number) => (
                  <div key={i} className="bg-muted p-4 border-2 border-border pixel-border-inset">
                    <div className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide font-minecraft">
                      Example {i + 1}
                    </div>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-semibold">Input:</span>
                        <pre className="whitespace-pre-wrap break-all bg-background/50 p-2 rounded text-accent-foreground border border-border/50">
                          {t.input}
                        </pre>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-semibold">Output:</span>
                        <pre className="whitespace-pre-wrap break-all bg-background/50 p-2 rounded text-primary border border-border/50">
                          {t.expected_output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ),
      }}
      editorPanel={{
        language: selectedLang,
        setLanguage: setSelectedLang,
        code: currentCode,
        setCode: handleSetCode,
        onSubmit: handleSubmit,
        isLoading: submissionStatus,
        onReset: () => handleSetCode(getDefaultCode(selectedLang)),
        editorComponent: (
          <CodeEditor code={currentCode} setCode={handleSetCode} language={selectedLang} />
        ),
      }}
      resultsPanel={{
        submissionResult: curQuesSub?.result,
        status: submissionStatus ? "running" : "idle",
        details: curQuesSub?.details ?? [],
      }}
    />
  );
};

export default DsaPracticeApp;