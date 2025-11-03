"use client";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Loader2, Menu , UserPlus } from "lucide-react";
import { authClient } from "@repo/auth";

interface ChatAreaProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  currentChatter: string | null;
  currentChatterID: string | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

let socket: Socket | null = null;

const Chatarea: React.FC<ChatAreaProps> = ({
  currentChatter,
  currentChatterID,
  setIsSidebarOpen,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Connect socket once
  useEffect(() => {
    if (!userId) return;

    socket = io("http://localhost:5000", { auth: { userId } });
    console.log("🔌 Socket connected:", socket.id);

    socket.on("receiveMessage", (msg: Message) => {
      if (
        msg.senderId === currentChatterID ||
        msg.receiverId === currentChatterID
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", ({ fromUserId }) => {
      if (fromUserId === currentChatterID) setIsTyping(true);
    });
    socket.on("stopTyping", ({ fromUserId }) => {
      if (fromUserId === currentChatterID) setIsTyping(false);
    });

    return () => {
      socket?.disconnect();
    };
  }, [userId, currentChatterID]);

  // ✅ Load chat history
  useEffect(() => {
    if (!currentChatterID || !userId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, friendId: currentChatterID }),
        });

        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    fetchMessages();
  }, [currentChatterID, userId]);

  // ✅ Send message
  const handleSend = async () => {
    if (!newMsg.trim() || !currentChatterID || !userId) return;
    setSending(true);

    const messageData = {
      senderId: userId,
      receiverId: currentChatterID,
      content: newMsg.trim(),
    };

    socket?.emit("sendMessage", messageData);
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        ...messageData,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewMsg("");
    setSending(false);
  };

  // ✅ Typing handler
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsg(e.target.value);
    if (socket && currentChatterID) {
      socket.emit("typing", { toUserId: currentChatterID });
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        socket?.emit("stopTyping", { toUserId: currentChatterID });
      }, 1500);
    }
  };

  // ✅ Send keyboardEvent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-700/70 text-gray-300 hover:text-white transition-all duration-200"
        >
          <Menu size={26} />
        </button>

        <h2 className="text-lg font-semibold text-white tracking-wide truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
          {currentChatter || "Select a friend to start chatting"}
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 hide-scrollbar relative pb-20">
        <AnimatePresence>
          {messages.length > 0 ? (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.senderId === userId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl shadow-md text-sm sm:text-base max-w-[75%] break-words ${
                    msg.senderId === userId
                      ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-br-none"
                      : "bg-gray-800/60 text-gray-100 border border-gray-700 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-center mt-5 italic">
              No messages yet. Say hi 👋
            </p>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-26 left-6 text-sm text-gray-400 italic flex items-center gap-1"
          >
            <motion.div
              className="flex items-center gap-1 bg-gray-800/50 backdrop-blur-md px-3 py-1 rounded-xl border border-gray-700 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentChatter} is typing
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ...
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      {currentChatterID && (
        <div className="p-3 bg-gray-800/70 border-t border-gray-700 flex items-center gap-2 backdrop-blur-xl sticky bottom-0 z-10 w-full">
          {/* Message Input */}
          <input
            className="flex-1 bg-gray-700/60 text-white rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 placeholder-gray-400 text-sm sm:text-base"
            value={newMsg}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentChatter}...`}
          />

          {/* Invite Button */}
          <button
            onClick={() => console.log("Invite clicked")}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 px-4 py-2.5 rounded-2xl text-sm font-medium text-white shadow-md"
          >
            <UserPlus size={18} />
            Invite to Match
          </button>

          {/* Compact icon version for mobile */}
          <button
            onClick={() => console.log("Invite clicked")}
            className="flex sm:hidden items-center justify-center bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 p-2.5 rounded-2xl shadow-md text-white"
          >
            <UserPlus size={20} />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className={`flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all duration-200 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl shadow-md ${
              sending ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {sending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <SendHorizonal className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatarea;
