'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type FeedbackCategory = 'Bug Report' | 'Feature Request' | 'Improvement' | 'General Feedback';
type FeedbackPriority = 'Low' | 'Medium' | 'High';
type FeedbackStatus = 'New' | 'In Progress' | 'Completed' | 'Dismissed';

interface Comment {
  text: string;
  authorId: string;
  authorName: string;
  authorRole: 'user' | 'admin';
  createdAt: string;
}

interface Feedback {
  _id: string;
  message: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  userEmail?: string;
  userId?: string;
  userName?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export default function MyFeedbackPage() {
  const { token, user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [addingComment, setAddingComment] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchMyFeedback();
    }
  }, [token]);

  async function fetchMyFeedback() {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback/my-feedback', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addComment(feedbackId: string) {
    const text = commentText[feedbackId]?.trim();
    if (!text) return;

    setAddingComment(feedbackId);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const newComment = await response.json();

        // Optimistically update the local state
        setFeedback(feedback.map(item =>
          item._id === feedbackId
            ? { ...item, comments: [...(item.comments || []), newComment] }
            : item
        ));

        setCommentText({ ...commentText, [feedbackId]: '' });

        // Still fetch to ensure sync with server
        fetchMyFeedback();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setAddingComment(null);
    }
  }

  function getStatusColor(status: FeedbackStatus) {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  function getPriorityColor(priority: FeedbackPriority) {
    switch (priority) {
      case 'High':
        return 'text-red-600 dark:text-red-400';
      case 'Medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'Low':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center py-12">
            <p className="text-gray-700 dark:text-gray-300">Please log in to view your feedback.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Loading your feedback...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
            My Feedback
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View the status of your submitted feedback
          </p>
        </div>

        {/* Feedback List */}
        {feedback.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-2">You haven't submitted any feedback yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Click "Send Feedback" in your profile menu to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-medium">
                          {item.category}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitted on {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-3">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {expandedId === item._id
                        ? item.message
                        : item.message.length > 200
                        ? `${item.message.substring(0, 200)}...`
                        : item.message}
                    </p>
                    {item.message.length > 200 && (
                      <button
                        onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {expandedId === item._id ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>

                  {/* Status Info */}
                  {item.status === 'In Progress' && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        👀 We're looking into this!
                      </p>
                    </div>
                  )}
                  {item.status === 'Completed' && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300">
                        ✅ This has been addressed!
                      </p>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Comments ({item.comments?.length || 0})
                    </h3>

                    {/* Existing Comments */}
                    {item.comments && item.comments.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {item.comments.map((comment, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {comment.authorName}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  comment.authorRole === 'admin'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                }`}>
                                  {comment.authorRole}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Form */}
                    {item.status === 'Dismissed' || item.status === 'Completed' ? (
                      <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          This feedback has been {item.status.toLowerCase()}. Comments are disabled.
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText[item._id] || ''}
                          onChange={(e) => setCommentText({ ...commentText, [item._id]: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              addComment(item._id);
                            }
                          }}
                          placeholder="Add a comment..."
                          disabled={addingComment === item._id}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50"
                        />
                        <button
                          onClick={() => addComment(item._id)}
                          disabled={addingComment === item._id || !commentText[item._id]?.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {addingComment === item._id ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
