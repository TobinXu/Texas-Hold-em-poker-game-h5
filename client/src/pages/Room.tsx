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
    isMyTurn,
    isHost,
    showdownResults,
    connected,
    error,
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a1628] to-[#1a1a2e]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40">
        <button
          onClick={handleLeave}
          className="text-gray-400 text-sm hover:text-white transition-colors"
        >
          ← 离开
        </button>
        <div className="text-center">
          <div className="text-yellow-400 font-bold text-sm">房间 {roomId}</div>
          <div className="flex items-center justify-center gap-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-500 text-xs">{connected ? '已连接' : '连接中...'}</span>
          </div>
        </div>
        <div className="text-gray-500 text-xs">
          {gameState ? `第${gameState.handNumber}手` : ''}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-3 mt-2 bg-red-900/80 text-red-300 text-sm px-3 py-2 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Table area */}
      <div className="flex-1 flex items-center justify-center py-2">
        <Table gameState={gameState} />
      </div>

      {/* Waiting room overlay */}
      {roomState && roomState.status === 'waiting' && (
        <div className="px-4 py-3">
          {/* Player list */}
          <div className="bg-gray-800/60 rounded-xl p-3 mb-3">
            <div className="text-sm text-gray-400 mb-2">
              玩家 ({roomState.players.length}/{roomState.maxPlayers})
            </div>
            <div className="flex flex-wrap gap-2">
              {roomState.players.map(p => (
                <div key={p.id} className={`flex items-center gap-2 bg-gray-700/60 rounded-lg px-3 py-1.5 ${p.id === myId ? 'ring-1 ring-yellow-400' : ''}`}>
                  <div className={`w-6 h-6 rounded-full ${p.isOnline ? 'bg-green-600' : 'bg-gray-600'} flex items-center justify-center text-xs font-bold`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{p.name}</span>
                  {p.id === roomState.hostId && <span className="text-xs text-yellow-400">房主</span>}
                  {!p.isOnline && <span className="text-xs text-gray-500">离线</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          {isHost ? (
            <button
              onClick={handleStart}
              disabled={roomState.players.filter(p => p.isOnline).length < 2}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold text-lg disabled:opacity-50 transition-all active:scale-95"
            >
              {roomState.players.filter(p => p.isOnline).length < 2
                ? '等待更多玩家加入...'
                : '开始游戏'}
            </button>
          ) : (
            <div className="text-center text-gray-400 py-3">
              等待房主开始游戏...
            </div>
          )}

          {/* Share room code hint */}
          <div className="text-center mt-3 text-gray-500 text-xs">
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-yellow-400 text-center mb-4">摊牌</h2>
        <div className="space-y-3">
          {results.map(r => (
            <div key={r.playerId} className={`flex items-center justify-between p-3 rounded-xl ${r.isWinner ? 'bg-yellow-900/40 ring-1 ring-yellow-400' : 'bg-gray-700/60'}`}>
              <div>
                <div className="text-white font-medium">{r.playerName}</div>
                <div className="text-gray-400 text-sm">{r.handName}</div>
              </div>
              <div className={`font-bold ${r.winAmount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {r.winAmount > 0 ? `+$${r.winAmount}` : '-'}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleClose}
          className="w-full mt-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
        >
          继续
        </button>
      </div>
    </div>
  );
}
