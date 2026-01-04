"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Crown, Trophy, Flame, Swords, UserPlus, Check, UserCheck } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
  const [mounted, setMounted] = useState(false);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const socket = useSocket(userId || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leaderboard`);
      setLeaderboard(response.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      if(!leaderboard.length) setError("Failed to load leaderboard");
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
    
    let timeoutId: NodeJS.Timeout;
    
    const handleUpdate = () => {
        // Debounce: Wait 2s after last update event before fetching
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fetchLeaderboard();
        }, 2000);
    };
    
    socket.on("leaderboard_update", handleUpdate);
    return () => {
        socket.off("leaderboard_update", handleUpdate);
        clearTimeout(timeoutId);
    };
  }, [socket]);

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  const stats = {
    totalPlayers: leaderboard.length,
    totalMatches: leaderboard.reduce((acc, curr) => acc + curr.totalMatches, 0),
  };

  if (!mounted || loading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 space-y-8 animate-pulse">
        <div className="h-20 w-1/3 bg-muted rounded-none" />
        <div className="grid grid-cols-3 gap-6 h-64">
           <Skeleton className="h-full w-full rounded-none" />
           <Skeleton className="h-full w-full rounded-none" />
           <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-none" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="p-6 bg-red-500/10 mb-4 border-2 border-red-500 border-dashed">
            <Swords className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-minecraft mb-2">Could not load leaderboard</h2>
        <p className="font-minecraft text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 md:space-y-6 pb-8">
      
      {/* Header Section */}
      <div className="shrink-0 px-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b-4 border-white/10">
          <div>
            <motion.div 
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="flex items-center gap-3"
            >
               <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/20 border-2 border-primary pixel-border-outset flex items-center justify-center">
                  <Trophy className="h-5 w-5 md:h-6 md:w-6 text-black fill-black" />
               </div>
               <h1 className="text-xl md:text-5xl font-minecraft font-bold text-white tracking-tight drop-shadow-md">
                 Leaderboard
               </h1>
            </motion.div>
            <p className="text-[10px] md:text-sm font-minecraft text-muted-foreground mt-1 pl-1">
              Battle for glory in the arena
            </p>
          </div>
          
          <div className="flex bg-card/50 border-2 border-border p-2 md:p-3 gap-6 md:gap-8 shadow-inner pixel-border-inset backdrop-blur-sm">
            <StatsItem label="Players" value={stats.totalPlayers} />
            <div className="w-0.5 bg-border h-8 self-center" />
            <StatsItem label="Matches" value={stats.totalMatches} />
          </div>
        </div>
      </div>

      {/* Podium Section (Top 3) */}
      {topThree.length > 0 && (
         <div className="shrink-0 grid grid-cols-3 gap-2 md:gap-6 items-end justify-center px-1 md:px-12 py-2 min-h-[160px] md:min-h-[220px]">
            {/* Rank 2 */}
            {topThree[1] && <PodiumCard 
              entry={topThree[1]} 
              rank={2} 
              isOnline={onlineUsers.includes(topThree[1]?.userId)} 
              isFriend={friendsList.some(f => f.id === topThree[1]?.userId)}
              isSelf={topThree[1]?.userId === userId}
              userId={userId}
              handleAddFriend={handleAddFriend}
              sentRequests={sentRequests}
            />}
            
            {/* Rank 1 (Center, Taller) */}
            {topThree[0] && <PodiumCard 
              entry={topThree[0]} 
              rank={1} 
              isOnline={onlineUsers.includes(topThree[0]?.userId)} 
              isFriend={friendsList.some(f => f.id === topThree[0]?.userId)}
              isSelf={topThree[0]?.userId === userId}
              userId={userId}
              handleAddFriend={handleAddFriend}
              sentRequests={sentRequests}
            />}
            
            {/* Rank 3 */}
            {topThree[2] && <PodiumCard 
              entry={topThree[2]} 
              rank={3} 
              isOnline={onlineUsers.includes(topThree[2]?.userId)} 
              isFriend={friendsList.some(f => f.id === topThree[2]?.userId)}
              isSelf={topThree[2]?.userId === userId}
              userId={userId}
              handleAddFriend={handleAddFriend}
              sentRequests={sentRequests}
            />}
         </div>
      )}

      {/* Main Table List */}
      <Card className="bg-card/30 border-2 border-border rounded-none shadow-2xl relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('/grid-pattern.png')] opacity-5" /> {/* Optional texture overlay */}
        
        <CardContent className="p-0 z-10">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-accent/20 text-xs font-minecraft font-bold text-muted-foreground uppercase tracking-widest shrink-0 border-b-2 border-border">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4 pl-2">Compagnie</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-2 text-center">Stats</div>
            <div className="col-span-2 text-center">Record</div>
            <div className="col-span-1 text-end pr-4">Streak</div>
          </div>

          <div className="p-0">
             {/* Unified List: Show ALL on mobile, hide Top 3 on Desktop (since they are in Podium) */}
             {leaderboard.map((entry) => {
                const isFriend = friendsList.some(f => f.id === entry.userId);
                const isSelf = entry.userId === userId;
                const isRequestSent = sentRequests.includes(entry.userId);
                const isOnline = onlineUsers.includes(entry.userId);
                
                // On desktop, hide the top 3 (they are on the podium). On mobile, show everyone.
                const isTop3 = entry.rank <= 3;

                return (
                  <div 
                    key={entry.userId}
                    className={cn(
                      "group relative border-b-4 border-border/50 transition-colors md:border-b-2",
                      // Minecraft Item Slot Style for Mobile
                      "md:bg-transparent bg-card/40 mb-2 md:mb-0 mx-2 md:mx-0 border-2 border-b-4 md:border-b-2 md:border-border border-border/50 rounded-sm md:rounded-none", 
                      isSelf 
                        ? "bg-primary/10 border-primary/50 shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]" 
                        : "hover:bg-accent/10",
                      isTop3 && "md:hidden" // Hide top 3 on desktop list
                    )}
                  >
                     <div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-6 py-2.5 items-center">
                        {/* Rank */}
                        <div className="col-span-2 md:col-span-1 text-center font-minecraft font-bold text-muted-foreground group-hover:text-foreground text-[10px] md:text-base">
                          {isSelf ? <span className="text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">#{entry.rank}</span> : `#${entry.rank}`}
                        </div>

                        {/* Player Info */}
                        <div className="col-span-7 md:col-span-4 flex items-center gap-3 min-w-0">
                           <Avatar className="h-8 w-8 md:h-9 md:w-9 rounded-none ring-2 ring-white/10 shrink-0 bg-black">
                              <AvatarImage src={entry.user.image || ""} className="rounded-none object-cover" />
                              <AvatarFallback className="rounded-none font-minecraft text-xs bg-neutral-800 flex items-center justify-center">
                                <span className="md:inline">{entry.user.name.substring(0,2).toUpperCase()}</span>
                              </AvatarFallback>
                           </Avatar>
                           
                           <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                 <span className={cn("font-minecraft font-bold text-[10px] md:text-sm truncate text-foreground/90", isSelf && "text-primary")}>
                                   {entry.user.name}
                                 </span>
                                 {isOnline && (
                                   <span className="ml-1 text-[8px] md:text-[10px] font-bold text-green-500 bg-green-500/10 border border-green-500/30 px-1 py-0.5 rounded-[2px] animate-pulse">
                                     ONLINE
                                   </span>
                                 )}
                              </div>
                              {/* Mobile Stats Row */}
                              <div className="md:hidden flex items-center gap-2 text-[8px] text-muted-foreground font-mono">
                                 <span className="text-yellow-500">{entry.rating}</span>
                                 <span>•</span>
                                 <span>{entry.wins}W</span>
                              </div>
                           </div>

                           {/* Inline Add Friend Button */}
                           {!isSelf && !isFriend && (
                              <button 
                                onClick={() => handleAddFriend(entry.userId)}
                                disabled={isRequestSent}
                                className={cn(
                                  "ml-2 p-1 hover:bg-white/20 active:translate-y-0.5 transition-all outline-none md:opacity-0 md:group-hover:opacity-100",
                                  isRequestSent ? "opacity-100" : "opacity-100" 
                                )}
                                title="Add Friend"
                              >
                                {isRequestSent ? <Check className="h-3.5 w-3.5 text-green-500" /> : <UserPlus className="h-3.5 w-3.5 text-muted-foreground hover:text-white" />}
                              </button>
                           )}
                           {isFriend && <UserCheck className="h-3.5 w-3.5 text-green-500/50 ml-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />}
                        </div>

                        {/* Desktop Stats Columns */}
                        <div className="hidden md:block col-span-2 text-center">
                           <span className="bg-black/30 border border-white/10 px-2 py-0.5 text-xs font-minecraft text-yellow-500">{entry.rating}</span>
                        </div>
                        
                        <div className="hidden md:block col-span-2 text-center">
                           <div className="flex flex-col items-center gap-0.5">
                              <div className="h-1.5 w-16 bg-white/10 rounded-none overflow-hidden border border-white/5">
                                 <div className="h-full bg-green-500" style={{ width: `${(entry.wins / (entry.totalMatches || 1)) * 100}%` }} />
                              </div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{Math.round((entry.wins / (entry.totalMatches || 1)) * 100)}% Win</span>
                           </div>
                        </div>

                        <div className="hidden md:block col-span-2 text-center text-xs font-minecraft">
                           <span className="text-green-400">{entry.wins}W</span>
                           <span className="text-white/20 mx-1">-</span>
                           <span className="text-red-400">{entry.losses}L</span>
                        </div>

                        {/* Streak (Visible on Mobile too if space allows, usually last col) */}
                        <div className="col-span-3 md:col-span-1 flex justify-end pr-2 md:pr-4">
                           {entry.winStreak > 0 && (
                              <div className="flex items-center gap-1 bg-orange-500/10 px-1.5 py-0.5 border border-orange-500/30">
                                 <Flame className="h-3 w-3 text-orange-500 fill-orange-500 animate-pulse" />
                                 <span className="text-orange-500 text-[10px] font-minecraft">{entry.winStreak}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div >
                );
             })}

             {leaderboard.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-minecraft text-sm">
                   No warriors have entered the arena yet.
                </div>
             )}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

