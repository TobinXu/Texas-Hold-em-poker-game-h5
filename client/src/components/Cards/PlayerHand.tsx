import Card from './Card';

interface PlayerHandProps {
  cards: number[];
  isRevealed?: boolean;
}

export default function PlayerHand({ cards, isRevealed = true }: PlayerHandProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex gap-1 justify-center">
      {cards.map((card, i) => (
        <Card key={i} card={isRevealed ? card : 0} faceDown={!isRevealed} small />
      ))}
    </div>
  );
}
