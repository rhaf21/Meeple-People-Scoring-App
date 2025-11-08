import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameSession from '@/lib/models/GameSession';
import Player from '@/lib/models/Player';
import { Types } from 'mongoose';

interface MonthlyPlayerStats {
  _id: string;
  playerName: string;
  playerPhoto?: string;
  totalGames: number;
  totalPoints: number;
  wins: number;
  winRate: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate inputs
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Get all sessions in the month
    const sessions = await GameSession.find({
      playedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json([]);
    }

    // Aggregate stats per player
    const playerStatsMap = new Map<string, { points: number; games: number; wins: number; name: string }>();

    sessions.forEach((session) => {
      session.results.forEach((result: any) => {
        const playerId = result.playerId.toString();
        const existing = playerStatsMap.get(playerId) || { points: 0, games: 0, wins: 0, name: result.playerName };

        existing.points += result.pointsEarned;
        existing.games += 1;
        if (result.rank === 1) {
          existing.wins += 1;
        }

        playerStatsMap.set(playerId, existing);
      });
    });

    // Convert to array and sort by points
    const leaderboard: MonthlyPlayerStats[] = Array.from(playerStatsMap.entries())
      .map(([playerId, stats]) => ({
        _id: playerId,
        playerName: stats.name,
        totalGames: stats.games,
        totalPoints: stats.points,
        wins: stats.wins,
        winRate: stats.wins / stats.games,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    // Fetch player photos and correct IDs
    const playerIds = leaderboard.map((p) => p._id);
    const players = await Player.find({ _id: { $in: playerIds } });
    const playerMap = new Map(players.map((p) => [(p._id as Types.ObjectId).toString(), { photoUrl: p.photoUrl, id: (p._id as Types.ObjectId).toString() }]));

    // Add photos to leaderboard and ensure correct _id
    leaderboard.forEach((player) => {
      const playerData = playerMap.get(player._id);
      if (playerData) {
        player.playerPhoto = playerData.photoUrl;
        player._id = playerData.id; // Ensure _id is correct Player document ID
      }
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly leaderboard' },
      { status: 500 }
    );
  }
}
