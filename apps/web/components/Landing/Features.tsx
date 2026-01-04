"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative p-8 bg-card border-2 minecraft-texture pixel-border-outset active:pixel-border-inset hover:bg-muted/5 transition-colors cursor-default select-none"
    >
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="relative z-10"
      >
        <div className={`w-14 h-14 bg-accent pixel-border-outset mb-6 flex items-center justify-center relative group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300`}>
          <feature.icon className="w-7 h-7 text-primary group-hover:rotate-12 transition-transform" />
          
          {/* Subtle glow effect behind icon */}
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <h3 className="text-xl font-bold text-card-foreground mb-3 font-minecraft group-hover:text-primary transition-colors">
          {feature.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Card highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};

export const Features = () => {
  return (
    <section className="py-32 bg-background relative overflow-hidden minecraft-texture">
      {/* Background Decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 text-balance">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-minecraft tracking-tight"
          >
            How <span className="text-primary italic">DSA Round Robin</span> Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-muted-foreground text-lg md:text-xl font-medium"
          >
            Play with random or challenge a friend, and code in real-time. See who solves it faster!
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
