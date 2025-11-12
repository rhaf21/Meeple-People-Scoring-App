import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import SystemSettings from '@/lib/models/SystemSettings';
import { requireAdmin } from '@/lib/middleware/authMiddleware';

// GET - Fetch system settings (public, no auth required for reading)
export async function GET() {
  try {
    await connectDB();

    let settings = await SystemSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await SystemSettings.create({
        siteTitle: 'Farty Meople Scoring App',
        primaryColor: '#2563eb',
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update system settings (requires admin authentication)
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    await connectDB();

    const body = await req.json();
    const { logoUrl, logoPublicId, faviconUrl, faviconPublicId, siteTitle, primaryColor } = body;

    // Find existing settings or create new
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    // Update fields if provided
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (logoPublicId !== undefined) settings.logoPublicId = logoPublicId;
    if (faviconUrl !== undefined) settings.faviconUrl = faviconUrl;
    if (faviconPublicId !== undefined) settings.faviconPublicId = faviconPublicId;
    if (siteTitle !== undefined) settings.siteTitle = siteTitle;
    if (primaryColor !== undefined) settings.primaryColor = primaryColor;

    await settings.save();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
