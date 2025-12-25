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
        "relative group flex flex-col p-6 bg-card border-2 minecraft-texture transition-all duration-300",
        !locked && "hover:-translate-y-1 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 pixel-border-outset active:pixel-border-inset",
        locked && "opacity-50 cursor-not-allowed pixel-border-inset"
      )}
    >
      {/* Background Effect on Hover */}
      {!locked && (
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div className={cn("p-4 pixel-border-outset bg-accent/20", colorClass)}>
          <Icon className="w-8 h-8" />
        </div>
        {tag && (
          <span className="px-3 py-1 text-xs font-semibold bg-accent text-accent-foreground pixel-border-outset font-minecraft">
            {tag}
          </span>
        )}
        {locked && (
           <Lock className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="z-10 mt-auto">
        <h3 className="text-xl font-bold text-card-foreground mb-2 font-minecraft">{title}</h3>
        <p className="text-sm text-muted-foreground font-medium">{description}</p>
      </div>
    </div>
  );
}
