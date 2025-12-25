"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  colorClass?: string;
}

export function ComingSoon({ 
  title, 
  description = "We're working hard to bring you exciting updates. Stay tuned!", 
  icon: Icon,
  colorClass = "text-primary"
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-2xl"
      >
        <Icon className={`w-24 h-24 ${colorClass}`} />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`text-4xl md:text-5xl font-bold mb-4 ${colorClass}`}
      >
        {title} Coming Soon
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed"
      >
        {description}
      </motion.p>
      
      <motion.div 
         initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4"
      >
        <Link href="/dashboard">
            <Button variant="outline" className="px-6 py-4 rounded-xl border-white/10 hover:bg-white/5">
                Return to Dashboard
            </Button>
        </Link>
        <Button className="px-6 py-4 rounded-xl bg-primary text-black font-bold hover:bg-primary/90">
            Share Your Ideas
        </Button>
      </motion.div>
    </div>
  );
}
