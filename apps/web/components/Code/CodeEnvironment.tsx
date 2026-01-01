"use client";

import React, { useRef, useState } from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { ChevronDown, ChevronUp, Code2, Play, RefreshCw } from "lucide-react";
import { InlineSpinner } from "@/components/ui/spinner";

interface CodeEnvironmentProps {
  header: React.ReactNode;
  questionPanel: {
    title: string;
    difficulty: string;
    difficultyStyles: {
      bg: string;
      border: string;
      text: string;
    };
    navigation?: React.ReactNode;
    content: React.ReactNode;
  };
  editorPanel: {
    language: string;
    setLanguage: (lang: string) => void;
    code: string;
    setCode: (code: string) => void;
    onRun?: () => void; // Optional if you want a separate run button
    onSubmit: () => void;
    isLoading?: boolean;
    onReset?: () => void;
    editorComponent: React.ReactNode;
  };
  resultsPanel: {
    submissionResult: any;
    status: "idle" | "running" | "complete";
    details: any[];
  };
  footer?: React.ReactNode;
}

export const CodeEnvironment: React.FC<CodeEnvironmentProps> = ({
  header,
  questionPanel,
  editorPanel,
  resultsPanel,
  footer,
}) => {
  const resultPanelRef = useRef<ImperativePanelHandle>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"problem" | "code">("problem");

  const toggleResultPanel = () => {
    if (resultPanelRef.current) {
      if (isResultCollapsed) {
        resultPanelRef.current.expand();
      } else {
        resultPanelRef.current.collapse();
      }
    }
  };

  const ResultHeader = () => (
    <div
      className="h-12 bg-card flex items-center justify-between px-4 md:px-6 border-b-2 border-border minecraft-texture"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 w-full">
        {resultsPanel.submissionResult ? (
          resultsPanel.submissionResult.passed ? (
            <div className="w-8 h-8 bg-primary/20 pixel-border-outset flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 bg-destructive/20 pixel-border-outset flex items-center justify-center">
              <svg
                className="w-5 h-5 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
            {resultsPanel.status === "running"
              ? "Running..."
              : resultsPanel.submissionResult
                ? resultsPanel.submissionResult.passed
                  ? "All Tests Passed!"
                  : `${resultsPanel.submissionResult.passedCount}/${resultsPanel.submissionResult.total} Passed`
                : "No results yet"}
          </p>
          {resultsPanel.submissionResult && (
            <p className="text-xs text-muted-foreground">
              {resultsPanel.submissionResult.timeMs}ms
            </p>
          )}
        </div>
        <button
          className="p-1 hover:bg-accent/50 transition-colors pixel-border-outset active:pixel-border-inset"
          onClick={toggleResultPanel}
        >
          {isResultCollapsed ? (
            <ChevronUp className="w-4 h-4 text-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-foreground" />
          )}
        </button>
      </div>
    </div>
  );

  const QuestionContent = (
    <div className="h-full flex flex-col border-r-2 border-border bg-card minecraft-texture w-full">
      <div className="px-4 md:px-5 py-3 md:py-4 border-b-2 border-border bg-card/50">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h2 className="text-base md:text-lg font-bold text-foreground font-minecraft">
              {questionPanel.title}
            </h2>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${questionPanel.difficultyStyles.bg} ${questionPanel.difficultyStyles.border} ${questionPanel.difficultyStyles.text} uppercase tracking-wide`}
          >
            {questionPanel.difficulty}
          </div>
        </div>
        {questionPanel.navigation}
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {questionPanel.content}
      </div>
    </div>
  );

  const EditorContent = (
    <div className="h-full flex flex-col w-full">
      <PanelGroup direction="vertical">
        <Panel defaultSize={70} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3.5 border-b-2 border-border bg-card/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse pixel-border-outset"></div>
                <h2 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider font-minecraft">
                  Code Editor
                </h2>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {editorPanel.onReset && (
                  <button
                    onClick={editorPanel.onReset}
                    className="p-1.5 md:p-2 bg-secondary hover:bg-secondary/80 transition-all border-2 border-border pixel-border-outset active:pixel-border-inset text-muted-foreground hover:text-foreground"
                    title="Reset Code"
                  >
                    <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                )}
                <select
                  className="bg-secondary text-secondary-foreground border-2 border-border px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer pixel-border-inset font-minecraft"
                  value={editorPanel.language}
                  onChange={(e) => editorPanel.setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={editorPanel.onSubmit}
                  disabled={editorPanel.isLoading}
                  className="px-3 md:px-5 py-1.5 md:py-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 text-xs md:text-sm pixel-border-outset active:pixel-border-inset font-minecraft whitespace-nowrap"
                >
                  {editorPanel.isLoading ? (
                    <>
                      <InlineSpinner />
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
              {editorPanel.editorComponent}
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
              {resultsPanel.status === "running" && !resultsPanel.submissionResult ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-pulse">
                  <InlineSpinner className="w-10 h-10 mb-4" />
                  <p className="text-muted-foreground font-minecraft">
                    Evaluating your code...
                  </p>
                </div>
              ) : resultsPanel.submissionResult ? (
                <>
                  <div className="bg-card p-4 md:p-5 border-2 border-border pixel-border-outset minecraft-texture">
                    <div className="flex items-center gap-4 flex-wrap">
                      {resultsPanel.submissionResult.passed ? (
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary pixel-border-outset flex items-center justify-center">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-destructive pixel-border-outset flex items-center justify-center">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-destructive-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-lg md:text-xl font-black font-minecraft ${resultsPanel.submissionResult.passed ? "text-primary" : "text-destructive"} mb-1`}
                        >
                          {resultsPanel.submissionResult.passed
                            ? "Perfect! All Tests Passed!"
                            : `${resultsPanel.submissionResult.passedCount}/${resultsPanel.submissionResult.total} Tests Passed`}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Execution time:{" "}
                          <span className="text-foreground font-bold">
                            {resultsPanel.submissionResult.timeMs}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {resultsPanel.details.map((r, i) => (
                      <div
                        key={i}
                        className={`p-4 border-2 backdrop-blur-sm minecraft-texture pixel-border-outset ${
                          r.passed
                            ? "bg-primary/5 border-primary/30"
                            : "bg-destructive/5 border-destructive/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-minecraft">
                            Test Case {i + 1}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-1 pixel-border-outset font-minecraft ${r.passed ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}
                          >
                            {r.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                        <div className="space-y-2 font-mono text-xs md:text-sm">
                          <div className="flex gap-3 flex-wrap">
                            <span className="text-muted-foreground font-semibold min-w-[70px]">
                              Input:
                            </span>
                            <span className="text-accent-foreground font-medium break-all">
                              {r.input}
                            </span>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <span className="text-muted-foreground font-semibold min-w-[70px]">
                              Expected:
                            </span>
                            <span className="text-primary font-medium break-all">
                              {r.expected}
                            </span>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <span className="text-muted-foreground font-semibold min-w-[70px]">
                              Output:
                            </span>
                            <span
                              className={`font-medium break-all ${r.passed ? "text-primary" : "text-destructive"}`}
                            >
                              {r.output}
                            </span>
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
                  <p className="text-muted-foreground text-sm font-medium font-minecraft">
                    Submit your code to see test results
                  </p>
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
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden minecraft-texture">
      {header}

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b-2 border-border bg-card">
        <button
          onClick={() => setActiveTab("problem")}
          className={`flex-1 py-3 text-sm font-bold font-minecraft transition-colors ${
            activeTab === "problem"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          Problem
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 py-3 text-sm font-bold font-minecraft transition-colors ${
            activeTab === "code"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          Code
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Mobile View */}
        <div className="md:hidden w-full h-full">
          {activeTab === "problem" ? QuestionContent : EditorContent}
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex w-full h-full">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} minSize={20}>
              {QuestionContent}
            </Panel>

            <PanelResizeHandle className="bg-slate-800 w-1 hover:bg-violet-500 transition-colors" />

            <Panel defaultSize={60} minSize={30}>
              {EditorContent}
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {footer}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #0f172a;
        }
      `}</style>
    </div>
  );
};
