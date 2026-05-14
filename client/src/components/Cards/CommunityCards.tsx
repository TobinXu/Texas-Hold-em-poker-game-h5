import Card from './Card';

interface CommunityCardsProps {
  cards: number[];
}

export default function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div className="flex gap-1.5 justify-center">
      {[0, 1, 2, 3, 4].map(i => (
        cards[i] !== undefined ? (
          <Card key={i} card={cards[i]} />
        ) : (
          <div key={i} className="w-12 h-[72px] rounded-lg border-2 border-dashed border-green-700/50 opacity-40" />
        )
      ))}
    </div>
  );
}
