"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Loader2, Menu, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useFriendsListStore } from "@/stores/friendsListStore";

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

let chatSocket: Socket | null = null;

const Chatarea: React.FC<ChatAreaProps> = ({
  currentChatter,
  currentChatterID,
  setIsSidebarOpen,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState<{
    fromUserId: string;
    fromUserName: string;
  } | null>(null);

  const { pendingRequests, unreadMessages, clearUnread } = useFriendsListStore();
  const totalUnreadInfo = Object.values(unreadMessages).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (currentChatterID) {
      clearUnread(currentChatterID);
    }
  }, [currentChatterID, messages]); // Clear when opening or receiving new messages while open

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Unknown";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  // rootSocket for invitations (matches handleInvite implementation)
  const rootSocket = useSocket(userId || "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, incomingInvite, isTyping]);


  // ... (rest of the code until typing indicator) ...

      {/* Typing indicator (Fixed Position) */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[calc(100%-10px)] left-4 text-xs text-muted-foreground italic z-20 mb-2 pointer-events-none"
          >
             <div className="bg-card/80 backdrop-blur-sm px-3 py-1 border pixel-border shadow-sm text-foreground rounded-md flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:1s]"></span>
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:1s]"></span>
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:1s]"></span>
               <span className="ml-1">{currentChatter} is typing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite modal */}

  // ---- Chat Socket (/friends) for Messaging and Typing ----
  useEffect(() => {
    if (!userId) return;

    chatSocket = io(`${API_BASE_URL}/friends`, { 
      auth: { userId },
      withCredentials: true,
      transports: ["websocket"], 
    });

    chatSocket.on("receiveMessage", (msg: Message) => {
      console.log("[ChatSocket] receiveMessage:", msg);
      if (
        msg.senderId === currentChatterID ||
        msg.receiverId === currentChatterID ||
        msg.type === "system"
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    chatSocket.on("typing", ({ fromUserId }) => {
      if (fromUserId === currentChatterID) setIsTyping(true);
    });

    chatSocket.on("stopTyping", ({ fromUserId }) => {
      if (fromUserId === currentChatterID) setIsTyping(false);
    });

    return () => {
      chatSocket?.disconnect();
      chatSocket = null;
    };
  }, [userId, currentChatterID]);

  // ---- Root Socket for Invitations (Friend Duel) ----
  useEffect(() => {
    if (!rootSocket || !userId) return;

    rootSocket.on("invite_received", (invite: any) => {
      console.log("[RootSocket] Received friend invite:", invite);
      setIncomingInvite({
        fromUserId: invite.inviterId,
        fromUserName: invite.inviterName,
      });
    });

    return () => {
      rootSocket.off("invite_received");
    };
  }, [rootSocket, userId]);

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
    if (chatSocket && currentChatterID) {
      chatSocket.emit("typing", { toUserId: currentChatterID });
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        chatSocket?.emit("stopTyping", { toUserId: currentChatterID });
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

    chatSocket?.emit("sendMessage", messageData);
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

  // Invite cool-down state (harmonized with dashboard) -> Keeping for incoming invites maybe? 
  // actually incoming invite logic doesn't use these specific states, they were for SENDING.
  // We can remove sending logic. Use `incomingInvite` and `handleInviteResponse` are still needed for RECEIVING.
  
  // Removed handleInvite logic block

  const handleInviteResponse = async (accepted: boolean) => {
    if (!rootSocket || !incomingInvite) return;

    rootSocket.emit("invite_response", {
      inviterId: incomingInvite.fromUserId,
      response: accepted ? "accept" : "reject",
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
            className="md:hidden p-1.5 sm:p-2 pixel-border-outset bg-card text-foreground hover:brightness-110 flex-shrink-0 relative"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
            {(pendingRequests.length > 0 || totalUnreadInfo > 0) && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full ring-1 ring-background translate-x-1/3 -translate-y-1/3" />
            )}
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
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar relative pb-20">
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

      {/* Typing indicator (Moved above input) */}

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
        <div className="p-1.5 sm:p-3 bg-secondary border-t border-border flex items-center gap-1 sm:gap-2 sticky bottom-0 z-10 transition-colors relative">
           <AnimatePresence>
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-4 mb-2 z-20 pointer-events-none"
              >
                <div className="bg-card/90 backdrop-blur-sm px-3 py-1.5 border pixel-border shadow-sm text-foreground rounded-md flex items-center gap-2 text-xs font-minecraft">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:1s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:1s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:1s]"></span>
                  </div>
                  <span>{currentChatter} is typing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            className="flex-1 bg-input text-foreground pixel-border-inset px-1.5 sm:px-4 py-1.5 sm:py-2.5 outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground text-xs sm:text-sm font-minecraft min-w-0"
            value={newMsg}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentChatter}...`}
          />
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
