import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Feedback from '@/lib/models/Feedback';
import { requireUser } from '@/lib/middleware/authMiddleware';

// GET - Fetch user's own feedback (requires authentication)
export async function GET(request: NextRequest) {
  try {
    // Require user authentication (allows both users and admins)
    const authResult = await requireUser(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;

    await connectDB();

    // Fetch only feedback created by this user
    const feedbackList = await Feedback.find({ userId: user.playerId })
      .sort({ createdAt: -1 })
      .lean();

    // Normalize feedback to ensure comments array exists and serialize ObjectIds properly
    const normalizedFeedback = feedbackList.map(f => ({
      ...f,
      _id: f._id.toString(),
      userId: f.userId?.toString() || null,
      comments: (f.comments || []).map((c: any) => ({
        text: c.text,
        authorId: c.authorId.toString(),
        authorName: c.authorName,
        authorRole: c.authorRole,
        createdAt: c.createdAt,
        _id: c._id?.toString(),
      })),
    }));

    return NextResponse.json(normalizedFeedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your feedback' },
      { status: 500 }
    );
  }
}
