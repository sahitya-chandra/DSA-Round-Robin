"use client";

import Link from "next/link";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Swords, Trophy, Users, LogOut, ChartBar, Flame } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, delay = 0 }) => (
  <div 
    className="bg-card p-4 pixel-border-outset flex flex-col items-center justify-center gap-2 group hover:-translate-y-1 transition-transform duration-200"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="p-2 bg-primary/10 rounded-none pixel-border-inset group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-minecraft mb-1 line-clamp-1">{label}</p>
      <p className="text-xl md:text-2xl font-bold font-minecraft text-foreground leading-none">{value}</p>
    </div>
  </div>
);

const UserProfile = () => {
  const { data: session, isPending } = authClient.useSession();
  
  if (isPending) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-10 p-6">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
           <CardSkeleton className="w-32 h-32" />
           <div className="space-y-4 w-full">
              <CardSkeleton className="h-12 w-1/2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-24 w-full" />)}
              </div>
           </div>
        </div>
      </div>
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Card className="max-w-md w-full pixel-border-outset bg-card text-center p-8 minecraft-texture">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-minecraft text-foreground">
              Welcome, Stranger!
            </CardTitle>
            <CardDescription className="font-minecraft text-muted-foreground">
              You need to sign in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex flex-col gap-4">
            <Link href="/signup">
              <Button className="w-full pixel-border-outset font-minecraft text-lg h-12">Sign Up</Button>
            </Link>
            <Link href="/signin">
              <Button variant="secondary" className="w-full pixel-border-outset font-minecraft text-lg h-12">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TODO: Replace with real data fetching
  const stats = {
    totalRounds: 18,
    totalFriends: 9,
    rating: 1250,
    wins: 12,
  };

  const recentRounds = [
    { name: "DSA Round #18", questions: 5, solved: 4, date: "2025-10-01", result: "WIN" },
    { name: "DSA Round #17", questions: 5, solved: 5, date: "2025-09-28", result: "WIN" },
    { name: "DSA Round #16", questions: 5, solved: 3, date: "2025-09-24", result: "LOSS" },
    { name: "DSA Round #15", questions: 5, solved: 5, date: "2025-09-20", result: "WIN" },
    { name: "DSA Round #14", questions: 5, solved: 4, date: "2025-09-17", result: "LOSS" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-10">
      
      {/* Profile Header */}
      <Card className="pixel-border-outset bg-card minecraft-texture overflow-visible">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          
          <div className="relative group">
             <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-none ring-4 ring-black shadow-2xl pixelated bg-black">
                <AvatarImage src={user.image || ""} className="object-cover" />
                <AvatarFallback className="rounded-none bg-muted font-minecraft text-4xl font-bold">
                   {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
             </Avatar>
             <div className="absolute -top-3 -right-3 z-10 bg-green-500 border-2 border-black px-2 py-0.5 transform rotate-6 animate-pulse group-hover:rotate-0 transition-transform">
                <span className="text-[10px] font-bold text-black font-minecraft block leading-none mt-0.5">ONLINE</span>
             </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
             <h1 className="text-3xl md:text-5xl font-bold font-minecraft text-foreground tracking-tight drop-shadow-sm">
                {user.name}
             </h1>
             <p className="font-mono text-muted-foreground text-sm flex items-center justify-center md:justify-start gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
                {user.email}
             </p>
             
             {/* XP Bar / Level Placeholder */}
             <div className="max-w-[200px] mx-auto md:mx-0 mt-4 h-4 bg-muted pixel-border-inset relative">
                <div className="h-full bg-primary w-[75%] absolute top-0 left-0" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-foreground font-minecraft z-10">
                   Level 5 (75%)
                </span>
             </div>
          </div>

          <div className="flex flex-col gap-2">
             <Button variant="destructive" onClick={() => authClient.signOut()} className="pixel-border-outset font-minecraft bg-red-600 hover:bg-red-700 text-white">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
             </Button>
          </div>

        </div>
      </Card>

      {/* Stats Grid */}
      <section>
         <h2 className="text-lg font-minecraft font-bold mb-4 flex items-center gap-2">
            <ChartBar className="w-5 h-5 text-primary" />
            Performance Stats
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
               label="Total Matches" 
               value={stats.totalRounds} 
               icon={<Swords className="w-5 h-5 text-blue-500" />} 
               delay={0}
            />
             <StatCard 
               label="Wins" 
               value={stats.wins} 
               icon={<Trophy className="w-5 h-5 text-yellow-500" />} 
               delay={100}
            />
             <StatCard 
               label="Friends" 
               value={stats.totalFriends} 
               icon={<Users className="w-5 h-5 text-green-500" />} 
               delay={200}
            />
             <StatCard 
               label="Rating" 
               value={stats.rating} 
               icon={<Flame className="w-5 h-5 text-orange-500" />} 
               delay={300}
            />
         </div>
      </section>

      {/* Recent Activity */}
      <section>
         <h2 className="text-lg font-minecraft font-bold mb-4 flex items-center gap-2">
            <ChartBar className="w-5 h-5 text-primary" />
            Battle History
         </h2>
         
         <Card className="bg-card/50 pixel-border-inset p-4 min-h-[300px]">
            <div className="space-y-2">
               {recentRounds.map((round, i) => (
                  <div 
                     key={i} 
                     className="bg-card border-b-2 border-border/50 p-3 hover:bg-accent/10 transition-colors flex items-center justify-between group"
                  >
                     <div className="flex items-center gap-4">
                        <div className={cn(
                           "w-10 h-10 flex items-center justify-center pixel-border-outset text-lg font-bold font-minecraft",
                           round.result === "WIN" ? "bg-green-500/20 text-green-500 border-green-500/50" : "bg-red-500/20 text-red-500 border-red-500/50"
                        )}>
                           {round.result === "WIN" ? "W" : "L"}
                        </div>
                        <div>
                           <p className="font-bold font-minecraft text-sm">{round.name}</p>
                           <p className="text-xs text-muted-foreground font-mono">{round.solved}/{round.questions} Problems Solved</p>
                        </div>
                     </div>
                     <span className="text-[10px] sm:text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                        {round.date}
                     </span>
                  </div>
               ))}
               
               {recentRounds.length === 0 && (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground/50">
                     <Swords className="w-12 h-12 mb-2 opacity-20" />
                     <p className="font-minecraft text-sm">No recent battles recorded.</p>
                  </div>
               )}
            </div>
         </Card>
      </section>

    </div>
  );
};

export default UserProfile;
