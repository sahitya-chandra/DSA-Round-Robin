"use client";

import { ComingSoon } from "@/components/Dashboard/ComingSoon";
import { Calendar } from "lucide-react";

export default function DailyChallengePage() {
  return (
    <ComingSoon 
      title="Daily Challenge" 
      icon={Calendar}
      colorClass="text-blue-500"
    />
  );
}
