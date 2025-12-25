import React from "react";
import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t-2 border-border py-12 minecraft-texture">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold font-minecraft text-xs">
              RR
            </div>
            <span className="text-foreground font-bold text-xl font-minecraft">DSA Round_Robin</span>
          </div>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors pixel-border-outset px-2 py-1 active:pixel-border-inset">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors pixel-border-outset px-2 py-1 active:pixel-border-inset">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors pixel-border-outset px-2 py-1 active:pixel-border-inset">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors pixel-border-outset p-2 active:pixel-border-inset">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors pixel-border-outset p-2 active:pixel-border-inset">
              <Twitter className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} DSA Round_Robin. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
