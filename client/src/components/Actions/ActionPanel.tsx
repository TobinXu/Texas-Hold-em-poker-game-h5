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
  const roomState = useGameStore(s => s.roomState);
  const [raiseAmount, setRaiseAmount] = useState(0);

  if (!gameState || !isMyTurn) {
    return (
      <div className="w-full px-3 py-2.5" style={{ background: '#2a2a2a' }}>
        <span className="text-gray-500 text-xs">{gameState ? '等待其他玩家...' : ''}</span>
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
  const sb = roomState?.config?.smallBlind ?? 5;

  if (raiseAmount === 0 && canRaise) setRaiseAmount(minRaise);

  const handleAction = (action: PlayerAction, amount?: number) => {
    sounds.click();
    onAction(action, amount);
  };

  return (
    <div className="w-full px-2 pt-2 pb-2" style={{ background: '#2a2a2a', borderTop: '1px solid #333' }}>
      {/* Top row: buttons */}
      <div className="flex gap-2 mb-2">
        {/* Fold - dark red */}
        <button
          onClick={() => handleAction('fold')}
          className="flex-1 py-2.5 rounded-md text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(180deg, #8b1a1a, #6b1414)', border: '1px solid rgba(0,0,0,0.3)' }}
        >
          Fold
        </button>

        {/* Check / Call - grey */}
        {canCheck ? (
          <button
            onClick={() => handleAction('check')}
            className="flex-1 py-2.5 rounded-md text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(180deg, #555, #444)', border: '1px solid rgba(0,0,0,0.3)' }}
          >
            Check
          </button>
        ) : (
          <button
            onClick={() => handleAction('call')}
            className="flex-1 py-2.5 rounded-md text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(180deg, #555, #444)', border: '1px solid rgba(0,0,0,0.3)' }}
          >
            Call ${callAmount}
          </button>
        )}

        {/* Raise - green */}
        {canRaise ? (
          <button
            onClick={() => handleAction('raise', raiseAmount)}
            className="flex-1 py-2.5 rounded-md text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(180deg, #2e7d32, #1b5e20)', border: '1px solid rgba(0,0,0,0.3)' }}
          >
            Raise ${raiseAmount}
          </button>
        ) : (
          <div className="flex-1 py-2.5 rounded-md text-gray-600 font-bold text-xs text-center"
            style={{ background: '#333', border: '1px solid #444' }}
          >
            Raise
          </div>
        )}
      </div>

      {/* Slider row */}
      {canRaise && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRaiseAmount(Math.max(minRaise, raiseAmount - sb))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
            style={{ background: 'linear-gradient(180deg, #555, #444)', border: '1px solid #666' }}
          >
            -
          </button>

          <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded-md" style={{ background: '#222' }}>
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={sb}
              value={raiseAmount}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white text-xs font-mono w-10 text-right">${raiseAmount}</span>
          </div>

          <button
            onClick={() => setRaiseAmount(Math.min(maxRaise, raiseAmount + sb))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
            style={{ background: 'linear-gradient(180deg, #555, #444)', border: '1px solid #666' }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
