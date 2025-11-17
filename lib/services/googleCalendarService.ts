import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Player from '@/lib/models/Player';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { Types } from 'mongoose';

// Initialize OAuth2 client
function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get authenticated calendar client for a player
 */
async function getCalendarClient(playerId: string | Types.ObjectId) {
  const player = await Player.findById(playerId).select('+googleAccessToken +googleRefreshToken');

  if (!player) {
    throw new Error('Player not found');
  }

  if (!player.googleCalendarConnected || !player.googleAccessToken) {
    throw new Error('Player has not connected Google Calendar');
  }

  const oauth2Client = getOAuth2Client();

  // Decrypt tokens
  const accessToken = decrypt(player.googleAccessToken);
  const refreshToken = player.googleRefreshToken ? decrypt(player.googleRefreshToken) : null;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Check if token is expired and refresh if needed
  if (player.googleTokenExpiry && new Date(player.googleTokenExpiry) < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update player with new tokens
      if (credentials.access_token) {
        player.googleAccessToken = encrypt(credentials.access_token);
      }
      if (credentials.expiry_date) {
        player.googleTokenExpiry = new Date(credentials.expiry_date);
      }
      await player.save();

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh Google Calendar access. Please reconnect your account.');
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  attendees?: Array<{ email: string; displayName?: string }>;
  organizerId: string | Types.ObjectId;
}

/**
 * Create a Google Calendar event
 */
export async function createCalendarEvent(params: CreateEventParams) {
  const { summary, description, location, startDateTime, endDateTime, attendees, organizerId } = params;

  try {
    const calendar = await getCalendarClient(organizerId);

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendees?.map(a => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: 'needsAction',
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      sendUpdates: 'all', // Send invites to all attendees
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',
    });

    return {
      eventId: response.data.id || '',
      eventUrl: response.data.htmlLink || '',
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

interface UpdateEventParams {
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  attendees?: Array<{ email: string; displayName?: string }>;
  organizerId: string | Types.ObjectId;
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(params: UpdateEventParams) {
  const { eventId, summary, description, location, startDateTime, endDateTime, attendees, organizerId } = params;

  try {
    const calendar = await getCalendarClient(organizerId);

    // First, get the existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const updatedEvent: any = { ...existingEvent.data };

    // Update only provided fields
    if (summary !== undefined) updatedEvent.summary = summary;
    if (description !== undefined) updatedEvent.description = description;
    if (location !== undefined) updatedEvent.location = location;
    if (startDateTime) {
      updatedEvent.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (endDateTime) {
      updatedEvent.end = {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (attendees) {
      updatedEvent.attendees = attendees.map(a => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: 'needsAction',
      }));
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all', // Notify all attendees of changes
    });

    return {
      eventId: response.data.id || '',
      eventUrl: response.data.htmlLink || '',
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete/Cancel a Google Calendar event
 */
export async function deleteCalendarEvent(eventId: string, organizerId: string | Types.ObjectId) {
  try {
    const calendar = await getCalendarClient(organizerId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all', // Notify all attendees of cancellation
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Get attendee responses for a calendar event
 */
export async function getEventAttendeeStatus(eventId: string, organizerId: string | Types.ObjectId) {
  try {
    const calendar = await getCalendarClient(organizerId);

    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const attendees = response.data.attendees || [];

    return attendees.map(attendee => ({
      email: attendee.email || '',
      displayName: attendee.displayName || '',
      responseStatus: attendee.responseStatus || 'needsAction', // 'accepted', 'declined', 'tentative', 'needsAction'
    }));
  } catch (error: any) {
    console.error('Error getting event attendee status:', error);
    throw new Error(`Failed to get event attendee status: ${error.message}`);
  }
}

/**
 * Map Google Calendar response status to app RSVP status
 */
export function mapCalendarResponseToRSVP(calendarResponse: string): 'going' | 'maybe' | 'not-going' {
  switch (calendarResponse) {
    case 'accepted':
      return 'going';
    case 'tentative':
      return 'maybe';
    case 'declined':
      return 'not-going';
    default:
      return 'maybe'; // needsAction defaults to maybe
  }
}

/**
 * Map app RSVP status to Google Calendar response status
 */
export function mapRSVPToCalendarResponse(rsvpStatus: 'going' | 'maybe' | 'not-going'): string {
  switch (rsvpStatus) {
    case 'going':
      return 'accepted';
    case 'maybe':
      return 'tentative';
    case 'not-going':
      return 'declined';
  }
}

/**
 * Update attendee response status in calendar event
 */
export async function updateAttendeeResponse(
  eventId: string,
  attendeeEmail: string,
  rsvpStatus: 'going' | 'maybe' | 'not-going',
  organizerId: string | Types.ObjectId
) {
  try {
    const calendar = await getCalendarClient(organizerId);

    // Get current event
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const attendees = event.data.attendees || [];
    const attendeeIndex = attendees.findIndex(a => a.email === attendeeEmail);

    if (attendeeIndex === -1) {
      throw new Error('Attendee not found in event');
    }

    // Update response status
    attendees[attendeeIndex].responseStatus = mapRSVPToCalendarResponse(rsvpStatus);

    // Update event
    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        ...event.data,
        attendees,
      },
      sendUpdates: 'none', // Don't send notifications for RSVP changes
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating attendee response:', error);
    throw new Error(`Failed to update attendee response: ${error.message}`);
  }
}

/**
 * Save OAuth tokens for a player
 */
export async function savePlayerTokens(
  playerId: string | Types.ObjectId,
  accessToken: string,
  refreshToken: string,
  expiryDate: number
) {
  const player = await Player.findById(playerId);

  if (!player) {
    throw new Error('Player not found');
  }

  // Encrypt tokens before saving
  player.googleAccessToken = encrypt(accessToken);
  player.googleRefreshToken = encrypt(refreshToken);
  player.googleTokenExpiry = new Date(expiryDate);
  player.googleCalendarConnected = true;

  await player.save();

  return { success: true };
}

/**
 * Disconnect Google Calendar for a player
 */
export async function disconnectGoogleCalendar(playerId: string | Types.ObjectId) {
  const player = await Player.findById(playerId);

  if (!player) {
    throw new Error('Player not found');
  }

  player.googleAccessToken = undefined;
  player.googleRefreshToken = undefined;
  player.googleTokenExpiry = undefined;
  player.googleCalendarConnected = false;

  await player.save();

  return { success: true };
}
