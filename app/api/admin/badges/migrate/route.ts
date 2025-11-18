import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/authMiddleware';
import { migrateAllPlayerBadges, getBadgeStats } from '@/lib/services/badges';

// POST - Run badge migration for all players (admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const results = await migrateAllPlayerBadges();
    const stats = await getBadgeStats();

    // Calculate total badges awarded
    const totalBadgesAwarded = results.results.reduce(
      (sum, r) => sum + r.badgesAwarded,
      0
    );

    return NextResponse.json({
      message: 'Badge migration completed successfully',
      summary: {
        totalPlayers: results.totalPlayers,
        totalBadgesAwarded,
        availableBadges: stats.totalBadgesAvailable
      },
      results: results.results
    });
  } catch (error: any) {
    console.error('Badge migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to migrate badges' },
      { status: 500 }
    );
  }
}

// GET - Get badge migration stats (admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const stats = await getBadgeStats();

    return NextResponse.json({
      availableBadges: stats.totalBadgesAvailable,
      byTier: stats.badgesByTier
    });
  } catch (error: any) {
    console.error('Badge stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get badge stats' },
      { status: 500 }
    );
  }
}
