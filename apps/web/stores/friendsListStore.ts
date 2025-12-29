import { create } from "zustand";

type Friend = {
  id: string;
  name: string;
  email: string;
};

interface FriendsListState {
	friendsList: Friend[];
	onlineUsers: string[];
	setFriendsList: (friendsList: Friend[]) => void;
	setOnlineUsers: (onlineUsers: string[]) => void
}

export const useFriendsListStore = create<FriendsListState>((set) => ({
	friendsList: [],
	onlineUsers: [],
	setFriendsList: (friendsList) => set({ friendsList }),
	setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
}))