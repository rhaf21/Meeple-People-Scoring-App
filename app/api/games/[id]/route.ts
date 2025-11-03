import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameDefinition from '@/lib/models/GameDefinition';

// GET game by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const game = await GameDefinition.findById(id);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

// PUT update game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await request.json();
    const { name, scoringMode, pointsPerPlayer, imageUrl, imagePublicId, isActive } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Game name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (scoringMode !== undefined) {
      if (!['pointing', 'winner-takes-all'].includes(scoringMode)) {
        return NextResponse.json(
          { error: 'Scoring mode must be either "pointing" or "winner-takes-all"' },
          { status: 400 }
        );
      }
      updateData.scoringMode = scoringMode;
    }

    if (pointsPerPlayer !== undefined) {
      updateData.pointsPerPlayer = pointsPerPlayer;
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    if (imagePublicId !== undefined) {
      updateData.imagePublicId = imagePublicId;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const game = await GameDefinition.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error('Error updating game:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Game name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

// DELETE game (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const game = await GameDefinition.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Game deactivated successfully',
      game
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
