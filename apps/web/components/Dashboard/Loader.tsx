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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm minecraft-texture">
          {/* Top Info Banner */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 bg-card text-card-foreground px-6 py-3 shadow-xl flex items-center gap-3 w-auto min-w-[300px] border-2 border-border pixel-border-outset minecraft-texture"
          >
            <Info className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm font-minecraft">Searching for an opponent for {mode.toLowerCase()}...</span>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border-2 border-border p-12 shadow-2xl flex flex-col items-center justify-center max-w-md w-full relative overflow-hidden minecraft-texture pixel-border-outset"
          >
            {/* Custom Spinner Animation */}
            <div className="relative w-32 h-32 mb-8">
              {/* Outer Ring */}
              <motion.div
                className="absolute inset-0 border-4 border-border pixel-border-outset"
              />
              {/* Spinning Segment */}
               <motion.div
                className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner Circle Effect */}
               <motion.div
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-4 bg-primary/10 blur-xl pixel-border-inset"
              />
            </div>

            <h2 className="text-2xl font-bold text-primary mb-2 font-minecraft">Searching for Opponent</h2>
            <p className="text-muted-foreground text-center mb-8">
              Looking for a worthy opponent for {mode}...
            </p>

            <Button 
                variant="destructive" 
                onClick={onCancel}
                className="px-8 py-6 font-bold shadow-lg font-minecraft"
            >
              Cancel Search
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
