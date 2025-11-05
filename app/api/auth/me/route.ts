import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import { requireAuth } from '@/lib/middleware/authMiddleware';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();

    // Find the player
    const player = await Player.findById(user.playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: player._id.toString(),
      name: player.name,
      email: player.email,
      photoUrl: player.photoUrl,
      bio: player.bio,
      playStyle: player.playStyle,
      favoriteGames: player.favoriteGames,
      availability: player.availability,
      publicProfile: player.publicProfile,
      showStats: player.showStats,
      profileClaimed: player.profileClaimed,
      emailVerified: player.emailVerified,
      role: player.role,
    });

  } catch (error) {
    console.error('Error in /me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
