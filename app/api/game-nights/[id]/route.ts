import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameNight from '@/lib/models/GameNight';
import Player from '@/lib/models/Player';
import { requireAuth, optionalAuth, isResourceOwner } from '@/lib/middleware/authMiddleware';

// GET game night by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if authenticated
    const user = await optionalAuth(request);

    const gameNight: any = await GameNight.findById(id)
      .populate('suggestedGames', 'name imageUrl bggRating')
      .lean();

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      );
    }

    // Check if private and user is not attendee or creator
    if (gameNight.isPrivate && user) {
      const isAttendee = gameNight.attendees.some(
        (a: any) => a.playerId.toString() === user.playerId
      );
      const isCreator = gameNight.createdBy.toString() === user.playerId;

      if (!isAttendee && !isCreator) {
        return NextResponse.json(
          { error: 'This game night is private' },
          { status: 403 }
        );
      }
    } else if (gameNight.isPrivate && !user) {
      return NextResponse.json(
        { error: 'This game night is private' },
        { status: 403 }
      );
    }

    // Fetch player photos for all attendees
    const playerIds = gameNight.attendees.map((a: any) => a.playerId);
    const players = await Player.find({ _id: { $in: playerIds } }).select('photoUrl').lean();
    const playerPhotoMap = new Map(
      players.map((p: any) => [p._id.toString(), p.photoUrl])
    );

    // Convert ObjectIds to strings for frontend comparison and add player photos
    gameNight.createdBy = gameNight.createdBy.toString();
    gameNight.attendees = gameNight.attendees.map((a: any) => ({
      ...a,
      playerId: a.playerId.toString(),
      playerPhotoUrl: playerPhotoMap.get(a.playerId.toString()) || null
    }));

    return NextResponse.json(gameNight);
  } catch (error) {
    console.error('Error fetching game night:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game night' },
      { status: 500 }
    );
  }
}

// PUT update game night (creator only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();
    const { id } = await params;

    const gameNight = await GameNight.findById(id);

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (!isResourceOwner(user, gameNight.createdBy.toString())) {
      return NextResponse.json(
        { error: 'Unauthorized - Only the creator can edit this game night' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      scheduledDate,
      location,
      suggestedGames,
      maxAttendees,
      isPrivate,
      status,
      notes,
    } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledDate !== undefined) {
      const gameDate = new Date(scheduledDate);
      if (gameDate < new Date() && gameNight.status === 'scheduled') {
        return NextResponse.json(
          { error: 'Scheduled date must be in the future for scheduled events' },
          { status: 400 }
        );
      }
      updateData.scheduledDate = gameDate;
    }
    if (location !== undefined) updateData.location = location;
    if (suggestedGames !== undefined) updateData.suggestedGames = suggestedGames;
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedGameNight = await GameNight.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('suggestedGames', 'name imageUrl');

    return NextResponse.json({
      message: 'Game night updated successfully',
      gameNight: updatedGameNight,
    });

  } catch (error) {
    console.error('Error updating game night:', error);
    return NextResponse.json(
      { error: 'Failed to update game night' },
      { status: 500 }
    );
  }
}

// DELETE game night (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();
    const { id } = await params;

    const gameNight = await GameNight.findById(id);

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (!isResourceOwner(user, gameNight.createdBy.toString())) {
      return NextResponse.json(
        { error: 'Unauthorized - Only the creator can delete this game night' },
        { status: 403 }
      );
    }

    // Soft delete - mark as cancelled instead of deleting
    gameNight.status = 'cancelled';
    await gameNight.save();

    return NextResponse.json({
      message: 'Game night cancelled successfully',
      gameNight,
    });

  } catch (error) {
    console.error('Error deleting game night:', error);
    return NextResponse.json(
      { error: 'Failed to delete game night' },
      { status: 500 }
    );
  }
}
