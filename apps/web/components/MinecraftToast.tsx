"use client";

import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface MinecraftToastProps {
  inviterName?: string | null;
  onAccept: () => void;
  onReject: () => void;
  duration?: number;
}

export const MinecraftToast: React.FC<MinecraftToastProps> = ({
  inviterName = "A friend",
  onAccept,
  onReject,
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
      <div className="bg-primary/20 p-3 border-b-2 border-border pixel-border-inset flex justify-between items-center">
        <span className="font-minecraft text-sm uppercase tracking-widest text-primary font-bold">
          Duel Request!
        </span>
        <span className="font-minecraft text-[10px] text-muted-foreground">
          {Math.ceil((duration / 1000) * (progress / 100))}s
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col items-center gap-4">
        <p className="font-minecraft text-base text-center leading-relaxed">
          <span className="text-yellow-500 font-bold">{inviterName}</span> wants to duel!
        </p>
        
        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={onReject}
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
            "
          >
            <X size={16} />
            Reject
          </button>
          
          <button
            onClick={onAccept}
            className="
              flex-1
              flex items-center justify-center gap-2
              bg-green-500/10 hover:bg-green-500/20
              text-green-500
              border-2 border-green-500/30
              pixel-border-outset
              py-3
              font-minecraft text-sm
              transition-colors
            "
          >
            <Check size={16} />
            Accept
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-muted">
        <motion.div 
            className="h-full bg-yellow-500"
            style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
