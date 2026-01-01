"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Github, Linkedin, Mail, Heart, Code2, Users, Code } from "lucide-react";

interface Developer {
  name: string;
  role: string;
  github: string;
  linkedin: string;
}

const developers: Developer[] = [
  {
    name: "Divyanshu",
    role: "Full Stack Developer",
    github: "https://github.com/DivyanshuVortex",
    linkedin: "https://www.linkedin.com/in/divyanshu-chandra-66074926b/",
  },
  {
    name: "Sahitya",
    role: "Full Stack Developer", 
    github: "https://github.com/sahitya-chandra",
    linkedin: "https://www.linkedin.com/in/sahitya-chandra75/",
  },
];

export const Footer = () => {
  const [selectedDev, setSelectedDev] = useState<number | null>(null);

  return (
    <footer className="bg-card border-t-2 border-border minecraft-texture relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container px-4 md:px-6 py-12 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold font-minecraft text-sm">
                RR
              </div>
              <div>
                <span className="text-foreground font-bold text-xl font-minecraft block">
                  DSA Round_Robin
                </span>
                <span className="text-muted-foreground text-xs">
                  Competitive Coding Platform
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Master data structures and algorithms through competitive
              round-robin battles with friends.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-foreground font-bold font-minecraft text-sm uppercase tracking-wider flex items-center gap-2">
              <Code2 size={16} className="text-primary" />
              Quick Links
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="#"
                className="group relative text-muted-foreground hover:text-foreground transition-colors pixel-border-outset px-3 py-2 active:pixel-border-inset w-fit"
              >
                <span>Terms of Service</span>
                <span className="absolute left-0 -top-24 bg-popover border-2 border-primary/50 px-4 py-3 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-20 pixel-border-outset shadow-xl w-64">
                  <strong className="block text-primary font-minecraft mb-1">Terms of Service</strong>
                  <span className="block text-muted-foreground leading-relaxed">
                    Review our platform rules, user agreements, and competitive coding guidelines. Fair play is our priority.
                  </span>
                </span>
              </Link>
              <Link
                href="mailto:contact@dsaroundrobin.com"
                className="group relative text-muted-foreground hover:text-foreground transition-colors pixel-border-outset px-3 py-2 active:pixel-border-inset w-fit"
              >
                <span>Contact Us</span>
                <span className="absolute left-0 -top-28 bg-popover border-2 border-primary/50 px-4 py-3 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-20 pixel-border-outset shadow-xl w-72">
                  <strong className="block text-primary font-minecraft mb-2 flex items-center gap-2">
                    <Mail size={14} />
                    Get in Touch
                  </strong>
                  <span className="block text-muted-foreground leading-relaxed mb-2">
                    Have questions, feedback, or need support? We'd love to hear from you!
                  </span>
                </span>
              </Link>
            </div>
          </div>

          {/* Developers Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-foreground font-bold font-minecraft text-sm uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Meet The Developers
            </h3>
            <div className="flex flex-col gap-3">
              {developers.map((dev, index) => (
                <div
                  key={dev.name}
                  onClick={() => setSelectedDev(selectedDev === index ? null : index)}
                  className={`cursor-pointer transition-all duration-300 pixel-border-outset p-3 ${
                    selectedDev === index
                      ? "bg-primary/10 border-primary"
                      : "bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-minecraft text-sm font-bold text-foreground">
                        {dev.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{dev.role}</p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        selectedDev === index ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>

                  {/* Social Links - Show when selected */}
                  {selectedDev === index && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors pixel-border-outset px-2 py-1 active:pixel-border-inset text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                        <span className="absolute left-0 -top-8 bg-popover border-2 border-border px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 pixel-border-outset">
                          View GitHub profile
                        </span>
                      </a>
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors pixel-border-outset px-2 py-1 active:pixel-border-inset text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                        <span className="absolute left-0 -top-8 bg-popover border-2 border-border px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 pixel-border-outset">
                          View LinkedIn profile
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-border flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <span>© {new Date().getFullYear()} DSA Round_Robin.</span>
            <span className="hidden md:inline">All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
