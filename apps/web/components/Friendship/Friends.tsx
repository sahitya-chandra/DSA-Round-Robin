"use client";
import React, { useEffect, useState } from "react";
import { authClient } from "@repo/auth";

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
        const response = await fetch("http://localhost:5000/api/social/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
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

  const Skeleton = () => (
    <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-gray-800 animate-pulse">
      <div className="flex items-center space-x-3">
        <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
        <div className="h-4 w-24 bg-gray-600 rounded"></div>
      </div>
    </div>
  );

  const handleFriendClick = (friend: Friend) => {
    setCurrentChatter(friend.name);
    setCurrentChatterID(friend.id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
      <h3 className="font-semibold text-gray-400 mb-3 text-lg">
        Current Friends
      </h3>

      {loading ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
      ) : friends.length === 0 ? (
        <p className="text-gray-500 text-sm mt-2">No friends found.</p>
      ) : (
        friends.map((friend, i) => (
          <div
            key={friend.id}
            onClick={() => handleFriendClick(friend)}
            className="flex items-center justify-between p-3 mb-2 rounded-lg bg-gray-800 hover:bg-gray-700 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  i % 2 === 0 ? "bg-green-500" : "bg-gray-500"
                }`}
              ></span>
              <div>
                <p className="font-medium text-white">{friend.name}</p>
                <p className="text-gray-400 text-xs">{friend.email}</p>
              </div>
            </div>
            <span className="text-gray-400 text-lg">💬</span>
          </div>
        ))
      )}
    </div>
  );
};

export default Friends;
