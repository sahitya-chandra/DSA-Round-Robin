"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Friendship/Sidebar";
import Chatarea from "../../components/Friendship/Chatarea";
import { motion } from "framer-motion";

const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatter, setCurrentChatter] = useState<string | null>(null);
  const [currentChatterID, setCurrentChatterID] = useState<string | null>(null);

  useEffect(() => {
    console.log(currentChatterID);
  }, [currentChatter]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden pt-16 minecraft-texture">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setCurrentChatter={setCurrentChatter}
        setCurrentChatterID={setCurrentChatterID}
      />
      <Chatarea
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentChatter={currentChatter}
        currentChatterID={currentChatterID}
      />
    </div>
  );
};

export default Page;
