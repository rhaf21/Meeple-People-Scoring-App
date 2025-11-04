import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import PlayerStats from '@/lib/models/PlayerStats';

// GET player stats by player ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const stats = await PlayerStats.findOne({ playerId: id });

    if (!stats) {
      return NextResponse.json(
        { error: 'Player stats not found' },
        { status: 404 }
      );
    }

    // Find favorite game (most played)
    let favoriteGame = undefined;
    if (stats.gameStats && stats.gameStats.length > 0) {
      const mostPlayed = stats.gameStats.reduce((prev: any, current: any) =>
        (current.totalGames > prev.totalGames) ? current : prev
      );
      if (mostPlayed.totalGames > 0) {
        favoriteGame = {
          name: mostPlayed.gameName,
          timesPlayed: mostPlayed.totalGames
        };
      }
    }

    // Transform to match component's expected interface
    const transformedStats = {
      totalGamesPlayed: stats.overall.totalGames,
      totalWins: stats.overall.wins,
      winRate: stats.overall.winRate,
      totalPoints: stats.overall.totalPoints,
      averagePointsPerGame: stats.overall.averagePoints,
      favoriteGame
    };

    return NextResponse.json(transformedStats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
