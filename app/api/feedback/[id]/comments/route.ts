import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Feedback from '@/lib/models/Feedback';
import { requireUser } from '@/lib/middleware/authMiddleware';
import { Types } from 'mongoose';

// POST - Add a comment to feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require user authentication (users and admins can comment)
    const authResult = await requireUser(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { text } = body;

    // Validate comment text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    if (text.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Comment text must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Get the feedback item
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Initialize comments array if it doesn't exist (backward compatibility with old documents)
    if (!feedback.comments) {
      feedback.comments = [];
    }

    // Prevent commenting on closed feedback (Dismissed or Completed)
    if (feedback.status === 'Dismissed' || feedback.status === 'Completed') {
      return NextResponse.json(
        { error: 'Cannot comment on closed feedback. This feedback has been ' + feedback.status.toLowerCase() + '.' },
        { status: 403 }
      );
    }

    // Check authorization: users can only comment on their own feedback, admins can comment on any
    if (user.role !== 'admin' && feedback.userId?.toString() !== user.playerId.toString()) {
      return NextResponse.json(
        { error: 'You can only comment on your own feedback' },
        { status: 403 }
      );
    }

    // Add the comment
    const newComment = {
      text: text.trim(),
      authorId: new Types.ObjectId(user.playerId),
      authorName: user.name,
      authorRole: user.role as 'admin' | 'user',
      createdAt: new Date(),
    };

    feedback.comments.push(newComment);
    await feedback.save();

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
