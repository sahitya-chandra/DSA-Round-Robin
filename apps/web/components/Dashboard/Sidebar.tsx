"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Puzzle, 
  Calendar, 
  Trophy, 
  Network, 
  BarChart3, 
  MessageSquare,
  Gamepad2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/Dashboard/UserNav"; 

// Note: UserNav will be a simplified version or reuse existing user profile logic if available.
// For now I'll stub it or use a simple avatar.

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Puzzles", href: "/puzzles", icon: Puzzle },
  { name: "Daily Challenge", href: "/daily-challenge", icon: Calendar },
  { name: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
  { name: "Chats", href: "/friends", icon: MessageSquare },
  { name: "Feedback", href: "/feedback", icon: MessageSquare }, // Keeping Feedback as requested, though icon duplicate
];

export function SidebarContent({ className, onItemClick }: { className?: string, onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r-2 border-sidebar-border minecraft-texture", className)}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-2 border-b-2 border-sidebar-border">
        <div className="w-8 h-8 bg-primary pixel-border-outset flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-sidebar-primary tracking-wider font-minecraft">DSA RR</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 py-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all duration-200 group pixel-border-outset active:pixel-border-inset",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium pixel-border-inset" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "group-hover:text-sidebar-primary")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile (Bottom) */}
      <div className="p-4 border-t-2 border-sidebar-border">
         <UserNav />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden md:flex flex-col w-64 h-screen z-40 relative">
      <SidebarContent />
    </div>
  );
}
