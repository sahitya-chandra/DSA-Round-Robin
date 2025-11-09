"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Assuming Card is a styled component, like from shadcn/ui
import { Card } from "@/components/ui/card"; 
import { authClient } from "@repo/auth";
import {
  TrendingUp,
  Trophy,
  Target,
  Calendar,
  Flame,
  Activity,
  X,
} from "lucide-react";

// --- TYPE DEFINITIONS ---
interface Match {
  id: string;
  opponent: string;
  result: "Win" | "Loss";
  date: string;
  score: string;
  ratingChange: number;
}

// Helper: DUMMY DATA GENERATOR (Generates 12 weeks of data)
const generateActivityData = (days: number) => {
  const today = new Date();
  const data = Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i)); 
    // Random activity count (0 to 4), similar to previous heatmap
    const count = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
    return { date: date.toISOString().split("T")[0] || '', count };
  });
  return data;
};

// Animation Variants for bars
const barVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: (i: number) => ({
    height: "100%",
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: i * 0.02,
    },
  }),
};

// --- MAIN COMPONENT ---
export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const username = user?.name || "Player";

  const stats = useMemo(() => ({
    matchesPlayed: 42,
    wins: 27,
    losses: 15,
    rating: 1420,
    winStreak: 3,
    bestRating: 1487,
  }), []);

  const [matches] = useState<Match[]>([
    { id: "1", opponent: "Alice", result: "Win", date: "Nov 9, 2025", score: "2-1", ratingChange: 10 },
    { id: "2", opponent: "Bob", result: "Loss", date: "Nov 8, 2025", score: "1-3", ratingChange: -9 },
    { id: "3", opponent: "Charlie", result: "Win", date: "Nov 7, 2025", score: "3-0", ratingChange: 14 },
    { id: "4", opponent: "David", result: "Loss", date: "Nov 6, 2025", score: "0-2", ratingChange: -12 },
  ]);

  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const totalDays = 84; 

  useEffect(() => {
    setActivity(generateActivityData(totalDays));
  }, []);

  const activeDays = activity.filter((d) => d.count > 0).length;
  const totalMatches = activity.reduce((sum, d) => sum + d.count, 0);
  const winRate = Math.round((stats.wins / stats.matchesPlayed) * 100);

  const maxCount = useMemo(() => Math.max(...activity.map((d) => d.count), 0), [activity]);

  // --- RENDER HELPERS ---

  const ProfileHeader = () => (
    <Card className="p-6 sm:p-8 bg-slate-900/60 border border-violet-600/30 rounded-3xl backdrop-blur-xl shadow-[0_0_20px_5px_rgba(124,58,237,0.15)]">
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div>
          <motion.h1 
            className="text-5xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {username}
          </motion.h1>
          <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
            <Calendar size={16} className="text-violet-400" aria-hidden="true" />
            Player since 2025 • {activeDays} active days
          </p>
          <div className="flex gap-4 mt-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy size={14} className="text-violet-400" aria-hidden="true" />
              <span aria-label={`Current rating ${stats.rating}`}>{stats.rating} rating</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size= {14} className="text-fuchsia-400" aria-hidden="true" />
              <span aria-label={`Win rate ${winRate} percent`}>{winRate}% win rate</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">Current Rating</p>
          <div className="flex items-center justify-end gap-3 mt-1">
            <Trophy size={28} className="text-violet-400" aria-hidden="true" />
            <motion.span 
              className="text-5xl font-black bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              {stats.rating}
            </motion.span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Peak: <span className="text-fuchsia-300">{stats.bestRating}</span>
          </p>
        </div>
      </div>
    </Card>
  );

  const QuickStats = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" role="list">
      {[
        { label: "Matches", value: stats.matchesPlayed, icon: Target },
        { label: "Wins", value: stats.wins, icon: Trophy, color: "text-violet-400" },
        { label: "Losses", value: stats.losses, icon: X, color: "text-fuchsia-400" },
        { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-fuchsia-400" },
        { label: "Streak", value: stats.winStreak, icon: Flame, color: "text-violet-400" },
      ].map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className="bg-slate-900/60 border border-slate-700/50 rounded-2xl text-center py-5 transition-all duration-200 hover:bg-slate-800/80 hover:border-violet-500/50 hover:shadow-lg"
            role="listitem"
            aria-label={`${s.label}: ${s.value}`}
          >
            <Icon className={`mx-auto mb-2 ${s.color || "text-violet-400"}`} size={22} aria-hidden="true" />
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{s.label}</p>
          </Card>
        );
      })}
    </div>
  );
  
  // Improved Component: Activity Bar Graph (Line Chart Simulation)
  const ActivityBarGraph = () => {
    return (
      <Card className="bg-slate-900/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-lg">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-fuchsia-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Daily Match Activity Trend</h2>
          </div>
          <span className="text-sm text-slate-400">{totalMatches} total matches</span>
        </header>

        {/* Graph Area */}
        <div 
          className="h-40 flex items-end overflow-x-auto overflow-y-hidden pb-4 border-b border-slate-700 relative"
          role="img"
          aria-label="Bar graph showing daily match activity over the last 84 days"
        >
          {/* Y-Axis Labels */}
          <div className="absolute left-0 bottom-0 top-0 w-8 text-xs text-slate-500 flex flex-col justify-between pt-1 pb-2 pointer-events-none">
            <span className="text-right pr-1">{maxCount}</span>
            <span className="text-right pr-1 text-center">{Math.floor(maxCount / 2)}</span>
            <span className="text-right pr-1">0</span>
          </div>

          {/* Graph Bars */}
          <div className="flex gap-1 pl-8 h-full flex-grow">
            <AnimatePresence>
              {activity.map((day, index) => {
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const isToday = index === activity.length - 1;
                const date = new Date(day.date);
                const title = `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${day.count} match${day.count !== 1 ? "es" : ""}`;

                return (
                  <motion.div 
                    key={index} 
                    className="flex flex-col justify-end w-1.5 h-full relative"
                    initial="hidden"
                    animate="visible"
                    variants={barVariants}
                    custom={index}
                    whileHover={{ scaleY: 1.2 }}
                    title={title}
                    aria-label={title}
                  >
                    <motion.div 
                      className={`w-full rounded-t shadow-md ${
                        isToday 
                          ? 'bg-fuchsia-400' 
                          : 'bg-violet-700/80'
                      }`}
                      style={{ height: `${height}%` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 right-0 pb-1 text-xs text-fuchsia-400 whitespace-nowrap transform -translate-y-0.5 pointer-events-none">
            Today
          </div>
        </div>
      </Card>
    );
  };

  const RecentMatches = () => (
    <Card className="bg-slate-900/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Recent Matches</h2>
      <div className="flex flex-col gap-3" role="list">
        {matches.map((m) => {
          const isWin = m.result === "Win";
          return (
            <div
              key={m.id}
              className={`flex justify-between items-center px-5 py-4 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                isWin
                  ? "border-violet-500/40 bg-violet-900/10 hover:border-violet-300/60"
                  : "border-fuchsia-500/40 bg-fuchsia-900/10 hover:border-fuchsia-300/60"
              }`}
              role="listitem"
            >
              <div>
                <p className="font-semibold text-lg">
                  vs{" "}
                  <span className={isWin ? "text-violet-400" : "text-fuchsia-400"}>
                    {m.opponent}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={12} aria-hidden="true" /> {m.date}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${isWin ? "text-violet-400" : "text-fuchsia-400"}`}
                >
                  {m.result}
                </p>
                <p className="font-mono text-white mt-1">
                  {m.score}
                  <span className={`text-xs ml-2 ${isWin ? "text-violet-400" : "text-fuchsia-400"}`}>
                    {m.ratingChange > 0 ? `+${m.ratingChange}` : m.ratingChange}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <ProfileHeader />
        <QuickStats />
        <ActivityBarGraph /> 
        <RecentMatches />
      </div>
    </div>
  );
}