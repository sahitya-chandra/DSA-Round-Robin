"use client";

import { ComingSoon } from "@/components/Dashboard/ComingSoon";
import { Puzzle, Calendar, Trophy, Network, BarChart3, MessageSquare } from "lucide-react";

export default function PuzzlesPage() {
  return (
    <ComingSoon 
      title="Puzzles" 
      description="We're working hard to bring you exciting coding puzzles. Stay tuned for challenging problems and algorithmic adventures!"
      icon={Puzzle}
      colorClass="text-green-500"
    />
  );
}
