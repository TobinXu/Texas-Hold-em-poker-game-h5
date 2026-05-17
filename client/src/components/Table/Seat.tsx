import type { PlayerPublicState } from '@shared/types';
import Card from '../Cards/Card';

interface SeatProps {
  player: PlayerPublicState | null;
  isDealer: boolean;
  isActive: boolean;
  isMe: boolean;
  seatIndex: number;
  showCards?: boolean;
}

export default function Seat({ player, isDealer, isActive, isMe, seatIndex, showCards }: SeatProps) {
  if (!player) {
    return (
      <div className="flex flex-col items-center w-[72px]">
        <div className="w-[72px] h-[52px] rounded-lg bg-black/20 border border-white/[0.04]" />
      </div>
    );
  }

  const isFolded = player.isFolded;

  return (
    <div className="relative flex flex-col items-center w-[72px]">
      {/* Cards above seat (for other players) */}
      {!isMe && player.cardCount === 2 && !isFolded && (
        <div className="flex gap-0.5 mb-0.5" style={{ transform: 'translateY(4px)' }}>
          <Card card={0} faceDown small />
          <Card card={0} faceDown small style={{ marginLeft: -8 }} />
        </div>
      )}

      {/* Dealer button */}
      {isDealer && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-md">
          D
        </div>
      )}

      {/* Seat panel */}
      <div
        className={`w-[72px] rounded-lg overflow-hidden ${isActive && !isFolded ? 'ring-1 ring-yellow-400/60' : ''}`}
        style={{
          background: 'rgba(20, 20, 25, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Avatar placeholder */}
        <div className="flex justify-center pt-1.5 pb-0.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${isFolded ? 'bg-gray-700 opacity-50' : 'bg-gray-600'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Name */}
        <div className={`text-[9px] text-center font-medium truncate px-1 ${isMe ? 'text-yellow-300' : 'text-white/80'} ${isFolded ? 'opacity-40' : ''}`}>
          {player.name}
        </div>

        {/* Chips */}
        <div className={`text-[9px] text-center pb-1 font-mono ${isFolded ? 'text-gray-600' : 'text-emerald-400'}`}>
          {player.isAllIn && !isFolded ? 'ALL IN' : `$${player.chips}`}
        </div>
      </div>

      {/* Current bet - shown as red chip + amount near seat */}
      {player.currentBet > 0 && !isFolded && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-400 shadow-sm" />
          <span className="text-[9px] text-white font-bold whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            ${player.currentBet}
          </span>
        </div>
      )}
    </div>
  );
}
