import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameDefinition from '@/lib/models/GameDefinition';

// GET all games
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly');

    // Treat games without isActive field as active (for backward compatibility)
    const filter = activeOnly === 'true'
      ? { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
      : {};

    const games = await GameDefinition.find(filter).sort({ name: 1 });
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

// POST create new game
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, scoringMode, pointsPerPlayer, imageUrl, imagePublicId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      );
    }

    if (!scoringMode || !['pointing', 'winner-takes-all'].includes(scoringMode)) {
      return NextResponse.json(
        { error: 'Scoring mode must be either "pointing" or "winner-takes-all"' },
        { status: 400 }
      );
    }

    // Check if game already exists
    const existing = await GameDefinition.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { error: 'Game already exists' },
        { status: 400 }
      );
    }

    const game = new GameDefinition({
      name: name.trim(),
      scoringMode,
      pointsPerPlayer: pointsPerPlayer || (scoringMode === 'winner-takes-all' ? 3 : 5),
      imageUrl,
      imagePublicId,
    });

    await game.save();
    return NextResponse.json(game, { status: 201 });
  } catch (error: any) {
    console.error('Error creating game:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Game already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
