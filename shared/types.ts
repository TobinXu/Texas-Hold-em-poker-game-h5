// ============================================
// Texas Hold'em — Shared Types
// ============================================

// --- Card representation ---
// Card = suit * 13 + rank (0-51)
// Suit: 0=spades, 1=hearts, 2=diamonds, 3=clubs
// Rank: 0=2, 1=3, ..., 12=A

export type Suit = 0 | 1 | 2 | 3;
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export function cardToString(card: number): string {
  return `${RANKS[card % 13]}${SUITS[Math.floor(card / 13)]}`;
}

export function cardRank(card: number): Rank {
  return (card % 13) as Rank;
}

export function cardSuit(card: number): Suit {
  return (Math.floor(card / 13)) as Suit;
}

// --- Player Actions ---
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all_in';

// --- Game Phase ---
export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

// --- Room Status ---
export type RoomStatus = 'waiting' | 'playing' | 'finished';

// --- Room Config ---
export interface RoomConfig {
  buyIn: number;
  smallBlind: number;
  bigBlind: number;
}

export const DEFAULT_CONFIG: RoomConfig = {
  buyIn: 1000,
  smallBlind: 5,
  bigBlind: 10,
};

// --- Room State (server internal) ---
export interface RoomState {
  roomId: string;
  hostId: string;
  createdAt: number;
  status: RoomStatus;
  players: Map<string, PlayerState>;
  maxPlayers: number;
  minPlayers: number;
  game: GameState | null;
  config: RoomConfig;
}

// --- Player State (server internal) ---
export interface PlayerState {
  id: string;
  name: string;
  chips: number;
  seatIndex: number;
  isOnline: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  totalBet: number;       // total bet this hand (across all rounds)
}

// --- Side Pot ---
export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

// --- Game State (server internal) ---
export interface GameState {
  phase: GamePhase;
  deck: number[];
  communityCards: number[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  dealerIndex: number;
  activePlayerIndex: number;
  playerOrder: string[];        // player IDs in seat order
  activePlayerIds: string[];    // IDs of players still in the hand (not folded)
  playerHands: Record<string, number[]>;  // playerId -> 2 cards
  actedThisRound: Set<string>;
  lastActionTime: number;
  handNumber: number;
}

// --- Public state sent to clients (no secrets) ---

export interface PlayerPublicState {
  id: string;
  name: string;
  chips: number;
  seatIndex: number;
  isOnline: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  totalBet: number;
  cardCount: number;  // 0 or 2 (don't reveal cards)
}

export interface GamePublicState {
  phase: GamePhase;
  communityCards: number[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  dealerIndex: number;
  activePlayerIndex: number;
  players: PlayerPublicState[];
  handNumber: number;
}

export interface RoomPublicState {
  roomId: string;
  hostId: string;
  status: RoomStatus;
  players: PlayerPublicState[];
  config: RoomConfig;
  maxPlayers: number;
}

// --- Showdown Result ---
export interface ShowdownResult {
  playerId: string;
  playerName: string;
  handName: string;       // e.g. "皇家同花顺", "同花顺", "四条"
  bestCards: number[];    // best 5 cards
  winAmount: number;
  isWinner: boolean;
}

// --- WebSocket Message Protocol ---

// Client → Server
export type ClientMessage =
  | { type: 'join'; playerId: string; name: string }
  | { type: 'leave' }
  | { type: 'start_game' }
  | { type: 'action'; action: PlayerAction; amount?: number }
  | { type: 'chat'; message: string }
  | { type: 'heartbeat' }

// Server → Client
export type ServerMessage =
  | { type: 'room_state'; state: RoomPublicState }
  | { type: 'game_state'; state: GamePublicState }
  | { type: 'your_hand'; cards: number[] }
  | { type: 'action_taken'; playerId: string; playerName: string; action: PlayerAction; amount?: number }
  | { type: 'new_phase'; phase: GamePhase; communityCards: number[] }
  | { type: 'showdown'; results: ShowdownResult[] }
  | { type: 'error'; message: string }
  | { type: 'player_joined'; player: PlayerPublicState }
  | { type: 'player_left'; playerId: string }
  | { type: 'pong' }
  | { type: 'your_turn'; timeLimit: number }

// --- Hand Rankings ---
export const HAND_RANKINGS = [
  '高牌',
  '一对',
  '两对',
  '三条',
  '顺子',
  '同花',
  '葫芦',
  '四条',
  '同花顺',
  '皇家同花顺',
] as const;

export type HandRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
