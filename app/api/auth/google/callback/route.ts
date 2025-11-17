import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { savePlayerTokens } from '@/lib/services/googleCalendarService';

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google
 * Public endpoint (no auth required as Google redirects here)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Player ID
    const error = searchParams.get('error');

    // Handle user denying access
    if (error) {
      return NextResponse.redirect(
        new URL(`/profile?error=google_access_denied`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/profile?error=invalid_oauth_response`, request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL(`/profile?error=oauth_not_configured`, request.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return NextResponse.redirect(
        new URL(`/profile?error=invalid_tokens`, request.url)
      );
    }

    // Save tokens to player document
    await savePlayerTokens(
      state, // Player ID from state
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date
    );

    // Redirect back to profile with success message
    return NextResponse.redirect(
      new URL(`/profile?success=google_calendar_connected`, request.url)
    );
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/profile?error=oauth_callback_failed`, request.url)
    );
  }
}
