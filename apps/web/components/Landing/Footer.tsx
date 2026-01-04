"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Github, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Modal Component
const FooterModal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="w-full max-w-lg bg-card border-2 border-border pixel-border-outset shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted/50">
              <h3 className="font-minecraft text-lg font-bold text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded pixel-border-outset active:pixel-border-inset"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto font-minecraft text-sm leading-relaxed text-muted-foreground custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Footer = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <footer className="bg-card border-t-2 border-border minecraft-texture py-6 px-4 relative overflow-hidden">
        {/* Decorative Background - subtle */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 w-[600px] h-[100px] bg-primary/20 blur-[120px] -translate-x-1/2" />
        </div>

        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm relative z-10 font-minecraft">
          {/* Brand */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              className="w-8 h-8 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold text-xs"
            >
              RR
            </motion.div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] leading-tight group-hover:text-primary transition-colors">
                © {new Date().getFullYear()}
              </span>
              <span className="text-foreground font-bold tracking-tight">DSA Round Robin</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-muted-foreground h-full">
            <motion.button
              whileHover={{ y: -2, color: "var(--primary)" }}
              onClick={() => setIsTermsOpen(true)}
              className="hover:underline underline-offset-4 transition-colors font-medium"
            >
              Terms
            </motion.button>
            <span className="text-border select-none opacity-50">|</span>
            <motion.a
              whileHover={{ scale: 1.1, color: "var(--primary)" }}
              href="https://github.com/sahitya-chandra/DSA-Round-Robin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group p-2 bg-muted/50 pixel-border-outset active:pixel-border-inset"
            >
              <Github size={16} className="group-hover:rotate-[360deg] transition-transform duration-500" />
              <span className="hidden sm:inline font-medium">GitHub</span>
            </motion.a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FooterModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms of Service"
      >
        <div className="space-y-4">
          <p>
            Welcome to <strong className="text-foreground">DSA Round Robin</strong>. By using our platform, you agree to
            play fair and respect your fellow coders.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not cheat or use AI assistance during live duels.</li>
            <li>Respect others in the global chat.</li>
            <li>Have fun and valid submissions only!</li>
          </ul>
          <p className="border-t border-border pt-4 mt-4 text-xs italic">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </FooterModal>
    </>
  );
};
