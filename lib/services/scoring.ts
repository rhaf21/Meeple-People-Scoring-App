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
 * - Ties: Players with the same rank split the points for the positions they occupy
 */
export function calculatePointingSystemScores(
  playerCount: number,
  pointsPerPlayer: number,
  results: PlayerResult[]
): ScoredResult[] {
  const totalPool = playerCount * pointsPerPlayer;

  // Sort by rank (just to be sure)
  const sortedResults = [...results].sort((a, b) => a.rank - b.rank);

  // First, calculate points for each position (as if no ties)
  const positionPoints: number[] = [];
  let remainingPool = totalPool;

  for (let i = 0; i < playerCount; i++) {
    let points = 0;

    if (i === 0) {
      // 1st position: 2/3 of pool (rounded up)
      points = Math.ceil((remainingPool * 2) / 3);
      remainingPool -= points;
    } else if (i === 1) {
      // 2nd position: 2/3 of remainder (rounded up)
      points = Math.ceil((remainingPool * 2) / 3);
      remainingPool -= points;
    } else if (i === 2) {
      // 3rd position: All remaining
      points = remainingPool;
      remainingPool = 0;
    } else {
      // 4th+ position: 0 points
      points = 0;
    }

    positionPoints.push(points);
  }

  // Group players by rank to handle ties
  const rankGroups = new Map<number, PlayerResult[]>();
  sortedResults.forEach((result) => {
    if (!rankGroups.has(result.rank)) {
      rankGroups.set(result.rank, []);
    }
    rankGroups.get(result.rank)!.push(result);
  });

  // Calculate points for each player considering ties
  const scoredResults: ScoredResult[] = [];
  let currentPosition = 0;

  // Sort rank groups by rank
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  sortedRanks.forEach((rank) => {
    const playersInRank = rankGroups.get(rank)!;
    const numPlayersInRank = playersInRank.length;

    // Calculate total points for the positions this rank occupies
    let totalPointsForRank = 0;
    for (let i = 0; i < numPlayersInRank; i++) {
      const position = currentPosition + i;
      totalPointsForRank += position < positionPoints.length ? positionPoints[position] : 0;
    }

    // Divide points equally among tied players (round down to keep pool constant)
    const pointsPerPlayer = Math.floor(totalPointsForRank / numPlayersInRank);

    // Add scored results for all players in this rank
    playersInRank.forEach((player) => {
      scoredResults.push({
        ...player,
        pointsEarned: pointsPerPlayer,
      });
    });

    // Move to next position group
    currentPosition += numPlayersInRank;
  });

  return scoredResults;
}

/**
 * Calculate points for winner-takes-all system
 * - Prize pool = playerCount × pointsPerPlayer
 * - 1st place: All points (split equally if there's a tie)
 * - Everyone else: 0 points
 */
export function calculateWinnerTakesAllScores(
  playerCount: number,
  pointsPerPlayer: number,
  results: PlayerResult[]
): ScoredResult[] {
  const totalPool = playerCount * pointsPerPlayer;

  // Count how many players have rank 1 (to handle ties)
  const winnersCount = results.filter((r) => r.rank === 1).length;
  const pointsPerWinner = winnersCount > 0 ? Math.floor(totalPool / winnersCount) : 0;

  return results.map((result) => ({
    ...result,
    pointsEarned: result.rank === 1 ? pointsPerWinner : 0,
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
 * Validate that rankings are correct
 * - Must start at rank 1
 * - No gaps in ranks (e.g., if max rank is 3, must have at least one player at ranks 1, 2, and 3)
 * - Allows duplicate ranks for ties
 */
export function validateRankings(results: PlayerResult[]): { valid: boolean; error?: string } {
  if (results.length === 0) {
    return {
      valid: false,
      error: 'No results provided',
    };
  }

  const ranks = results.map((r) => r.rank);
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);

  // Check if rankings start at 1
  if (uniqueRanks[0] !== 1) {
    return {
      valid: false,
      error: 'Rankings must start at 1',
    };
  }

  // Check for gaps in rankings
  for (let i = 0; i < uniqueRanks.length; i++) {
    if (uniqueRanks[i] !== i + 1) {
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
