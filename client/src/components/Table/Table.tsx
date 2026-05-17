import type { GamePublicState, PlayerPublicState } from '@shared/types';
import Seat from './Seat';
import CommunityCards from '../Cards/CommunityCards';
import Card from '../Cards/Card';
import { useGameStore } from '../../store/gameStore';

interface TableProps {
  gameState: GamePublicState | null;
}

// 6 seats on ellipse
function seatPos(i: number) {
  const angle = Math.PI / 2 - (i / 6) * 2 * Math.PI;
  return { x: Math.cos(angle) * 155, y: Math.sin(angle) * 105 };
}

export default function Table({ gameState }: TableProps) {
  const myId = useGameStore(s => s.myId);
  const myHand = useGameStore(s => s.myHand);

  const players = gameState?.players || [];
  const communityCards = gameState?.communityCards || [];
  const pot = gameState?.pot || 0;
  const dealerIndex = gameState?.dealerIndex ?? -1;
  const activePlayerIndex = gameState?.activePlayerIndex ?? -1;

  const allSeats: (PlayerPublicState | null)[] = Array(6).fill(null);
  for (const p of players) {
    if (p.seatIndex < 6) allSeats[p.seatIndex] = p;
  }

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 380, height: 300 }}>
      {/* Table shadow */}
      <div className="absolute inset-0 rounded-[50%]" style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(12px)', transform: 'scale(1.02)' }} />

      {/* Table edge - dark grey */}
      <div
        className="absolute inset-0 rounded-[50%]"
        style={{
          background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a, #333, #2a2a2a, #3a3a3a)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.05)',
        }}
      />
      <div className="absolute inset-[5px] rounded-[50%]" style={{ background: '#222' }} />

      {/* Felt */}
      <div
        className="absolute inset-[8px] rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse 75% 70% at 50% 50%, #1e8a4a 0%, #157a3a 30%, #0d5e2e 60%, #094020 100%)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner line */}
        <div className="absolute inset-[10px] rounded-[50%] border border-white/[0.04]" />
        <div className="absolute inset-[14px] rounded-[50%] border border-white/[0.02]" />
      </div>

      {/* Pot */}
      {pot > 0 && (
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 z-10 text-center">
          <span className="text-yellow-400 text-sm font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            Total pot: ${pot.toLocaleString()}
          </span>
        </div>
      )}

      {/* Community cards */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-10">
        <CommunityCards cards={communityCards} />
      </div>

      {/* Seats */}
      {allSeats.map((player, i) => {
        const pos = seatPos(i);
        return (
          <div
            key={i}
            className="absolute z-10"
            style={{
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Seat
              player={player}
              isDealer={gameState ? dealerIndex === i : false}
              isActive={gameState ? activePlayerIndex === i : false}
              isMe={player?.id === myId}
              seatIndex={i}
            />
          </div>
        );
      })}

      {/* My hand + timer bar */}
      {myHand.length > 0 && (
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center"
        >
          {/* Timer bar */}
          <div className="w-16 h-1 rounded-full bg-black/50 mb-1 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-[shrink_30s_linear]" />
          </div>
          <div className="flex gap-1">
            {myHand.map((card, i) => (
              <Card key={i} card={card} animate />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
