import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import GameDefinition from '@/lib/models/GameDefinition';
import GameSession from '@/lib/models/GameSession';
import { requireAdmin } from '@/lib/middleware/authMiddleware';

// GET - System statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    // Get counts
    const [
      totalPlayers,
      activePlayers,
      claimedPlayers,
      adminCount,
      totalGames,
      activeGames,
      totalSessions,
    ] = await Promise.all([
      Player.countDocuments(),
      Player.countDocuments({ isActive: true }),
      Player.countDocuments({ profileClaimed: true }),
      Player.countDocuments({ role: 'admin' }),
      GameDefinition.countDocuments(),
      GameDefinition.countDocuments({ isActive: true }),
      GameSession.countDocuments(),
    ]);

    // Get recent sessions
    const recentSessions = await GameSession.find()
      .sort({ playedAt: -1 })
      .limit(5)
      .populate('gameId', 'name')
      .select('gameId playedAt results');

    // Get most played games
    const mostPlayedGames = await GameSession.aggregate([
      {
        $group: {
          _id: '$gameId',
          timesPlayed: { $sum: 1 },
          gameName: { $first: '$gameName' },
        },
      },
      {
        $sort: { timesPlayed: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 1,
          gameName: 1,
          timesPlayed: 1,
        },
      },
    ]);

    return NextResponse.json({
      players: {
        total: totalPlayers,
        active: activePlayers,
        claimed: claimedPlayers,
        admins: adminCount,
      },
      games: {
        total: totalGames,
        active: activeGames,
        mostPlayed: mostPlayedGames,
      },
      sessions: {
        total: totalSessions,
        recent: recentSessions,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
