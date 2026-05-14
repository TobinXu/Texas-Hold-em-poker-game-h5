import type { PlayerPublicState } from '@shared/types';

interface SeatProps {
  player: PlayerPublicState | null;
  isDealer: boolean;
  isActive: boolean;
  isMe: boolean;
  seatIndex: number;
  totalSeats: number;
}

export default function Seat({ player, isDealer, isActive, isMe, seatIndex, totalSeats }: SeatProps) {
  if (!player) {
    return (
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600/40 flex items-center justify-center opacity-30">
        <span className="text-xs text-gray-500">空位</span>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center gap-1 ${isActive ? 'scale-110' : ''} transition-transform`}>
      {/* Dealer button */}
      {isDealer && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center z-10">
          D
        </div>
      )}

      {/* Avatar */}
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
        ${player.isFolded ? 'bg-gray-700 opacity-50' : ''}
        ${player.isAllIn ? 'bg-red-600' : ''}
        ${isActive ? 'ring-2 ring-yellow-400 bg-green-700' : 'bg-gray-700'}
        ${!player.isOnline ? 'opacity-40' : ''}
      `}>
        {player.name.charAt(0).toUpperCase()}
      </div>

      {/* Name and chips */}
      <div className="text-center">
        <div className={`text-xs font-medium truncate max-w-20 ${isMe ? 'text-yellow-300' : 'text-white'}`}>
          {player.name}{isMe ? ' (你)' : ''}
        </div>
        <div className={`text-xs ${player.chips <= 0 ? 'text-red-400' : 'text-green-400'}`}>
          {player.isAllIn ? 'ALL IN' : `$${player.chips}`}
        </div>
      </div>

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div className="absolute -bottom-5 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          ${player.currentBet}
        </div>
      )}

      {/* Folded indicator */}
      {player.isFolded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-400 text-xs font-bold bg-black/60 px-2 py-1 rounded">弃牌</span>
        </div>
      )}
    </div>
  );
}
