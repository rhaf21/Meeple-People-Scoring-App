import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';
import { generateOTP, getOTPExpiry, hashValue } from '@/lib/utils/auth';
import { sendOTPEmail } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, playerId } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let player;

    // If playerId is not provided, this is a login attempt (find player by email)
    if (!playerId) {
      player = await Player.findOne({
        email: email.toLowerCase(),
        profileClaimed: true
      });

      if (!player) {
        return NextResponse.json(
          { error: 'No profile found with this email. Please claim a profile first.' },
          { status: 404 }
        );
      }
    } else {
      // Claim flow - playerId is provided
      player = await Player.findById(playerId);
      if (!player) {
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      // Check if email is already claimed by another player
      if (player.email && player.email !== email && player.profileClaimed) {
        return NextResponse.json(
          { error: 'This profile already has a different email address' },
          { status: 400 }
        );
      }

      const existingPlayer = await Player.findOne({ email: email.toLowerCase(), _id: { $ne: playerId } });
      if (existingPlayer && existingPlayer.profileClaimed) {
        return NextResponse.json(
          { error: 'This email is already associated with another player' },
          { status: 400 }
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashValue(otp);
    const otpExpiry = getOTPExpiry();

    // Save OTP to player
    player.email = email.toLowerCase();
    player.otp = hashedOTP;
    player.otpExpiry = otpExpiry;
    await player.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, player.name);

    if (!emailSent) {
      return NextResponse.json(
        {
          error: 'Failed to send OTP email. Please check email configuration.',
          // In development, return the OTP for testing
          ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully to your email',
      expiresIn: '10 minutes',
      // In development mode, include OTP in response for easier testing
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    });

  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
