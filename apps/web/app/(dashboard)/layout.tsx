"use client";

import React from "react";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { MobileSidebar } from "@/components/Dashboard/MobileSidebar";
import { Loader } from "@/components/Dashboard/Loader";
import { useMatchListener } from "@/hooks/useMatchListener";
import { useMatchStores } from "@/stores/useMatchStore";
import { useMatchMaker } from "@/hooks/useMatchMaker";
import { useFriendDuel } from "@/hooks/useFriendDuel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useMatchListener();
  const { queued } = useMatchStores();
  const { cancelMatch } = useMatchMaker();
  useFriendDuel();
  
  return (
    <div className="h-screen bg-background text-foreground font-sans selection:bg-primary/20 minecraft-texture flex flex-row overflow-hidden">
      <MobileSidebar />
      <Sidebar />
      <main className="flex-1 h-full pt-16 md:pt-0 relative overflow-y-auto custom-scrollbar">

        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
      <Loader 
        isOpen={queued} 
        onCancel={cancelMatch} 
        mode="BLITZ DUEL" 
      />
    </div>
  );
}
