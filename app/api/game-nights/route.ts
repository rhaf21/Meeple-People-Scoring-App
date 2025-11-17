import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameNight from '@/lib/models/GameNight';
import Player from '@/lib/models/Player';
import GameDefinition from '@/lib/models/GameDefinition';
import { requireAuth, optionalAuth } from '@/lib/middleware/authMiddleware';
import { createCalendarEvent } from '@/lib/services/googleCalendarService';
import { sendGameNightInviteEmail } from '@/lib/services/emailService';

// Force GameDefinition import to execute (prevents tree-shaking)
void GameDefinition;

// GET all game nights (with filters)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const playerId = searchParams.get('playerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if authenticated
    const user = await optionalAuth(request);

    // Build query
    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter upcoming events
    if (upcoming) {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'in-progress'] };
    }

    // Filter by player attendance
    if (playerId) {
      query['attendees.playerId'] = playerId;
    }

    // Only show public events unless user is authenticated
    if (!user) {
      query.isPrivate = false;
    }

    const gameNights = await GameNight.find(query)
      .sort({ scheduledDate: upcoming ? 1 : -1 })
      .limit(limit)
      .populate('suggestedGames', 'name imageUrl')
      .lean();

    return NextResponse.json(gameNights);
  } catch (error) {
    console.error('Error fetching game nights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game nights' },
      { status: 500 }
    );
  }
}

// POST create new game night (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      scheduledDate,
      location,
      suggestedGames,
      maxAttendees,
      isPrivate,
      invitedPlayerIds,
    } = body;

    // Validation
    if (!title || !scheduledDate) {
      return NextResponse.json(
        { error: 'Title and scheduled date are required' },
        { status: 400 }
      );
    }

    // Check if date is in the future
    const gameDate = new Date(scheduledDate);
    if (gameDate < new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
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

    // Create game night
    const gameNight = new GameNight({
      title,
      description,
      scheduledDate: gameDate,
      location,
      createdBy: user.playerId,
      createdByName: player.name,
      suggestedGames: suggestedGames || [],
      maxAttendees,
      isPrivate: isPrivate || false,
      invitedPlayerIds: invitedPlayerIds || [],
      calendarSyncEnabled: false, // Will be set to true if calendar event is created
      attendees: [
        {
          playerId: user.playerId,
          playerName: player.name,
          rsvpStatus: 'going',
          rsvpAt: new Date(),
        },
      ],
    });

    await gameNight.save();

    // Store calendar URL to include in email invitations
    let calendarEventUrl: string | undefined = undefined;

    // Create Google Calendar event FIRST (if organizer has Google Calendar connected)
    if (player.googleCalendarConnected && invitedPlayerIds && invitedPlayerIds.length > 0) {
      try {
        // Fetch invited players' emails for calendar
        const invitedPlayers = await Player.find({
          _id: { $in: invitedPlayerIds },
          email: { $exists: true, $ne: null },
        }).select('email name');

        // Only create calendar event if there are players with emails
        if (invitedPlayers.length > 0) {
          // Calculate end time (assume 3 hours duration)
          const endDateTime = new Date(gameDate);
          endDateTime.setHours(endDateTime.getHours() + 3);

          const attendees = invitedPlayers.map(p => ({
            email: p.email!,
            displayName: p.name,
          }));

          // Create calendar event
          const { eventId, eventUrl } = await createCalendarEvent({
            summary: title,
            description: description || `Game Night organized by ${player.name}`,
            location: location || undefined,
            startDateTime: gameDate,
            endDateTime,
            attendees,
            organizerId: user.playerId,
          });

          // Update game night with calendar info
          gameNight.googleCalendarEventId = eventId;
          gameNight.googleCalendarUrl = eventUrl;
          gameNight.calendarSyncEnabled = true;
          calendarEventUrl = eventUrl; // Save URL for email invitations
          await gameNight.save();
        }
      } catch (calendarError: any) {
        // Log calendar error but don't fail the game night creation
        console.error('Failed to create calendar event:', calendarError);
        // Calendar event creation failed, but game night was still created successfully
      }
    }

    // Send email notifications to invited players (WITH calendar URL if available)
    if (invitedPlayerIds && invitedPlayerIds.length > 0) {
      try {
        // Fetch invited players' emails
        const invitedPlayers = await Player.find({
          _id: { $in: invitedPlayerIds },
          email: { $exists: true, $ne: null },
        }).select('email name');

        if (invitedPlayers.length > 0) {
          // Send email notifications to invited players
          for (const invitedPlayer of invitedPlayers) {
            try {
              await sendGameNightInviteEmail(
                invitedPlayer.email!,
                invitedPlayer.name,
                {
                  title,
                  description,
                  scheduledDate: gameDate.toISOString(),
                  location,
                  organizerName: player.name,
                  calendarUrl: calendarEventUrl, // Include calendar URL if event was created
                }
              );
            } catch (emailError: any) {
              // Log email error but don't fail
              console.error(`Failed to send email to ${invitedPlayer.email}:`, emailError);
            }
          }
        }
      } catch (emailFetchError: any) {
        console.error('Failed to fetch invited players for email notifications:', emailFetchError);
      }
    }

    return NextResponse.json({
      message: 'Game night created successfully',
      gameNight,
      calendarEventCreated: gameNight.calendarSyncEnabled,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating game night:', error);
    return NextResponse.json(
      { error: 'Failed to create game night' },
      { status: 500 }
    );
  }
}
