"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { getProfileData } from "../actions/profile";

// --- TYPE DEFINITIONS ---
interface Match {
  id: string;
  opponent: string;
  result: "Win" | "Loss";
  date: string;
  score: string;
  ratingChange: number;
}

// --- ACTIVITY DATA GENERATOR REMOVED ---

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

  const [profileData, setProfileData] = useState<{
    user: { name: string; rating: number; createdAt: Date; activeDays: number };
    stats: { matchesPlayed: number; wins: number; losses: number; rating: number; winRate: number; winStreak: number; bestRating: number };
    matches: Match[];
    activity: { date: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProfileData(session);
        if (data) {
          // @ts-ignore - Date serialization issue between server/client
          setProfileData(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayUsername = profileData?.user.name || username;
  const stats = profileData?.stats || {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    rating: 1200,
    winRate: 0,
    winStreak: 0,
    bestRating: 1200,
  };
  const matches = profileData?.matches || [];
  const activity = profileData?.activity || [];
  
  const activeDays = profileData?.user.activeDays || 0;
  const totalMatches = stats.matchesPlayed;
  const winRate = stats.winRate;
  const maxCount = useMemo(() => Math.max(...activity.map((d) => d.count), 0), [activity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 pt-24 flex items-center justify-center minecraft-texture">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- COMPONENTS ---
  const ProfileHeader = () => (
    <Card className="p-6 sm:p-8 bg-card border-2 border-border backdrop-blur-xl shadow-2xl minecraft-texture">
      <div className="flex flex-col sm:flex-row justify-between gap-6">
        <div>
          <motion.h1
            className="text-5xl font-black text-primary font-minecraft"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            {displayUsername}
          </motion.h1>

          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Player since 2025 • {activeDays} active days
          </p>

          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy size={14} className="text-accent" /> {stats.rating} rating
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-primary" /> {winRate}% win rate
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Rating</p>
          <div className="flex items-center justify-end gap-3 mt-1">
            <Trophy size={28} className="text-primary" />
            <motion.span
              className="text-5xl font-black text-primary font-minecraft"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
            >
              {stats.rating}
            </motion.span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Peak: <span className="text-accent">{stats.bestRating}</span>
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
        <Card key={label} className="bg-card border-2 border-border text-center py-5 hover:brightness-110 transition-all minecraft-texture pixel-border-outset">
          <Icon className="mx-auto mb-2 text-primary" size={22} />
          <div className="text-2xl font-bold text-card-foreground font-minecraft">{value}</div>
          <p className="text-xs text-muted-foreground mt-1 uppercase font-minecraft">{label}</p>
        </Card>
      ))}
    </div>
  );

  const ActivityBarGraph = () => (
    <Card className="bg-card border-2 border-border p-6 backdrop-blur-lg minecraft-texture">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-accent" />
          <h2 className="text-xl font-semibold text-card-foreground font-minecraft">Daily Match Activity Trend</h2>
        </div>
        <span className="text-sm text-muted-foreground">{totalMatches} total matches</span>
      </header>

      <div className="h-40 flex items-end overflow-x-auto pb-4 border-b-2 border-border relative">
        <div className="absolute left-0 bottom-0 top-0 w-8 text-xs text-muted-foreground flex flex-col justify-between pt-1 pb-2 pointer-events-none">
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
                    className={`w-full shadow-md pixel-border-outset ${
                      isToday ? "bg-primary" : "bg-accent/80"
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
        <div className="absolute bottom-0 right-0 pb-1 text-xs text-primary font-minecraft">Today</div>
      </div>
    </Card>
  );

  const RecentMatches = () => (
    <Card className="bg-card border-2 border-border p-6 backdrop-blur-lg minecraft-texture">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground font-minecraft">Recent Matches</h2>
      <div className="flex flex-col gap-3">
        {matches.map((m) => {
          const isWin = m.result === "Win";
          return (
            <div
              key={m.id}
              className={`flex justify-between items-center px-5 py-4 border-2 transition-all duration-200 minecraft-texture pixel-border-outset ${
                isWin
                  ? "border-primary/30 bg-primary/10"
                  : "border-destructive/30 bg-destructive/10"
              } hover:brightness-110`}
            >
              <div>
                <p className="font-semibold text-lg font-minecraft">
                  vs{" "}
                  <span className={isWin ? "text-primary" : "text-destructive"}>
                    {m.opponent}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar size={12} /> {m.date}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold font-minecraft ${isWin ? "text-primary" : "text-destructive"}`}>
                  {m.result}
                </p>
                <p className="font-mono text-card-foreground mt-1">
                  {m.score}
                  <span className={`text-xs ml-2 ${isWin ? "text-primary" : "text-destructive"}`}>
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
    <div className="min-h-screen bg-background text-foreground p-6 pt-24 minecraft-texture">
      <div className="max-w-5xl mx-auto space-y-8">
        <ProfileHeader />
        <QuickStats />
        <ActivityBarGraph />
        <RecentMatches />
      </div>
    </div>
  );
}
