// Pot calculation including side pots
import type { PlayerState, SidePot } from '../../../shared/types';

interface PotResult {
  mainPot: number;
  sidePots: SidePot[];
  distributions: { playerId: string; amount: number }[];
}

// Calculate side pots when players are all-in
export function calculatePots(players: PlayerState[]): PotResult {
  // Collect all unique all-in amounts (total bets this hand)
  const activePlayers = players.filter(p => !p.isFolded);
  const allInPlayers = activePlayers.filter(p => p.isAllIn);

  if (allInPlayers.length === 0) {
    // Simple case: no side pots
    const totalPot = players.reduce((sum, p) => sum + p.totalBet, 0);
    return {
      mainPot: totalPot,
      sidePots: [],
      distributions: [],
    };
  }

  // Get sorted unique all-in amounts
  const allInAmounts = [...new Set(allInPlayers.map(p => p.totalBet))].sort((a, b) => a - b);

  const sidePots: SidePot[] = [];
  let prevAmount = 0;

  for (const amount of allInAmounts) {
    // Each player contributes min(amount, their totalBet) - already contributed to previous pots
    let potAmount = 0;
    const eligible: string[] = [];

    for (const p of activePlayers) {
      const contribution = Math.min(p.totalBet, amount) - prevAmount;
      if (contribution > 0) {
        potAmount += contribution;
      }
      if (p.totalBet >= amount && !p.isFolded) {
        eligible.push(p.id);
      }
    }

    if (potAmount > 0) {
      sidePots.push({ amount: potAmount, eligiblePlayerIds: eligible });
    }
    prevAmount = amount;
  }

  // Remaining pot for players who bet more than the highest all-in
  const maxAllIn = allInAmounts[allInAmounts.length - 1];
  let remainingPot = 0;
  const remainingEligible: string[] = [];

  for (const p of activePlayers) {
    const contribution = p.totalBet - maxAllIn;
    if (contribution > 0) {
      remainingPot += contribution;
    }
    if (p.totalBet > maxAllIn && !p.isFolded && !p.isAllIn) {
      remainingEligible.push(p.id);
    }
  }

  if (remainingPot > 0) {
    // Also include non-all-in players who bet >= maxAllIn
    for (const p of activePlayers) {
      if (!p.isFolded && !p.isAllIn && p.totalBet >= maxAllIn && !remainingEligible.includes(p.id)) {
        remainingEligible.push(p.id);
      }
    }
    sidePots.push({ amount: remainingPot, eligiblePlayerIds: remainingEligible });
  }

  return {
    mainPot: sidePots.reduce((s, p) => s + p.amount, 0),
    sidePots,
    distributions: [],
  };
}

