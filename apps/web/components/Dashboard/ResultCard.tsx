"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  isOpen: boolean;
  winnerId: string | null;
  userId: string | undefined;
  onReturnHome: () => void;
}

export function ResultCard({ isOpen, winnerId, userId, onReturnHome }: ResultCardProps) {
  const isWinner = winnerId === userId;
  const isDraw = !winnerId;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    }
  };

  const modalVariants = {
    hidden: { scale: 0.8, y: 20, opacity: 0 },
    visible: { 
      scale: 1, 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    },
    exit: { 
      scale: 0.8, 
      y: 20, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="result-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            variants={modalVariants}
            className="bg-card border-4 border-border p-6 sm:p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full relative overflow-hidden minecraft-texture pixel-border-outset"
          >
            {/* Header Icon */}
            <div className="relative mb-6 sm:mb-8">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 pixel-border-outset flex items-center justify-center shadow-lg ${
                  isWinner ? "bg-primary" : isDraw ? "bg-muted" : "bg-destructive"
                }`}
              >
                <Trophy className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${isWinner ? "text-primary-foreground" : "text-foreground"}`} />
              </motion.div>
              
              {isWinner && (
                <motion.div 
                   animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 pixel-border-outset flex items-center justify-center"
                >
                  <span className="text-sm sm:text-lg">⭐</span>
                </motion.div>
              )}
            </div>

            <div className="text-center space-y-2 sm:space-y-4 mb-6 sm:mb-10">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-foreground font-minecraft tracking-tight">
                {isWinner ? "YOU WON!" : isDraw ? "IT'S A DRAW!" : "YOU LOST!"}
              </h2>
              <p className="text-muted-foreground font-medium text-xs sm:text-lg">
                {isWinner ? "Incredible performance! You crushed it!" : isDraw ? "Both competitors gave it their all!" : "Good game! Practice makes perfect."}
              </p>
            </div>

            <Button
              onClick={onReturnHome}
              className={`w-full py-4 sm:py-6 md:py-8 text-sm sm:text-xl font-bold shadow-lg transition-all font-minecraft flex items-center gap-2 sm:gap-3 pixel-border-outset active:pixel-border-inset ${
                isWinner ? "bg-primary hover:brightness-110" : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <Home className="w-4 h-4 sm:w-6 sm:h-6" />
              RETURN TO HOME
            </Button>
            
            <p className="mt-4 sm:mt-6 text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-minecraft opacity-50">
               End of Match Report
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
