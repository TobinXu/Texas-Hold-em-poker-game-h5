import Card from './Card';

interface CommunityCardsProps {
  cards: number[];
}

export default function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="flex gap-1 justify-center">
      {[0, 1, 2, 3, 4].map(i => (
        cards[i] !== undefined ? (
          <Card key={i} card={cards[i]} />
        ) : (
          <div
            key={i}
            className="rounded-sm border border-dashed border-white/10"
            style={{ width: 44, height: 60, opacity: 0.15, background: 'rgba(255,255,255,0.02)' }}
          />
        )
      ))}
    </div>
  );
}
