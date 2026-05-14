import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import Table from '../components/Table/Table';
import ActionPanel from '../components/Actions/ActionPanel';
import type { PlayerAction, ShowdownResult } from '@shared/types';

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#081223] to-[#0f172a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/10">
        <button
          onClick={handleLeave}
          className="text-gray-300 text-sm hover:text-white transition-colors font-medium"
        >
          ← 离开
        </button>
        <div className="text-center">
          <div className="text-yellow-400 font-bold text-base">房间 {roomId}</div>
          <div className="flex items-center justify-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-400 text-xs">{connected ? '已连接' : '连接中...'}</span>
          </div>
        </div>
        <div className="text-gray-400 text-xs w-16 text-right">
          {gameState ? `第${gameState.handNumber}手` : ''}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-4 mt-3 bg-red-900/80 text-red-200 text-sm px-4 py-2 rounded-lg text-center border border-red-500/50">
          {error}
        </div>
      )}

      {/* Table area */}
      <div className="flex-1 flex items-center justify-center py-6">
        <Table gameState={gameState} />
      </div>

      {/* Waiting room overlay */}
      {roomState && roomState.status === 'waiting' && (
        <div className="px-4 py-4 bg-black/50 backdrop-blur-md">
          {/* Player list */}
          <div className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-white/10">
            <div className="text-sm text-gray-300 mb-3 font-medium">
              玩家 ({roomState.players.length}/{roomState.maxPlayers})
            </div>
            <div className="flex flex-wrap gap-2">
              {roomState.players.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 bg-slate-700/80 rounded-xl px-3 py-2 ${p.id === myId ? 'ring-2 ring-yellow-400' : ''} border border-white/10`}
                >
                  <div className={`w-8 h-8 rounded-full ${p.isOnline ? 'bg-green-600' : 'bg-gray-600'} flex items-center justify-center text-sm font-bold text-white`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{p.name}</span>
                  {p.id === roomState.hostId && (
                    <span className="text-xs text-yellow-300 bg-yellow-500/20 px-1.5 rounded">房主</span>
                  )}
                  {!p.isOnline && (
                    <span className="text-xs text-gray-400">离线</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          {isHost ? (
            <button
              onClick={handleStart}
              disabled={roomState.players.filter(p => p.isOnline).length < 2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xl disabled:opacity-50 transition-all active:scale-95 shadow-xl"
            >
              {roomState.players.filter(p => p.isOnline).length < 2
                ? '等待更多玩家加入...'
                : '开始游戏'}
            </button>
          ) : (
            <div className="text-center text-gray-400 py-4 rounded-xl bg-slate-800/60">
              等待房主开始游戏...
            </div>
          )}

          {/* Share room code hint */}
          <div className="text-center mt-3 text-gray-400 text-xs">
            分享房间号 <span className="text-yellow-400 font-mono font-bold">{roomId}</span> 给好友加入
          </div>
        </div>
      )}

      {/* Action panel */}
      {roomState?.status === 'playing' && (
        <ActionPanel gameState={gameState} onAction={handleAction} />
      )}

      {/* Showdown overlay */}
      {showdownResults && (
        <ShowdownOverlay
          results={showdownResults}
          onClose={() => setShowdownResults(null)}
        />
      )}
    </div>
  );
}

function ShowdownOverlay({ results, onClose }: { results: ShowdownResult[]; onClose: () => void }) {
  const handleClose = () => {
    sounds.click();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-6" onClick={handleClose}>
      <div
        className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-yellow-400 text-center mb-4">摊牌</h2>
        <div className="space-y-3">
          {results.map(r => (
            <div
              key={r.playerId}
              className={`flex items-center justify-between p-3 rounded-xl ${
                r.isWinner && r.winAmount > 0
                  ? 'bg-yellow-900/40 ring-2 ring-yellow-400/50 border border-yellow-400/30'
                  : 'bg-slate-700/60 border border-white/10'
              }`}
            >
              <div>
                <div className="text-white font-medium">{r.playerName}</div>
                <div className="text-gray-400 text-sm">{r.handName}</div>
              </div>
              <div className={`font-bold ${r.winAmount > 0 ? 'text-green-400' : 'text-gray-500'} text-base`}>
                {r.winAmount > 0 ? `+$${r.winAmount}` : '-'}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleClose}
          className="w-full mt-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors border border-white/10"
        >
          继续
        </button>
      </div>
    </div>
  );
}
