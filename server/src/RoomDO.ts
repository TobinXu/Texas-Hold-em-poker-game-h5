// RoomDO — Durable Object for a single poker room
// Handles WebSocket connections, game state, and all game logic

import type {
  RoomState,
  PlayerState,
  GameState,
  RoomPublicState,
  GamePublicState,
  PlayerPublicState,
  ClientMessage,
  ServerMessage,
  RoomConfig,
  ShowdownResult,
  PlayerAction,
} from '../../shared/types';
import { DEFAULT_CONFIG } from '../../shared/types';
import { startHand, processAction } from './game/engine';

interface WebSocketWithPlayer {
  websocket: WebSocket;
  playerId: string;
}

export class RoomDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<string, WebSocketWithPlayer> = new Map();
  private roomState: RoomState | null = null;
  private gameState: GameState | null = null;
  private players: Map<string, PlayerState> = new Map();
  private playerOrder: string[] = [];
  private previousDealerIndex: number = -1;
  private handNumber: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 400 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Extract playerId from query params
      const playerId = url.searchParams.get('playerId') || crypto.randomUUID();
      const playerName = url.searchParams.get('name') || `Player${Math.floor(Math.random() * 1000)}`;

      this.handleSession(server as WebSocket, playerId, playerName);

      return new Response(null, {
        status: 101,
        webSocket: client as any,
      });
    }

    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.getRoomPublicState()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleSession(ws: WebSocket, playerId: string, playerName: string) {
    ws.accept();

    const session: WebSocketWithPlayer = { websocket: ws, playerId };
    this.sessions.set(playerId, session);

    // Auto-join
    this.joinRoom(playerId, playerName);

    // Send current state
    this.sendToPlayer(playerId, { type: 'room_state', state: this.getRoomPublicState() });
    if (this.gameState) {
      this.sendToPlayer(playerId, { type: 'game_state', state: this.getGamePublicState()! });
      // Re-send hand if game is in progress
      if (this.gameState.playerHands[playerId]) {
        this.sendToPlayer(playerId, { type: 'your_hand', cards: this.gameState.playerHands[playerId] });
      }
    }

    // Handle messages
    ws.addEventListener('message', (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ClientMessage;
        this.handleMessage(playerId, msg);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(playerId);
      this.playerDisconnected(playerId);
    });

    ws.addEventListener('error', () => {
      this.sessions.delete(playerId);
      this.playerDisconnected(playerId);
    });
  }

  private handleMessage(playerId: string, msg: ClientMessage) {
    switch (msg.type) {
      case 'join':
        this.joinRoom(playerId, msg.name);
        break;

      case 'leave':
        this.leaveRoom(playerId);
        break;

      case 'start_game':
        this.startGame(playerId);
        break;

      case 'action':
        this.handleAction(playerId, msg.action, msg.amount);
        break;

      case 'chat':
        this.broadcast({
          type: 'chat',
          data: { playerId, playerName: this.players.get(playerId)?.name, message: msg.message },
        } as any);
        break;

      case 'heartbeat':
        this.sendToPlayer(playerId, { type: 'pong' } as any);
        break;
    }
  }

  private initRoom(roomId: string) {
    if (this.roomState) return;

    this.roomState = {
      roomId,
      hostId: '',
      createdAt: Date.now(),
      status: 'waiting',
      players: new Map(),
      maxPlayers: 9,
      minPlayers: 2,
      game: null,
      config: { ...DEFAULT_CONFIG },
    };
  }

  private joinRoom(playerId: string, name: string) {
    if (!this.roomState) {
      this.initRoom(crypto.randomUUID());
    }

    if (this.players.has(playerId)) {
      // Reconnect
      const p = this.players.get(playerId)!;
      p.isOnline = true;
      p.name = name;
      this.broadcastPlayerList();
      return;
    }

    if (this.players.size >= this.roomState!.maxPlayers) {
      this.sendToPlayer(playerId, { type: 'error', message: '房间已满' } as any);
      return;
    }

    if (this.roomState!.status === 'playing') {
      this.sendToPlayer(playerId, { type: 'error', message: '游戏进行中，无法加入' } as any);
      return;
    }

    const seatIndex = this.findAvailableSeat();
    const player: PlayerState = {
      id: playerId,
      name,
      chips: this.roomState!.config.buyIn,
      seatIndex,
      isOnline: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      totalBet: 0,
    };

    this.players.set(playerId, player);
    this.playerOrder.push(playerId);

    // First player is host
    if (this.players.size === 1) {
      this.roomState!.hostId = playerId;
    }

    this.broadcast({
      type: 'player_joined',
      player: this.playerToPublic(player),
    } as any);

    this.broadcastPlayerList();
  }

  private leaveRoom(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    // If game is in progress, mark as offline but keep in hand
    if (this.roomState?.status === 'playing') {
      player.isOnline = false;
      this.broadcast({
        type: 'player_left',
        playerId,
      } as any);
      return;
    }

    // Otherwise remove from room
    this.players.delete(playerId);
    this.playerOrder = this.playerOrder.filter(id => id !== playerId);
    this.sessions.delete(playerId);

    // Transfer host
    if (this.roomState!.hostId === playerId && this.playerOrder.length > 0) {
      this.roomState!.hostId = this.playerOrder[0];
    }

    this.broadcast({
      type: 'player_left',
      playerId,
    } as any);

    this.broadcastPlayerList();
  }

  private playerDisconnected(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.isOnline = false;

    this.broadcast({
      type: 'player_left',
      playerId,
    } as any);

    // If not in game, remove after a delay
    if (this.roomState?.status !== 'playing') {
      setTimeout(() => {
        if (this.players.has(playerId) && !this.sessions.has(playerId)) {
          this.leaveRoom(playerId);
        }
      }, 30000);
    }
  }

  private startGame(playerId: string) {
    if (!this.roomState) return;
    if (this.roomState.hostId !== playerId) {
      this.sendToPlayer(playerId, { type: 'error', message: '只有房主可以开始游戏' } as any);
      return;
    }

    if (this.roomState.status === 'playing') {
      this.sendToPlayer(playerId, { type: 'error', message: '游戏已在进行中' } as any);
      return;
    }

    const activePlayers = this.playerOrder.filter(id => {
      const p = this.players.get(id)!;
      return p.isOnline && p.chips > 0;
    });

    if (activePlayers.length < this.roomState.minPlayers) {
      this.sendToPlayer(playerId, { type: 'error', message: `需要至少${this.roomState.minPlayers}名玩家` } as any);
      return;
    }

    this.roomState.status = 'playing';
    this.playerOrder = activePlayers;
    this.handNumber = 0;

    this.startNewHand();
  }

  private startNewHand() {
    this.handNumber++;
    const result = startHand(this.players, this.playerOrder, this.roomState!.config, this.previousDealerIndex, this.handNumber);

    if (result.handOver) {
      // Not enough players
      this.roomState!.status = 'waiting';
      this.broadcastRoomState();
      return;
    }

    this.gameState = result.gameState;
    this.previousDealerIndex = result.gameState.dealerIndex;

    // Send messages
    for (const msg of result.messages) {
      if (msg.target === 'all') {
        this.broadcast({ type: msg.type, ...msg.data } as any);
      } else {
        this.sendToPlayer(msg.target, { type: msg.type, ...msg.data } as any);
      }
    }

    // Broadcast game state
    this.broadcastGameState();

    // Notify whose turn it is
    this.notifyActivePlayer();
  }

  private handleAction(playerId: string, action: PlayerAction, amount?: number) {
    if (!this.gameState || !this.roomState || this.roomState.status !== 'playing') {
      this.sendToPlayer(playerId, { type: 'error', message: '当前没有进行中的游戏' } as any);
      return;
    }

    const result = processAction(this.gameState, this.players, playerId, action, amount);

    // Send messages
    for (const msg of result.messages) {
      if (msg.target === 'all') {
        this.broadcast({ type: msg.type, ...msg.data } as any);
      } else {
        this.sendToPlayer(msg.target, { type: msg.type, ...msg.data } as any);
      }
    }

    if (result.handOver) {
      this.gameState = null;
      this.roomState.status = 'waiting';

      // Check if any players are broke
      for (const [id, p] of this.players) {
        if (p.chips <= 0) {
          p.chips = 500; // Reset broke players
        }
      }

      this.broadcastRoomState();
      this.broadcastGameState();
      return;
    }

    this.gameState = result.gameState;
    this.broadcastGameState();
    this.notifyActivePlayer();
  }

  private notifyActivePlayer() {
    if (!this.gameState) return;
    const activeId = this.gameState.playerOrder[this.gameState.activePlayerIndex];
    if (activeId) {
      this.sendToPlayer(activeId, { type: 'your_turn', timeLimit: 30 } as any);
    }
  }

  // --- Broadcasting ---

  private broadcast(msg: ServerMessage) {
    const data = JSON.stringify(msg);
    for (const [, session] of this.sessions) {
      try {
        session.websocket.send(data);
      } catch (e) {
        // Connection may be closed
      }
    }
  }

  private sendToPlayer(playerId: string, msg: ServerMessage) {
    const session = this.sessions.get(playerId);
    if (session) {
      try {
        session.websocket.send(JSON.stringify(msg));
      } catch (e) {
        // Connection may be closed
      }
    }
  }

  private broadcastRoomState() {
    this.broadcast({ type: 'room_state', state: this.getRoomPublicState() });
  }

  private broadcastGameState() {
    if (this.gameState) {
      this.broadcast({ type: 'game_state', state: this.getGamePublicState()! });
    }
  }

  private broadcastPlayerList() {
    this.broadcastRoomState();
  }

  // --- State to Public ---

  private getRoomPublicState(): RoomPublicState {
    if (!this.roomState) {
      return {
        roomId: '',
        hostId: '',
        status: 'waiting',
        players: [],
        config: DEFAULT_CONFIG,
        maxPlayers: 9,
      };
    }
    return {
      roomId: this.roomState.roomId,
      hostId: this.roomState.hostId,
      status: this.roomState.status,
      players: Array.from(this.players.values()).map(p => this.playerToPublic(p)),
      config: this.roomState.config,
      maxPlayers: this.roomState.maxPlayers,
    };
  }

  private getGamePublicState(): GamePublicState | null {
    if (!this.gameState) return null;

    return {
      phase: this.gameState.phase,
      communityCards: this.gameState.communityCards,
      pot: this.gameState.pot,
      sidePots: this.gameState.sidePots,
      currentBet: this.gameState.currentBet,
      dealerIndex: this.gameState.dealerIndex,
      activePlayerIndex: this.gameState.activePlayerIndex,
      players: this.playerOrder.map(id => {
        const p = this.players.get(id)!;
        return this.playerToPublic(p);
      }),
      handNumber: this.gameState.handNumber,
    };
  }

  private playerToPublic(p: PlayerState): PlayerPublicState {
    return {
      id: p.id,
      name: p.name,
      chips: p.chips,
      seatIndex: p.seatIndex,
      isOnline: p.isOnline,
      isFolded: p.isFolded,
      isAllIn: p.isAllIn,
      currentBet: p.currentBet,
      totalBet: p.totalBet,
      cardCount: this.gameState?.playerHands[p.id]?.length || 0,
    };
  }

  private findAvailableSeat(): number {
    const taken = new Set(Array.from(this.players.values()).map(p => p.seatIndex));
    for (let i = 0; i < 9; i++) {
      if (!taken.has(i)) return i;
    }
    return this.players.size;
  }
}
