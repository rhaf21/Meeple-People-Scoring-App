import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';

/**
 * GET /api/players/me
 * Get the current authenticated user's player info
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    await connectDB();

    const player = await Player.findById(user.playerId).select(
      'name email emailVerified photoUrl role profileClaimed googleCalendarConnected publicProfile showStats bio playStyle topFavoriteGames leastFavoriteGames availability'
    );

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player info' },
      { status: 500 }
    );
  }
}
