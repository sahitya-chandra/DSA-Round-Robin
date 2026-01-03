"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2 } from "lucide-react";

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const contentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    },
    exit: { 
      scale: 0.95, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
            key="global-loader"
            className="!fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background minecraft-texture h-screen w-screen"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
          <motion.div
            variants={contentVariants}
            className="flex flex-col items-center justify-center p-8 lg:p-12 relative"
          >
            {/* Spinning Indicator */}
            <div className="relative w-32 h-32 mb-8">
              {/* Outer Ring */}
              <div className="absolute inset-0 border-4 border-muted/30 pixel-border-outset opacity-50" />
              
              {/* Spinning Segment */}
               <motion.div
                className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-primary/20 flex items-center justify-center rounded-lg">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                 </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold font-minecraft mb-2 text-foreground tracking-widest animate-pulse">
              LOADING
            </h2>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
