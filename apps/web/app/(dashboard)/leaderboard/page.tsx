"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Crown, Medal , Trophy, TrendingUp, Flame, Swords, Shield, Zap, BarChart3, RefreshCw, UserPlus, Check, UserCheck } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFriendsListStore } from "@/stores/friendsListStore";

interface LeaderboardEntry {
  id: string;
  userId: string;
  rank: number;
  rating: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winStreak: number;
  bestWinStreak: number;
  lastMatchAt: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { onlineUsers, friendsList } = useFriendsListStore();
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const socket = useSocket(userId || "");

  const fetchLeaderboard = async () => {
    try {
      // setLoading(true); // Don't show full loading state on refresh
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leaderboard`);
      setLeaderboard(response.data);
      // setLoading(false);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      // setError("Failed to load leaderboard");
      // setLoading(false);
    } finally {
        setLoading(false);
    }
  };

  const handleAddFriend = async (targetId: string) => {
    if (!userId) return;
    try {
      setSentRequests(prev => [...prev, targetId]);
      await axios.post(`${API_BASE_URL}/api/social/request`, {
        userId,
        friendId: targetId
      });
      toast.success("Friend request sent!");
    } catch (err) {
      console.error("Failed to send friend request:", err);
      toast.error("Failed to send request");
      setSentRequests(prev => prev.filter(id => id !== targetId));
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
        console.log("Leaderboard update received!");
        fetchLeaderboard();
    };

    socket.on("leaderboard_update", handleUpdate);

    return () => {
        socket.off("leaderboard_update", handleUpdate);
    };
  }, [socket]);

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  const stats = {
    totalPlayers: leaderboard.length,
    totalMatches: leaderboard.reduce((acc, curr) => acc + curr.totalMatches, 0),
    activeStreaks: leaderboard.filter(p => p.winStreak > 2).length
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return { icon: <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500/20" />, color: "border-yellow-500/50 bg-yellow-500/10", text: "text-yellow-500" };
      case 2: return { icon: <Medal className="h-7 w-7 text-gray-400 fill-gray-400/20" />, color: "border-gray-400/50 bg-gray-400/10", text: "text-gray-400" };
      case 3: return { icon: <Medal className="h-6 w-6 text-amber-600 fill-amber-600/20" />, color: "border-amber-600/50 bg-amber-600/10", text: "text-amber-600" };
      default: return { icon: <span className="font-bold text-muted-foreground w-8 text-center">#{rank}</span>, color: "border-border/50 bg-card/50", text: "text-foreground" };
    }
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 space-y-8 animate-pulse">
        <div className="h-20 w-1/3 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-black/5">
        <div className="p-6 rounded-full bg-red-500/10 mb-4 ring-1 ring-red-500/20">
            <BarChart3 className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Could not load leaderboard</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col space-y-6 md:space-y-8 pb-4">
      {/* Header & Stats - Fixed at top */}
      <div className="shrink-0 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
            >
              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
              Leaderboard
            </motion.h1>
          </div>
          
          <div className="flex gap-4 md:gap-8 text-sm">
            <StatsItem label="Players" value={stats.totalPlayers} />
            <div className="w-px bg-white/10 h-8 self-center" />
            <StatsItem label="Matches" value={stats.totalMatches} />
            <div className="w-px bg-white/10 h-8 self-center" />
          </div>
        </div>
      </div>

      {/* Content Area - Flex Grow */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        
        {/* Podium - Left Side on Desktop, Hidden on Mobile */}
        {topThree.length > 0 && (
          <div className="hidden md:flex shrink-0 w-80 flex-col gap-4 overflow-y-auto pr-0 pb-0 hide-scrollbar">
             {/* Reordered for visual stack: 2nd, 1st, 3rd */}
             {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} delay={0} isOnline={onlineUsers.includes(topThree[0].userId)} />}
             {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} delay={0.1} isOnline={onlineUsers.includes(topThree[1].userId)} />}
             {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} delay={0.2} isOnline={onlineUsers.includes(topThree[2].userId)} />}
          </div>
        )}

        {/* List - Right Side / Bottom - Scrollable */}
        <Card className="flex-1 border-0 shadow-2xl bg-black/20 backdrop-blur-xl ring-1 ring-white/5 flex flex-col min-h-0">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 border-b border-white/5">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-2 text-center">Rating</div>
              <div className="col-span-2 text-center">Win Rate</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-1 text-end">Streak</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-0">
              
              {/* Desktop Table Rows */}
              <div className="hidden md:block">
                {restOfList.map((entry, idx) => {
                  const isFriend = friendsList.some(f => f.id === entry.userId);
                  const isSelf = entry.userId === userId;
                  const isRequestSent = sentRequests.includes(entry.userId);

                  return (
                    <motion.div 
                    key={entry.userId}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-6 py-3 items-center transition-all border-b border-white/5 last:border-0 group",
                      isSelf 
                        ? "bg-primary/10 border-l-4 border-l-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.1)] hover:bg-primary/15" 
                        : "hover:bg-white/5"
                    )}
                  >
                    <div className="col-span-1 text-center font-bold text-muted-foreground group-hover:text-foreground">
                      {isSelf ? <span className="text-primary">#{entry.rank}</span> : `#${entry.rank}`}
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-white/10 shrink-0">
                        <AvatarImage src={entry.user.image || ""} />
                        <AvatarFallback className="text-xs">{entry.user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                         <div className="flex items-center gap-2">
                             <span className="font-semibold text-sm truncate max-w-[150px]">{entry.user.name}</span>
                             {onlineUsers.includes(entry.userId) && (
                               <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-green-500/30">Online</span>
                             )}
                         </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono font-bold">{entry.rating}</span>
                    </div>
                    <div className="col-span-2 text-center text-xs">
                        <span className="opacity-70">{entry.totalMatches > 0 ? Math.round((entry.wins/entry.totalMatches)*100) : 0}%</span>
                    </div>
                    <div className="col-span-2 text-center text-xs font-medium">
                      <span className="text-green-500">{entry.wins}W</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-red-500">{entry.losses}L</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                       {entry.winStreak > 0 && <span className="text-orange-500 text-xs font-bold flex items-center gap-1">{entry.winStreak} <Flame className="h-3 w-3" /></span>}
                    </div>
                    <div className="col-span-1 flex justify-center">
                       {!isSelf && !isFriend && (
                          <button 
                            onClick={() => handleAddFriend(entry.userId)}
                            disabled={isRequestSent}
                            className="p-1.5 rounded-md hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                            title="Add Friend"
                          >
                            {isRequestSent ? <Check className="h-4 w-4 text-green-500" /> : <UserPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                          </button>
                       )}
                       {isFriend && <UserCheck className="h-4 w-4 text-green-500/50" />}
                    </div>
                  </motion.div>
                  )
                })}
              </div>

