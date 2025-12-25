"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const Hero: React.FC= () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-20 minecraft-texture">
      {/* Background Effects - Minecraft grid pattern */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,oklch(0.3_0.01_0/0.3)_2px,transparent_2px),linear-gradient(to_bottom,oklch(0.3_0.01_0/0.3)_2px,transparent_2px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-accent/10 to-transparent blur-3xl" />

      <div className="container relative z-10 px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border-2 border-border text-sm text-primary mb-8 pixel-border-outset font-minecraft"
        >
          <Sparkles className="w-4 h-4" />
          <span>The Ultimate DSA Battleground</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 font-minecraft"
        >
          Master Algorithms <br />
          <span className="text-primary">
            In Real-Time
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Challenge friends, solve complex problems, and level up your coding skills
          in an immersive, multiplayer environment designed for developers.
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground animate-bounce"
      >
        <div className="w-6 h-10 border-2 border-border flex items-start justify-center p-1 pixel-border-outset bg-card">
          <div className="w-1 h-2 bg-primary" />
        </div>
      </motion.div>
    </section>
  );
};
