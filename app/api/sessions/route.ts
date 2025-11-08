import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameSession from '@/lib/models/GameSession';
import GameDefinition from '@/lib/models/GameDefinition';
import Player from '@/lib/models/Player';
import {
  calculateScores,
  validateRankings,
  getTotalPointsPool,
  PlayerResult,
} from '@/lib/services/scoring';
import { recalculatePlayerStats } from '@/lib/services/stats';
import { requireUser } from '@/lib/middleware/authMiddleware';

// GET all game sessions
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const playerId = searchParams.get('playerId');
    const limit = searchParams.get('limit') || '50';

    const filter: any = {};
    if (gameId) filter.gameId = gameId;
    if (playerId) filter['results.playerId'] = playerId;

    const sessions = await GameSession.find(filter)
      .sort({ playedAt: -1 })
      .limit(Number(limit))
      .populate('gameId', 'name')
      .populate('results.playerId', 'name');

    return NextResponse.json(sessions, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game sessions' },
      { status: 500 }
    );
  }
}

// POST create new game session (any logged-in user)
export async function POST(request: NextRequest) {
  try {
    // Require user authentication (admin or user role)
    const authResult = await requireUser(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const body = await request.json();
    const { gameId, playedAt, results, playerCount} = body;

    // Validate required fields
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Results are required' },
        { status: 400 }
      );
    }

    // Fetch game definition
    const game = await GameDefinition.findById(gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // For Winner Takes All, validate and process differently
    if (game.scoringMode === 'winner-takes-all') {
      // Ensure exactly 1 player with rank 1
      const winnersCount = results.filter((r: PlayerResult) => r.rank === 1).length;
      if (winnersCount !== 1) {
        return NextResponse.json(
          { error: 'Winner Takes All mode requires exactly 1 player with rank 1' },
          { status: 400 }
        );
      }
    } else {
      // For Pointing System, validate rankings
      const rankingValidation = validateRankings(results);
      if (!rankingValidation.valid) {
        return NextResponse.json(
          { error: rankingValidation.error },
          { status: 400 }
        );
      }
    }

    // Fetch all players and validate they exist
    const playerIds = results.map((r: PlayerResult) => r.playerId);
    const players = await Player.find({ _id: { $in: playerIds } });

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: 'One or more players not found' },
        { status: 400 }
      );
    }

    // Create player map for quick lookup
    const playerMap = new Map(players.map((p) => [p._id.toString(), p.name]));

    // Add player names to results
    const resultsWithNames = results.map((r: PlayerResult) => ({
      ...r,
      playerName: playerMap.get(r.playerId) || 'Unknown',
    }));

    // Use provided playerCount (for Winner Takes All) or results.length (for Pointing System)
    const actualPlayerCount = playerCount || results.length;

    // Calculate scores
    const scoredResults = calculateScores(
      game.scoringMode,
      actualPlayerCount,
      game.pointsPerPlayer,
      resultsWithNames
    );

    // Calculate total pool
    const totalPointsPool = getTotalPointsPool(actualPlayerCount, game.pointsPerPlayer);

    // Create game session
    const session = new GameSession({
      gameId: game._id,
      gameName: game.name,
      scoringMode: game.scoringMode,
      playerCount: actualPlayerCount,
      playedAt: playedAt || new Date(),
      results: scoredResults,
      totalPointsPool,
    });

    await session.save();

    // Update lastPlayedAt for all players
    await Player.updateMany(
      { _id: { $in: playerIds } },
      { lastPlayedAt: session.playedAt }
    );

    // Recalculate stats for all affected players (in background)
    Promise.all(playerIds.map((playerId: string) => recalculatePlayerStats(playerId))).catch(
      (err) => console.error('Error recalculating stats:', err)
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { error: 'Failed to create game session' },
      { status: 500 }
    );
  }
}
