// Game Engine — State machine for Texas Hold'em
import type {
  PlayerState,
  GameState,
  GamePhase,
  PlayerAction,
  RoomConfig,
  ShowdownResult,
  SidePot,
} from '../../../shared/types';
import { createDeck, deal } from './deck';
import { evaluateHand } from './evaluator';
import { calculatePots } from './pots';

export interface EngineAction {
  type: 'action' | 'start_hand' | 'timeout';
  playerId?: string;
  action?: PlayerAction;
  amount?: number;
}

export interface EngineResult {
  gameState: GameState;
  playerStates: Map<string, PlayerState>;
  messages: {
    target: 'all' | string;   // playerId for targeted messages
    type: string;
    data: any;
  }[];
  showdownResults?: ShowdownResult[];
  handOver: boolean;
}

// Find next active player index (not folded, not all-in, still has chips to act)
function nextActiveIndex(
  playerOrder: string[],
  players: Map<string, PlayerState>,
  fromIndex: number,
  direction: 1 | -1 = 1,
): number {
  let idx = fromIndex;
  for (let i = 0; i < playerOrder.length; i++) {
    idx = (idx + direction + playerOrder.length) % playerOrder.length;
    const p = players.get(playerOrder[idx]);
    if (p && !p.isFolded && !p.isAllIn && p.isOnline) {
      return idx;
    }
  }
  return -1; // no active player
}

// Count players still in the hand (not folded)
function countActivePlayers(players: Map<string, PlayerState>, playerIds: string[]): number {
  return playerIds.filter(id => {
    const p = players.get(id);
    return p && !p.isFolded;
  }).length;
}

// Count players who can still act (not folded, not all-in)
function countActablePlayers(players: Map<string, PlayerState>, playerIds: string[]): number {
  return playerIds.filter(id => {
    const p = players.get(id);
    return p && !p.isFolded && !p.isAllIn;
  }).length;
}

// Start a new hand
export function startHand(
  players: Map<string, PlayerState>,
  playerOrder: string[],
  config: RoomConfig,
  previousDealerIndex: number,
  handNumber: number,
): EngineResult {
  const messages: EngineResult['messages'] = [];

  // Filter to players with chips
  const activeIds = playerOrder.filter(id => {
    const p = players.get(id);
    return p && p.chips > 0;
  });

  if (activeIds.length < 2) {
    return {
      gameState: null as any,
      playerStates: players,
      messages: [{ target: 'all', type: 'error', data: { message: '需要至少2名有筹码的玩家' } }],
      handOver: true,
    };
  }

  // Move dealer
  const dealerIndex = (previousDealerIndex + 1) % activeIds.length;

  // Reset player states for new hand
  for (const [id, p] of players) {
    p.isFolded = !activeIds.includes(id);
    p.isAllIn = false;
    p.currentBet = 0;
    p.totalBet = 0;
  }

  // Create and shuffle deck
  const deck = createDeck();

  // Deal 2 cards to each active player
  let remaining = deck;
  const playerHands: Record<string, number[]> = {};
  for (const id of activeIds) {
    const result = deal(remaining, 2);
    playerHands[id] = result.cards;
    remaining = result.remaining;
    // Send hand privately
    messages.push({
      target: id,
      type: 'your_hand',
      data: { cards: result.cards },
    });
  }

  // Post blinds
  const sbIndex = activeIds.length === 2
    ? dealerIndex  // heads-up: dealer is small blind
    : (dealerIndex + 1) % activeIds.length;
  const bbIndex = activeIds.length === 2
    ? (dealerIndex + 1) % activeIds.length  // heads-up: other player is big blind
    : (dealerIndex + 2) % activeIds.length;

  const sbPlayer = players.get(activeIds[sbIndex])!;
  const bbPlayer = players.get(activeIds[bbIndex])!;

  const sbAmount = Math.min(config.smallBlind, sbPlayer.chips);
  sbPlayer.chips -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  sbPlayer.totalBet = sbAmount;
  if (sbPlayer.chips === 0) sbPlayer.isAllIn = true;

  const bbAmount = Math.min(config.bigBlind, bbPlayer.chips);
  bbPlayer.chips -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  bbPlayer.totalBet = bbAmount;
  if (bbPlayer.chips === 0) bbPlayer.isAllIn = true;

  // First to act preflop: player after big blind (or dealer in heads-up after BB)
  let firstToAct: number;
  if (activeIds.length === 2) {
    // Heads-up: dealer/SB acts first preflop
    firstToAct = sbIndex;
  } else {
    firstToAct = (bbIndex + 1) % activeIds.length;
  }

  // Make sure firstToAct is an actable player
  const activeIndex = nextActiveIndex(activeIds, players, (firstToAct - 1 + activeIds.length) % activeIds.length);
  const realFirstToAct = activeIndex >= 0 ? activeIndex : firstToAct;

  const gameState: GameState = {
    phase: 'preflop',
    deck: remaining,
    communityCards: [],
    pot: sbAmount + bbAmount,
    sidePots: [],
    currentBet: bbAmount,
    dealerIndex,
    activePlayerIndex: realFirstToAct,
    playerOrder: activeIds,
    activePlayerIds: activeIds.filter(id => !players.get(id)!.isFolded),
    playerHands,
    actedThisRound: new Set<string>(),
    lastActionTime: Date.now(),
    handNumber,
  };

  // If SB or BB went all-in from blinds, mark them as acted
  if (sbPlayer.isAllIn) gameState.actedThisRound.add(sbPlayer.id);
  if (bbPlayer.isAllIn) gameState.actedThisRound.add(bbPlayer.id);

  return {
    gameState,
    playerStates: players,
    messages,
    handOver: false,
  };
}

