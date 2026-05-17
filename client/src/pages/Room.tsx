import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import Table from '../components/Table/Table';
import ActionPanel from '../components/Actions/ActionPanel';
import type { PlayerAction, ShowdownResult } from '@shared/types';
import { ArrowLeft, Wifi, WifiOff, Crown, Users, Trophy, X, Loader2 } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { send } = useWebSocket(roomId || '');

  const {
    myId,
    roomState,
    gameState,
    connected,
    error,
    showdownResults,
    setShowdownResults,
  } = useGameStore();

  const handleAction = (action: PlayerAction, amount?: number) => {
    send({ type: 'action', action, amount });
  };

  const handleStart = () => {
    sounds.click();
    send({ type: 'start_game' });
  };

  const handleLeave = () => {
    sounds.click();
    send({ type: 'leave' });
    navigate('/');
  };

  if (!roomId) return null;

  const isHost = roomState?.hostId === myId;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #222 0%, #2a2a2a 50%, #222 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={handleLeave} className="flex items-center gap-1 text-gray-500 text-xs hover:text-white transition-colors">
          <ArrowLeft size={13} />
          离开
        </button>

        <div className="text-center">
          <div className="text-yellow-500 font-bold text-xs tracking-wide">房间 {roomId}</div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            {connected ? <Wifi size={8} className="text-emerald-500" /> : <WifiOff size={8} className="text-red-500" />}
            <span className="text-gray-600 text-[8px]">{connected ? '已连接' : '连接中'}</span>
          </div>
        </div>

        <div className="text-gray-600 text-[9px] w-12 text-right font-mono">
          {gameState ? `第${gameState.handNumber}手` : ''}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded text-red-300 text-xs text-center bg-red-500/5 border border-red-500/10">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 flex items-center justify-center py-2">
        <Table gameState={gameState} />
      </div>

      {/* Waiting room */}
      {roomState && roomState.status === 'waiting' && (
        <div className="px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="rounded-lg p-2.5 mb-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
              <Users size={11} />
              玩家 ({roomState.players.length}/{roomState.maxPlayers})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roomState.players.map(p => (
                <div key={p.id} className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${p.isOnline ? 'bg-emerald-700' : 'bg-gray-700'}`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-white/70">{p.name}</span>
                  {p.id === roomState.hostId && <Crown size={9} className="text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleStart}
              disabled={roomState.players.filter(p => p.isOnline).length < 2}
              className="w-full py-3 rounded-lg font-bold text-sm disabled:opacity-30 active:scale-[0.97] transition-transform flex items-center justify-center gap-1"
              style={{
                background: roomState.players.filter(p => p.isOnline).length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg, #fbbf24, #d97706)',
                color: roomState.players.filter(p => p.isOnline).length < 2 ? '#666' : '#000',
              }}
            >
              {roomState.players.filter(p => p.isOnline).length < 2 ? (
                <><Loader2 size={13} className="animate-spin" />等待更多玩家...</>
              ) : (
                <><Trophy size={13} />开始游戏</>
              )}
            </button>
          ) : (
            <div className="text-center text-gray-600 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Loader2 size={13} className="inline animate-spin mr-1" />
              等待房主开始...
            </div>
          )}

          <div className="text-center mt-1 text-gray-700 text-[9px]">
            分享房间号 <span className="text-yellow-600 font-mono">{roomId}</span> 给好友
          </div>
        </div>
      )}

      {/* Action panel */}
      {roomState?.status === 'playing' && (
        <ActionPanel gameState={gameState} onAction={handleAction} />
      )}

      {/* Showdown */}
      {showdownResults && (
        <ShowdownOverlay results={showdownResults} onClose={() => setShowdownResults(null)} />
      )}
    </div>
  );
}

function ShowdownOverlay({ results, onClose }: { results: ShowdownResult[]; onClose: () => void }) {
  const handleClose = () => {
    sounds.click();
    onClose();
  };

  const myId = useGameStore(s => s.myId);
  const iWon = results.some(r => r.isWinner && r.playerId === myId);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-5" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={handleClose}>
      <div className="rounded-xl p-5 max-w-sm w-full" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy size={16} className={iWon ? 'text-yellow-400' : 'text-gray-600'} />
          <h2 className={`text-base font-black ${iWon ? 'text-yellow-400' : 'text-gray-400'}`}>{iWon ? '你赢了！' : '摊牌'}</h2>
        </div>

        <div className="space-y-1.5">
          {results.map(r => (
            <div key={r.playerId} className="flex items-center justify-between p-2 rounded-lg" style={{ background: r.isWinner && r.winAmount > 0 ? 'rgba(251, 191, 36, 0.05)' : 'rgba(255,255,255,0.02)', border: r.isWinner && r.winAmount > 0 ? '1px solid rgba(251, 191, 36, 0.1)' : '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${r.isWinner && r.winAmount > 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                  {r.playerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-xs font-semibold">{r.playerName}</div>
                  <div className="text-gray-600 text-[9px]">{r.handName}</div>
                </div>
              </div>
              <div className={`font-bold text-sm ${r.winAmount > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                {r.winAmount > 0 ? `+$${r.winAmount.toLocaleString()}` : '-'}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleClose} className="w-full mt-4 py-2 rounded-lg text-white text-sm font-bold bg-white/[0.05] border border-white/[0.06] active:scale-[0.97] transition-transform">
          <X size={13} className="inline mr-1" />
          继续
        </button>
      </div>
    </div>
  );
}
