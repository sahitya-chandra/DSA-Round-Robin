"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Loader2, Menu, UserPlus } from "lucide-react";
import { authClient } from "@repo/auth";
import { useRouter } from "next/navigation";

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
  type?: "text" | "invite" | "system";
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
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "sending" | "pending" | "expired"
  >("idle");
  const [incomingInvite, setIncomingInvite] = useState<{
    fromUserId: string;
    fromUserName: string;
  } | null>(null);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Unknown";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // ---- Auto-scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, incomingInvite]);

  // ---- Socket setup ----
  useEffect(() => {
    if (!userId) return;

    socket = io("http://localhost:5000/friends", { auth: { userId } });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    socket.on("receiveMessage", (msg: Message) => {
      console.log("[Socket] receiveMessage:", msg);

      if (msg.type === "invite") {
        setIncomingInvite({
          fromUserId: msg.senderId,
          fromUserName: currentChatter || "Unknown",
        });
      }

      if (
        msg.senderId === currentChatterID ||
        msg.receiverId === currentChatterID ||
        msg.type === "system"
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

    // ✅ When backend emits matchStarted, both users redirect
    socket.on("matchStarted", ({ matchId }) => {
      console.log("[Socket] Match started:", matchId);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderId: userId!,
          receiverId: currentChatterID!,
          content: "Match started! Redirecting...",
          createdAt: new Date().toISOString(),
          type: "system",
        },
      ]);
      setTimeout(() => router.push(`/code/${matchId}`), 1000);
    });

    return () => {
      socket?.disconnect();
    };
  }, [userId, currentChatterID]);

  // ---- Load chat history ----
  useEffect(() => {
    if (!currentChatterID || !userId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, friendId: currentChatterID }),
        });
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("[ChatHistory] Error:", err);
      }
    };
    fetchMessages();
  }, [currentChatterID, userId]);

  // ---- Typing ----
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

  // ---- Send message ----
  const handleSend = async () => {
    if (!newMsg.trim() || !currentChatterID || !userId) return;
    setSending(true);

    const messageData: Message = {
      id: `msg-${Date.now()}`,
      senderId: userId,
      receiverId: currentChatterID,
      content: newMsg.trim(),
      createdAt: new Date().toISOString(),
      type: "text",
    };

    socket?.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMsg("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- Send match invite ----
  const handleInvite = useCallback(() => {
    if (!socket || !userId || !currentChatterID) return;
    if (inviteStatus === "pending" || inviteStatus === "sending") return;

    setInviteStatus("sending");
    console.log("[Invite] Sending invite to", currentChatterID);

    socket.emit("matchInvite", {
      fromUserId: userId,
      fromUserName: userName,
      toUserId: currentChatterID,
    });

    const inviteMsg: Message = {
      id: `invite-${Date.now()}`,
      senderId: userId,
      receiverId: currentChatterID,
      content: `${userName} invited you to a 1v1 match.`,
      createdAt: new Date().toISOString(),
      type: "invite",
    };

    setMessages((prev) => [...prev, inviteMsg]);
    setInviteStatus("pending");
  }, [socket, userId, currentChatterID, userName, inviteStatus]);

  // ---- Respond to invite ----
  const handleInviteResponse = async (accepted: boolean) => {
    if (!socket || !incomingInvite) return;

    console.log(
      `[InviteResponse] ${userId} ${
        accepted ? "ACCEPTED" : "DECLINED"
      } invite from ${incomingInvite.fromUserId}`
    );

    socket.emit("respondInvite", {
      fromUserId: incomingInvite.fromUserId,
      accepted,
    });

    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      senderId: userId!,
      receiverId: incomingInvite.fromUserId,
      content: accepted
        ? "You accepted the match invite!"
        : "You declined the match invite.",
      createdAt: new Date().toISOString(),
      type: "system",
    };
    setMessages((prev) => [...prev, systemMsg]);

    setIncomingInvite(null);
  };

  // ---- UI ----
  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-700/70 text-gray-300 hover:text-white"
          >
            <Menu size={26} />
          </button>
          <h2 className="text-lg font-semibold truncate">
            {currentChatter || "Select a friend"}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 hide-scrollbar relative pb-20">
        <AnimatePresence>
          {messages.length ? (
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
                {msg.type === "system" ? (
                  <div className="text-center text-gray-400 text-xs italic w-full">
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm sm:text-base max-w-[75%] break-words ${
                      msg.senderId === userId
                        ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-br-none"
                        : "bg-gray-800/60 text-gray-100 border border-gray-700 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
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

      {/* Typing indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-24 left-6 text-sm text-gray-400 italic"
          >
            <div className="bg-gray-800/50 px-3 py-1 rounded-xl border border-gray-700 shadow-sm">
              {currentChatter} is typing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite modal */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div
            key="incoming-invite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-20"
          >
            <div className="bg-gray-800/90 border border-gray-700 px-4 py-2 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="text-sm text-gray-200">
                {incomingInvite.fromUserName} invited you to a 1v1 match
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleInviteResponse(true)}
                  className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleInviteResponse(false)}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      {currentChatterID && (
        <div className="p-3 bg-gray-800/70 border-t border-gray-700 flex items-center gap-2 sticky bottom-0 z-10">
          <input
            className="flex-1 bg-gray-700/60 text-white rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
            value={newMsg}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentChatter}...`}
          />
          <button
            onClick={handleInvite}
            disabled={inviteStatus === "pending" || inviteStatus === "sending"}
            className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-white shadow-md transition-all ${
              inviteStatus === "pending"
                ? "bg-gray-700 cursor-wait"
                : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            }`}
          >
            {inviteStatus === "pending" ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Waiting...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Invite
              </>
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={`flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all p-2.5 sm:px-4 sm:py-2.5 rounded-2xl shadow-md ${
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
