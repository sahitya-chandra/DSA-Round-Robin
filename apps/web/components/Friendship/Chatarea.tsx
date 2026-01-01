"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Loader2, Menu, UserPlus, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

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

  // Invite cool-down state (harmonized with dashboard)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const isCooldownActive = cooldownUntil !== null && Date.now() < cooldownUntil;


  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Unknown";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const socket = useSocket(userId || "");


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, incomingInvite]);

  useEffect(() => {
    if (!socket || !userId) return;

    socket.on("receiveMessage", (msg: Message) => {
      console.log("[Socket] receiveMessage:", msg);
      if (
        msg.senderId === currentChatterID ||
        msg.receiverId === currentChatterID ||
        msg.type === "system"
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", ({ fromUserId }: { fromUserId: string }) => {
      if (fromUserId === currentChatterID) setIsTyping(true);
    });

    socket.on("stopTyping", ({ fromUserId }: { fromUserId: string }) => {
      if (fromUserId === currentChatterID) setIsTyping(false);
    });

    // Invitation logic (from dashboard)
    socket.on("friend_invite", (invite: any) => {
      console.log("Received friend invite:", invite);
      setIncomingInvite({
        fromUserId: invite.fromUserId,
        fromUserName: invite.fromUserName,
      });
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("friend_invite");
    };
  }, [socket, userId, currentChatterID]);


  // ---- Load chat history ----
  useEffect(() => {
    if (!currentChatterID || !userId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/messages`, {
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

  const handleInvite = useCallback(() => {
    if (isCooldownActive || !socket || !currentChatterID) return;

    setInviteStatus("sending");
    console.log("[Invite] Sending invite to", currentChatterID);

    socket.emit("invite_friend", {
      friendId: currentChatterID,
      inviterName: userName,
    });

    const cooldownMs = 10_000;
    setCooldownUntil(Date.now() + cooldownMs);

    const inviteMsg: Message = {
      id: `invite-${Date.now()}`,
      senderId: userId!,
      receiverId: currentChatterID,
      content: `You invited ${currentChatter} to a 1v1 match.`,
      createdAt: new Date().toISOString(),
      type: "system",
    };

    setMessages((prev) => [...prev, inviteMsg]);
    setInviteStatus("pending");

    setTimeout(() => {
      setInviteStatus("idle");
      setCooldownUntil(null);
    }, cooldownMs);
  }, [socket, userId, currentChatterID, userName, isCooldownActive, currentChatter]);


  const handleInviteResponse = async (accepted: boolean) => {
    if (!socket || !incomingInvite) return;

    socket.emit("respond_invite", {
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

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground font-minecraft">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1.5 sm:p-2 pixel-border-outset bg-card text-foreground hover:brightness-110 flex-shrink-0"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold truncate text-foreground min-w-0">
            {currentChatter || "Select a friend"}
          </h2>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-1.5 md:py-2 pixel-border-outset bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-xs sm:text-xs md:text-sm flex-shrink-0"
        >
          <LayoutDashboard size={14} className="sm:w-4 sm:h-4 md:w-4 md:h-4" />
          <span className="hidden xs:inline sm:inline">Dashboard</span>
        </button>
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
                  <div className="text-center text-muted-foreground text-xs italic w-full">
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2 border pixel-border text-sm sm:text-base max-w-[75%] break-words ${
                      msg.senderId === userId
                        ? "bg-accent text-accent-foreground"
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-muted-foreground text-center mt-5 italic">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="bg-card/90 backdrop-blur-sm px-4 py-1.5 border pixel-border shadow-lg text-foreground text-xs font-minecraft italic">
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
            <div className="bg-card border pixel-border px-4 py-2 flex items-center gap-4 shadow-lg">
              <div className="text-sm text-foreground font-minecraft">
                {incomingInvite.fromUserName} invited you to a 1v1 match
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleInviteResponse(true)}
                  className="px-3 py-1 pixel-border-outset bg-primary text-primary-foreground text-xs hover:brightness-110"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleInviteResponse(false)}
                  className="px-3 py-1 pixel-border-outset bg-destructive text-destructive-foreground text-xs hover:brightness-110"
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
        <div className="p-1.5 sm:p-3 bg-secondary border-t border-border flex items-center gap-1 sm:gap-2 sticky bottom-0 z-10 transition-colors">
          <input
            className="flex-1 bg-input text-foreground pixel-border-inset px-1.5 sm:px-4 py-1.5 sm:py-2.5 outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground text-xs sm:text-sm font-minecraft min-w-0"
            value={newMsg}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentChatter}...`}
          />
          <button
            onClick={handleInvite}
            disabled={inviteStatus === "pending" || inviteStatus === "sending"}
            className={`flex items-center justify-center gap-0 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2.5 pixel-border-outset text-xs sm:text-sm font-medium text-primary-foreground shadow-md transition-all flex-shrink-0 ${
              inviteStatus === "pending"
                ? "bg-muted cursor-wait"
                : "bg-accent hover:brightness-110"
            }`}
          >
            {inviteStatus === "pending" ? (
              <>
                <Loader2 size={14} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                <span className="hidden sm:inline ml-1">Waiting...</span>
              </>
            ) : (
              <>
                <UserPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline ml-1">Invite</span>
              </>
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={`flex items-center justify-center bg-primary text-primary-foreground pixel-border-outset hover:brightness-110 transition-all p-1.5 sm:p-2.5 shadow-md flex-shrink-0 ${
              sending ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {sending ? (
              <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-5 sm:h-5" />
            ) : (
              <SendHorizonal className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatarea;
