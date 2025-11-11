import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Feedback from '@/lib/models/Feedback';
import { requireAdmin } from '@/lib/middleware/authMiddleware';

// PATCH - Update feedback status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['New', 'In Progress', 'Completed', 'Dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update feedback
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Normalize feedback to ensure comments array exists (backward compatibility)
    const normalizedFeedback = {
      ...feedback.toObject(),
      comments: feedback.comments || []
    };

    return NextResponse.json(normalizedFeedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { id } = await params;
    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
