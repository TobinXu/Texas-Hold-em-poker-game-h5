import { SUITS, RANKS } from '@shared/types';

interface CardProps {
  card: number;
  faceDown?: boolean;
  small?: boolean;
}

const suitColors: Record<string, string> = {
  '♠': 'text-slate-900',
  '♥': 'text-red-600',
  '♦': 'text-red-600',
  '♣': 'text-slate-900',
};

export default function Card({ card, faceDown = false, small = false }: CardProps) {
  if (faceDown) {
    return (
      <div className={`${small ? 'w-8 h-12' : 'w-14 h-20'} rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 border-2 border-blue-300/50 flex items-center justify-center shadow-xl`}>
        <div className="grid grid-cols-3 grid-rows-3 gap-1 opacity-50">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/40" />
          ))}
        </div>
      </div>
    );
  }

  const rank = RANKS[card % 13];
  const suit = SUITS[Math.floor(card / 13)];
  const color = suitColors[suit] || 'text-slate-900';

  return (
    <div className={`
      ${small ? 'w-10 h-14 text-base' : 'w-14 h-20 text-xl'}
      rounded-lg bg-[#f8f8f5] border border-gray-200 shadow-xl flex flex-col items-center justify-center font-bold ${color}
    `}>
      <span className="leading-none">{rank}</span>
      <span className={`${small ? 'text-xl' : 'text-3xl'} leading-none`}>{suit}</span>
    </div>
  );
}

export function CardBack({ small = false }: { small?: boolean }) {
  return <Card card={0} faceDown small={small} />;
}
