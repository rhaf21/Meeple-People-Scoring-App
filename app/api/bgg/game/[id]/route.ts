import { NextRequest, NextResponse } from 'next/server';
import { getBGGGameDetailsWithRetry } from '@/lib/services/bggService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bggId = parseInt(id);

    if (isNaN(bggId)) {
      return NextResponse.json(
        { error: 'Invalid BGG ID' },
        { status: 400 }
      );
    }

    const gameDetails = await getBGGGameDetailsWithRetry(bggId);

    return NextResponse.json(gameDetails);
  } catch (error) {
    console.error('Error in BGG game details endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details from BoardGameGeek. Please try again.' },
      { status: 500 }
    );
  }
}
