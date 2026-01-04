"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Puzzle, 
  Calendar, 
  Trophy, 
  Network, 
  BarChart3, 
  MessageSquare,
  Gamepad2,
  Users,
  User,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/Dashboard/UserNav"; 
import { useFriendsListStore } from "@/stores/friendsListStore"; 
import QuickAddFriendModal from "@/components/Friendship/QuickAddFriendModal";
import { Plus } from "lucide-react";
import { useState } from "react"; 

export function SidebarContent({ className, onItemClick, onClose }: { className?: string, onItemClick?: () => void, onClose?: () => void }) {
  const pathname = usePathname();
  const { pendingRequests, unreadMessages } = useFriendsListStore();
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  const totalUnreadInfo = Object.values(unreadMessages).reduce((a, b) => a + b, 0);

  const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Puzzles", href: "/puzzles", icon: Puzzle },
    { name: "Daily Challenge", href: "/daily-challenge", icon: Calendar },
    { name: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
    { name: "Friends", href: "/friends", icon: MessageSquare },
    { name: "Feedback", href: "/feedback", icon: MessageSquare },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r-2 border-sidebar-border minecraft-texture", className)}>
      <div className="p-4 flex items-center justify-between border-b-2 border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary pixel-border-outset flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-primary tracking-wider font-minecraft">DSA RR</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden text-sidebar-foreground hover:text-sidebar-primary transition"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const hasNotification = item.name === "Chats" && (pendingRequests.length > 0 || totalUnreadInfo > 0);
          const isFriendsItem = item.name === "Friends";

          return (
            <div key={item.href} className="relative group/item">
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all duration-200 group pixel-border-outset active:pixel-border-inset relative",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium pixel-border-inset" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "group-hover:text-sidebar-primary")} />
                {hasNotification && (
                   <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full ring-1 ring-background" />
                )}
              </div>
              <span>{item.name}</span>
            </Link>
             {isFriendsItem && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAddFriendOpen(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 hover:bg-primary hover:text-primary-foreground rounded transition-all z-10 pixel-border-outset bg-sidebar-card"
                  title="Quick Add Friend"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t-2 border-sidebar-border">
         <UserNav />
      </div>
      <QuickAddFriendModal 
        isOpen={isAddFriendOpen} 
        onClose={() => setIsAddFriendOpen(false)} 
      />
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
