import { create } from 'zustand';
import type {
  RoomPublicState,
  GamePublicState,
  PlayerPublicState,
  ShowdownResult,
} from '@shared/types';

interface GameStore {
  // Identity
  myId: string;
  myName: string;

  // Room
  roomState: RoomPublicState | null;
  isHost: boolean;

  // Game
  gameState: GamePublicState | null;
  myHand: number[];
  isMyTurn: boolean;
  showdownResults: ShowdownResult[] | null;

  // UI
  connected: boolean;
  error: string | null;

  // Actions
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setRoomState: (state: RoomPublicState) => void;
  setGameState: (state: GamePublicState) => void;
  setMyHand: (cards: number[]) => void;
  setIsMyTurn: (isMyTurn: boolean) => void;
  setShowdownResults: (results: ShowdownResult[] | null) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  myId: localStorage.getItem('poker_player_id') || crypto.randomUUID(),
  myName: localStorage.getItem('poker_player_name') || '',
  roomState: null,
  isHost: false,
  gameState: null,
  myHand: [],
  isMyTurn: false,
  showdownResults: null,
  connected: false,
  error: null,

  setMyId: (id) => {
    localStorage.setItem('poker_player_id', id);
    set({ myId: id });
  },
  setMyName: (name) => {
    localStorage.setItem('poker_player_name', name);
    set({ myName: name });
  },
  setRoomState: (state) => {
    const myId = get().myId;
    set({
      roomState: state,
      isHost: state.hostId === myId,
    });
  },
  setGameState: (state) => set({ gameState: state }),
  setMyHand: (cards) => set({ myHand: cards }),
  setIsMyTurn: (isMyTurn) => set({ isMyTurn }),
  setShowdownResults: (results) => set({ showdownResults: results }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  reset: () => set({
    roomState: null,
    gameState: null,
    myHand: [],
    isMyTurn: false,
    showdownResults: null,
    error: null,
  }),
}));
