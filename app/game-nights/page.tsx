'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api/client';
import Navigation from '@/components/Navigation';
import CreateGameNightModal from '@/components/CreateGameNightModal';

interface GameNight {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  createdByName: string;
  attendees: {
    playerId: string;
    playerName: string;
    rsvpStatus: 'going' | 'maybe' | 'not-going';
  }[];
  suggestedGames: string[];
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  maxAttendees?: number;
  isPrivate: boolean;
}

export default function GameNightsPage() {
  const { user } = useAuth();
  const [gameNights, setGameNights] = useState<GameNight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchGameNights();
  }, [filter]);

  const fetchGameNights = async () => {
    setLoading(true);
    setError('');
    try {
      const data: any = await api.getGameNights();

      // Filter based on selected filter
      const now = new Date();
      let filtered = data;

      if (filter === 'upcoming') {
        filtered = data.filter((gn: GameNight) =>
          new Date(gn.scheduledDate) >= now && gn.status !== 'cancelled'
        );
      } else if (filter === 'past') {
        filtered = data.filter((gn: GameNight) =>
          new Date(gn.scheduledDate) < now || gn.status === 'completed' || gn.status === 'cancelled'
        );
      }

      // Sort by date (upcoming first for upcoming, recent first for past)
      filtered.sort((a: GameNight, b: GameNight) => {
        const dateA = new Date(a.scheduledDate).getTime();
        const dateB = new Date(b.scheduledDate).getTime();
        return filter === 'past' ? dateB - dateA : dateA - dateB;
      });

      setGameNights(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch game nights');
    } finally {
      setLoading(false);
    }
  };

  const handleGameNightCreated = () => {
    fetchGameNights();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'in-progress': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      completed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return badges[status as keyof typeof badges] || badges.upcoming;
  };

  const getGoingCount = (attendees: GameNight['attendees']) => {
    return attendees.filter(a => a.rsvpStatus === 'going').length;
  };

  const getMaybeCount = (attendees: GameNight['attendees']) => {
    return attendees.filter(a => a.rsvpStatus === 'maybe').length;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Game Nights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Schedule and join game nights with your group
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Game Night
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'upcoming'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'past'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Past
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game nights...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && gameNights.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            No game nights yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {user
              ? 'Create your first game night to get started!'
              : 'Login to create and join game nights'}
          </p>
          {user && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Game Night
            </button>
          )}
        </div>
      )}

      {/* Game Nights Grid */}
      {!loading && !error && gameNights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameNights.map((gameNight) => (
            <Link
              key={gameNight._id}
              href={`/game-nights/${gameNight._id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/30 transition-shadow overflow-hidden"
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex-1">
                    {gameNight.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(gameNight.status)}`}>
                    {gameNight.status}
                  </span>
                </div>

                {/* Date & Location */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(gameNight.scheduledDate)}
                  </div>
                  {gameNight.location && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {gameNight.location}
                    </div>
                  )}
                </div>

                {/* Description */}
                {gameNight.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {gameNight.description}
                  </p>
                )}

                {/* Attendees */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {getGoingCount(gameNight.attendees)}
                    </div>
                    {getMaybeCount(gameNight.attendees) > 0 && (
                      <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {getMaybeCount(gameNight.attendees)}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    by {gameNight.createdByName}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

          {/* Create Game Night Modal */}
          <CreateGameNightModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onGameNightCreated={handleGameNightCreated}
          />
        </div>
      </main>
    </div>
  );
}
