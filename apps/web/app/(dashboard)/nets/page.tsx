"use client";

import { ComingSoon } from "@/components/Dashboard/ComingSoon";
import { Network } from "lucide-react";

export default function NetsPage() {
  return (
    <ComingSoon 
      title="Nets" 
      icon={Network}
      colorClass="text-purple-500"
    />
  );
}
