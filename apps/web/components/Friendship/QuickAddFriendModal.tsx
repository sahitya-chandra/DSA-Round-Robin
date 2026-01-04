"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface QuickAddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  friendStatus: "PENDING" | "REJECTED" | "NONE" | "FRIEND";
}

const QuickAddFriendModal: React.FC<QuickAddFriendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSendIds, setActiveSendIds] = useState<string[]>([]);
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchInput("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const safeFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("❌ Non-JSON response:", text);
      throw new Error("Server did not return valid JSON");
    }
  };

  // Debounced Search
  useEffect(() => {
    if (!searchInput.trim() || !userId) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await safeFetch(
          `${API_BASE_URL}/api/social/search?userName=${encodeURIComponent(
            searchInput
          )}&userId=${userId}`,
          { signal: controller.signal }
        );

        setSearchResults(res || []);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput, userId]);

  const sendFriendRequest = async (targetId: string) => {
    if (activeSendIds.includes(targetId) || !userId) return;

    setActiveSendIds((prev) => [...prev, targetId]);
    try {
      const res = await safeFetch(`${API_BASE_URL}/api/social/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId: targetId }),
      });

      if (res.success) {
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === targetId ? { ...u, friendStatus: "PENDING" } : u
          )
        );
        toast.success("Friend request sent!");
      } else {
        toast.error(res.message || "Failed to send request");
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("An error occurred");
    } finally {
      setActiveSendIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70] px-4"
          >
            <div className="bg-card border-2 pixel-border border-border shadow-xl overflow-hidden font-minecraft">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground tracking-wide">
                    Add Friend
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2 bg-background border-2 pixel-border-inset border-border focus:border-primary focus:ring-0 outline-none transition-colors"
                  />
                </div>

                <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => {
                      const isSending = activeSendIds.includes(user.id);
                      const isPending = user.friendStatus === "PENDING";
                      const isFriend = user.friendStatus === "FRIEND";
                      const isSelf = user.id === userId;

                      if (isSelf) return null;

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-muted/20 border-2 pixel-border border-transparent hover:border-primary/20 hover:bg-muted/40 transition-all rounded-sm"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium truncate text-foreground">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          
                          {isFriend ? (
                             <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">Friends</span>
                          ) : isPending ? (
                             <span className="text-yellow-500 text-xs font-bold px-2 py-1 bg-yellow-500/10 rounded">Pending</span>
                          ) : (
                            <button
                              onClick={() => sendFriendRequest(user.id)}
                              disabled={isSending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold pixel-border-outset hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              {isSending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserPlus className="w-3 h-3" />
                              )}
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : searchInput.trim() ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                      <p className="text-sm">No users found</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 opacity-60">
                      <UserPlus className="w-8 h-8 mb-2" />
                      <p className="text-sm">Type a name to search</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickAddFriendModal;
