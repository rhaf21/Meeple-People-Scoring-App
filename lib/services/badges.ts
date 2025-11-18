import { Types } from 'mongoose';
import Player, { IBadge, IPlayer } from '../models/Player';
import PlayerStats from '../models/PlayerStats';
import GameSession from '../models/GameSession';
import { BADGE_DEFINITIONS, BadgeDefinition } from '../data/badgeDefinitions';
import connectDB from '../utils/db';

interface PlayerStatsData {
  overall: {
    totalGames: number;
    totalPoints: number;
    wins: number;
    podiums: number;
    winRate: number;
  };
  gameStats: Array<{
    gameId: Types.ObjectId;
    gameName: string;
  }>;
}

/**
 * Calculate the maximum win streak for a player from their game history
 */
async function calculateMaxStreak(playerId: string): Promise<number> {
  const sessions = await GameSession.find({
    'results.playerId': new Types.ObjectId(playerId)
  }).sort({ playedAt: 1 });

  let maxStreak = 0;
  let currentStreak = 0;

  for (const session of sessions) {
    const playerResult = session.results.find(
      (r: any) => r.playerId.toString() === playerId
    );

    if (playerResult && playerResult.rank === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Check if a player meets the criteria for a specific badge
 */
function checkBadgeCriteria(
  badgeDef: BadgeDefinition,
  stats: PlayerStatsData,
  maxStreak: number
): boolean {
  const { criteria } = badgeDef;

  switch (criteria.type) {
    case 'games':
      return stats.overall.totalGames >= criteria.threshold;

    case 'wins':
      return stats.overall.wins >= criteria.threshold;

    case 'podiums':
      return stats.overall.podiums >= criteria.threshold;

    case 'points':
      return stats.overall.totalPoints >= criteria.threshold;

    case 'winRate':
      const minGames = criteria.minGames || 10;
      return stats.overall.totalGames >= minGames &&
             stats.overall.winRate >= criteria.threshold;

    case 'streak':
      return maxStreak >= criteria.threshold;

    case 'variety':
      return stats.gameStats.length >= criteria.threshold;

    default:
      return false;
  }
}

/**
 * Calculate all badges a player should have based on their stats
 */
export async function calculateBadgesForPlayer(playerId: string): Promise<IBadge[]> {
  await connectDB();

  // Get player stats
  const stats = await PlayerStats.findOne({
    playerId: new Types.ObjectId(playerId)
  });

  if (!stats) {
    return [];
  }

  // Calculate max win streak
  const maxStreak = await calculateMaxStreak(playerId);

  const earnedBadges: IBadge[] = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    const earned = checkBadgeCriteria(badgeDef, stats as PlayerStatsData, maxStreak);

    if (earned) {
      earnedBadges.push({
        badgeId: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        tier: badgeDef.tier,
        earnedAt: new Date()
      });
    }
  }

  return earnedBadges;
}

/**
 * Update a player's badges, only adding new ones they don't already have
 * Returns the list of newly earned badges
 */
export async function updatePlayerBadges(playerId: string): Promise<IBadge[]> {
  await connectDB();

  // Calculate all badges the player should have
  const allEarnedBadges = await calculateBadgesForPlayer(playerId);

  // Get current badges to avoid overwriting earnedAt dates
  const player = await Player.findById(playerId);
  if (!player) {
    return [];
  }

  const existingBadgeIds = new Set(player.badges?.map((b: IBadge) => b.badgeId) || []);

  // Only add new badges, preserve existing ones
  const newBadges = allEarnedBadges.filter(b => !existingBadgeIds.has(b.badgeId));

  if (newBadges.length > 0) {
    await Player.findByIdAndUpdate(playerId, {
      $push: { badges: { $each: newBadges } }
    });
  }

  return newBadges;
}

/**
 * Run badge migration for all active players
 * Returns summary of results
 */
export async function migrateAllPlayerBadges(): Promise<{
  totalPlayers: number;
  results: Array<{
    playerId: string;
    playerName: string;
    badgesAwarded: number;
    badges: string[];
  }>;
}> {
  await connectDB();

  // Get all active players
  const players = await Player.find({ isActive: true });
  const results = [];

  for (const player of players) {
    const playerId = (player._id as Types.ObjectId).toString();
    const newBadges = await updatePlayerBadges(playerId);

    results.push({
      playerId,
      playerName: player.name,
      badgesAwarded: newBadges.length,
      badges: newBadges.map(b => b.name)
    });
  }

  return {
    totalPlayers: players.length,
    results
  };
}

/**
 * Get badge statistics for display
 */
export async function getBadgeStats(): Promise<{
  totalBadgesAvailable: number;
  badgesByTier: Record<string, number>;
}> {
  const badgesByTier: Record<string, number> = {
    none: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  };

  for (const badge of BADGE_DEFINITIONS) {
    const tier = badge.tier || 'none';
    badgesByTier[tier]++;
  }

  return {
    totalBadgesAvailable: BADGE_DEFINITIONS.length,
    badgesByTier
  };
}
