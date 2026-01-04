"use client";

import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface RejoinMatchToastProps {
  opponentName?: string | null;
  onRejoin: () => void;
  onGiveUp: () => void;
  duration?: number;
}

export const RejoinMatchToast: React.FC<RejoinMatchToastProps> = ({
  opponentName = "Unknown",
  onRejoin,
  onGiveUp,
  duration = 10000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Progress bar logic
    const interval = 100;
    const steps = duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="
        w-full max-w-md
        bg-card
        border-4 border-border
        pixel-border-outset
        minecraft-texture
        shadow-2xl
        overflow-hidden
        pointer-events-auto
      "
    >
      {/* Header */}
      <div className="bg-amber-500/20 p-3 border-b-2 border-border pixel-border-inset flex justify-between items-center">
        <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="font-minecraft text-sm uppercase tracking-widest text-amber-500 font-bold">
            Active Match!
            </span>
        </div>
        <span className="font-minecraft text-[10px] text-muted-foreground">
          {Math.ceil((duration / 1000) * (progress / 100))}s
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col items-center gap-4">
        <div className="font-minecraft text-base text-center leading-relaxed">
          <p>You have a match running against</p>
          <span className="text-amber-500 font-bold">{opponentName}</span>
        </div>
        
        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={onGiveUp}
            className="
              flex-1
              flex items-center justify-center gap-2
              bg-destructive/10 hover:bg-destructive/20
              text-destructive
              border-2 border-destructive/30
              pixel-border-outset
              py-3
              font-minecraft text-sm
              transition-colors
              active:pixel-border-inset
            "
          >
            <X size={16} />
            Give Up
          </button>
          
          <button
            onClick={onRejoin}
            className="
              flex-1
              flex items-center justify-center gap-2
              bg-primary/10 hover:bg-primary/20
              text-primary
              border-2 border-primary/30
              pixel-border-outset
              py-3
              font-minecraft text-sm
              transition-colors
              active:pixel-border-inset
            "
          >
            <Check size={16} />
            Rejoin
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-muted">
        <motion.div 
            className="h-full bg-amber-500"
            style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
