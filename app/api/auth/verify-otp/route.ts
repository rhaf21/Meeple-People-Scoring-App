import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import { verifyHashedValue, generateToken, isOTPExpired } from '@/lib/utils/auth';
import { sendWelcomeEmail } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp, playerId } = body;

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    let player;

    // If playerId is not provided, this is a login attempt (find player by email)
    if (!playerId) {
      player = await Player.findOne({
        email: email.toLowerCase(),
        profileClaimed: true
      }).select('+otp +otpExpiry');

      if (!player) {
        return NextResponse.json(
          { error: 'No profile found with this email' },
          { status: 404 }
        );
      }
    } else {
      // Claim flow - playerId is provided
      player = await Player.findById(playerId).select('+otp +otpExpiry');
      if (!player) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      // Check if email matches
      if (player.email?.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match' },
          { status: 400 }
        );
      }
    }

    // Check if OTP exists
    if (!player.otp || !player.otpExpiry) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (isOTPExpired(player.otpExpiry)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = verifyHashedValue(otp, player.otp);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check if this is a new claim (for welcome email)
    const wasAlreadyClaimed = player.profileClaimed;

    // OTP is valid - claim the profile
    player.emailVerified = true;
    player.profileClaimed = true;
    player.otp = undefined; // Clear OTP
    player.otpExpiry = undefined; // Clear expiry
    await player.save();

    // Send welcome email only for NEW claims (non-blocking)
    if (!wasAlreadyClaimed) {
      sendWelcomeEmail(player.email!, player.name).catch(err =>
        console.error('Failed to send welcome email:', err)
      );
    }

    // Generate JWT token
    const token = generateToken({
      playerId: player._id.toString(),
      email: player.email!,
      name: player.name,
      role: player.role,
    });

    return NextResponse.json({
      message: 'Profile claimed successfully!',
      token,
      player: {
        id: player._id.toString(),
        name: player.name,
        email: player.email,
        photoUrl: player.photoUrl,
        bio: player.bio,
        playStyle: player.playStyle,
        topFavoriteGames: player.topFavoriteGames || [],
        leastFavoriteGames: player.leastFavoriteGames || [],
        publicProfile: player.publicProfile,
        showStats: player.showStats,
        profileClaimed: player.profileClaimed,
        emailVerified: player.emailVerified,
        role: player.role,
      }
    });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
