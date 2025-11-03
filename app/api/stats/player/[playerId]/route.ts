import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import PlayerStats from '@/lib/models/PlayerStats';

// GET player stats by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    await connectDB();
    const stats = await PlayerStats.findOne({ playerId });

    if (!stats) {
      return NextResponse.json(
        { error: 'Player stats not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
