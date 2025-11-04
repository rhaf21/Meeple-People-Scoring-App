import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameNight from '@/lib/models/GameNight';
import Player from '@/lib/models/Player';
import { requireAuth, optionalAuth } from '@/lib/middleware/authMiddleware';

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

    return NextResponse.json({
      message: 'Game night created successfully',
      gameNight,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating game night:', error);
    return NextResponse.json(
      { error: 'Failed to create game night' },
      { status: 500 }
    );
  }
}
