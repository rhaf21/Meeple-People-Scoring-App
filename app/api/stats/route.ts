import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import PlayerStats from '@/lib/models/PlayerStats';
import { recalculateAllStats } from '@/lib/services/stats';

// GET all player stats
export async function GET() {
  try {
    await connectDB();
    const allStats = await PlayerStats.find().sort({ 'overall.totalPoints': -1 });
    return NextResponse.json(allStats);
  } catch (error) {
    console.error('Error fetching all stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all stats' },
      { status: 500 }
    );
  }
}

// POST recalculate all stats
export async function POST() {
  try {
    await connectDB();
    const result = await recalculateAllStats();
    return NextResponse.json({
      message: 'All player stats recalculated successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error recalculating all stats:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate all stats' },
      { status: 500 }
    );
  }
}
