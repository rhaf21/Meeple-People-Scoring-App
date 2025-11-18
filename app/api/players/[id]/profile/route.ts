import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import { optionalAuth, requireAuth, isResourceOwner } from '@/lib/middleware/authMiddleware';
import { Types } from 'mongoose';

// GET player profile by ID (public or private based on settings)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if request is authenticated
    const user = await optionalAuth(request);

    const player = await Player.findById(id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if profile is private and user is not the owner
    const isOwner = user && user.playerId === id;
    if (!player.publicProfile && !isOwner) {
      return NextResponse.json(
        { error: 'This profile is private' },
        { status: 403 }
      );
    }

    // Return full profile for owner, limited profile for others
    const profileData: any = {
      _id: (player._id as Types.ObjectId).toString(),
      name: player.name,
      photoUrl: player.photoUrl,
      profileClaimed: player.profileClaimed,
      badges: player.badges || [],
    };

    // Add public fields
    if (player.publicProfile || isOwner) {
      profileData.bio = player.bio;
      profileData.playStyle = player.playStyle;
      profileData.topFavoriteGames = player.topFavoriteGames;
      profileData.leastFavoriteGames = player.leastFavoriteGames;
    }

    // Add stats if visible
    if (player.showStats || isOwner) {
      profileData.showStats = player.showStats;
      // Stats will be fetched from stats endpoint
    }

    // Add private fields only for owner
    if (isOwner) {
      profileData.email = player.email;
      profileData.availability = player.availability;
      profileData.publicProfile = player.publicProfile;
      profileData.emailVerified = player.emailVerified;
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player profile' },
      { status: 500 }
    );
  }
}

// PUT update player profile (authenticated only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;
    const { id } = await params;

    // Check if user owns this profile
    if (!isResourceOwner(user, id)) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own profile' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      bio,
      playStyle,
      topFavoriteGames,
      leastFavoriteGames,
      availability,
      publicProfile,
      showStats,
      photoUrl,
      photoPublicId,
    } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (playStyle !== undefined) updateData.playStyle = playStyle;
    if (topFavoriteGames !== undefined) {
      if (Array.isArray(topFavoriteGames) && topFavoriteGames.length <= 3) {
        updateData.topFavoriteGames = topFavoriteGames;
      }
    }
    if (leastFavoriteGames !== undefined) {
      if (Array.isArray(leastFavoriteGames) && leastFavoriteGames.length <= 3) {
        updateData.leastFavoriteGames = leastFavoriteGames;
      }
    }
    if (availability !== undefined) updateData.availability = availability;
    if (publicProfile !== undefined) updateData.publicProfile = publicProfile;
    if (showStats !== undefined) updateData.showStats = showStats;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (photoPublicId !== undefined) updateData.photoPublicId = photoPublicId;

    const player = await Player.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      player: {
        id: (player._id as Types.ObjectId).toString(),
        name: player.name,
        email: player.email,
        photoUrl: player.photoUrl,
        bio: player.bio,
        playStyle: player.playStyle,
        topFavoriteGames: player.topFavoriteGames,
        leastFavoriteGames: player.leastFavoriteGames,
        availability: player.availability,
        publicProfile: player.publicProfile,
        showStats: player.showStats,
      }
    });
  } catch (error: any) {
    console.error('Error updating player profile:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    return NextResponse.json(
      { error: 'Failed to update player profile', details: error.message },
      { status: 500 }
    );
  }
}
