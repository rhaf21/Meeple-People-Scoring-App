'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api, apiClient } from '@/lib/api/client';

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  recurring: boolean;
}

interface PlayerProfile {
  _id: string;
  name: string;
  photoUrl?: string;
  email?: string;
  emailVerified: boolean;
  profileClaimed: boolean;
  bio?: string;
  playStyle?: string;
  favoriteGames: string[];
  availability: Availability[];
  publicProfile: boolean;
  showStats: boolean;
  createdAt: string;
}

interface PlayerStats {
  totalGamesPlayed: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  averagePointsPerGame: number;
  favoriteGame?: {
    name: string;
    timesPlayed: number;
  };
}

export default function PlayerProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editBio, setEditBio] = useState('');
  const [editPlayStyle, setEditPlayStyle] = useState('');
  const [editPublicProfile, setEditPublicProfile] = useState(true);
  const [editShowStats, setEditShowStats] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlayer();
  }, [params.id]);

  const fetchPlayer = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, statsData]: any = await Promise.all([
        api.getPlayerProfile(params.id as string),
        apiClient.get(`/api/players/${params.id}/stats`).catch(() => null),
      ]);

      setPlayer(profileData);
      setStats(statsData);

      // Initialize edit form
      setEditBio(profileData.bio || '');
      setEditPlayStyle(profileData.playStyle || '');
      setEditPublicProfile(profileData.publicProfile ?? true);
      setEditShowStats(profileData.showStats ?? true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch player profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await api.updatePlayerProfile(params.id as string, {
        bio: editBio || undefined,
        playStyle: editPlayStyle || undefined,
        publicProfile: editPublicProfile,
        showStats: editShowStats,
      });

      // Refresh player data
      await fetchPlayer();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current values
    if (player) {
      setEditBio(player.bio || '');
      setEditPlayStyle(player.playStyle || '');
      setEditPublicProfile(player.publicProfile ?? true);
      setEditShowStats(player.showStats ?? true);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isOwner = user && player && user.id === player._id;
  // Can only edit if: (1) you're the owner AND profile is claimed, OR (2) profile is unclaimed (admin edit)
  const canEdit = player && ((isOwner && player.profileClaimed) || !player.profileClaimed);
  const canView = !!player; // All profiles are viewable by everyone

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error || 'Player not found'}</p>
          <Link
            href="/players"
            className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Players
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/players"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Players
      </Link>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {player.photoUrl ? (
                <Image
                  src={player.photoUrl}
                  alt={player.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-4xl">
                  {player.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {player.name}
              </h1>
              {player.emailVerified && (
                <div className="flex items-center mt-1 text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Verified Profile</span>
                </div>
              )}
              {isOwner && player.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{player.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice for Claimed Profiles */}
        {player.profileClaimed && !isOwner && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  This profile has been claimed by its owner
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Only the profile owner can edit their information for security purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Play Style
              </label>
              <input
                type="text"
                value={editPlayStyle}
                onChange={(e) => setEditPlayStyle(e.target.value)}
                placeholder="e.g., Competitive, Casual, Strategic, Social"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="publicProfile"
                  checked={editPublicProfile}
                  onChange={(e) => setEditPublicProfile(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={saving}
                />
                <label htmlFor="publicProfile" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Make profile public (anyone can view)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showStats"
                  checked={editShowStats}
                  onChange={(e) => setEditShowStats(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={saving}
                />
                <label htmlFor="showStats" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show statistics on profile
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Bio */}
            {player.bio && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About</h3>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{player.bio}</p>
              </div>
            )}

            {/* Play Style */}
            {player.playStyle && (
              <div className={player.bio ? 'mt-4' : 'pt-4 border-t border-gray-200 dark:border-gray-700'}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Play Style</h3>
                <p className="text-gray-800 dark:text-gray-200">{player.playStyle}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Statistics */}
      {stats && player.showStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Statistics</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Games Played</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalGamesPlayed}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Wins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalWins}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.winRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPoints}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Points/Game</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.averagePointsPerGame.toFixed(1)}
              </p>
            </div>

            {stats.favoriteGame && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Favorite Game</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {stats.favoriteGame.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.favoriteGame.timesPlayed} plays
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability */}
      {player.availability && player.availability.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Availability</h2>

          <div className="space-y-2">
            {player.availability
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getDayName(slot.dayOfWeek)}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
