import { ScoringMode } from '../models/GameDefinition';

export interface PlayerResult {
  playerId: string;
  playerName: string;
  rank: number;
  score?: number;
}

export interface ScoredResult extends PlayerResult {
  pointsEarned: number;
}

/**
 * Calculate points for pointing system (prize pool distribution)
 * - Prize pool = playerCount × pointsPerPlayer
 * - 1st place: 2/3 of pool (rounded up)
 * - 2nd place: 2/3 of remainder (rounded up)
 * - 3rd place: All remaining
 * - 4th+ place: 0 points
 */
export function calculatePointingSystemScores(
  playerCount: number,
  pointsPerPlayer: number,
  results: PlayerResult[]
): ScoredResult[] {
  const totalPool = playerCount * pointsPerPlayer;
  let remainingPool = totalPool;

  // Sort by rank (just to be sure)
  const sortedResults = [...results].sort((a, b) => a.rank - b.rank);

  return sortedResults.map((result, index) => {
    let pointsEarned = 0;

    if (index === 0) {
      // 1st place: 2/3 of pool (rounded up)
      pointsEarned = Math.ceil((remainingPool * 2) / 3);
      remainingPool -= pointsEarned;
    } else if (index === 1) {
      // 2nd place: 2/3 of remainder (rounded up)
      pointsEarned = Math.ceil((remainingPool * 2) / 3);
      remainingPool -= pointsEarned;
    } else if (index === 2) {
      // 3rd place: All remaining
      pointsEarned = remainingPool;
      remainingPool = 0;
    } else {
      // 4th+ place: 0 points
      pointsEarned = 0;
    }

    return {
      ...result,
      pointsEarned,
    };
  });
}

/**
 * Calculate points for winner-takes-all system
 * - Prize pool = playerCount × pointsPerPlayer
 * - 1st place: All points
 * - Everyone else: 0 points
 */
export function calculateWinnerTakesAllScores(
  playerCount: number,
  pointsPerPlayer: number,
  results: PlayerResult[]
): ScoredResult[] {
  const totalPool = playerCount * pointsPerPlayer;

  return results.map((result) => ({
    ...result,
    pointsEarned: result.rank === 1 ? totalPool : 0,
  }));
}

/**
 * Main scoring function that delegates to the appropriate scoring method
 */
export function calculateScores(
  scoringMode: ScoringMode,
  playerCount: number,
  pointsPerPlayer: number,
  results: PlayerResult[]
): ScoredResult[] {
  if (scoringMode === 'winner-takes-all') {
    return calculateWinnerTakesAllScores(playerCount, pointsPerPlayer, results);
  } else {
    return calculatePointingSystemScores(playerCount, pointsPerPlayer, results);
  }
}

/**
 * Validate that rankings are correct (1, 2, 3, ...)
 */
export function validateRankings(results: PlayerResult[]): { valid: boolean; error?: string } {
  const ranks = results.map((r) => r.rank).sort((a, b) => a - b);

  for (let i = 0; i < ranks.length; i++) {
    if (ranks[i] !== i + 1) {
      return {
        valid: false,
        error: `Invalid rankings: Missing rank ${i + 1}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get total points pool for a game
 */
export function getTotalPointsPool(playerCount: number, pointsPerPlayer: number): number {
  return playerCount * pointsPerPlayer;
}