// Subcomponents

function StatsItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center md:items-end">
      <span className="text-[10px] font-minecraft uppercase text-muted-foreground/70 tracking-widest mb-0.5">{label}</span>
      <span className="text-sm md:text-2xl font-minecraft font-bold text-white drop-shadow-sm leading-none">{value.toLocaleString()}</span>
    </div>
  )
}

function PodiumCard({ entry, rank, isOnline, isFriend, isSelf, userId, handleAddFriend, sentRequests }: { 
  entry?: LeaderboardEntry, 
  rank: number, 
  isOnline?: boolean,
  isFriend?: boolean,
  isSelf?: boolean,
  userId?: string,
  handleAddFriend: (id: string) => void,
  sentRequests: string[]
}) {
  if (!entry) return <div className="flex-1 invisible" />; // Placeholder for empty slots

  // Adjusted heights and orders for the podium effect
  const config = {
     1: { height: "h-40 md:h-56", color: "bg-yellow-500", border: "border-yellow-600", order: "order-2" },
     2: { height: "h-32 md:h-44", color: "bg-gray-400", border: "border-gray-500", order: "order-1" },
     3: { height: "h-24 md:h-36", color: "bg-orange-700", border: "border-orange-800", order: "order-3" }
  }[rank as 1|2|3];
  
  const isRequestSent = sentRequests.includes(entry.userId);

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: rank * 0.1, type: "spring" }}
      className={cn("relative flex flex-col items-center justify-end w-full group", config.order)}
    >
       {/* Avatar floating above */}
       <div className="flex flex-col items-center mb-2 z-10 relative">
          <div className="relative">
             <Avatar className={cn("h-12 w-12 md:h-16 md:w-16 rounded-none ring-4 ring-black shadow-xl bg-black transition-transform hover:scale-110 duration-300", isSelf && "ring-primary")}>
                <AvatarImage src={entry.user.image || ""} className="rounded-none object-cover" />
                <AvatarFallback className="rounded-none font-minecraft font-bold bg-muted">{entry.user.name.substring(0,1)}</AvatarFallback>
             </Avatar>
             
             {rank === 1 && (
               <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-md" />
             )}
             
             {isOnline && (
               <span className="absolute -bottom-2 -right-3 z-20 bg-green-500 text-black text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 border-2 border-black shadow-sm transform -rotate-6 animate-pulse">
                 ONLINE
               </span>
             )}
          </div>
          
          <div className="mt-2 text-center">
             <div className="font-minecraft font-bold text-[10px] md:text-sm text-white drop-shadow-md truncate max-w-[80px] md:max-w-[120px]">
                {entry.user.name}
             </div>
             <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-[10px] font-mono text-white/80 bg-black/50 px-1 rounded-sm">{entry.rating}</span>
                
                {!isSelf && !isFriend && (
                   <button 
                     onClick={() => handleAddFriend(entry.userId)}
                     disabled={isRequestSent}
                     className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     {isRequestSent ? <Check className="h-3 w-3 text-green-400" /> : <UserPlus className="h-3 w-3 text-white/70 hover:text-white" />}
                   </button>
                )}
             </div>

             {entry.winStreak > 0 && (
                <div className="flex items-center gap-1 mt-1 bg-orange-500/10 px-1.5 py-0.5 rounded-sm border border-orange-500/20">
                   <Flame className="h-2.5 w-2.5 text-orange-500 fill-orange-500 animate-pulse" />
                   <span className="text-orange-500 text-[9px] font-minecraft">{entry.winStreak} Streak</span>
                </div>
             )}
          </div>
       </div>

       {/* The Block/Pedestal */}
       <div className={cn(
         "w-full flex items-end justify-center pb-4 border-x-4 border-t-4 border-b-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative",
         config.height,
         config.color,
         config.border
       )}>
          <span className="font-minecraft font-black text-2xl md:text-6xl text-white/20 select-none absolute bottom-2">
             {rank}
          </span>
       </div>
    </motion.div>
  );
}
