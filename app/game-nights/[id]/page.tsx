'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api/client';
import Navigation from '@/components/Navigation';
import RSVPButtons from '@/components/RSVPButtons';
import AuthModal from '@/components/AuthModal';

interface Attendee {
  playerId: string;
  playerName: string;
  playerPhotoUrl?: string;
  rsvpStatus: 'going' | 'maybe' | 'not-going';
  joinedAt: string;
}

interface Game {
  _id: string;
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  scoringMode: 'pointing' | 'winner-takes-all';
  pointsPerPlayer: number;
  isActive: boolean;
  createdAt: string;
  // BGG fields
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  bggRating?: number;
  bggAverageWeight?: number;
  designers?: string[];
  categories?: string[];
  mechanics?: string[];
  bggUrl?: string;
  thumbnailUrl?: string;
}

interface GameNight {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  createdBy: string;
  createdByName: string;
  attendees: Attendee[];
  suggestedGames: Game[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  maxAttendees?: number;
  isPrivate: boolean;
  createdAt: string;
}

export default function GameNightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [gameNight, setGameNight] = useState<GameNight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewingGame, setViewingGame] = useState<Game | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);

  useEffect(() => {
    fetchGameNight();
  }, [params.id]);

  const fetchGameNight = async () => {
    setLoading(true);
    setError('');
    try {
      const data: any = await api.getGameNight(params.id as string);
      setGameNight(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch game night');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVPChange = (newStatus: 'going' | 'maybe' | 'not-going' | null) => {
    // Refresh the game night data
    fetchGameNight();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this game night?')) return;

    setDeleting(true);
    try {
      await api.deleteGameNight(params.id as string);
      router.push('/game-nights');
    } catch (err: any) {
      alert(err.message || 'Failed to delete game night');
      setDeleting(false);
    }
  };

  const handleGameClick = async (gameId: string) => {
    setLoadingGame(true);
    try {
      const gameData: any = await api.getGame(gameId);
      setViewingGame(gameData);
      setShowGameModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch game details');
    } finally {
      setLoadingGame(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: { color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', label: 'Upcoming' },
      'in-progress': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', label: 'In Progress' },
      completed: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', label: 'Completed' },
      cancelled: { color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200', label: 'Cancelled' }
    };
    const badge = badges[status as keyof typeof badges] || badges.upcoming;
    return <span className={`px-3 py-1 text-sm font-medium rounded ${badge.color}`}>{badge.label}</span>;
  };

  const getAttendeesByStatus = (status: 'going' | 'maybe' | 'not-going') => {
    return gameNight?.attendees.filter(a => a.rsvpStatus === status) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game night...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !gameNight) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error || 'Game night not found'}</p>
          <Link
            href="/game-nights"
            className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Game Nights
          </Link>
        </div>
        </main>
      </div>
    );
  }

  const going = getAttendeesByStatus('going');
  const maybe = getAttendeesByStatus('maybe');
  const notGoing = getAttendeesByStatus('not-going');

  const isCreator = user && gameNight && user.id === gameNight.createdBy;
  const currentUserRSVP = gameNight?.attendees.find(a => a.playerId === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/game-nights"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Game Nights
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl text-gray-900 dark:text-gray-100 mb-2">
              {gameNight.title}
            </h1>
            {getStatusBadge(gameNight.status)}
          </div>

          {isCreator && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        {/* Date & Location */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{formatDate(gameNight.scheduledDate)}</span>
          </div>

          {gameNight.location && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{gameNight.location}</span>
            </div>
          )}

          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Hosted by {gameNight.createdByName}</span>
          </div>

          {gameNight.maxAttendees && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Max {gameNight.maxAttendees} attendees</span>
            </div>
          )}
        </div>

        {/* Description */}
        {gameNight.description && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {gameNight.description}
            </p>
          </div>
        )}
      </div>

      {/* RSVP Section */}
      {gameNight.status === 'scheduled' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">
            Your RSVP
          </h2>
          {user ? (
            <RSVPButtons
              gameNightId={gameNight._id}
              currentStatus={currentUserRSVP?.rsvpStatus || null}
              onRSVPChange={handleRSVPChange}
            />
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    Please log in to RSVP
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    You need to be logged in to respond to this game night invitation.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendees */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">
          Attendees ({going.length + maybe.length})
        </h2>

        {/* Going */}
        {going.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-green-600 dark:text-green-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Going ({going.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {going.map((attendee) => (
                <Link
                  key={attendee.playerId}
                  href={`/players/${attendee.playerId}`}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    {attendee.playerPhotoUrl ? (
                      <Image
                        src={attendee.playerPhotoUrl}
                        alt={attendee.playerName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                        {attendee.playerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {attendee.playerName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Maybe */}
        {maybe.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-yellow-600 dark:text-yellow-400 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Maybe ({maybe.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {maybe.map((attendee) => (
                <Link
                  key={attendee.playerId}
                  href={`/players/${attendee.playerId}`}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                    {attendee.playerPhotoUrl ? (
                      <Image
                        src={attendee.playerPhotoUrl}
                        alt={attendee.playerName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                        {attendee.playerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {attendee.playerName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {going.length === 0 && maybe.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No RSVPs yet. Be the first to join!
          </p>
        )}
      </div>

      {/* Suggested Games */}
      {gameNight.suggestedGames && gameNight.suggestedGames.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">
            Suggested Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameNight.suggestedGames.map((game) => (
              <button
                key={game._id}
                onClick={() => handleGameClick(game._id)}
                disabled={loadingGame}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {game.thumbnailUrl && (
                  <Image
                    src={game.thumbnailUrl}
                    alt={game.name}
                    width={60}
                    height={60}
                    className="rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {game.name}
                  </p>
                  {game.minPlayers && game.maxPlayers && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {game.minPlayers}-{game.maxPlayers} players
                      {game.playingTime && ` • ${game.playingTime} min`}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      </main>

      {/* Game Details Modal */}
      {showGameModal && viewingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  <Image
                    src={viewingGame.imageUrl || '/game-placeholder.svg'}
                    alt={viewingGame.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl text-gray-900 dark:text-gray-100">
                    {viewingGame.name}
                  </h2>
                  {viewingGame.yearPublished && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Published: {viewingGame.yearPublished}
                    </p>
                  )}
                  {/* Scoring Badge */}
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      viewingGame.scoringMode === 'pointing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                    }`}>
                      {viewingGame.scoringMode === 'pointing' ? 'Pointing' : 'Winner Takes All'} ({viewingGame.pointsPerPlayer} pts/player)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGameModal(false);
                  setShowFullDescription(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {viewingGame.description && (
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    Description
                  </h3>
                  {viewingGame.description.length > 300 ? (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {showFullDescription
                          ? viewingGame.description
                          : `${viewingGame.description.substring(0, 300)}...`}
                      </p>
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showFullDescription ? 'Show Less' : 'Read More'}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {viewingGame.description}
                    </p>
                  )}
                </div>
              )}

              {/* Game Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewingGame.minPlayers && viewingGame.maxPlayers && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Players</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.minPlayers}-{viewingGame.maxPlayers}
                    </p>
                  </div>
                )}

                {viewingGame.playingTime && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Playing Time</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.playingTime} min
                    </p>
                  </div>
                )}

                {viewingGame.bggRating && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">BGG Rating</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.bggRating.toFixed(1)} / 10
                    </p>
                  </div>
                )}

                {viewingGame.bggAverageWeight && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Complexity</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.bggAverageWeight.toFixed(1)} / 5
                    </p>
                  </div>
                )}
              </div>

              {/* Designers */}
              {viewingGame.designers && viewingGame.designers.length > 0 && (
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    Designers
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {viewingGame.designers.join(', ')}
                  </p>
                </div>
              )}

              {/* Categories */}
              {viewingGame.categories && viewingGame.categories.length > 0 && (
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingGame.categories.map((category, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mechanics */}
              {viewingGame.mechanics && viewingGame.mechanics.length > 0 && (
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-gray-100 mb-2">
                    Mechanics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingGame.mechanics.map((mechanic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full"
                      >
                        {mechanic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* BGG Link & Attribution */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {viewingGame.bggUrl && (
                  <a
                    href={viewingGame.bggUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span>View on BoardGameGeek</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <a
                    href="https://boardgamegeek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Powered by BoardGameGeek
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setShowGameModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
