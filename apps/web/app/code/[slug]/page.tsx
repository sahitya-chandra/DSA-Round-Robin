"use client";

import React, { useState, useEffect } from "react";
import CodeEditor from "@/components/editor/editor";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMatchStore } from "@/stores/matchStore";
import { useMatchResultStore } from "@/stores/matchResultStore";
import { Play, Code2, Clock, Zap, AlertCircle, ChevronDown } from "lucide-react";
import { useSubmissionsStore } from "@/stores/submissionStore";
import { useMatchProgressStore } from "@/stores/matchProgressStore";
import { useSocket } from "@/hooks/useSocket";
import { ResultCard } from "@/components/Dashboard/ResultCard";
import { CodeEnvironment } from "@/components/Code/CodeEnvironment";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";


const getDefaultCode = (lang: string): string => {
  switch (lang) {
    case "javascript":
      return `function solve(input) {\n    console.log("DSA RoundRobin");\n    return input;\n}\n`;
    case "python":
      return `def solve(input):\n    print("DSA RoundRobin")\n    return input\n`;
    case "cpp":
    default:
      return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "DSA RoundRobin" << endl;\n    return 0;\n}`;
  }
};







const App: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { questions, hydrated, startedAt, duration } = useMatchStore();
  const { visible, winnerId, hideResult } = useMatchResultStore();

  const calculateTimeLeft = () => {
    if (!startedAt || !duration) return 0;
    const start = new Date(startedAt).getTime();
    const end = start + duration * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const submissions = useSubmissionsStore((state) => state.submissions);
  const myProgress = useMatchProgressStore((state) => state.myProgress);
  const opponentProgress = useMatchProgressStore((state) => state.opponentProgress);
  const [questionData, setQuestionData] = useState<any[]>(questions);
  const [selectedLang, setSelectedLang] = useState("cpp");
  const [loading, setLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [opponent, setOpponent] = useState<{ name: string } | null>(null);
  const { data: session } = authClient.useSession();
  useSocket(session?.user?.id as string, params.slug as string);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({
    cpp: getDefaultCode("cpp"),
  });
  const code = codeMap[selectedLang] || getDefaultCode(selectedLang);
  const setCode = (newCode: string) => {
    setCodeMap(prev => ({ ...prev, [selectedLang]: newCode }));
  };

  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const isHeaderLoading = !hydrated || loadingQuestions;

  useEffect(() => {
    setLoading(false);
  }, [submissions]);

  useEffect(() => {
    if (!hydrated || questions.length === 0) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/match/getmatch/${params.slug}`, {
          credentials: "include",
        });
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (data.error || data.status === "finished") {
          // If the match is already finished in the DB, but we haven't shown 
          // the result yet, don't redirect yet. 
          // However, if we are NOT in the match room anymore or it's totally gone, we should redirect.
          if (!visible) {
             router.replace("/");
          }
          return;
        }
        setOpponent(data.opponent);
        setQuestionData(data.questions);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchMatch();
  }, [hydrated, questions, params.slug, router]);

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

  const currentQuestion = questionData[currentQIndex];
  const curQuesSub =
    Object.values(submissions).find(
      (sub) => sub.questionId === currentQuestion?.questionData.id
    ) || null;

  const handleSubmit = async () => {
    if (!currentQuestion || !session?.user?.id) return;
    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/submit`, {
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
    } catch (err: any) {
      console.error("Submit error:", err);
    }
  };

  const [finishing, setFinishing] = useState(false);

  const finish = async () => {
    if (!params.slug || !session?.user?.id) return;
    setFinishing(true);
    try {
      await fetch(`${API_BASE_URL}/api/match/finish/${params.slug}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error("Finish error:", err);
    } finally {
      setFinishing(false);
    }
  };

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

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor =
    timeLeft <= 60 ? "text-rose-400" : timeLeft <= 120 ? "text-amber-400" : "text-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full w-full"
    >
    <CodeEnvironment
      header={
        <div className="relative bg-card border-b-2 border-border minecraft-texture">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            ></div>
          </div>

          <div className="relative px-4 md:px-6 py-3">
            <div className="flex items-center justify-between gap-3 lg:gap-6 flex-wrap lg:flex-nowrap">
              {/* Logo Section - Order 1 */}
              <div className="flex items-center gap-3 order-1">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Zap className="w-4 h-4 text-white" fill="white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-lg font-black text-foreground tracking-tight font-minecraft">
                    DSA RR
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-medium">1v1 Battle Mode</p>
                </div>
              </div>

              {/* Status Section (Progress + Timer) - Order 3 (Mobile/Tablet) / Order 2 (Desktop) */}
              <div className="flex items-center gap-2 lg:gap-4 justify-center w-full lg:w-auto lg:flex-1 order-3 lg:order-2 mt-2 lg:mt-0">
                {isHeaderLoading ? (
                  <>
                    <div className="bg-card/50 px-3 md:px-4 py-2 border-2 border-border w-[100px] md:w-[140px] h-[50px] md:h-[54px] animate-pulse flex items-center gap-2 md:gap-3 pixel-border-outset">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-muted pixel-border-inset" />
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-4 h-4 md:w-6 md:h-6 bg-muted pixel-border-inset" />
                        ))}
                      </div>
                    </div>
                    <div className="bg-card/50 p-[2px] w-[90px] md:w-[110px] h-[46px] md:h-[50px] animate-pulse pixel-border-outset">
                      <div className="h-full bg-card pixel-border-inset flex items-center justify-center">
                        <div className="w-16 md:w-20 h-5 md:h-6 bg-muted" />
                      </div>
                    </div>
                    <div className="bg-card/50 px-3 md:px-4 py-2 border-2 border-border w-[100px] md:w-[140px] h-[50px] md:h-[54px] animate-pulse flex items-center gap-2 md:gap-3 pixel-border-outset">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-muted pixel-border-inset" />
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-4 h-4 md:w-6 md:h-6 bg-muted pixel-border-inset" />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-card px-2 md:px-4 py-1.5 md:py-2 border-2 border-primary pixel-border-outset minecraft-texture">
                      <div className="flex items-center gap-1.5 md:gap-2.5">
                        <div className="w-6 h-6 md:w-9 md:h-9 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold text-[10px] md:text-xs font-minecraft">
                          YOU
                        </div>
                        <div className="flex gap-0.5 md:gap-1.5">
                          {questionData.map((q, i) => {
                            const solved = myProgress[q.questionData.id] ?? false;
                            return (
                              <div
                                key={i}
                                className={`w-3 h-3 md:w-6 md:h-6 flex items-center justify-center transition-colors pixel-border-outset ${
                                  solved ? "bg-primary/30" : "bg-muted"
                                }`}
                              >
                                {solved ? (
                                  <svg
                                    className="w-2 h-2 md:w-4 md:h-4 text-primary"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="bg-destructive p-[2px] shadow-lg pixel-border-outset">
                      <div className="bg-card px-2 md:px-5 py-1.5 md:py-2 pixel-border-inset">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Clock className={`w-3 h-3 md:w-3.5 md:h-3.5 ${timerColor}`} />
                          <div
                            className={`text-base md:text-2xl font-black font-mono ${timerColor} tracking-wider font-minecraft`}
                          >
                            {formatTime(timeLeft)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card px-2 md:px-4 py-1.5 md:py-2 border-2 border-accent pixel-border-outset minecraft-texture">
                      <div className="flex items-center gap-1.5 md:gap-2.5">
                        <div className="w-6 h-6 md:w-9 md:h-9 bg-accent pixel-border-outset flex items-center justify-center text-accent-foreground font-bold text-[10px] md:text-xs font-minecraft">
                          {opponent?.name?.[0]?.toUpperCase() ?? "OPP"}
                        </div>
                        <div className="flex gap-0.5 md:gap-1.5">
                          {questionData.map((q, i) => {
                            const oppSolved = opponentProgress[q.questionData.id] ?? false;
                            return (
                              <div
                                key={i}
                                className={`w-3 h-3 md:w-6 md:h-6 flex items-center justify-center transition-colors pixel-border-outset ${
                                  oppSolved ? "bg-accent/30" : "bg-muted"
                                }`}
                              >
                                {oppSolved ? (
                                  <svg
                                    className="w-2 h-2 md:w-4 md:h-4 text-accent"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Section - Order 2 (Mobile/Tablet) / Order 3 (Desktop) */}
              <div className="order-2 lg:order-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={finish}
                  disabled={finishing}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 transition-all border-2 border-destructive pixel-border-outset active:pixel-border-inset font-minecraft whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Give up
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      }
      questionPanel={{
        title: `Problem ${currentQIndex + 1}`,
        difficulty: currentQuestion?.questionData.difficulty || "Unknown",
        difficultyStyles: getDifficultyStyles(currentQuestion?.questionData.difficulty),
        navigation: questionData.length > 1 && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setCurrentQIndex((i) => (i > 0 ? i - 1 : questionData.length - 1))
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 transition-all border-2 border-border pixel-border-outset active:pixel-border-inset group"
            >
              <ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-semibold text-secondary-foreground">Prev</span>
            </motion.button>
            <div className="px-4 py-2.5 bg-accent/20 border-2 border-accent pixel-border-outset text-center min-w-[80px]">
              <span className="text-sm font-bold text-accent-foreground font-minecraft">
                {currentQIndex + 1} / {questionData.length}
              </span>
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentQIndex((i) => (i + 1) % questionData.length)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 transition-all border-2 border-border pixel-border-outset active:pixel-border-inset group"
            >
              <span className="text-sm font-semibold text-secondary-foreground">Next</span>
              <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </div>

        ),
        content: loadingQuestions ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-4/6 animate-pulse"></div>
          </div>
        ) : currentQuestion ? (
          <>
            <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
              <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                <AlertCircle className="w-4 h-4" />
                Problem Statement
              </h3>
              <p className="text-card-foreground leading-relaxed text-[15px]">
                {currentQuestion.questionData.question}
              </p>
            </div>

            <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
              <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                <Code2 className="w-4 h-4" />
                Sample Test Cases
              </h3>
              <div className="space-y-3">
                {currentQuestion.questionData.testcases.slice(0, 3).map((t: any, i: number) => (
                  <div key={i} className="bg-muted p-4 border-2 border-border pixel-border-inset">
                    <div className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide font-minecraft">
                      Test {i + 1}
                    </div>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex gap-3">
                        <span className="text-muted-foreground font-semibold min-w-[65px]">
                          Input:
                        </span>
                        <span className="text-accent-foreground font-medium">{t.input}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-muted-foreground font-semibold min-w-[65px]">
                          Output:
                        </span>
                        <span className="text-primary font-medium">{t.expected_output}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/20 p-5 border-2 border-accent pixel-border-outset minecraft-texture">
              <h3 className="text-xs font-bold text-accent-foreground mb-3 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                <Zap className="w-4 h-4" />
                Battle Rules
              </h3>
              <ul className="space-y-2.5 text-sm text-card-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 text-lg leading-none">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Speed Wins:</strong> Solve
                    faster to break ties
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 text-lg leading-none">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Accuracy Counts:</strong>{" "}
                    Wrong answers lose points
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 text-lg leading-none">•</span>
                  <span>
                    <strong className="text-foreground font-semibold">Fair Play:</strong> No
                    external help allowed
                  </span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-center">No question available</p>
        ),
      }}
      editorPanel={{
        language: selectedLang,
        setLanguage: setSelectedLang,
        code,
        setCode,
        onSubmit: handleSubmit,
        isLoading: loading,
        editorComponent: <CodeEditor code={code} setCode={setCode} language={selectedLang} />,
      }}
      resultsPanel={{
        submissionResult: curQuesSub?.result,
        status: loading ? "running" : "idle",
        details: curQuesSub?.details ?? [],
      }}
      footer={
        <ResultCard
          isOpen={visible}
          winnerId={winnerId}
          userId={session?.user?.id}
          onReturnHome={() => {
            hideResult();
            useMatchStore.getState().resetMatchData();
            router.replace("/");
          }}
        />
      }
    />
    </motion.div>
  );
};

export default App;