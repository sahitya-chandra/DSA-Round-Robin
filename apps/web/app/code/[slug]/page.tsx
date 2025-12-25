"use client";

import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "@/components/editor/editor";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@repo/auth";
import { useMatchStore } from "@/store/matchStore";
import { useMatchResultStore } from "@/store/matchResultStore";
import { Loader2, Play, ChevronDown, Code2, Clock, Zap, AlertCircle, Trophy, ChevronUp } from "lucide-react";
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useSubmissionsStore } from "@/store/submissionStore";
import { useMatchProgressStore } from "@/store/matchProgressStore";
import { useSocket } from "@/hooks/useSocket";

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
  const resultPanelRef = useRef<ImperativePanelHandle>(null);

  const [isResultCollapsed, setIsResultCollapsed] = useState(false);
  
  const isHeaderLoading = !hydrated || loadingQuestions;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(false)
  }, [submissions])

  useEffect(() => {
    if (!hydrated || questions.length === 0) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/match/getmatch/${params.slug}`, {
          credentials: "include",
        });
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (data.error) {
          router.push("/");
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

  const ResultHeader = () => (
    <div 
      className="h-12 bg-card flex items-center justify-between px-4 md:px-6 border-b-2 border-border minecraft-texture"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 w-full">
        {curQuesSub ? (
          curQuesSub.result.passed ? (
            <div className="w-8 h-8 bg-primary/20 pixel-border-outset flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 bg-destructive/20 pixel-border-outset flex items-center justify-center">
              <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )
        ) : (
          <div className="w-8 h-8 bg-muted pixel-border-inset flex items-center justify-center">
            <Code2 className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground font-minecraft truncate">
            {curQuesSub
              ? curQuesSub.result.passed
                ? "All Tests Passed!"
                : `${curQuesSub.result.passedCount}/${curQuesSub.result.total} Passed`
              : "No results yet"}
          </p>
          {curQuesSub && <p className="text-xs text-muted-foreground">{curQuesSub.result.timeMs}ms</p>}
        </div>
        <button 
          className="p-1 hover:bg-accent/50 transition-colors pixel-border-outset active:pixel-border-inset"
          onClick={() => {
            const panel = resultPanelRef.current;
            if (panel) {
              if (isResultCollapsed) {
                panel.expand();
              } else {
                panel.collapse();
              }
            }
          }}
        >
          {isResultCollapsed ? <ChevronUp className="w-4 h-4 text-foreground" /> : <ChevronDown className="w-4 h-4 text-foreground" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden minecraft-texture">
      {/* Battle Header */}
      <div className="relative bg-card border-b-2 border-border minecraft-texture">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        <div className="relative px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3 md:gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Zap className="w-4 h-4 text-white" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-black text-foreground tracking-tight font-minecraft">DSA RR</h1>
                <p className="text-[10px] text-muted-foreground font-medium">1v1 Battle Mode</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center min-w-0">
              {isHeaderLoading ? (
                <>
                  {/* YOU Skeleton */}
                  <div className="bg-card/50 px-3 md:px-4 py-2 border-2 border-border w-[100px] md:w-[140px] h-[50px] md:h-[54px] animate-pulse flex items-center gap-2 md:gap-3 pixel-border-outset">
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-muted pixel-border-inset" />
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-4 h-4 md:w-6 md:h-6 bg-muted pixel-border-inset" />
                      ))}
                    </div>
                  </div>

                  {/* Timer Skeleton */}
                  <div className="bg-card/50 p-[2px] w-[90px] md:w-[110px] h-[46px] md:h-[50px] animate-pulse pixel-border-outset">
                    <div className="h-full bg-card pixel-border-inset flex items-center justify-center">
                      <div className="w-16 md:w-20 h-5 md:h-6 bg-muted" />
                    </div>
                  </div>

                  {/* OPPONENT Skeleton */}
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
                  {/* ----- YOU ----- */}
                  <div className="bg-card px-3 md:px-4 py-2 border-2 border-primary pixel-border-outset minecraft-texture">
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold text-[10px] md:text-xs font-minecraft">
                        YOU
                      </div>

                      <div className="flex gap-1 md:gap-1.5">
                        {questionData.map((q, i) => {
                          const solved = myProgress[q.questionData.id] ?? false
                          return (
                            <div
                              key={i}
                              className={`w-4 h-4 md:w-6 md:h-6 flex items-center justify-center transition-colors pixel-border-outset ${
                                solved ? "bg-primary/30" : "bg-muted"
                              }`}
                            >
                              {solved ? (
                                <svg className="w-3 h-3 md:w-4 md:h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <div className="w-2 h-2 md:w-3 md:h-3 bg-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-destructive p-[2px] shadow-lg pixel-border-outset">
                    <div className="bg-card px-3 md:px-5 py-2 pixel-border-inset">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Clock className={`w-3 h-3 md:w-3.5 md:h-3.5 ${timerColor}`} />
                        <div className={`text-lg md:text-2xl font-black font-mono ${timerColor} tracking-wider font-minecraft`}>
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ----- OPPONENT ----- */}
                  <div className="bg-card px-3 md:px-4 py-2 border-2 border-accent pixel-border-outset minecraft-texture">
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className="w-7 h-7 md:w-9 md:h-9 bg-accent pixel-border-outset flex items-center justify-center text-accent-foreground font-bold text-[10px] md:text-xs font-minecraft">
                        {opponent?.name?.[0]?.toUpperCase() ?? "OPP"}
                      </div>

                      <div className="flex gap-1 md:gap-1.5">
                        {questionData.map((q, i) => {
                          const oppSolved = opponentProgress[q.questionData.id] ?? false;
                          return (
                            <div
                              key={i}
                              className={`w-4 h-4 md:w-6 md:h-6 flex items-center justify-center transition-colors pixel-border-outset ${
                                oppSolved ? "bg-accent/30" : "bg-muted"
                              }`}
                            >
                              {oppSolved ? (
                                <svg className="w-3 h-3 md:w-4 md:h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <div className="w-2 h-2 md:w-3 md:h-3 bg-muted-foreground" />
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

            <button
              onClick={finish}
              className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 transition-all border-2 border-destructive pixel-border-outset active:pixel-border-inset font-minecraft whitespace-nowrap"
            >
              Give up
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col border-r-2 border-border bg-card minecraft-texture">
              <div className="px-4 md:px-5 py-3 md:py-4 border-b-2 border-border bg-card/50">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <h2 className="text-base md:text-lg font-bold text-foreground font-minecraft">Problem {currentQIndex + 1}</h2>
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 transition-all border-2 border-border pixel-border-outset active:pixel-border-inset group"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-sm font-semibold text-secondary-foreground">Prev</span>
                    </button>
                    <div className="px-4 py-2.5 bg-accent/20 border-2 border-accent pixel-border-outset text-center min-w-[80px]">
                      <span className="text-sm font-bold text-accent-foreground font-minecraft">{currentQIndex + 1} / {questionData.length}</span>
                    </div>
                    <button
                      onClick={() => setCurrentQIndex((i) => (i + 1) % questionData.length)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 transition-all border-2 border-border pixel-border-outset active:pixel-border-inset group"
                    >
                      <span className="text-sm font-semibold text-secondary-foreground">Next</span>
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
                    <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
                      <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                        <AlertCircle className="w-4 h-4" />
                        Problem Statement
                      </h3>
                      <p className="text-card-foreground leading-relaxed text-[15px]">{currentQuestion.questionData.question}</p>
                    </div>

                    <div className="bg-card p-5 border-2 border-border pixel-border-outset minecraft-texture">
                      <h3 className="text-xs font-bold text-primary mb-4 uppercase tracking-wider flex items-center gap-2 font-minecraft">
                        <Code2 className="w-4 h-4" />
                        Sample Test Cases
                      </h3>
                      <div className="space-y-3">
                        {currentQuestion.questionData.testcases.slice(0, 3).map((t: any, i: number) => (
                          <div key={i} className="bg-muted p-4 border-2 border-border pixel-border-inset">
                            <div className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wide font-minecraft">Test {i + 1}</div>
                            <div className="space-y-2 font-mono text-sm">
                              <div className="flex gap-3">
                                <span className="text-muted-foreground font-semibold min-w-[65px]">Input:</span>
                                <span className="text-accent-foreground font-medium">{t.input}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-muted-foreground font-semibold min-w-[65px]">Output:</span>
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
                          <span><strong className="text-foreground font-semibold">Speed Wins:</strong> Solve faster to break ties</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-primary mt-1 text-lg leading-none">•</span>
                          <span><strong className="text-foreground font-semibold">Accuracy Counts:</strong> Wrong answers lose points</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-primary mt-1 text-lg leading-none">•</span>
                          <span><strong className="text-foreground font-semibold">Fair Play:</strong> No external help allowed</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-center">No question available</p>
                )}
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="bg-slate-800 w-1 hover:bg-violet-500 transition-colors" />
          
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col" ref={containerRef}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={70} minSize={20}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3.5 border-b-2 border-border bg-card/50 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary animate-pulse pixel-border-outset"></div>
                        <h2 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider font-minecraft">Code Editor</h2>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <select
                          className="bg-secondary text-secondary-foreground border-2 border-border px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pixel-border-inset font-minecraft"
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
                          className="px-3 md:px-5 py-1.5 md:py-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 text-xs md:text-sm pixel-border-outset active:pixel-border-inset font-minecraft whitespace-nowrap"
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

                    <div className="flex-1 min-h-0 overflow-hidden">
                      <CodeEditor code={code} setCode={setCode} language={selectedLang} />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 w-full cursor-row-resize bg-slate-800 hover:bg-violet-500 transition-colors" />

                <Panel 
                  ref={resultPanelRef}
                  collapsible={true}
                  defaultSize={30} 
                  minSize={20}
                  onCollapse={() => setIsResultCollapsed(true)}
                  onExpand={() => setIsResultCollapsed(false)}
                  className={isResultCollapsed ? "hidden" : ""}
                >
                  <div className="h-full flex flex-col bg-card minecraft-texture">
                    <ResultHeader />
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 custom-scrollbar">
                      {curQuesSub ? (
                        <>
                          <div className="bg-card p-4 md:p-5 border-2 border-border pixel-border-outset minecraft-texture">
                            <div className="flex items-center gap-4 flex-wrap">
                              {curQuesSub.result.passed ? (
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-primary pixel-border-outset flex items-center justify-center">
                                  <svg className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-destructive pixel-border-outset flex items-center justify-center">
                                  <svg className="w-6 h-6 md:w-8 md:h-8 text-destructive-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={`text-lg md:text-xl font-black font-minecraft ${curQuesSub.result.passed ? "text-primary" : "text-destructive"} mb-1`}>
                                  {curQuesSub.result.passed ? "Perfect! All Tests Passed!" : `${curQuesSub.result.passedCount}/${curQuesSub.result.total} Tests Passed`}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                  Execution time: <span className="text-foreground font-bold">{curQuesSub.result.timeMs}ms</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {curQuesSub.details.map((r, i) => (
                              <div
                                key={i}
                                className={`p-4 border-2 backdrop-blur-sm minecraft-texture pixel-border-outset ${
                                  r.passed ? "bg-primary/5 border-primary/30" : "bg-destructive/5 border-destructive/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-minecraft">Test Case {i + 1}</span>
                                  <span className={`text-xs font-black px-2.5 py-1 pixel-border-outset font-minecraft ${r.passed ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                                    {r.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>
                                <div className="space-y-2 font-mono text-xs md:text-sm">
                                  <div className="flex gap-3 flex-wrap">
                                    <span className="text-muted-foreground font-semibold min-w-[70px]">Input:</span>
                                    <span className="text-accent-foreground font-medium break-all">{r.input}</span>
                                  </div>
                                  <div className="flex gap-3 flex-wrap">
                                    <span className="text-muted-foreground font-semibold min-w-[70px]">Expected:</span>
                                    <span className="text-primary font-medium break-all">{r.expected}</span>
                                  </div>
                                  <div className="flex gap-3 flex-wrap">
                                    <span className="text-muted-foreground font-semibold min-w-[70px]">Output:</span>
                                    <span className={`font-medium break-all ${r.passed ? "text-primary" : "text-destructive"}`}>{r.output}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted pixel-border-inset flex items-center justify-center mb-4">
                            <Code2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground text-sm font-medium font-minecraft">Submit your code to see test results</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
              {isResultCollapsed && (
                <div className="border-t-2 border-border">
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
      `}</style>
      {visible && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 minecraft-texture">
          <div className="bg-card border-2 border-border p-6 md:p-8 w-full max-w-md text-center shadow-2xl minecraft-texture pixel-border-outset">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`w-16 h-16 md:w-20 md:h-20 pixel-border-outset flex items-center justify-center shadow-lg ${
                winnerId === session?.user.id
                  ? "bg-primary"
                  : winnerId
                  ? "bg-destructive"
                  : "bg-muted"
              }`}>
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-card-foreground mb-2 font-minecraft">
                  {winnerId === session?.user.id
                    ? "🏆 You Won!"
                    : winnerId
                    ? "😞 You Lost!"
                    : "🤝 It's a Draw!"}
                </h2>
                <p className="text-muted-foreground text-sm font-medium">
                  {winnerId ? "Good game!" : "Both players performed equally well."}
                </p>
              </div>

              <button
                onClick={() => {
                  hideResult();
                  router.push("/");
                }}
                className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-semibold shadow-md transition-all pixel-border-outset active:pixel-border-inset hover:brightness-110 font-minecraft"
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