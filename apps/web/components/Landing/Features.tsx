"use client";

import React from "react";
import { motion } from "framer-motion";
import { Swords, Brain, Users, Zap, Trophy, Code } from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "1v1 Battles",
    description: "Challenge your friends to real-time coding duels. See who can solve the problem faster and cleaner.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Brain,
    title: "DSA Practice",
    description: "Access a curated library of Data Structures and Algorithms problems ranging from easy to hard.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Peer Learning",
    description: "Learn from others by reviewing their code after the match. Discuss optimal solutions together.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Get real-time test case results and performance metrics for your solutions.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Climb the ranks and showcase your coding prowess to the community.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Code,
    title: "Multi-Language",
    description: "Support for popular programming languages including Python, C++, Java, and JavaScript.",
    color: "from-indigo-500 to-violet-500",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden minecraft-texture">
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-minecraft">
            Everything you need to <span className="text-primary">excel</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete platform designed to help you master coding interviews and competitive programming.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 bg-card border-2 minecraft-texture transition-all hover:-translate-y-1 hover:shadow-xl pixel-border-outset active:pixel-border-inset"
            >
              <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className={`w-12 h-12 bg-accent pixel-border-outset mb-6 flex items-center justify-center relative z-10`}>
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-xl font-bold text-card-foreground mb-3 font-minecraft">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
