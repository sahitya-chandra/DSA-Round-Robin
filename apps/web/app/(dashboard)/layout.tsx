import React from "react";
import { Sidebar } from "@/components/Dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 minecraft-texture flex flex-row">
      <Sidebar />
      <main className="flex-1 min-h-screen pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
