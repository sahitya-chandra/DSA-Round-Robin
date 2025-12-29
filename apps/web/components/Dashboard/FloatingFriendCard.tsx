"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFriendDuel } from "@/hooks/useFriendDuel";
import { useFriendsListStore } from "@/stores/friendsListStore";

type FloatingFriendCardProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const FloatingFriendCard: React.FC<FloatingFriendCardProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const { loading } = useFriendDuel()
  const friendsList = useFriendsListStore((s) => s.friendsList);
  const onlineUsers = useFriendsListStore((s) => s.onlineUsers);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const isCooldownActive = cooldownUntil !== null && Date.now() < cooldownUntil;
  const remainingSeconds = cooldownUntil
    ? Math.ceil((cooldownUntil - Date.now()) / 1000)
    : 0;

  const handleInvite = async (friendId: string) => {
    if (isCooldownActive) return;

    try {
      setInvitingUserId(friendId);

      console.log("Inviting friend:", friendId);

      const cooldownMs = 10_000;
      setCooldownUntil(Date.now() + cooldownMs);

      setTimeout(() => {
        setInvitingUserId(null);
        setCooldownUntil(null);
      }, cooldownMs);
    } catch (err) {
      console.error("Invite failed", err);
      setInvitingUserId(null);
      setCooldownUntil(null);
    }
  };

  const filteredFriends = useMemo(() => {
    if (!Array.isArray(friendsList)) return [];

    return friendsList
      .map((f) => ({
        ...f,
        online: onlineUsers.includes(f.id),
      }))
      .filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase().trim()) ||
          f.email.toLowerCase().includes(search.toLowerCase().trim())
      );
  }, [friendsList, onlineUsers, search]);

  const online = filteredFriends.filter((f) => f.online);
  const offline = filteredFriends.filter((f) => !f.online);

  /* Animations (mirrors Loader) */
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        when: "afterChildren",
        staggerDirection: -1,
      },
    },
  };

  const contentVariants = {
    hidden: { y: 20, scale: 0.95, opacity: 0 },
    visible: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
    exit: { 
      y: 20, 
      scale: 0.95, 
      opacity: 0, 
      transition: { duration: 0.2 } 
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Top Status Banner (same visual language as Loader) */}
          {/* <motion.div
            variants={contentVariants}
            className="
              mb-6
              bg-card
              border-2 border-primary/20
              px-6 py-4
              shadow-2xl
              flex items-center gap-4
              w-full max-w-md
              pixel-border-outset
              minecraft-texture
            "
          >
            <div className="bg-primary/20 p-2 pixel-border-outset">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-minecraft">
                Friends
              </span>
              <span className="font-bold text-sm font-minecraft">
                Challenge a Friend
              </span>
            </div>
          </motion.div> */}

          {/* Main Modal */}
          <motion.div
            variants={contentVariants}
            className="w-full max-w-md"
          >
            <Card
              className="
                relative
                border-4 border-border
                bg-card
                minecraft-texture
                pixel-border-outset
                shadow-[0_0_50px_rgba(0,0,0,0.6)]
              "
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="
                  absolute top-3 right-3
                  bg-muted
                  border-2 border-border
                  pixel-border-outset
                  p-2
                  text-muted-foreground
                  hover:text-foreground
                  transition
                "
              >
                <X size={18} />
              </button>

              <CardHeader>
                <CardTitle className="text-xl font-minecraft">
                  Select a Friend
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search friends..."
                  className="font-minecraft pixel-border-inset bg-input"
                />

                {/* Online */}
                <div>
                  <h4 className="mb-2 text-sm font-minecraft text-green-500">
                    Online
                  </h4>
                  {online.length > 0 ? (
                    online.map((f) => (
                      <div
                        key={f.id}
                        className="
                          flex items-center gap-2
                          px-3 py-2 mb-1
                          pixel-border-outset
                          bg-primary/10
                          hover:bg-primary/20
                          cursor-pointer
                          transition
                        "
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-minecraft text-sm flex-1 truncate">
                          {f.name}
                        </span>
                        <button
                          disabled={isCooldownActive}
                          onClick={() => handleInvite(f.id)}
                          className={`
                            text-xs px-3 py-1
                            border-2 pixel-border-outset font-minecraft
                            transition
                            ${
                              isCooldownActive
                                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }
                          `}
                        >
                          {invitingUserId === f.id
                            ? "Invited"
                            // : isCooldownActive
                            // ? "Cooldown"
                            : "Invite"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground px-2">
                      No online friends
                    </div>
                  )}
                </div>

                {/* Offline */}
                <div>
                  <h4 className="mb-2 text-sm font-minecraft text-muted-foreground">
                    Offline
                  </h4>
                  {offline.length > 0 ? (
                    offline.map((f) => (
                      <div
                        key={f.id}
                        className="
                          flex items-center gap-2
                          px-3 py-2 mb-1
                          pixel-border-outset
                          bg-muted/30
                        "
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="font-minecraft text-sm flex-1 truncate text-muted-foreground">
                          {f.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground px-2">
                      No offline friends
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
