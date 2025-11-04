'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';

interface GameNight {
  _id: string;
  title: string;
  scheduledDate: string;
  location?: string;
  createdByName: string;
  attendees: {
    playerId: string;
    status: 'going' | 'maybe' | 'not-going';
  }[];
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
}

export default function UpcomingGameNights() {
  const [gameNights, setGameNights] = useState<GameNight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameNights();
  }, []);

  const fetchGameNights = async () => {
    try {
      const data: any = await api.getGameNights();

      // Filter for upcoming game nights only
      const now = new Date();
      const upcoming = data
        .filter((gn: GameNight) =>
          new Date(gn.scheduledDate) >= now && gn.status !== 'cancelled'
        )
        .sort((a: GameNight, b: GameNight) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        )
        .slice(0, 3); // Show only the next 3

      setGameNights(upcoming);
    } catch (err) {
      console.error('Error fetching game nights:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGoingCount = (attendees: GameNight['attendees']) => {
    return attendees.filter(a => a.status === 'going').length;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Game Nights</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp animate-delay-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upcoming Game Nights</h2>
        <Link
          href="/game-nights"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          View All
        </Link>
      </div>

      {gameNights.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-gray-700 dark:text-gray-300">No upcoming game nights</p>
          <Link
            href="/game-nights"
            className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Create one now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {gameNights.map((gameNight, idx) => (
            <Link
              key={gameNight._id}
              href={`/game-nights/${gameNight._id}`}
              className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-fadeInUp"
              style={{animationDelay: `${0.1 * idx}s`}}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2">
                  {gameNight.title}
                </h3>
                <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                  {formatDate(gameNight.scheduledDate)}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {gameNight.location && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{gameNight.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">{gameNight.createdByName}</span>
                  </div>

                  {getGoingCount(gameNight.attendees) > 0 && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {getGoingCount(gameNight.attendees)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