// Process a player action
export function processAction(
  game: GameState,
  players: Map<string, PlayerState>,
  playerId: string,
  action: PlayerAction,
  amount?: number,
): EngineResult {
  const messages: EngineResult['messages'] = [];
  const player = players.get(playerId)!;

  // Validate it's this player's turn
  if (game.playerOrder[game.activePlayerIndex] !== playerId) {
    return {
      gameState: game,
      playerStates: players,
      messages: [{ target: playerId, type: 'error', data: { message: '还没轮到你' } }],
      handOver: false,
    };
  }

  // Process action
  switch (action) {
    case 'fold': {
      player.isFolded = true;
      break;
    }
    case 'check': {
      if (game.currentBet > player.currentBet) {
        return {
          gameState: game,
          playerStates: players,
          messages: [{ target: playerId, type: 'error', data: { message: '当前有下注，不能过牌' } }],
          handOver: false,
        };
      }
      break;
    }
    case 'call': {
      const callAmount = Math.min(game.currentBet - player.currentBet, player.chips);
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBet += callAmount;
      if (player.chips === 0) player.isAllIn = true;
      break;
    }
    case 'raise': {
      if (!amount || amount <= game.currentBet) {
        return {
          gameState: game,
          playerStates: players,
          messages: [{ target: playerId, type: 'error', data: { message: '加注金额必须大于当前下注' } }],
          handOver: false,
        };
      }
      const raiseTotal = amount; // total bet this round
      const toAdd = raiseTotal - player.currentBet;
      const actualAdd = Math.min(toAdd, player.chips);
      player.chips -= actualAdd;
      player.currentBet += actualAdd;
      player.totalBet += actualAdd;
      game.currentBet = player.currentBet;
      if (player.chips === 0) player.isAllIn = true;
      // Reset actedThisRound since others need to respond to the raise
      game.actedThisRound = new Set<string>([playerId]);
      break;
    }
    case 'all_in': {
      const allInAmount = player.chips;
      player.totalBet += allInAmount;
      player.currentBet += allInAmount;
      player.chips = 0;
      player.isAllIn = true;
      if (player.currentBet > game.currentBet) {
        game.currentBet = player.currentBet;
        game.actedThisRound = new Set<string>([playerId]);
      }
      break;
    }
  }

  game.actedThisRound.add(playerId);

  // Broadcast action
  messages.push({
    target: 'all',
    type: 'action_taken',
    data: {
      playerId,
      playerName: player.name,
      action,
      amount: action === 'raise' ? player.currentBet : undefined,
    },
  });

  // Check if only one player left
  const activeCount = countActivePlayers(players, game.activePlayerIds);
  if (activeCount === 1) {
    // Remaining player wins
    const winnerId = game.activePlayerIds.find(id => !players.get(id)!.isFolded)!;
    const winner = players.get(winnerId)!;
    winner.chips += game.pot;

    messages.push({
      target: 'all',
      type: 'showdown',
      data: {
        results: [{
          playerId: winnerId,
          playerName: winner.name,
          handName: '对手弃牌',
          bestCards: [],
          winAmount: game.pot,
          isWinner: true,
        }],
      },
    });

    return { gameState: game, playerStates: players, messages, handOver: true };
  }

  // Check if round is complete
  const actableCount = countActablePlayers(players, game.activePlayerIds);
  if (actableCount === 0 || isRoundComplete(game, players)) {
    return advancePhase(game, players, messages);
  }

  // Move to next player
  const nextIdx = nextActiveIndex(game.playerOrder, players, game.activePlayerIndex);
  if (nextIdx >= 0) {
    game.activePlayerIndex = nextIdx;
    game.lastActionTime = Date.now();
  }

  return { gameState: game, playerStates: players, messages, handOver: false };
}

