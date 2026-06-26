import { create } from "zustand";

export interface LobbyPlayer {
  id: string;
  name: string;
  joinedAt: string;
}

export interface LobbyState {
  code: string;
  hostId: string;
  maxPlayers: number;
  minPlayers: number;
  status: "WAITING" | "STARTED" | "CLOSED";
  createdAt: string;
  matchId?: string;
  players: LobbyPlayer[];
}

interface LobbyStore {
  lobby: LobbyState | null;
  setLobby: (lobby: LobbyState | null) => void;
  clearLobby: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobby: null,
  setLobby: (lobby) => set({ lobby }),
  clearLobby: () => set({ lobby: null }),
}));
