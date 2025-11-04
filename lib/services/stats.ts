import GameSession from '../models/GameSession';
import PlayerStats from '../models/PlayerStats';
import { Types } from 'mongoose';

/**
 * Recalculate and update stats for a specific player
 */
export async function recalculatePlayerStats(playerId: string | Types.ObjectId) {
  const playerObjectId = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId;

  // Get all game sessions for this player
  const sessions = await GameSession.find({
    'results.playerId': playerObjectId,
  }).sort({ playedAt: -1 });

  if (sessions.length === 0) {
    // No games played, clear stats
    await PlayerStats.findOneAndDelete({ playerId: playerObjectId });
    return null;
  }

  // Calculate overall stats
  let totalGames = sessions.length;
  let totalPoints = 0;
  let wins = 0;
  let podiums = 0;

  // Track stats per game
  const gameStatsMap = new Map<string, any>();

  for (const session of sessions) {
    const playerResult = session.results.find(
      (r: any) => r.playerId.toString() === playerObjectId.toString()
    );

    if (!playerResult) continue;

    totalPoints += playerResult.pointsEarned;

    if (playerResult.rank === 1) wins++;
    if (playerResult.rank <= 3) podiums++;

    // Update game-specific stats
    const gameIdStr = session.gameId.toString();
    if (!gameStatsMap.has(gameIdStr)) {
      gameStatsMap.set(gameIdStr, {
        gameId: session.gameId,
        gameName: session.gameName,
        totalGames: 0,
        totalPoints: 0,
        wins: 0,
        podiums: 0,
        byPlayerCount: new Map<number, any>(),
      });
    }

    const gameStat = gameStatsMap.get(gameIdStr);
    gameStat.totalGames++;
    gameStat.totalPoints += playerResult.pointsEarned;
    if (playerResult.rank === 1) gameStat.wins++;
    if (playerResult.rank <= 3) gameStat.podiums++;

    // Update player count specific stats
    if (!gameStat.byPlayerCount.has(session.playerCount)) {
      gameStat.byPlayerCount.set(session.playerCount, {
        totalGames: 0,
        totalPoints: 0,
        averagePoints: 0,
        wins: 0,
      });
    }

    const playerCountStat = gameStat.byPlayerCount.get(session.playerCount);
    playerCountStat.totalGames++;
    playerCountStat.totalPoints += playerResult.pointsEarned;
    if (playerResult.rank === 1) playerCountStat.wins++;
    playerCountStat.averagePoints = playerCountStat.totalPoints / playerCountStat.totalGames;
  }

  // Calculate averages for game stats
  const gameStats = Array.from(gameStatsMap.values()).map((gs) => ({
    gameId: gs.gameId,
    gameName: gs.gameName,
    totalGames: gs.totalGames,
    totalPoints: gs.totalPoints,
    averagePoints: gs.totalPoints / gs.totalGames,
    wins: gs.wins,
    podiums: gs.podiums,
    byPlayerCount: Object.fromEntries(gs.byPlayerCount),
  }));

  // Get player name from first session
  const playerName =
    sessions[0].results.find((r: any) => r.playerId.toString() === playerObjectId.toString())
      ?.playerName || 'Unknown';

  // Update or create PlayerStats
  const statsData = {
    playerId: playerObjectId,
    playerName,
    overall: {
      totalGames,
      totalPoints,
      averagePoints: totalPoints / totalGames,
      wins,
      podiums,
      winRate: wins / totalGames,
    },
    gameStats,
    lastUpdated: new Date(),
  };

  const updatedStats = await PlayerStats.findOneAndUpdate(
    { playerId: playerObjectId },
    statsData,
    { upsert: true, new: true }
  );

  return updatedStats;
}

/**
 * Get leaderboard for all players (overall)
 */
export async function getOverallLeaderboard(limit: number = 10) {
  return await PlayerStats.find()
    .sort({ 'overall.totalPoints': -1 })
    .limit(limit)
    .select('playerId playerName overall');
}

/**
 * Get leaderboard for a specific game
 */
export async function getGameLeaderboard(gameId: string, playerCount?: number, limit: number = 10) {
  const gameObjectId = new Types.ObjectId(gameId);

  const stats = await PlayerStats.find({
    'gameStats.gameId': gameObjectId,
  });

  // Extract and sort game-specific stats
  const leaderboard = stats
    .map((playerStat) => {
      const gameStat = playerStat.gameStats.find(
        (gs: any) => gs.gameId.toString() === gameObjectId.toString()
      );

      if (!gameStat) return null;

      let relevantStats = gameStat;
      let relevantTotalPoints = gameStat.totalPoints;

      // If player count is specified, use those specific stats
      if (playerCount && gameStat.byPlayerCount.has(playerCount)) {
        const playerCountStats = gameStat.byPlayerCount.get(playerCount);
        relevantTotalPoints = playerCountStats.totalPoints;
      }

      return {
        playerName: playerStat.playerName,
        totalGames: gameStat.totalGames,
        totalPoints: relevantTotalPoints,
        averagePoints: gameStat.averagePoints,
        wins: gameStat.wins,
        podiums: gameStat.podiums,
      };
    })
    .filter((item) => item !== null)
    .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
    .slice(0, limit);

  return leaderboard;
}

/**
 * Recalculate stats for all players
 */
export async function recalculateAllStats() {
  // Get all unique player IDs from game sessions
  const sessions = await GameSession.find().select('results.playerId');
  const playerIds = new Set<string>();

  sessions.forEach((session) => {
    session.results.forEach((result: any) => {
      playerIds.add(result.playerId.toString());
    });
  });

  // Recalculate for each player
  const promises = Array.from(playerIds).map((playerId) => recalculatePlayerStats(playerId));
  await Promise.all(promises);

  return { updatedPlayers: playerIds.size };
}
