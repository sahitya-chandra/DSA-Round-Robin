"use client";

import React from "react";
import { LucideIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string; // e.g., "text-orange-500 bg-orange-500/10"
  tag?: string;
  onClick?: () => void;
  bgGradient?: string;
  locked?: boolean;
}

export function MatchCard({
  title,
  description,
  icon: Icon,
  colorClass,
  tag,
  onClick,
  bgGradient,
  locked = false
}: MatchCardProps) {
  return (
    <div
      onClick={!locked ? onClick : undefined}
      className={cn(
        "relative group flex flex-col p-8 bg-card border-2 minecraft-texture transition-all duration-300",
        !locked && "hover:-translate-y-1 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 pixel-border-outset active:pixel-border-inset",
        locked && "opacity-50 cursor-not-allowed pixel-border-inset"
      )}
    >
      {/* Background Effect on Hover */}
      {!locked && (
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8 z-10">
        <div className={cn("p-5 pixel-border-outset bg-accent/20", colorClass)}>
          <Icon className="w-10 h-10" />
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {tag && (
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-accent text-accent-foreground pixel-border-outset font-minecraft tracking-tight">
              {tag}
            </span>
          )}
          {/* {locked && (
            <Lock className="w-5 h-5 text-muted-foreground mr-1" />
          )} */}
        </div>
      </div>

      {/* Content */}
      <div className="z-10 mt-auto">
        <h3 className="text-2xl font-bold text-card-foreground mb-3 font-minecraft">{title}</h3>
        <p className="text-base text-muted-foreground font-medium">{description}</p>
      </div>
    </div>
  );
}
