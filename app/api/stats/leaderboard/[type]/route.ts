import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { getOverallLeaderboard, getGameLeaderboard } from '@/lib/services/stats';

// GET leaderboard by type (overall or game ID)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await connectDB();
    const { type } = await params; // Await params in Next.js 15+
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const playerCount = searchParams.get('playerCount');

    if (type === 'overall') {
      // Overall leaderboard
      const leaderboard = await getOverallLeaderboard(Number(limit));
      return NextResponse.json(leaderboard);
    } else {
      // Game-specific leaderboard
      const gameId = type; // The type is actually the game ID for game-specific leaderboards
      const leaderboard = await getGameLeaderboard(
        gameId,
        playerCount ? Number(playerCount) : undefined,
        Number(limit)
      );
      return NextResponse.json(leaderboard);
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
