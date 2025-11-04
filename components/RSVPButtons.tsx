'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';

interface RSVPButtonsProps {
  gameNightId: string;
  currentStatus: 'going' | 'maybe' | 'not-going' | null;
  onRSVPChange: (newStatus: 'going' | 'maybe' | 'not-going' | null) => void;
}

export default function RSVPButtons({ gameNightId, currentStatus, onRSVPChange }: RSVPButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRSVP = async (status: 'going' | 'maybe' | 'not-going') => {
    setLoading(true);
    setError('');

    try {
      if (currentStatus === status) {
        // Remove RSVP if clicking the same status
        await api.removeRSVP(gameNightId);
        onRSVPChange(null);
      } else {
        // Update or create RSVP
        await api.rsvpGameNight(gameNightId, status);
        onRSVPChange(status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update RSVP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {/* Going Button */}
        <button
          onClick={() => handleRSVP('going')}
          disabled={loading}
          className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${
            currentStatus === 'going'
              ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {currentStatus === 'going' ? 'Going ✓' : 'Going'}
          </div>
        </button>

        {/* Maybe Button */}
        <button
          onClick={() => handleRSVP('maybe')}
          disabled={loading}
          className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${
            currentStatus === 'maybe'
              ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {currentStatus === 'maybe' ? 'Maybe ✓' : 'Maybe'}
          </div>
        </button>

        {/* Not Going Button */}
        <button
          onClick={() => handleRSVP('not-going')}
          disabled={loading}
          className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 ${
            currentStatus === 'not-going'
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {currentStatus === 'not-going' ? 'Not Going ✓' : 'Not Going'}
          </div>
        </button>
      </div>

      {/* Help Text */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
        {currentStatus
          ? 'Click your current status again to remove your RSVP'
          : 'Let others know if you\'re attending'}
      </p>

      {/* Error Message */}
      {error && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
