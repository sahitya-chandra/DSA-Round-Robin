"use client";

import { ComingSoon } from "@/components/Dashboard/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <ComingSoon 
      title="Leaderboard" 
      icon={BarChart3}
      colorClass="text-orange-500"
    />
  );
}
