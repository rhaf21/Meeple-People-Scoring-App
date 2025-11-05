import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import GameSession from '@/lib/models/GameSession';
import PlayerStats from '@/lib/models/PlayerStats';
import { requireAdmin, optionalAuth, isAdminOrOwner } from '@/lib/middleware/authMiddleware';

// GET player by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const player = await Player.findById(id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

// PUT update player (admin or owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication (optional - we'll verify ownership/admin below)
    const user = await optionalAuth(request);
    const { id } = await params;

    // If updating isActive, require admin
    const body = await request.json();
    const { name, photoUrl, photoPublicId, isActive } = body;

    if (isActive !== undefined) {
      // Changing active status requires admin
      const authResult = await requireAdmin(request);
      if (authResult instanceof NextResponse) return authResult;
    } else if (user && !isAdminOrOwner(user, id)) {
      // For other updates, must be admin or owner
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own profile' },
        { status: 403 }
      );
    } else if (!user) {
      // No authentication provided for protected update
      return NextResponse.json(
        { error: 'Unauthorized - Please login to edit profiles' },
        { status: 401 }
      );
    }

    await connectDB();

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Player name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (photoPublicId !== undefined) updateData.photoPublicId = photoPublicId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const player = await Player.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error: any) {
    console.error('Error updating player:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Player name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

// DELETE player - admin only (soft delete - sets isActive to false, or permanent delete if ?permanent=true)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Check if player exists
    const player = await Player.findById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // PERMANENT DELETE: Remove player and anonymize all references
    if (permanent) {
      const playerName = player.name;

      // Update all game sessions: replace player references with [Deleted Player]
      await GameSession.updateMany(
        { 'results.playerId': id },
        {
          $set: {
            'results.$[elem].playerId': null,
            'results.$[elem].playerName': '[Deleted Player]',
          },
        },
        {
          arrayFilters: [{ 'elem.playerId': id }],
        }
      );

      // Delete player stats (historical leaderboard will no longer show this player)
      await PlayerStats.deleteOne({ playerId: id });

      // Delete the player document (frees up the name for reuse)
      await Player.findByIdAndDelete(id);

      return NextResponse.json({
        message: 'Player permanently deleted',
        playerName,
      });
    }

    // SOFT DELETE (Archive): Set isActive to false
    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    return NextResponse.json({
      message: 'Player archived successfully',
      player: updatedPlayer,
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
