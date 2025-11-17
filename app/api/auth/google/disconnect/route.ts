import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { disconnectGoogleCalendar } from '@/lib/services/googleCalendarService';

/**
 * POST /api/auth/google/disconnect
 * Disconnects Google Calendar integration for the authenticated user
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    await disconnectGoogleCalendar(user.playerId);

    return NextResponse.json({
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
