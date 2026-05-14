import type { PlayerPublicState } from '@shared/types';

interface SeatProps {
  player: PlayerPublicState | null;
  isDealer: boolean;
  isActive: boolean;
  isMe: boolean;
  seatIndex: number;
  totalSeats: number;
}

export default function Seat({ player, isDealer, isActive, isMe, seatIndex }: SeatProps) {
  if (!player) {
    return (
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300/30 flex items-center justify-center opacity-40 bg-black/20">
        <span className="text-xs text-gray-400">空位</span>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center gap-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
      {/* Dealer button */}
      {isDealer && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center z-10 shadow-md">
          D
        </div>
      )}

      {/* Avatar */}
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-lg
        ${player.isFolded ? 'bg-gray-700 opacity-50 saturate-0' : ''}
        ${player.isAllIn ? 'bg-gradient-to-br from-red-700 to-red-500' : ''}
        ${isActive ? 'ring-3 ring-yellow-400 bg-gradient-to-br from-green-700 to-green-500' : 'bg-gradient-to-br from-gray-700 to-gray-600'}
        ${!player.isOnline ? 'opacity-40 saturate-0' : ''}
        ${isMe ? 'ring-2 ring-blue-400' : ''}
      `}>
        {player.name.charAt(0).toUpperCase()}
      </div>

      {/* Name and chips */}
      <div className="text-center bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
        <div className={`text-xs font-medium text-white/90 truncate max-w-20 ${isMe ? 'text-yellow-300' : ''}`}>
          {player.name}{isMe ? ' (你)' : ''}
        </div>
        <div className={`text-xs ${player.chips <= 0 ? 'text-red-400' : 'text-green-300'}`}>
          {player.isAllIn ? (
            <span className="font-bold text-red-300">ALL IN</span>
          ) : (
            `$${player.chips}`
          )}
        </div>
      </div>

      {/* Current bet indicator */}
      {player.currentBet > 0 && (
        <div className="absolute -bottom-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
          ${player.currentBet}
        </div>
      )}

      {/* Folded overlay */}
      {player.isFolded && !player.isFolded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
          <span className="text-red-400 text-xs font-bold bg-black/60 px-2 py-1 rounded">弃牌</span>
        </div>
      )}
    </div>
  );
}