              {/* Mobile Integrated List (All Ranks) - Minimal Rows */}
              <div className="md:hidden">
                {leaderboard.map((entry, idx) => {
                   const isTop3 = entry.rank <= 3;
                   const rankColor = entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-gray-400" : entry.rank === 3 ? "text-amber-700" : "text-muted-foreground";
                   const bgStyle = isTop3 ? "bg-white/5" : "bg-transparent";
                   const isOnline = onlineUsers.includes(entry.userId);
                   const isFriend = friendsList.some(f => f.id === entry.userId);
                   const isSelf = entry.userId === userId;
                   const isRequestSent = sentRequests.includes(entry.userId);

                   return (
                    <div 
                      key={entry.userId} 
                      className={cn(
                        "flex items-center gap-3 p-3 border-b border-white/5 last:border-0 transition-all", 
                        bgStyle,
                        isSelf ? "bg-primary/10 border-l-4 border-l-primary pl-2 shadow-inner" : "active:bg-white/5"
                      )}
                    >
                      <div className={cn("font-mono font-bold w-5 text-center text-xs shrink-0", rankColor)}>
                        {entry.rank}
                      </div>
                      
                      <Avatar className={cn("h-9 w-9 shrink-0 ring-2 relative", isTop3 ? rankColor.replace("text", "ring") : "ring-transparent")}>
                        <AvatarImage src={entry.user.image || ""} />
                        <AvatarFallback className="text-[10px]">{entry.user.name.substring(0,2)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <div className="flex items-center gap-1.5">
                           <span className={cn("font-semibold text-sm truncate", isTop3 ? "text-foreground" : "text-muted-foreground")}>
                             {entry.user.name}
                           </span>
                           {isOnline && (
                              <span className="bg-green-500/20 text-green-400 text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider border border-green-500/30">Online</span>
                           )}
                           {entry.rank === 1 && <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <span className="bg-white/10 px-1.5 py-px rounded text-foreground/80">{entry.rating}</span>
                            <span>{entry.wins}W / {entry.losses}L</span>
                         </div>
                      </div>

                      {entry.winStreak > 0 && (
                        <div className="shrink-0 flex flex-col items-center min-w-[30px] mr-2">
                           <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                           <span className="text-[10px] font-bold text-orange-500">{entry.winStreak}</span>
                        </div>
                      )}

                      {!isSelf && !isFriend && (
                          <button 
                            onClick={() => handleAddFriend(entry.userId)}
                            disabled={isRequestSent}
                            className="p-2 -mr-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-all disabled:opacity-50"
                          >
                             {isRequestSent ? <Check className="h-4 w-4 text-green-500" /> : <UserPlus className="h-4 w-4 text-muted-foreground" />}
                          </button>
                      )}
                    </div>
                   );
                })}
              </div>

              {leaderboard.length === 0 && (
                 <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No entries found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsItem({ label, value, icon }: { label: string, value: number, icon?: React.ReactNode }) {
  return (
    <div className="text-center md:text-right">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <div className="flex items-center gap-1 justify-center md:justify-end">
        <p className="text-xl font-bold leading-none">{value}</p>
        {icon}
      </div>
    </div>
  )
}

function PodiumCard({ entry, rank, delay, isOnline }: { entry: LeaderboardEntry; rank: number; delay: number; isOnline?: boolean }) {
  const styles = {
    1: { bg: "bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30", text: "text-yellow-500", height: "h-32 md:h-auto" },
    2: { bg: "bg-gradient-to-b from-gray-400/20 to-transparent border-gray-400/30", text: "text-gray-400", height: "h-24 md:h-auto" },
    3: { bg: "bg-gradient-to-b from-amber-700/20 to-transparent border-amber-700/30", text: "text-amber-700", height: "h-20 md:h-auto" },
  }[rank as 1|2|3];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn("relative p-2 md:p-4 rounded-xl border flex flex-col md:flex-row items-center md:gap-4 shrink-0 overflow-hidden group justify-end md:justify-start", styles.bg, styles.height)}
    >
      <div className={cn("hidden md:block absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity", styles.text)}>
        <Crown className="h-16 w-16 rotate-12" />
      </div>
      
      <div className="relative mb-2 md:mb-0 shrink-0">
        <Avatar className={cn("h-10 w-10 md:h-12 md:w-12 border-2", styles.text.replace('text', 'border'))}>
          <AvatarImage src={entry.user.image || ""} />
          <AvatarFallback>{entry.user.name.substring(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className={cn("absolute -bottom-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/20 z-10", rankingColor(rank))}>
          #{rank}
        </div>
        {isOnline && (
           <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm z-20">Online</span>
        )}
      </div>
      
      <div className="text-center md:text-left min-w-0 w-full">
        <div className="font-bold text-xs md:text-sm truncate w-full px-1 md:px-0">{entry.user.name}</div>
        <div className="text-[10px] md:text-xs font-mono opacity-80 flex flex-col md:flex-row items-center md:gap-2">
           <span>{entry.rating}</span>
           <span className={entry.wins > 0 ? "text-green-400" : ""}>{entry.wins}W</span>
        </div>
      </div>
    </motion.div>
  );
}

function rankingColor(rank: number) {
  if (rank === 1) return "bg-yellow-500";
  if (rank === 2) return "bg-gray-400";
  return "bg-amber-700";
}
