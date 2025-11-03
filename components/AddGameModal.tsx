'use client';

import { useState } from 'react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: (gameId: string) => void;
}

export default function AddGameModal({ isOpen, onClose, onGameAdded }: AddGameModalProps) {
  const [gameName, setGameName] = useState('');
  const [scoringMode, setScoringMode] = useState<'pointing' | 'winner-takes-all'>('pointing');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!gameName.trim()) {
      setError('Game name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          scoringMode,
          pointsPerPlayer: scoringMode === 'winner-takes-all' ? 3 : 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add game');
        return;
      }

      // Reset form
      setGameName('');
      setScoringMode('pointing');
      setError('');

      // Notify parent with new game ID
      onGameAdded(data._id);
      onClose();
    } catch (error) {
      setError('Failed to add game');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      setGameName('');
      setScoringMode('pointing');
      setError('');
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Add Game
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game Name
            </label>
            <input
              type="text"
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter game name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="scoringMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scoring Mode
            </label>
            <select
              id="scoringMode"
              value={scoringMode}
              onChange={(e) => setScoringMode(e.target.value as 'pointing' | 'winner-takes-all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="pointing">Pointing System</option>
              <option value="winner-takes-all">Winner Takes All</option>
            </select>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {scoringMode === 'pointing'
                ? '💡 Top 3 players earn points from a shared pool. 1st: 2/3 of pool, 2nd: 2/3 of remainder, 3rd: rest'
                : '💡 Winner gets all points, others get 0'}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
