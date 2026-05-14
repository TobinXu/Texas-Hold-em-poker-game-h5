import { SUITS, RANKS } from '@shared/types';

interface CardProps {
  card: number;
  faceDown?: boolean;
  small?: boolean;
}

const suitColors: Record<string, string> = {
  '♠': 'text-white',
  '♥': 'text-red-400',
  '♦': 'text-red-400',
  '♣': 'text-white',
};

export default function Card({ card, faceDown = false, small = false }: CardProps) {
  if (faceDown) {
    return (
      <div className={`${small ? 'w-8 h-12' : 'w-12 h-[72px]'} rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 border border-blue-500/50 flex items-center justify-center shadow-lg`}>
        <div className={`${small ? 'w-5 h-8' : 'w-8 h-12'} rounded border border-blue-400/30 bg-blue-700/50`} />
      </div>
    );
  }

  const rank = RANKS[card % 13];
  const suit = SUITS[Math.floor(card / 13)];
  const color = suitColors[suit] || 'text-white';

  return (
    <div className={`${small ? 'w-8 h-12 text-xs' : 'w-12 h-[72px] text-sm'} rounded-lg bg-[#f5f5f0] border border-gray-300 flex flex-col items-center justify-center shadow-lg font-bold ${color}`}>
      <span className="leading-none">{rank}</span>
      <span className={`${small ? 'text-sm' : 'text-lg'} leading-none`}>{suit}</span>
    </div>
  );
}

export function CardBack({ small = false }: { small?: boolean }) {
  return <Card card={0} faceDown small={small} />;
}
