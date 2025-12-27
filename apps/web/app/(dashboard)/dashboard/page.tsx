"use client";

import React, { useEffect } from "react";
import { Zap, Code2, Moon, Upload, TrendingUp, Users } from "lucide-react";
import { MatchCard } from "@/components/Dashboard/MatchCard";
import { useMatchMaker } from "@/hooks/useMatchMaker";
import { API_BASE_URL } from "@/lib/api";


export default function DashboardPage() {
  const { startMatch } = useMatchMaker();

  useEffect(() => {
    async function check() {
      await fetch(`${API_BASE_URL}/api/health`, {
        credentials: "include",
      });
    }

    check()
  }, [])

  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-center mb-8 md:mb-16 text-center">
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tight font-minecraft">
            Online <span className="text-muted-foreground">Duels</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground font-medium">
            Challenge your friends and coders around the globe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <MatchCard
          title="BLITZ DUEL"
          description="10-min speed round"
          icon={Zap}
          colorClass="text-orange-500 bg-orange-500/10"
          tag="vs Random"
          onClick={startMatch}
        />

        <MatchCard
          title="PRACTICE SOLO"
          description="Sharpen your skills alone"
          icon={Code2}
          colorClass="text-yellow-500 bg-yellow-500/10"
          onClick={() => window.location.href = "/code"} 
        />
        
        <MatchCard
          title="FRIEND DUEL"
          description="Private battle with your buddy"
          icon={Upload}
          colorClass="text-pink-500 bg-pink-500/10"
          // tag="New"
          onClick={() => {}} // TODO: Implement Friend Duel logic
          locked={true} // Locking for now as logic is specific
        />
        
        {/* Row 2 - Locked/Extra */}
        <MatchCard
          title="ALGORITHM DUELS"
          description="Topic specific battles"
          icon={TrendingUp}
          colorClass="text-purple-500 bg-purple-500/10"
          locked={true}
        />
      </div>

      {/* Loader moved to Global Layout */}
    </div>
  );
}
