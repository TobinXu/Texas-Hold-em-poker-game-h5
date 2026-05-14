import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import type { ClientMessage, ServerMessage } from '@shared/types';

const HEARTBEAT_INTERVAL = 15000;
const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket(roomId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectDelayRef = useRef(RECONNECT_DELAY);
  const mountedRef = useRef(true);
  const prevPhaseRef = useRef<string>('');

  const {
    myId,
    myName,
    setRoomState,
    setGameState,
    setMyHand,
    setIsMyTurn,
    setShowdownResults,
    setConnected,
    setError,
  } = useGameStore();

  const connect = useCallback(() => {
    if (!roomId || !myId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8787' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/${roomId}?playerId=${encodeURIComponent(myId)}&name=${encodeURIComponent(myName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
      reconnectDelayRef.current = RECONNECT_DELAY;

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        handleMessage(msg);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      clearInterval(heartbeatRef.current);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, reconnectDelayRef.current);

      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
    };

    ws.onerror = () => {
      setError('连接失败，正在重连...');
    };
  }, [roomId, myId, myName]);

  const handleMessage = (msg: ServerMessage) => {
    switch (msg.type) {
      case 'room_state':
        setRoomState(msg.state);
        break;
      case 'game_state':
        // Detect phase change for sound
        if (msg.state.phase !== prevPhaseRef.current && prevPhaseRef.current !== '') {
          if (msg.state.phase === 'showdown') {
            sounds.showdown();
          } else if (['flop', 'turn', 'river'].includes(msg.state.phase)) {
            sounds.newPhase();
          }
        }
        prevPhaseRef.current = msg.state.phase;
        setGameState(msg.state);
        break;
      case 'your_hand':
        setMyHand(msg.cards);
        sounds.deal();
        break;
      case 'your_turn':
        setIsMyTurn(true);
        sounds.yourTurn();
        break;
      case 'showdown':
        setShowdownResults(msg.results);
        setIsMyTurn(false);
        // Win sound if any result shows me as winner
        const isWinner = msg.results.some(r => r.isWinner && r.playerId === myId);
        if (isWinner) {
          setTimeout(() => sounds.win(), 200);
        } else {
          sounds.showdown();
        }
        break;
      case 'action_taken':
        if (msg.playerId === myId) {
          setIsMyTurn(false);
        }
        // Play action-specific sound
        if (msg.action === 'fold') sounds.fold();
        else if (msg.action === 'check') sounds.check();
        else if (msg.action === 'call') sounds.chip();
        else if (msg.action === 'raise') sounds.raise();
        else if (msg.action === 'all_in') sounds.allIn();
        break;
      case 'new_phase':
        if (['flop', 'turn', 'river'].includes(msg.phase)) {
          sounds.newPhase();
        } else if (msg.phase === 'showdown') {
          sounds.showdown();
        }
        prevPhaseRef.current = msg.phase;
        break;
      case 'player_joined':
        sounds.playerJoin();
        break;
      case 'player_left':
        sounds.playerLeave();
        break;
      case 'error':
        sounds.error();
        setError(msg.message);
        break;
      case 'pong':
        break;
    }
  };

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { send };
}
