import type { GamePublicState, PlayerPublicState } from '@shared/types';
import Seat from './Seat';
import CommunityCards from '../Cards/CommunityCards';
import { useGameStore } from '../../store/gameStore';

interface TableProps {
  gameState: GamePublicState | null;
}

// Position seats in an ellipse around the table
function getSeatTransform(seatIndex: number, totalSeats: number): React.CSSProperties {
  const angle = (seatIndex / totalSeats) * 2 * Math.PI - Math.PI / 2;
  const radiusX = 140; // horizontal radius
  const radiusY = 100; // vertical radius
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;

  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
  };
}

export default function Table({ gameState }: TableProps) {
  const myId = useGameStore(s => s.myId);
  const myHand = useGameStore(s => s.myHand);

  const players = gameState?.players || [];
  const communityCards = gameState?.communityCards || [];
  const pot = gameState?.pot || 0;
  const dealerIndex = gameState?.dealerIndex ?? -1;
  const activePlayerIndex = gameState?.activePlayerIndex ?? -1;

  // Pad to 9 seats for consistent layout
  const allSeats: (PlayerPublicState | null)[] = Array(9).fill(null);
  for (const p of players) {
    if (p.seatIndex < 9) {
      allSeats[p.seatIndex] = p;
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: '4/3' }}>
      {/* Table felt */}
      <div className="absolute inset-4 rounded-[50%] bg-gradient-to-b from-green-800 to-green-900 border-4 border-amber-900/60 shadow-2xl">
        {/* Table pattern */}
        <div className="absolute inset-3 rounded-[50%] border border-green-700/50" />
      </div>

      {/* Community cards */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <CommunityCards cards={communityCards} />
      </div>

      {/* Pot */}
      {pot > 0 && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 z-10">
          <div className="bg-black/40 text-yellow-400 text-sm font-bold px-3 py-1 rounded-full">
            底池 ${pot}
          </div>
        </div>
      )}

      {/* Seats */}
      {allSeats.map((player, i) => (
        <div key={i} style={getSeatTransform(i, 9)}>
          <Seat
            player={player}
            isDealer={gameState ? i === dealerIndex : false}
            isActive={gameState ? i === activePlayerIndex : false}
            isMe={player?.id === myId}
            seatIndex={i}
            totalSeats={9}
          />
        </div>
      ))}

      {/* My hand (displayed at bottom, separate from seat) */}
      {myHand.length > 0 && (
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-20">
          <div className="bg-black/50 rounded-xl px-3 py-2">
            <div className="text-center text-xs text-gray-400 mb-1">我的手牌</div>
            <div className="flex gap-1.5">
              {myHand.map((card, i) => (
                <div key={i} className="w-10 h-14 rounded bg-[#f5f5f0] border border-gray-300 flex flex-col items-center justify-center shadow-lg font-bold text-sm">
                  <span className="leading-none">
                    {['2','3','4','5','6','7','8','9','10','J','Q','K','A'][card % 13]}
                  </span>
                  <span className="text-base leading-none">
                    {['♠','♥','♦','♣'][Math.floor(card / 13)]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
