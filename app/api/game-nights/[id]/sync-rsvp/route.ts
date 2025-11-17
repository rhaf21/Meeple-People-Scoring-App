import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import connectDB from '@/lib/utils/db';
import GameNight from '@/lib/models/GameNight';
import Player from '@/lib/models/Player';
import { getEventAttendeeStatus, mapCalendarResponseToRSVP } from '@/lib/services/googleCalendarService';

/**
 * POST /api/game-nights/[id]/sync-rsvp
 * Syncs calendar RSVP responses back to the app
 * Fetches current attendee status from Google Calendar and updates app RSVPs
 * Requires authentication (organizer only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    await connectDB();
    const { id } = await params;

    const gameNight = await GameNight.findById(id);

    if (!gameNight) {
      return NextResponse.json(
        { error: 'Game night not found' },
        { status: 404 }
      );
    }

    // Only organizer can sync RSVPs
    if (gameNight.createdBy.toString() !== user.playerId) {
      return NextResponse.json(
        { error: 'Only the organizer can sync RSVPs' },
        { status: 403 }
      );
    }

    // Check if calendar sync is enabled
    if (!gameNight.calendarSyncEnabled || !gameNight.googleCalendarEventId) {
      return NextResponse.json(
        { error: 'Calendar sync not enabled for this game night' },
        { status: 400 }
      );
    }

    // Fetch current attendee statuses from Google Calendar
    const attendeeStatuses = await getEventAttendeeStatus(
      gameNight.googleCalendarEventId,
      user.playerId
    );

    let updatedCount = 0;
    const updates: string[] = [];

    // Update RSVPs based on calendar responses
    for (const calendarAttendee of attendeeStatuses) {
      // Find the player by email
      const player = await Player.findOne({ email: calendarAttendee.email });

      if (!player) {
        continue; // Skip if player not found
      }

      // Map calendar response to RSVP status
      const newRSVPStatus = mapCalendarResponseToRSVP(calendarAttendee.responseStatus);

      // Find existing attendee in game night
      const existingAttendeeIndex = gameNight.attendees.findIndex(
        (a: any) => a.playerId.toString() === (player._id as any).toString()
      );

      if (existingAttendeeIndex >= 0) {
        // Update existing attendee's RSVP if it changed
        const currentStatus = gameNight.attendees[existingAttendeeIndex].rsvpStatus;

        if (currentStatus !== newRSVPStatus) {
          gameNight.attendees[existingAttendeeIndex].rsvpStatus = newRSVPStatus;
          gameNight.attendees[existingAttendeeIndex].rsvpAt = new Date();
          updatedCount++;
          updates.push(`${player.name}: ${currentStatus} → ${newRSVPStatus}`);
        }
      } else if (newRSVPStatus === 'going') {
        // Add new attendee if they responded "going" in calendar
        gameNight.attendees.push({
          playerId: player._id as any,
          playerName: player.name,
          rsvpStatus: newRSVPStatus,
          rsvpAt: new Date(),
        });
        updatedCount++;
        updates.push(`${player.name}: added as ${newRSVPStatus}`);
      }
    }

    // Save updates
    if (updatedCount > 0) {
      await gameNight.save();
    }

    return NextResponse.json({
      message: 'RSVP sync completed',
      updatedCount,
      updates,
      totalAttendees: gameNight.attendees.length,
    });

  } catch (error: any) {
    console.error('Error syncing RSVPs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync RSVPs' },
      { status: 500 }
    );
  }
}
