import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';

// GET all players
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Treat players without isActive field as active (for backward compatibility)
    const filter = activeOnly
      ? { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
      : {};
    const players = await Player.find(filter).sort({ name: 1 });
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST create new player
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, photoUrl, photoPublicId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Check if player already exists
    const existing = await Player.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'Player already exists' },
        { status: 400 }
      );
    }

    const player = new Player({
      name: name.trim(),
      photoUrl,
      photoPublicId
    });
    await player.save();

    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Player already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
