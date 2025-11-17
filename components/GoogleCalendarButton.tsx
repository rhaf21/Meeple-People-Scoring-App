'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface GoogleCalendarButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

export default function GoogleCalendarButton({ onConnectionChange }: GoogleCalendarButtonProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, [user]);

  const checkConnectionStatus = async () => {
    if (!user) return;

    try {
      // Fetch current user's Google Calendar connection status
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/players/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.googleCalendarConnected || false);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/google/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Google Calendar connection');
      }

      const data = await response.json();

      // Redirect to Google OAuth
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? You will no longer receive calendar invites for game nights.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Google Calendar');
      }

      setIsConnected(false);
      onConnectionChange?.(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.46 12c0-.66-.06-1.31-.17-1.94H12v3.68h5.85c-.25 1.33-1.03 2.46-2.19 3.22v2.67h3.54c2.08-1.91 3.26-4.73 3.26-7.63z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.67c-.99.67-2.26 1.06-3.74 1.06-2.88 0-5.32-1.94-6.19-4.54H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.81 14.19c-.22-.67-.35-1.39-.35-2.19s.13-1.52.35-2.19V7.03H2.18C1.43 8.51 1 10.22 1 12s.43 3.49 1.18 4.97l3.63-2.78z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.62 0 3.08.56 4.23 1.65l3.17-3.17C17.45 1.39 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.03l3.63 2.78c.87-2.6 3.31-4.54 6.19-4.54z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Google Calendar
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isConnected && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ You'll receive calendar invites when organizers create game nights and add you to the invite list.
          </p>
        </div>
      )}
    </div>
  );
}
