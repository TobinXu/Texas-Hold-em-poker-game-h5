import type { GamePublicState, PlayerPublicState } from '@shared/types';
import Seat from './Seat';
import CommunityCards from '../Cards/CommunityCards';
import Card from '../Cards/Card';
import { useGameStore } from '../../store/gameStore';

interface TableProps {
  gameState: GamePublicState | null;
}

// Custom seat positions for better mobile layout
// 0 = bottom (my spot), 1-8 going clockwise left → top → right
// This way you always see your seat at the bottom on mobile
const SEAT_POSITIONS: { x: number; y: number }[] = [
  { x: 0, y: 130 },    // 0: bottom center (my seat usually here)
  { x: -90, y: 100 },  // 1: bottom-left
  { x: -140, y: 50 },  // 2: left-middle
  { x: -120, y: -30 }, // 3: top-left
  { x: -40, y: -80 },  // 4: top-left-center
  { x: 40, y: -80 },   // 5: top-right-center
  { x: 120, y: -30 },  // 6: top-right
  { x: 140, y: 50 },   // 7: right-middle
  { x: 90, y: 100 },   // 8: bottom-right
];

export default function Table({ gameState }: TableProps) {
  const myId = useGameStore(s => s.myId);
  const myHand = useGameStore(s => s.myHand);

  const players = gameState?.players || [];
  const communityCards = gameState?.communityCards || [];
  const pot = gameState?.pot || 0;
  const dealerIndex = gameState?.dealerIndex ?? -1;
  const activePlayerIndex = gameState?.activePlayerIndex ?? -1;

  // Reorder seats to keep my seat at bottom on mobile
  const mySeatIndex = players.find(p => p.id === myId)?.seatIndex ?? 0;
  const allSeats: (PlayerPublicState | null)[] = Array(9).fill(null);
  for (const p of players) {
    // We already use 0-9 indices from server, just render at custom positions
    allSeats[p.seatIndex] = p;
  }

  return (
    <div className="relative w-full max-w-lg mx-auto pb-16" style={{ aspectRatio: '4/3' }}>
      {/* Table felt background */}
      <div className="absolute inset-0 -top-4 rounded-[50%] bg-gradient-to-br from-[#0f7037] via-[#0d5e2e] to-[#094020] border-[6px] border-amber-800/70 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {/* Subtle texture overlay */}
        <div className="absolute inset-3 rounded-[50%] border-2 border-green-300/15 bg-green-400/[0.03]" />
      </div>

      {/* Community cards container */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="bg-black/30 px-4 py-2 rounded-2xl backdrop-blur-sm">
          <div className="text-[10px] text-yellow-200/80 mb-1 text-center uppercase tracking-wide font-medium">公共牌</div>
          <CommunityCards cards={communityCards} />
        </div>
      </div>

      {/* Pot display */}
      {pot > 0 && (
        <div className="absolute left-1/2 top-[25%] -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 text-yellow-300 px-5 py-2 rounded-full shadow-lg border border-amber-600/50 backdrop-blur-sm">
            <div className="text-sm font-bold tracking-wide">底池 ${pot}</div>
          </div>
        </div>
      )}

      {/* Seats */}
      {allSeats.map((player, i) => {
        const pos = SEAT_POSITIONS[i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Seat
              player={player}
              isDealer={gameState ? (dealerIndex === i) : false}
              isActive={gameState ? (activePlayerIndex === i) : false}
              isMe={player?.id === myId}
              seatIndex={i}
              totalSeats={9}
            />
          </div>
        );
      })}

      {/* My hand - LARGE at bottom center (outside table circle) */}
      {myHand.length > 0 && (
        <div className="absolute left-1/2 bottom-[-10px] -translate-x-1/2 z-20 bg-gradient-to-b from-black/70 to-black/80 rounded-2xl px-5 py-3 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="text-center text-xs text-yellow-200/80 mb-2 uppercase tracking-wide font-medium">我的手牌</div>
          <div className="flex gap-3">
            {myHand.map((card, i) => (
              <Card key={i} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
