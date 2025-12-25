"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoaderProps {
  isOpen: boolean;
  onCancel: () => void;
  mode?: string;
}

export function Loader({ isOpen, onCancel, mode = "BLITZ duel" }: LoaderProps) {
  // Variants for the container (orchestrates children)
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
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

  // Variants for the content stack
  const contentVariants = {
    hidden: { y: 20, scale: 0.95, opacity: 0 },
    visible: { 
      y: 0, 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    },
    exit: { 
      y: 20, 
      scale: 0.95, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
            key="loader-overlay"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
          {/* Top Integrated Banner (Floating just above the box) */}
          <motion.div
            variants={contentVariants}
            className="mb-6 bg-card border-2 border-primary/20 px-6 py-4 shadow-2xl flex items-center gap-4 w-full max-w-md pixel-border-outset minecraft-texture bg-gradient-to-r from-card to-primary/5"
          >
            <div className="bg-primary/20 p-2 pixel-border-outset">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-minecraft">Status</span>
              <span className="font-bold text-sm font-minecraft">Searching for {mode}...</span>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            variants={contentVariants}
            className="bg-card border-4 border-border p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center max-w-md w-full relative overflow-hidden minecraft-texture pixel-border-outset border-t-primary"
          >
            {/* Spinning Indicator */}
            <div className="relative w-36 h-36 mb-10">
              {/* Outer Decorative Ring */}
              <div className="absolute inset-0 border-4 border-muted/20 pixel-border-outset opacity-50" />
              
              {/* Spinning Segment */}
               <motion.div
                className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />

              {/* Inner Pulse */}
               <motion.div
                initial={{ opacity: 0.2, scale: 0.8 }}
                animate={{ opacity: 0.6, scale: 1.1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-6 bg-primary/20 blur-2xl rounded-full"
              />

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-background border-2 border-border pixel-border-outset flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Info className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-black text-foreground mb-4 font-minecraft tracking-tight">MATCHMAKING</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-[280px] leading-relaxed">
              Establishing connection... Finding a worthy challenger for your level.
            </p>

            <Button 
                variant="destructive" 
                onClick={onCancel}
                className="w-full py-8 text-lg font-bold shadow-[0_5px_0_rgb(153,27,27)] hover:shadow-none hover:translate-y-[2px] transition-all font-minecraft group relative overflow-hidden"
            >
              <X className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
              CANCEL SEARCH
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
