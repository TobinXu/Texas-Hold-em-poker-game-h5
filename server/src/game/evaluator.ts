// Hand Evaluator for Texas Hold'em
// Evaluates the best 5-card hand from 5, 6, or 7 cards.
// Returns a numeric score where higher = better hand.
// Score encoding: handRank(0-9) * 10^10 + kicker values
//
// Hand rankings:
// 0=High Card, 1=One Pair, 2=Two Pair, 3=Three of a Kind,
// 4=Straight, 5=Flush, 6=Full House, 7=Four of a Kind,
// 8=Straight Flush, 9=Royal Flush

import type { HandRank } from '../../../shared/types';
import { HAND_RANKINGS } from '../../../shared/types';

const RANK_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // index 0=2, 12=A

function rankValue(card: number): number {
  return RANK_VALUES[card % 13];
}

function suitValue(card: number): number {
  return Math.floor(card / 13);
}

function scoreHand(handRank: number, kickers: number[]): number {
  let score = handRank * 1e10;
  for (let i = 0; i < kickers.length; i++) {
    score += kickers[i] * Math.pow(15, 4 - i);
  }
  return score;
}

interface EvalResult {
  score: number;
  handRank: HandRank;
  name: string;
  bestCards: number[];
}

// Generate all C(n,k) combinations
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

// Evaluate exactly 5 cards
function evaluate5(cards: number[]): EvalResult {
  const ranks = cards.map(rankValue).sort((a, b) => b - a);
  const suits = cards.map(suitValue);

  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);

  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    }
    // Ace-low straight (A-2-3-4-5)
    if (uniqueRanks[0] === 14 && uniqueRanks[1] === 5 && uniqueRanks[4] === 2) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Count rank frequencies
  const freq: Record<number, number> = {};
  for (const r of ranks) {
    freq[r] = (freq[r] || 0) + 1;
  }
  const freqEntries = Object.entries(freq)
    .map(([r, c]) => ({ rank: Number(r), count: c }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  // Determine hand rank
  if (isStraight && isFlush) {
    const handRank: HandRank = straightHigh === 14 ? 9 : 8;
    return {
      score: scoreHand(handRank, [straightHigh]),
      handRank,
      name: HAND_RANKINGS[handRank],
      bestCards: cards,
    };
  }

  if (freqEntries[0].count === 4) {
    const kicker = freqEntries[1].rank;
    return {
      score: scoreHand(7, [freqEntries[0].rank, kicker]),
      handRank: 7,
      name: HAND_RANKINGS[7],
      bestCards: cards,
    };
  }

  if (freqEntries[0].count === 3 && freqEntries[1].count === 2) {
    return {
      score: scoreHand(6, [freqEntries[0].rank, freqEntries[1].rank]),
      handRank: 6,
      name: HAND_RANKINGS[6],
      bestCards: cards,
    };
  }

  if (isFlush) {
    return {
      score: scoreHand(5, ranks),
      handRank: 5,
      name: HAND_RANKINGS[5],
      bestCards: cards,
    };
  }

  if (isStraight) {
    return {
      score: scoreHand(4, [straightHigh]),
      handRank: 4,
      name: HAND_RANKINGS[4],
      bestCards: cards,
    };
  }

  if (freqEntries[0].count === 3) {
    const kickers = freqEntries.filter(e => e.count === 1).map(e => e.rank).sort((a, b) => b - a);
    return {
      score: scoreHand(3, [freqEntries[0].rank, ...kickers]),
      handRank: 3,
      name: HAND_RANKINGS[3],
      bestCards: cards,
    };
  }

  if (freqEntries[0].count === 2 && freqEntries[1].count === 2) {
    const pairs = [freqEntries[0].rank, freqEntries[1].rank].sort((a, b) => b - a);
    const kicker = freqEntries[2].rank;
    return {
      score: scoreHand(2, [...pairs, kicker]),
      handRank: 2,
      name: HAND_RANKINGS[2],
      bestCards: cards,
    };
  }

  if (freqEntries[0].count === 2) {
    const kickers = freqEntries.filter(e => e.count === 1).map(e => e.rank).sort((a, b) => b - a);
    return {
      score: scoreHand(1, [freqEntries[0].rank, ...kickers]),
      handRank: 1,
      name: HAND_RANKINGS[1],
      bestCards: cards,
    };
  }

  return {
    score: scoreHand(0, ranks),
    handRank: 0,
    name: HAND_RANKINGS[0],
    bestCards: cards,
  };
}

// Evaluate best hand from 5-7 cards
export function evaluateHand(cards: number[]): EvalResult {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate');
  }

  const combos = combinations(cards, 5);
  let best: EvalResult | null = null;

  for (const combo of combos) {
    const result = evaluate5(combo);
    if (!best || result.score > best.score) {
      best = result;
    }
  }

  return best!;
}

// Compare two hands, return positive if a wins, negative if b wins, 0 if tie
export function compareHands(a: number[], b: number[]): number {
  return evaluateHand(a).score - evaluateHand(b).score;
}
