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
import { requireAdmin } from '@/lib/middleware/authMiddleware';

// GET session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const session = await GameSession.findById(id)
      .populate('gameId', 'name')
      .populate('results.playerId', 'name');

    if (!session) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching game session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game session' },
      { status: 500 }
    );
  }
}

// PUT update game session (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { playedAt, results } = body;

    const session = await GameSession.findById(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    // Fetch game definition
    const game = await GameDefinition.findById(session.gameId);
    if (!game) {
      return NextResponse.json(
        { error: 'Associated game not found' },
        { status: 404 }
      );
    }

    // Track old player IDs before updating
    const oldPlayerIds = session.results.map((r: any) => r.playerId.toString());

    // If results are being updated, recalculate scores
    if (results && Array.isArray(results)) {
      // Validate rankings
      const rankingValidation = validateRankings(results);
      if (!rankingValidation.valid) {
        return NextResponse.json(
          { error: rankingValidation.error },
          { status: 400 }
        );
      }

      // Fetch all players
      const playerIds = results.map((r: PlayerResult) => r.playerId);
      const players = await Player.find({ _id: { $in: playerIds } });

      if (players.length !== playerIds.length) {
        return NextResponse.json(
          { error: 'One or more players not found' },
          { status: 400 }
        );
      }

      const playerMap = new Map(players.map((p) => [p._id.toString(), p.name]));

      const resultsWithNames = results.map((r: PlayerResult) => ({
        ...r,
        playerName: playerMap.get(r.playerId) || 'Unknown',
      }));

      // Recalculate scores
      const scoredResults = calculateScores(
        game.scoringMode,
        results.length,
        game.pointsPerPlayer,
        resultsWithNames
      );

      session.results = scoredResults;
      session.playerCount = results.length;
      session.totalPointsPool = getTotalPointsPool(results.length, game.pointsPerPlayer);

      // Track new player IDs for stats recalculation
      const newPlayerIds = playerIds;
      const affectedPlayerIds = new Set([...oldPlayerIds, ...newPlayerIds]);

      // Recalculate stats for all affected players
      Promise.all(
        Array.from(affectedPlayerIds).map((playerId) => recalculatePlayerStats(playerId))
      ).catch((err) => console.error('Error recalculating stats:', err));
    }

    if (playedAt) {
      session.playedAt = new Date(playedAt);
    }

    await session.save();
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating game session:', error);
    return NextResponse.json(
      { error: 'Failed to update game session' },
      { status: 500 }
    );
  }
}

// DELETE game session (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await connectDB();
    const session = await GameSession.findByIdAndDelete(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    // Recalculate stats for all affected players
    const playerIds = session.results.map((r: any) => r.playerId.toString());
    Promise.all(playerIds.map((playerId: string) => recalculatePlayerStats(playerId))).catch((err: any) =>
      console.error('Error recalculating stats:', err)
    );

    return NextResponse.json({
      message: 'Game session deleted successfully',
      session
    });
  } catch (error) {
    console.error('Error deleting game session:', error);
    return NextResponse.json(
      { error: 'Failed to delete game session' },
      { status: 500 }
    );
  }
}
