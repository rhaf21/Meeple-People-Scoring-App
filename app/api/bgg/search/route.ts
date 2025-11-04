import { NextRequest, NextResponse } from 'next/server';
import { searchBGGWithRetry } from '@/lib/services/bggService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await searchBGGWithRetry(query.trim());

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in BGG search endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to search BoardGameGeek. Please try again.' },
      { status: 500 }
    );
  }
}
