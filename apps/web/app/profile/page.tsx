"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  TrendingUp,
  Trophy,
  Target,
  Calendar,
  Flame,
  Activity,
  X,
  Search,
  Award,
  ChevronRight,
  Info,
  History,
  BarChart3,
  Brain,
  AlertCircle,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getProfileData } from "../actions/profile";

// --- TYPES ---
interface Match {
  id: string;
  opponent: string;
  result: "Win" | "Loss";
  date: string;
  score: string;
  ratingChange: number;
}

interface Achievement {
  id: string;
  title: string;
  icon: React.ReactNode;
  unlocked: boolean;
  description: string;
}

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Win" | "Loss">("All");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProfileData(session);
        if (data) setProfileData(data);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // --- HELPER FUNCTIONS ---
  const toggleTopic = (topic: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic);
    } else {
      newExpanded.add(topic);
    }
    setExpandedTopics(newExpanded);
  };

  // --- DERIVED STATE ---
  const stats = profileData?.stats || { rating: 1200, winRate: 0, wins: 0, losses: 0, winStreak: 0, bestRating: 1200 };
  const matches = (profileData?.matches || []) as Match[];
  const activity = profileData?.activity || [];
  const topicAnalysis = profileData?.topicAnalysis || {};
  
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchesSearch = m.opponent.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "All" || m.result === filter;
      return matchesSearch && matchesFilter;
    });
  }, [matches, searchQuery, filter]);

  const achievements: Achievement[] = [
    { id: "1", title: "Veteran", icon: <Award className="text-yellow-500" />, unlocked: stats.matchesPlayed > 50, description: "Played over 50 matches" },
    { id: "2", title: "Hot Streak", icon: <Flame className="text-orange-500" />, unlocked: stats.winStreak >= 3, description: "Won 3 matches in a row" },
    { id: "3", title: "Elite", icon: <Trophy className="text-blue-500" />, unlocked: stats.rating >= 1500, description: "Reached 1500+ rating" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-minecraft animate-pulse text-primary">Loading Player Data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-background text-foreground p-3 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-28 minecraft-texture selection:bg-primary/30"
    >
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Dashboard Button - Fixed Top Right */}
        <div className="fixed top-16 sm:top-20 right-3 sm:right-6 lg:right-8 z-40">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2 md:px-3 py-1.5 sm:py-1.5 md:py-2 pixel-border-outset bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs sm:text-xs md:text-sm flex-shrink-0"
          >
            <Home size={14} className="sm:w-4 sm:h-4 md:w-4 md:h-4" />
            <span className="hidden xs:inline sm:inline">Dashboard</span>
          </button>
        </div>
        
        {/* Page Heading */}
        <motion.div variants={itemVariants} className="text-center mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-minecraft text-primary tracking-tight pixel-border-outset bg-secondary/30 inline-block px-6 sm:px-8 py-3 sm:py-4">
            DSA ROUND ROBIN
          </h1>
        </motion.div>
        
        {/* --- 1. RESPONSIVE HERO SECTION --- */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden p-4 sm:p-6 lg:p-10 border-2 border-border bg-card/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy size={80} className="sm:w-[120px] sm:h-[120px]" />
            </div>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 lg:gap-8 relative z-10">
              <div className="space-y-2 sm:space-y-4">
                <div className="inline-block px-2 sm:px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-widest">
                  Pro League Member
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black font-minecraft text-primary tracking-tight leading-none break-words">
                  {profileData?.user.name || "Unknown Player"}
                </h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1 sm:gap-2 bg-secondary/50 px-2 sm:px-3 py-1 rounded-md">
                    <Calendar size={14} className="sm:w-4 sm:h-4" /> Joined 2025
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2 bg-secondary/50 px-2 sm:px-3 py-1 rounded-md">
                    <Activity size={14} className="sm:w-4 sm:h-4" /> {profileData?.user.activeDays} Active Days
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 bg-background/40 p-4 sm:p-6 rounded-2xl border-2 border-primary/20 shadow-inner w-full lg:w-auto">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Current Elo</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-minecraft text-primary">{stats.rating}</p>
                </div>
                <div className="h-10 sm:h-12 w-[2px] bg-border mx-1 sm:mx-2" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Global Peak</p>
                  <p className="text-xl sm:text-2xl font-bold font-minecraft text-accent">{stats.bestRating}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* --- 2. STATS GRID --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: "Matches", val: stats.matchesPlayed, icon: Target, color: "text-blue-500" },
            { label: "Victories", val: stats.wins, icon: Trophy, color: "text-yellow-500" },
            { label: "Defeats", val: stats.losses, icon: X, color: "text-red-500" },
            { label: "Win Rate", val: `${stats.winRate}%`, icon: TrendingUp, color: "text-green-500" },
            { label: "Win Streak", val: stats.winStreak, icon: Flame, color: "text-orange-500" },
          ].map((s, i) => (
            <Card key={i} className="p-3 sm:p-5 flex flex-col items-center justify-center border-2 border-border hover:border-primary/50 transition-all group">
              <div className={`p-2 sm:p-3 rounded-xl bg-secondary mb-2 sm:mb-3 group-hover:scale-110 transition-transform ${s.color}`}>
                <s.icon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-xl sm:text-2xl font-black font-minecraft">{s.val}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{s.label}</span>
            </Card>
          ))}
        </motion.div>

        {/* --- ANALYSIS BUTTON --- */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <button
            onClick={() => setShowAnalysis(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-secondary text-secondary-foreground font-minecraft font-bold pixel-border-outset hover:brightness-110 transition-all text-sm sm:text-base"
          >
            <Brain size={20} className="sm:w-6 sm:h-6" />
            <span>View Performance Analysis</span>
            <BarChart3 size={20} className="sm:w-6 sm:h-6" />
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* --- 3. ACTIVITY & ACHIEVEMENTS (LEFT) --- */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <motion.div variants={itemVariants}>
              <Card className="p-4 sm:p-6 border-2 border-border">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-xl font-bold font-minecraft flex items-center gap-2">
                    <Activity className="text-primary w-5 h-5 sm:w-6 sm:h-6" /> Performance Trend
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase">
                      <div className="w-2 h-2 bg-accent rounded-full" /> Normal
                    </div>
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full" /> Peak
                    </div>
                  </div>
                </div>
                
                <div className="h-40 sm:h-48 flex items-end gap-1 sm:gap-2 px-1 sm:px-2 border-b-2 border-border pb-2">
                  {activity.map((day: any, i: number) => (
                    <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.count / (Math.max(...activity.map((a:any)=>a.count)) || 1)) * 100}%` }}
                        className={`w-full rounded-t-md transition-all ${i === activity.length -1 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "bg-accent/40 group-hover:bg-accent"}`}
                      />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {day.date}: {day.count} matches
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[9px] sm:text-[10px] font-minecraft text-muted-foreground uppercase tracking-widest">
                  <span>Past 30 Days</span>
                  <span>Today</span>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {achievements.map((ach) => (
                <Card key={ach.id} className={`p-3 sm:p-4 border-2 flex flex-col items-center text-center gap-2 ${!ach.unlocked && "opacity-40 grayscale"}`}>
                  <div className="p-2 sm:p-3 bg-secondary rounded-full">{ach.icon}</div>
                  <p className="font-minecraft text-xs sm:text-sm">{ach.title}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">{ach.description}</p>
                </Card>
              ))}
            </motion.div>
          </div>

          {/* --- 4. MATCH HISTORY (RIGHT) --- */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="h-full flex flex-col border-2 border-border overflow-hidden">
              <div className="p-4 sm:p-6 border-b-2 border-border space-y-3 sm:space-y-4 bg-muted/30">
                <h3 className="text-base sm:text-xl font-bold font-minecraft flex items-center gap-2">
                  <History className="text-primary w-5 h-5 sm:w-6 sm:h-6" /> Match Log
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Opponent..."
                    className="w-full bg-background border-2 border-border rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Win", "Loss"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`flex-1 py-1 text-[10px] sm:text-[11px] font-minecraft border-2 rounded transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary border-transparent"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px] sm:max-h-[500px] p-3 sm:p-4 space-y-2 sm:space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredMatches.map((m) => (
                    <motion.div
                      layout
                      key={m.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-3 sm:p-4 border-2 rounded-xl flex justify-between items-center group cursor-default transition-all ${m.result === "Win" ? "border-primary/20 bg-primary/5 hover:border-primary/40" : "border-destructive/20 bg-destructive/5 hover:border-destructive/40"}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] sm:text-[10px] font-black font-minecraft px-1.5 rounded ${m.result === "Win" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
                            {m.result[0]}
                          </span>
                          <span className="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors truncate">vs {m.opponent}</span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter">
                          <Calendar size={10} /> {m.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-xs sm:text-sm tracking-tighter">{m.score}</p>
                        <p className={`text-[9px] sm:text-[10px] font-bold ${m.ratingChange >= 0 ? "text-primary" : "text-destructive"}`}>
                          {m.ratingChange >= 0 ? `+${m.ratingChange}` : m.ratingChange} LP
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredMatches.length === 0 && (
                  <div className="py-16 sm:py-20 text-center text-muted-foreground font-minecraft italic opacity-50 text-xs sm:text-sm">
                    No records found
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* --- ANALYSIS POPUP --- */}
        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
              onClick={() => setShowAnalysis(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border-2 border-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="bg-secondary border-b-2 border-border p-4 sm:p-6 flex justify-between items-center">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Brain className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-minecraft text-foreground">
                      Performance Analysis
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="text-foreground w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
                  {Object.keys(topicAnalysis).length === 0 ? (
                    <div className="py-16 sm:py-20 text-center">
                      <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-base sm:text-lg font-minecraft text-muted-foreground">
                        No performance data available yet
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        Complete some matches to see your topic-wise analysis
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {Object.entries(topicAnalysis).map(([topic, data]: [string, any]) => (
                        <Card key={topic} className="border-2 border-border overflow-hidden">
                          <div
                            className="p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                            onClick={() => toggleTopic(topic)}
                          >
                            <div className="flex justify-between items-center gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-base sm:text-lg font-bold font-minecraft truncate">
                                    {topic}
                                  </h3>
                                  {expandedTopics.has(topic) ? (
                                    <ChevronUp size={18} className="flex-shrink-0" />
                                  ) : (
                                    <ChevronDown size={18} className="flex-shrink-0" />
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1">
                                    <Target size={14} className="text-blue-500 flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">Total: {data.total}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Trophy size={14} className="text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">Passed: {data.passed}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">Failed: {data.failed}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp size={14} className="text-primary flex-shrink-0" />
                                    <span className="font-bold text-primary truncate">{data.successRate}%</span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3 h-2 sm:h-3 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-500"
                                    style={{ width: `${data.successRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content - Failed Questions */}
                          <AnimatePresence>
                            {expandedTopics.has(topic) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t-2 border-border bg-muted/30"
                              >
                                <div className="p-3 sm:p-4">
                                  {data.failedQuestions.length === 0 ? (
                                    <div className="py-6 sm:py-8 text-center">
                                      <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2" />
                                      <p className="text-xs sm:text-sm font-minecraft text-green-500">
                                        Perfect! No failed questions in this topic
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <h4 className="text-xs sm:text-sm font-bold mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-500" />
                                        Questions You Struggled With ({data.failedQuestions.length})
                                      </h4>
                                      <div className="space-y-2">
                                        {data.failedQuestions.map((q: any, idx: number) => (
                                          <div
                                            key={q.id}
                                            className="p-2 sm:p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                                          >
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                              <p className="text-xs sm:text-sm font-medium flex-1 line-clamp-2">
                                                {idx + 1}. {q.question}
                                              </p>
                                              <span
                                                className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                  q.difficulty === "Easy"
                                                    ? "bg-green-500/20 text-green-500"
                                                    : q.difficulty === "Medium"
                                                    ? "bg-yellow-500/20 text-yellow-500"
                                                    : "bg-red-500/20 text-red-500"
                                                }`}
                                              >
                                                {q.difficulty}
                                              </span>
                                            </div>
                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                                              Failed attempts: {q.attempts}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}