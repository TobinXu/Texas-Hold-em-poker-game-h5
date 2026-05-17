import { PotChips } from './Chips';
import { Coins } from 'lucide-react';

interface PotDisplayProps {
  amount: number;
  sidePots?: { amount: number; eligiblePlayerIds: string[] }[];
}

export default function PotDisplay({ amount, sidePots }: PotDisplayProps) {
  if (amount <= 0 && (!sidePots || sidePots.length === 0)) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Main pot */}
      <div
        className="px-5 py-2 rounded-2xl flex flex-col items-center gap-1"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Coins size={12} className="text-yellow-400/70" />
          <span className="text-[10px] text-yellow-200/60 uppercase tracking-[0.2em] font-semibold">
            底池
          </span>
        </div>
        <span
          className="text-lg font-black tracking-wide"
          style={{
            color: '#fbbf24',
            textShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
          }}
        >
          ${amount.toLocaleString()}
        </span>
      </div>

      {/* Chips visual */}
      <div className="mt-1">
        <PotChips amount={amount} />
      </div>

      {/* Side pots */}
      {sidePots && sidePots.length > 0 && (
        <div className="flex gap-2 mt-1">
          {sidePots.map((sp, i) => (
            <div
              key={i}
              className="px-2 py-1 rounded-lg text-[10px]"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-yellow-300/70">边池{i + 1}:</span>
              <span className="text-yellow-400 font-bold ml-1">${sp.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
