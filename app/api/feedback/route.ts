import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import Feedback from '@/lib/models/Feedback';
import { requireAdmin, optionalAuth } from '@/lib/middleware/authMiddleware';

// GET - Fetch all feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (search) {
      filter.message = { $regex: search, $options: 'i' };
    }

    // Fetch feedback sorted by newest first
    const feedbackList = await Feedback.find(filter)
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
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Submit new feedback (optional authentication)
export async function POST(request: NextRequest) {
  try {
    // Optional auth - get user if authenticated, but allow guests
    const user = await optionalAuth(request);

    await connectDB();

    const body = await request.json();
    const { message, category, priority, userEmail, userName } = body;

    // Validate required fields
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await Feedback.create({
      message: message.trim(),
      category: category || 'General Feedback',
      priority: priority || 'Medium',
      status: 'New',
      userEmail: user ? user.email : userEmail,
      userId: user ? user.playerId : null,
      userName: user ? user.name : userName,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your feedback! We appreciate your input.',
        feedback
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
