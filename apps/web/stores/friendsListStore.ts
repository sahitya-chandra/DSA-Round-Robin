import { create } from "zustand";

type Friend = {
  id: string;
  name: string;
  email: string;
};

interface FriendRequest {
  id: string;
  fromUser: Friend;
  toUser?: Friend;
  createdAt?: string;
}

interface FriendsListState {
  friendsList: Friend[];
  onlineUsers: string[];
  pendingRequests: FriendRequest[];
  unreadMessages: Record<string, number>;
  setFriendsList: (friendsList: Friend[]) => void;
  setOnlineUsers: (onlineUsers: string[]) => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  addPendingRequest: (request: FriendRequest) => void;
  removePendingRequest: (requestId: string) => void;
  incrementUnread: (friendId: string) => void;
  clearUnread: (friendId: string) => void;
}

export const useFriendsListStore = create<FriendsListState>((set) => ({
  friendsList: [],
  onlineUsers: [],
  pendingRequests: [],
  unreadMessages: {},
  setFriendsList: (friendsList) => set({ friendsList }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  addPendingRequest: (request) =>
    set((state) => ({ pendingRequests: [request, ...state.pendingRequests] })),
  removePendingRequest: (requestId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((req) => req.id !== requestId),
    })),
  incrementUnread: (friendId) =>
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [friendId]: (state.unreadMessages[friendId] || 0) + 1,
      },
    })),
  clearUnread: (friendId) =>
    set((state) => {
      const newUnread = { ...state.unreadMessages };
      delete newUnread[friendId];
      return { unreadMessages: newUnread };
    }),
}));