"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@repo/auth";
import Friends from "./Friends";

interface User {
  id: string;
  name: string;
  email: string;
}

interface FriendRequest {
  id: string;
  fromUser: User;
  toUser?: User;
}

interface SearchResult extends User {
  friendStatus: "PENDING" | "REJECTED" | "NONE" | "FRIEND";
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setCurrentChatter: (name: string | null) => void;
  setCurrentChatterID: (id: string | null) => void;
}

const API_BASE = "http://localhost:5000/api/social";

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setCurrentChatter,
  setCurrentChatterID,
}) => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activeSendIds, setActiveSendIds] = useState<string[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  // ✅ Helper for safe fetch + JSON parsing
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

  // ✅ Fetch Friend Requests
  const fetchFriendRequests = async () => {
    if (!userId) return;
    setLoadingRequests(true);
    try {
      const data = await safeFetch(`${API_BASE}/requests?userId=${userId}`);
      setFriendRequests(data || []);
    } catch (err) {
      console.error("Failed to fetch friend requests:", err);
      setFriendRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ✅ Send Friend Request
  const sendFriendRequest = async (targetId: string) => {
    if (activeSendIds.includes(targetId) || !userId) return;

    setActiveSendIds((prev) => [...prev, targetId]);
    try {
      const res = await safeFetch(`${API_BASE}/request`, {
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
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setActiveSendIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  // ✅ Accept Friend Request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const res = await safeFetch(`${API_BASE}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.success) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  };

  // ✅ Reject Friend Request
  const rejectFriendRequest = async (requestId: string) => {
    try {
      const res = await safeFetch(`${API_BASE}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.success) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  };

  // ✅ Debounced Search
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
          `${API_BASE}/search?userName=${encodeURIComponent(
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

  useEffect(() => {
    fetchFriendRequests();
  }, [userId]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-950 border-r border-gray-800 transition-transform duration-300
      ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"}
      md:relative md:translate-x-0 md:w-72 md:shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Friends</h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden text-gray-400 hover:text-white transition"
        >
          ✖
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <input
          type="text"
          placeholder="Search or add friend..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        />

        {isSearching && (
          <p className="mt-2 text-gray-400 text-sm">Searching...</p>
        )}
        {!isSearching && searchInput.trim() && searchResults.length === 0 && (
          <p className="mt-2 text-gray-400 text-sm">No users found</p>
        )}
      </div>

      {/* Search Results */}
      {!isSearching && searchResults.length > 0 && (
        <div className="px-4 mt-2 space-y-2">
          {searchResults.map((user) => {
            const isSending = activeSendIds.includes(user.id);
            const isPending = user.friendStatus === "PENDING";
            const isFriend = user.friendStatus === "FRIEND";

            return (
              <div
                key={user.id}
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-white">{user.name}</p>
                  <p className="truncate text-gray-400 text-sm">{user.email}</p>
                </div>

                <button
                  onClick={() => sendFriendRequest(user.id)}
                  disabled={isSending || isPending || isFriend}
                  className={`ml-2 py-1 px-3 rounded-lg text-sm font-medium transition ${
                    isSending
                      ? "bg-gray-600 text-gray-300"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                >
                  {isSending
                    ? "Sending..."
                    : isPending
                    ? "Pending"
                    : isFriend
                    ? "Friends"
                    : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Friend Requests */}
      <div className="px-4 mt-3">
        <button
          onClick={() => setShowRequests(!showRequests)}
          className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-white"
        >
          {showRequests ? "Hide Requests" : "Show Requests"}
        </button>
      </div>

      {showRequests && (
        <div className="p-4 border-t border-gray-800 overflow-y-auto">
          {loadingRequests ? (
            <p className="text-gray-400 text-sm">Loading requests…</p>
          ) : friendRequests.length > 0 ? (
            friendRequests.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center p-2 mb-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
              >
                <span className="truncate text-white">
                  {req.fromUser?.name || req.toUser?.name || "Unknown User"}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(req.id)}
                    className="text-green-500 hover:text-green-400"
                    title="Accept"
                  >
                    ✔
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400"
                    title="Reject"
                    onClick={() => rejectFriendRequest(req.id)} 
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No requests</p>
          )}
        </div>
      )}

      {/* ✅ Friends List */}
      <div className="flex-1 overflow-y-auto border-t border-gray-800 mt-2">
        <Friends
          setCurrentChatter={setCurrentChatter}
          setCurrentChatterID={setCurrentChatterID}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
