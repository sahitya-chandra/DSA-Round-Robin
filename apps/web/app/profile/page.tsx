"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, easeOut } from "framer-motion";
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

// --- ACTIVITY DATA GENERATOR ---
const generateActivityData = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    const count = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
    return { date: date.toISOString().split("T")[0] || "", count };
  });
};

// --- BAR VARIANTS (FIXED ease) ---
const barVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: (i: number) => ({
    height: "100%",
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easeOut,
      delay: i * 0.02,
    },
  }),
};

// --- MAIN COMPONENT ---
export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const username = session?.user?.name || "Player";

  const stats = useMemo(
    () => ({
      matchesPlayed: 42,
      wins: 27,
      losses: 15,
      rating: 1420,
      winStreak: 3,
      bestRating: 1487,
    }),
    []
  );

  const [matches] = useState<Match[]>([
    { id: "1", opponent: "Alice", result: "Win", date: "Nov 9, 2025", score: "2-1", ratingChange: 10 },
    { id: "2", opponent: "Bob", result: "Loss", date: "Nov 8, 2025", score: "1-3", ratingChange: -9 },
    { id: "3", opponent: "Charlie", result: "Win", date: "Nov 7, 2025", score: "3-0", ratingChange: 14 },
    { id: "4", opponent: "David", result: "Loss", date: "Nov 6, 2025", score: "0-2", ratingChange: -12 },
  ]);

  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const totalDays = 84;

  useEffect(() => setActivity(generateActivityData(totalDays)), []);

  const activeDays = activity.filter((d) => d.count > 0).length;
  const totalMatches = activity.reduce((sum, d) => sum + d.count, 0);
  const winRate = Math.round((stats.wins / stats.matchesPlayed) * 100);
  const maxCount = useMemo(() => Math.max(...activity.map((d) => d.count), 0), [activity]);

  // --- COMPONENTS ---
  const ProfileHeader = () => (
    <Card className="p-6 sm:p-8 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div>
          <motion.h1
            className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            {username}
          </motion.h1>

          <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
            <Calendar size={16} className="text-cyan-400" />
            Player since 2025 • {activeDays} active days
          </p>

          <div className="flex gap-4 mt-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy size={14} className="text-purple-400" /> {stats.rating} rating
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-pink-400" /> {winRate}% win rate
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">Current Rating</p>
          <div className="flex items-center justify-end gap-3 mt-1">
            <Trophy size={28} className="text-cyan-400" />
            <motion.span
              className="text-5xl font-black bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
            >
              {stats.rating}
            </motion.span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Peak: <span className="text-purple-300">{stats.bestRating}</span>
          </p>
        </div>
      </div>
    </Card>
  );

  const QuickStats = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {[
        { label: "Matches", value: stats.matchesPlayed, icon: Target },
        { label: "Wins", value: stats.wins, icon: Trophy },
        { label: "Losses", value: stats.losses, icon: X },
        { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp },
        { label: "Streak", value: stats.winStreak, icon: Flame },
      ].map(({ label, value, icon: Icon }) => (
        <Card key={label} className="bg-slate-900/50 border border-white/5 rounded-2xl text-center py-5 hover:bg-slate-800/80 transition-colors">
          <Icon className="mx-auto mb-2 text-cyan-400" size={22} />
          <div className="text-2xl font-bold text-white">{value}</div>
          <p className="text-xs text-slate-400 mt-1 uppercase">{label}</p>
        </Card>
      ))}
    </div>
  );

  const ActivityBarGraph = () => (
    <Card className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-lg">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Daily Match Activity Trend</h2>
        </div>
        <span className="text-sm text-slate-400">{totalMatches} total matches</span>
      </header>

      <div className="h-40 flex items-end overflow-x-auto pb-4 border-b border-slate-800 relative">
        <div className="absolute left-0 bottom-0 top-0 w-8 text-xs text-slate-500 flex flex-col justify-between pt-1 pb-2 pointer-events-none">
          <span className="text-right pr-1">{maxCount}</span>
          <span className="text-right pr-1">{Math.floor(maxCount / 2)}</span>
          <span className="text-right pr-1">0</span>
        </div>

        <div className="flex gap-1 pl-8 h-full flex-grow">
          <AnimatePresence>
            {activity.map((day, index) => {
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const isToday = index === activity.length - 1;
              const date = new Date(day.date);
              const title = `${date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}: ${day.count} match${day.count !== 1 ? "es" : ""}`;
              return (
                <motion.div
                  key={index}
                  className="flex flex-col justify-end w-1.5 h-full"
                  initial="hidden"
                  animate="visible"
                  variants={barVariants}
                  custom={index}
                  title={title}
                >
                  <motion.div
                    className={`w-full rounded-t shadow-md ${
                      isToday ? "bg-cyan-400" : "bg-purple-700/80"
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
        <div className="absolute bottom-0 right-0 pb-1 text-xs text-cyan-400">Today</div>
      </div>
    </Card>
  );

  const RecentMatches = () => (
    <Card className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Recent Matches</h2>
      <div className="flex flex-col gap-3">
        {matches.map((m) => {
          const isWin = m.result === "Win";
          return (
            <div
              key={m.id}
              className={`flex justify-between items-center px-5 py-4 rounded-2xl border transition-all duration-200 ${
                isWin
                  ? "border-cyan-500/20 bg-cyan-900/10"
                  : "border-pink-500/20 bg-pink-900/10"
              } hover:border-white/20`}
            >
              <div>
                <p className="font-semibold text-lg">
                  vs{" "}
                  <span className={isWin ? "text-cyan-400" : "text-pink-400"}>
                    {m.opponent}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={12} /> {m.date}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isWin ? "text-cyan-400" : "text-pink-400"}`}>
                  {m.result}
                </p>
                <p className="font-mono text-white mt-1">
                  {m.score}
                  <span className={`text-xs ml-2 ${isWin ? "text-cyan-400" : "text-pink-400"}`}>
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
    <div className="min-h-screen bg-slate-950 text-white p-6 pt-24">
      <div className="max-w-5xl mx-auto space-y-8">
        <ProfileHeader />
        <QuickStats />
        <ActivityBarGraph />
        <RecentMatches />
      </div>
    </div>
  );
}
