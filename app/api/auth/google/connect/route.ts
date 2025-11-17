import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireAuth } from '@/lib/middleware/authMiddleware';

/**
 * POST /api/auth/google/connect
 * Initiates Google OAuth flow for calendar integration
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Generate auth URL with calendar scope
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar.events', // Manage calendar events
        'https://www.googleapis.com/auth/calendar.readonly', // Read calendar
      ],
      state: user.playerId, // Pass player ID in state for callback
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
}
