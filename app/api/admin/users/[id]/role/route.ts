import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import { requireAdmin } from '@/lib/middleware/authMiddleware';

// POST - Update user role (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const admin = authResult;
    const { id } = await params;
    await connectDB();

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!['admin', 'user', 'guest'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, user, or guest' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (admin.playerId === id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Find and update player
    const player = await Player.findById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player has a claimed profile
    if (!player.profileClaimed) {
      return NextResponse.json(
        { error: 'Cannot change role of unclaimed profile' },
        { status: 400 }
      );
    }

    player.role = role;
    await player.save();

    return NextResponse.json({
      message: `Role updated to ${role} successfully`,
      player: {
        id: player._id,
        name: player.name,
        email: player.email,
        role: player.role,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
