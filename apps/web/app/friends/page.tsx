"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Friendship/Sidebar";
import Chatarea from "../../components/Friendship/Chatarea";

const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatter, setCurrentChatter] = useState<string | null>(null);
  const [currentChatterID, setCurrentChatterID] = useState<string | null>(null);
  useEffect(() => {
    console.log(currentChatterID);
  }, [currentChatter]);
  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
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
