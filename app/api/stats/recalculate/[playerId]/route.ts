import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import { recalculatePlayerStats } from '@/lib/services/stats';

// POST recalculate stats for a specific player
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    await connectDB();
    const stats = await recalculatePlayerStats(playerId);

    if (!stats) {
      return NextResponse.json(
        { error: 'No game sessions found for this player' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Player stats recalculated successfully',
      stats
    });
  } catch (error) {
    console.error('Error recalculating player stats:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate player stats' },
      { status: 500 }
    );
  }
}
