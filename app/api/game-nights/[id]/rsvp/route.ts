import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameNight from '@/lib/models/GameNight';
import Player from '@/lib/models/Player';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { updateAttendeeResponse } from '@/lib/services/googleCalendarService';

// POST RSVP to game night
export async function POST(
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

    const body = await request.json();
    const { rsvpStatus } = body;

    // Validate RSVP status
    if (!rsvpStatus || !['going', 'maybe', 'not-going'].includes(rsvpStatus)) {
      return NextResponse.json(
        { error: 'Valid RSVP status is required (going, maybe, or not-going)' },
        { status: 400 }
      );
    }

    const gameNight = await GameNight.findById(id);

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      );
    }

    // Check if game night is cancelled
    if (gameNight.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot RSVP to a cancelled game night' },
        { status: 400 }
      );
    }

    // Get player info
    const player = await Player.findById(user.playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player already has an RSVP
    const existingRSVPIndex = gameNight.attendees.findIndex(
      (a: any) => a.playerId.toString() === user.playerId
    );

    if (existingRSVPIndex !== -1) {
      // Update existing RSVP
      gameNight.attendees[existingRSVPIndex].rsvpStatus = rsvpStatus;
      gameNight.attendees[existingRSVPIndex].rsvpAt = new Date();
    } else {
      // Check if max attendees reached (only for "going" status)
      if (rsvpStatus === 'going' && gameNight.maxAttendees) {
        const goingCount = gameNight.attendees.filter(
          (a: any) => a.rsvpStatus === 'going'
        ).length;

        if (goingCount >= gameNight.maxAttendees) {
          return NextResponse.json(
            { error: 'This game night has reached maximum capacity' },
            { status: 400 }
          );
        }
      }

      // Add new RSVP
      gameNight.attendees.push({
        playerId: user.playerId as any,
        playerName: player.name,
        rsvpStatus,
        rsvpAt: new Date(),
      });
    }

    await gameNight.save();

    // Update Google Calendar if player has it connected (uses PLAYER's credentials, not organizer's)
    if (player.googleCalendarConnected && gameNight.calendarSyncEnabled && gameNight.googleCalendarEventId && player.email) {
      try {
        await updateAttendeeResponse(
          gameNight.googleCalendarEventId,
          player.email,
          rsvpStatus,
          user.playerId // Use the PLAYER's ID (not organizer's) to access their calendar
        );
      } catch (calendarError: any) {
        console.error(`Failed to update calendar response for ${player.email}:`, calendarError);
        // Don't fail the RSVP update if calendar sync fails (player might not have permissions)
      }
    }

    return NextResponse.json({
      message: 'RSVP updated successfully',
      gameNight,
    });

  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}

// DELETE remove RSVP (leave game night)
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
    if (gameNight.createdBy.toString() === user.playerId) {
      return NextResponse.json(
        { error: 'Creator cannot leave their own game night. Cancel the event instead.' },
        { status: 400 }
      );
    }

    // Remove RSVP
    gameNight.attendees = gameNight.attendees.filter(
      (a: any) => a.playerId.toString() !== user.playerId
    );

    await gameNight.save();

    return NextResponse.json({
      message: 'RSVP removed successfully',
      gameNight,
    });

  } catch (error) {
    console.error('Error removing RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to remove RSVP' },
      { status: 500 }
    );
  }
}
