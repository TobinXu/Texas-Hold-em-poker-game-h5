import { SUITS, RANKS } from '@shared/types';

interface CardProps {
  card: number;
  faceDown?: boolean;
  small?: boolean;
  animate?: boolean;
  style?: React.CSSProperties;
}

export default function Card({ card, faceDown = false, small = false, animate = false, style }: CardProps) {
  if (faceDown) {
    return (
      <div
        className={`rounded-sm shadow-md flex items-center justify-center overflow-hidden ${animate ? 'animate-deal' : ''}`}
        style={{
          width: small ? 32 : 44,
          height: small ? 44 : 60,
          background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 50%, #7f1d1d 100%)',
          border: '1px solid rgba(0,0,0,0.2)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          ...style,
        }}
      >
        {/* Red back pattern - diagonal lines */}
        <div
          className="w-full h-full opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
          }}
        />
      </div>
    );
  }

  const rank = RANKS[card % 13];
  const suit = SUITS[Math.floor(card / 13)];
  const isRed = suit === '♥' || suit === '♦';

  return (
    <div
      className={`rounded-sm shadow-md relative flex flex-col ${animate ? 'animate-deal' : ''}`}
      style={{
        width: small ? 34 : 44,
        height: small ? 48 : 60,
        background: 'linear-gradient(165deg, #fff 0%, #f5f5f0 100%)',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        ...style,
      }}
    >
      {/* Top-left */}
      <div className={`absolute top-[1px] left-[2px] flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-black" style={{ fontSize: small ? 8 : 10 }}>{rank}</span>
        <span style={{ fontSize: small ? 7 : 8, marginTop: -2 }}>{suit}</span>
      </div>
      {/* Center */}
      <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="select-none" style={{ fontSize: small ? 18 : 24 }}>{suit}</span>
      </div>
      {/* Bottom-right */}
      <div className={`absolute bottom-[1px] right-[2px] flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-black" style={{ fontSize: small ? 8 : 10 }}>{rank}</span>
        <span style={{ fontSize: small ? 7 : 8, marginTop: -2 }}>{suit}</span>
      </div>
    </div>
  );
}

export function CardBack({ small = false, style }: { small?: boolean; style?: React.CSSProperties }) {
  return <Card card={0} faceDown small={small} style={style} />;
}
