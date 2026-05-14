import Card from './Card';

interface CommunityCardsProps {
  cards: number[];
}

export default function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4].map(i => (
        cards[i] !== undefined ? (
          <Card key={i} card={cards[i]} small={false} />
        ) : (
          <div key={i} className="w-14 h-20 rounded-lg border-2 border-dashed border-white/20 opacity-30" />
        )
      ))}
    </div>
  );
}
