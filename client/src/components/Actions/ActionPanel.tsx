import { useState } from 'react';
import type { PlayerAction, GamePublicState } from '@shared/types';
import { useGameStore } from '../../store/gameStore';
import { sounds } from '../../lib/sounds';

interface ActionPanelProps {
  gameState: GamePublicState | null;
  onAction: (action: PlayerAction, amount?: number) => void;
}

export default function ActionPanel({ gameState, onAction }: ActionPanelProps) {
  const isMyTurn = useGameStore(s => s.isMyTurn);
  const myId = useGameStore(s => s.myId);
  const [raiseAmount, setRaiseAmount] = useState(0);

  if (!gameState || !isMyTurn) {
    return (
      <div className="w-full px-4 py-4 bg-black/80 backdrop-blur-sm border-t border-gray-700">
        <div className="text-center text-gray-400 text-sm">
          {gameState ? '等待其他玩家操作...' : ''}
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === myId);
  if (!myPlayer) return null;

  const canCheck = gameState.currentBet === myPlayer.currentBet;
  const callAmount = Math.min(gameState.currentBet - myPlayer.currentBet, myPlayer.chips);
  const minRaise = Math.max(gameState.currentBet * 2, gameState.currentBet + gameState.currentBet);
  const maxRaise = myPlayer.chips + myPlayer.currentBet;
  const canRaise = myPlayer.chips > callAmount;

  // Initialize raise amount
  if (raiseAmount === 0 && canRaise) {
    setRaiseAmount(minRaise);
  }

  const handleAction = (action: PlayerAction, amount?: number) => {
    sounds.click();
    onAction(action, amount);
  };

  return (
    <div className="w-full px-4 py-4 bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-md border-t border-gray-700">
      {/* Timer indicator */}
      {isMyTurn && (
        <div className="w-full h-2 bg-gray-700 rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full animate-[shrink_30s_linear]" />
        </div>
      )}

      <div className="flex gap-3 items-center">
        {/* Fold */}
        <button
          onClick={() => handleAction('fold')}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-95 text-white font-bold text-base shadow-lg transition-all"
        >
          弃牌
        </button>

        {/* Check / Call */}
        {canCheck ? (
          <button
            onClick={() => handleAction('check')}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-95 text-white font-bold text-base shadow-lg transition-all"
          >
            过牌
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-95 text-white font-bold text-base shadow-lg transition-all"
          >
            跟注 ${callAmount}
          </button>
        )}

        {/* Raise */}
        {canRaise && (
          <div className="flex-1 flex flex-col gap-2">
            <button
              onClick={() => handleAction('raise', raiseAmount)}
              className="py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 active:scale-95 text-white font-bold text-base shadow-lg transition-all"
            >
              加注 ${raiseAmount}
            </button>
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={5}
              value={raiseAmount}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className="w-full h-2 accent-green-500"
            />
          </div>
        )}

        {/* All In */}
        <button
          onClick={() => handleAction('all_in')}
          className="px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 active:scale-95 text-white font-bold text-base shadow-lg transition-all whitespace-nowrap"
        >
          ALL IN
        </button>
      </div>
    </div>
  );
}