function isRoundComplete(game: GameState, players: Map<string, PlayerState>): boolean {
  const actableIds = game.playerOrder.filter(id => {
    const p = players.get(id);
    return p && !p.isFolded && !p.isAllIn;
  });

  // All actable players have acted and matched the current bet
  return actableIds.every(id => {
    const p = players.get(id)!;
    return game.actedThisRound.has(id) && p.currentBet === game.currentBet;
  });
}

function advancePhase(
  game: GameState,
  players: Map<string, PlayerState>,
  messages: EngineResult['messages'],
): EngineResult {
  // Reset round bets
  for (const [, p] of players) {
    p.currentBet = 0;
  }
  game.currentBet = 0;
  game.actedThisRound = new Set();

  const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIdx = phases.indexOf(game.phase);

  // Check if we should go straight to showdown (only 0-1 actable players)
  const actableCount = countActablePlayers(players, game.activePlayerIds);
  const activeCount = countActivePlayers(players, game.activePlayerIds);

  // All remaining players are all-in → fast forward to showdown
  if (actableCount <= 1 && activeCount > 1) {
    // Deal remaining community cards
    while (game.communityCards.length < 5) {
      const cardsNeeded = game.communityCards.length === 0 ? 3 : 1;
      const result = deal(game.deck, cardsNeeded);
      game.communityCards.push(...result.cards);
      game.deck = result.remaining;
    }
    game.phase = 'showdown';
    messages.push({
      target: 'all',
      type: 'new_phase',
      data: { phase: 'showdown', communityCards: game.communityCards },
    });
    return showdown(game, players, messages);
  }

  if (currentIdx >= 3) {
    // After river → showdown
    game.phase = 'showdown';
    return showdown(game, players, messages);
  }

  // Advance to next phase
  const nextPhase = phases[currentIdx + 1];
  game.phase = nextPhase;

  // Deal community cards
  let cardsToDeal: number;
  if (nextPhase === 'flop') {
    cardsToDeal = 3;
  } else {
    cardsToDeal = 1;
  }

  const result = deal(game.deck, cardsToDeal);
  game.communityCards.push(...result.cards);
  game.deck = result.remaining;

  messages.push({
    target: 'all',
    type: 'new_phase',
    data: { phase: nextPhase, communityCards: game.communityCards },
  });

  // Set first to act (first active player after dealer)
  const firstToAct = nextActiveIndex(game.playerOrder, players, game.dealerIndex);
  game.activePlayerIndex = firstToAct >= 0 ? firstToAct : game.dealerIndex;
  game.lastActionTime = Date.now();

  return { gameState: game, playerStates: players, messages, handOver: false };
}

function showdown(
  game: GameState,
  players: Map<string, PlayerState>,
  messages: EngineResult['messages'],
): EngineResult {
  const activePlayers = game.activePlayerIds.filter(id => !players.get(id)!.isFolded);

  // Calculate pots
  const playerList = Array.from(players.values()).filter(p => game.activePlayerIds.includes(p.id));
  const potResult = calculatePots(playerList);

  // Evaluate each active player's hand
  const evaluations: Record<string, { score: number; handName: string; bestCards: number[] }> = {};
  for (const id of activePlayers) {
    const allCards = [...game.playerHands[id], ...game.communityCards];
    const result = evaluateHand(allCards);
    evaluations[id] = {
      score: result.score,
      handName: result.name,
      bestCards: result.bestCards,
    };
  }

  // Distribute each side pot
  const results: ShowdownResult[] = [];
  const allPots = potResult.sidePots.length > 0
    ? potResult.sidePots
    : [{ amount: game.pot, eligiblePlayerIds: activePlayers }];

  for (const pot of allPots) {
    // Find eligible players still in the hand
    const eligible = pot.eligiblePlayerIds
      .filter(id => !players.get(id)!.isFolded && evaluations[id]);

    if (eligible.length === 0) continue;

    // Find best hand among eligible
    let bestScore = -1;
    for (const id of eligible) {
      if (evaluations[id].score > bestScore) {
        bestScore = evaluations[id].score;
      }
    }

    const winners = eligible.filter(id => evaluations[id].score === bestScore);
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount - share * winners.length;

    for (const id of activePlayers) {
      const p = players.get(id)!;
      const isWinner = winners.includes(id);
      const winAmount = isWinner ? share + (winners[0] === id ? remainder : 0) : 0;

      p.chips += winAmount;

      // Add to results (avoid duplicates)
      const existing = results.find(r => r.playerId === id);
      if (existing) {
        existing.winAmount += winAmount;
        existing.isWinner = existing.isWinner || isWinner;
      } else {
        results.push({
          playerId: id,
          playerName: p.name,
          handName: evaluations[id]?.handName || '弃牌',
          bestCards: evaluations[id]?.bestCards || [],
          winAmount,
          isWinner,
        });
      }
    }
  }

  messages.push({
    target: 'all',
    type: 'showdown',
    data: { results },
  });

  return { gameState: game, playerStates: players, messages, showdownResults: results, handOver: true };
}
