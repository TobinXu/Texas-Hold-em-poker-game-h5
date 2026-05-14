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
      <div className="w-full px-4 py-3">
        <div className="text-center text-gray-500 text-sm">
          {gameState ? '等待其他玩家操作...' : ''}
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === myId);
  if (!myPlayer) return null;

  const canCheck = gameState.currentBet === myPlayer.currentBet;
  const callAmount = Math.min(gameState.currentBet - myPlayer.currentBet, myPlayer.chips);
  const minRaise = gameState.currentBet * 2;
  const maxRaise = myPlayer.chips + myPlayer.currentBet;
  const canRaise = myPlayer.chips > callAmount;

  if (raiseAmount === 0 && canRaise) {
    setRaiseAmount(minRaise);
  }

  const handleAction = (action: PlayerAction, amount?: number) => {
    sounds.click();
    onAction(action, amount);
  };

  return (
    <div className="w-full px-3 py-2 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700">
      {/* Timer indicator */}
      <div className="w-full h-1 bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full animate-[shrink_30s_linear]" />
      </div>

      <div className="flex gap-2 items-center">
        {/* Fold */}
        <button
          onClick={() => handleAction('fold')}
          className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm transition-colors"
        >
          弃牌
        </button>

        {/* Check / Call */}
        {canCheck ? (
          <button
            onClick={() => handleAction('check')}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-colors"
          >
            过牌
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-colors"
          >
            跟注 ${callAmount}
          </button>
        )}

        {/* Raise */}
        {canRaise && (
          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={() => handleAction('raise', raiseAmount)}
              className="py-3 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm transition-colors"
            >
              加注 ${raiseAmount}
            </button>
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              value={raiseAmount}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className="w-full h-1 accent-green-500"
            />
          </div>
        )}

        {/* All In */}
        <button
          onClick={() => handleAction('all_in')}
          className="py-3 px-4 rounded-xl bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white font-bold text-sm transition-colors whitespace-nowrap"
        >
          ALL IN
        </button>
      </div>
    </div>
  );
}
