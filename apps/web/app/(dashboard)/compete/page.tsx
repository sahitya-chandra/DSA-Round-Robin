"use client";

import { ComingSoon } from "@/components/Dashboard/ComingSoon";
import { Trophy } from "lucide-react";

export default function CompetePage() {
  return (
    <ComingSoon 
      title="Compete" 
      icon={Trophy}
      colorClass="text-yellow-500"
    />
  );
}
