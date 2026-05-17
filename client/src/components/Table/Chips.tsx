// Poker chips — realistic 3D style with stacking

export const CHIP_DENOMS = [
  { value: 1, color: '#f3f4f6', border: '#d1d5db', text: '#1f2937' },
  { value: 5, color: '#dc2626', border: '#991b1b', text: '#fff' },
  { value: 25, color: '#059669', border: '#065f46', text: '#fff' },
  { value: 100, color: '#1f2937', border: '#000', text: '#fbbf24' },
  { value: 500, color: '#7c3aed', border: '#5b21b6', text: '#fff' },
  { value: 1000, color: '#f59e0b', border: '#b45309', text: '#1f2937' },
] as const;

export function getChipDenom(amount: number) {
  // Find the largest denomination that fits
  for (let i = CHIP_DENOMS.length - 1; i >= 0; i--) {
    if (amount >= CHIP_DENOMS[i].value) return CHIP_DENOMS[i];
  }
  return CHIP_DENOMS[0];
}

export function breakIntoChips(amount: number) {
  const result: { denom: typeof CHIP_DENOMS[number]; count: number }[] = [];
  let remaining = amount;
  for (let i = CHIP_DENOMS.length - 1; i >= 0; i--) {
    const count = Math.floor(remaining / CHIP_DENOMS[i].value);
    if (count > 0) {
      result.push({ denom: CHIP_DENOMS[i], count: Math.min(count, 5) }); // cap at 5 for display
      remaining -= count * CHIP_DENOMS[i].value;
    }
  }
  // If still remaining, add smallest denom
  if (remaining > 0) {
    result.push({ denom: CHIP_DENOMS[0], count: 1 });
  }
  return result;
}

interface SingleChipProps {
  denom: typeof CHIP_DENOMS[number];
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function SingleChip({ denom, size = 'md', style }: SingleChipProps) {
  const sizes = {
    sm: { w: 20, h: 20, font: 8, ring: 2 },
    md: { w: 28, h: 28, font: 11, ring: 3 },
    lg: { w: 36, h: 36, font: 14, ring: 4 },
  };
  const s = sizes[size];

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold select-none flex-shrink-0"
      style={{
        width: s.w,
        height: s.h,
        background: `radial-gradient(circle at 35% 35%, ${denom.color}, ${denom.border})`,
        border: `${Math.max(1, s.ring - 1)}px dashed ${denom.border}`,
        boxShadow: `0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)`,
        color: denom.text,
        fontSize: s.font,
        ...style,
      }}
    >
      {denom.value >= 1000 ? '1k' : denom.value}
    </div>
  );
}

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export function ChipStack({ amount, size = 'md', className, style }: ChipStackProps) {
  if (amount <= 0) return null;
  const chips = breakIntoChips(amount);

  return (
    <div className={`flex items-end gap-0.5 ${className || ''}`} style={style}>
      {chips.map((c, i) => (
        <div key={i} className="flex flex-col-reverse items-center" style={{ marginLeft: i > 0 ? -6 : 0 }}>
          {Array.from({ length: Math.min(c.count, 4) }).map((_, j) => (
            <div key={j} style={{ marginBottom: j > 0 ? -14 : 0, zIndex: j }}>
              <SingleChip
                denom={c.denom}
                size={size}
                style={{
                  transform: `rotate(${j % 2 === 0 ? 2 : -2}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface BetChipsProps {
  amount: number;
}

export function BetChips({ amount }: BetChipsProps) {
  if (amount <= 0) return null;
  const denom = getChipDenom(amount);

  return (
    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
      <div className="flex items-center gap-0.5">
        <SingleChip denom={denom} size="sm" />
        {amount >= denom.value * 2 && <SingleChip denom={denom} size="sm" style={{ marginLeft: -8 }} />}
        {amount >= denom.value * 4 && <SingleChip denom={denom} size="sm" style={{ marginLeft: -8 }} />}
      </div>
      <div
        className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-300 whitespace-nowrap"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        ${amount.toLocaleString()}
      </div>
    </div>
  );
}

interface PotChipsProps {
  amount: number;
}

export function PotChips({ amount }: PotChipsProps) {
  if (amount <= 0) return null;
  const chips = breakIntoChips(amount);

  return (
    <div className="flex items-end justify-center gap-1">
      {chips.map((c, i) => (
        <div key={i} className="flex flex-col-reverse items-center" style={{ marginLeft: i > 0 ? -10 : 0 }}>
          {Array.from({ length: Math.min(c.count, 5) }).map((_, j) => (
            <div key={j} style={{ marginBottom: j > 0 ? -18 : 0, zIndex: j }}>
              <SingleChip
                denom={c.denom}
                size="md"
                style={{
                  transform: `rotate(${j % 2 === 0 ? 3 : -3}deg) translateX(${j % 2 === 0 ? 1 : -1}px)`,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
