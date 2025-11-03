import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Player from '@/lib/models/Player';

// GET player by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const player = await Player.findById(id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

// PUT update player
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, photoUrl, photoPublicId, isActive } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Player name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (photoPublicId !== undefined) updateData.photoPublicId = photoPublicId;
    if (isActive !== undefined) updateData.isActive = isActive;

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

    return NextResponse.json(player);
  } catch (error: any) {
    console.error('Error updating player:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Player name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

// DELETE player (soft delete - sets isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const player = await Player.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Player archived successfully',
      player
    });
  } catch (error) {
    console.error('Error archiving player:', error);
    return NextResponse.json(
      { error: 'Failed to archive player' },
      { status: 500 }
    );
  }
}
