// Deck: Fisher-Yates shuffle, deal cards

export function createDeck(): number[] {
  const deck: number[] = [];
  for (let i = 0; i < 52; i++) {
    deck.push(i);
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal(deck: number[], count: number): { cards: number[]; remaining: number[] } {
  return {
    cards: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}
