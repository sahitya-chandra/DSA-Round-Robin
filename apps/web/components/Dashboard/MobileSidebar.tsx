"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "@/components/Dashboard/Sidebar";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-sidebar border-2 border-sidebar-border pixel-border-outset active:pixel-border-inset"
      >
        <Menu className="w-6 h-6 text-sidebar-foreground" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="relative z-50 w-64 h-full animate-in slide-in-from-left duration-300">
             <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-[-3rem] p-2 bg-sidebar border-2 border-sidebar-border pixel-border-outset active:pixel-border-inset text-sidebar-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            <SidebarContent onItemClick={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
