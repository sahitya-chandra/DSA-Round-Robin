"use client";
import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { useFriendsListStore } from "@/stores/friendsListStore";

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface FriendsProps {
  setCurrentChatter: (name: string | null) => void;
  setCurrentChatterID: (id: string | null) => void;
}

const Friends: React.FC<FriendsProps> = ({
  setCurrentChatter,
  setCurrentChatterID,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchFriends = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/social/friends`, {
          credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch friends");

        const data = await response.json();
        const fetchedFriends = Array.isArray(data)
          ? data
          : data.friends || [];

        setFriends(fetchedFriends);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [session?.user?.id]);

  const handleFriendClick = (friend: Friend) => {
    setCurrentChatter(friend.name);
    setCurrentChatterID(friend.id);
  };

  const { onlineUsers, unreadMessages } = useFriendsListStore();

  return (
    <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar font-minecraft">
      <h3 className="font-semibold text-muted-foreground mb-2 md:mb-3 text-sm md:text-lg px-1 text-balance">
        Current Friends
      </h3>

      {loading ? (
        Array.from({ length: 8 }).map((_, i) => <ListItemSkeleton key={i} />)
      ) : friends.length === 0 ? (
        <p className="text-muted-foreground text-sm mt-2 px-1">No friends found.</p>
      ) : (
        friends.map((friend) => {
          const isOnline = onlineUsers.includes(friend.id);
          const unreadCount = unreadMessages[friend.id] || 0;

          return (
            <div
              key={friend.id}
              onClick={() => handleFriendClick(friend)}
              className="flex items-center justify-between p-2 md:p-3 mb-2 bg-card border pixel-border hover:bg-muted hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 transition-colors duration-300 ${
                    isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-500"
                  }`}
                ></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm md:text-base truncate">
                    {friend.name}
                  </p>
                  <div className="flex mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] pixel-border-outset ${isOnline ? "bg-green-500/20 text-green-600 border-green-500/30" : "bg-muted text-muted-foreground/70 border-border"}`}>
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <div className="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 shadow-sm">
                    {unreadCount}
                  </div>
                )}
                <span className="text-muted-foreground text-base md:text-lg flex-shrink-0">
                  💬
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};


export default Friends;
