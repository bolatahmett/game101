import { create } from 'zustand';
import { User } from 'firebase/auth';
import { Room, Player } from '../services/roomService';

interface GameStore {
  // Auth state
  user: User | null;
  isGuest: boolean;
  setUser: (user: User | null, isGuest: boolean) => void;

  // Room state
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  publicRooms: Room[];
  setPublicRooms: (rooms: Room[]) => void;

  // Player state
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;

  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  user: null,
  isGuest: false,
  setUser: (user, isGuest) => set({ user, isGuest }),

  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  publicRooms: [],
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),

  currentPlayer: null,
  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
}));
