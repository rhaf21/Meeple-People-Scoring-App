'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Game {
  _id: string;
  name: string;
  scoringMode: string;
  pointsPerPlayer: number;
}

interface Player {
  _id: string;
  name: string;
}

interface GamePlayer {
  playerId: string;
  playerName: string;
  rank: number;
}

export default function RecordGamePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchPlayers();
  }, []);

  async function fetchGames() {
    try {
      const res = await fetch('/api/games?activeOnly=true');
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/players');
      const data = await res.json();
      setPlayers(data);
      setAvailablePlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  function selectGame(game: Game) {
    setSelectedGame(game);
    setGamePlayers([]);
    setAvailablePlayers(players);
    setError('');
  }

  function addPlayer(player: Player) {
    const newPlayer: GamePlayer = {
      playerId: player._id,
      playerName: player.name,
      rank: gamePlayers.length + 1,
    };

    setGamePlayers([...gamePlayers, newPlayer]);
    setAvailablePlayers(availablePlayers.filter((p) => p._id !== player._id));
    setError('');
  }

  function removePlayer(playerId: string) {
    const removedPlayer = players.find((p) => p._id === playerId);
    if (removedPlayer) {
      setAvailablePlayers([...availablePlayers, removedPlayer]);
    }

    const updatedPlayers = gamePlayers
      .filter((p) => p.playerId !== playerId)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    setGamePlayers(updatedPlayers);
  }

  function updateRank(playerId: string, newRank: number) {
    const updatedPlayers = gamePlayers.map((p) =>
      p.playerId === playerId ? { ...p, rank: newRank } : p
    );
    setGamePlayers(updatedPlayers);
  }

  async function handleSubmit() {
    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    if (gamePlayers.length < 2) {
      setError('Please add at least 2 players');
      return;
    }

    // Validate ranks
    const ranks = gamePlayers.map((p) => p.rank).sort((a, b) => a - b);
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i] !== i + 1) {
        setError(`Invalid rankings. Please ensure ranks are 1, 2, 3, etc.`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGame._id,
          results: gamePlayers.map((p) => ({
            playerId: p.playerId,
            playerName: p.playerName,
            rank: p.rank,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to record game');
        return;
      }

      // Redirect to history page
      router.push('/history');
    } catch (error) {
      setError('Failed to record game');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelectedGame(null);
    setGamePlayers([]);
    setAvailablePlayers(players);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Record Game</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Select Game */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Select Game</h2>
              <div className="space-y-2">
                {games.map((game) => (
                  <button
                    key={game._id}
                    onClick={() => selectGame(game)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedGame?._id === game._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{game.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {game.scoringMode === 'pointing' ? 'Pointing System' : 'Winner Takes All'} • {game.pointsPerPlayer} pts/player
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Add Players */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Add Players</h2>
              {!selectedGame ? (
                <p className="text-gray-600 dark:text-gray-400">Select a game first</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Players
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availablePlayers.map((player) => (
                        <button
                          key={player._id}
                          onClick={() => addPlayer(player)}
                          className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100 transition-colors"
                        >
                          {player.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {gamePlayers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Players ({gamePlayers.length})
                      </label>
                      <div className="space-y-2">
                        {gamePlayers.map((player) => (
                          <div key={player.playerId} className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{player.playerName}</span>
                            <button
                              onClick={() => removePlayer(player.playerId)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step 3: Enter Rankings */}
            {gamePlayers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. Enter Rankings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gamePlayers
                    .sort((a, b) => a.rank - b.rank)
                    .map((player) => (
                      <div key={player.playerId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">{player.playerName}</div>
                        <div className="flex items-center space-x-2">
                          <label htmlFor={`rank-${player.playerId}`} className="text-sm text-gray-600 dark:text-gray-400">
                            Rank:
                          </label>
                          <input
                            type="number"
                            id={`rank-${player.playerId}`}
                            value={player.rank}
                            onChange={(e) => updateRank(player.playerId, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            min="1"
                            max={gamePlayers.length}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedGame && gamePlayers.length > 0 && (
              <div className="lg:col-span-2">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={reset}
                    disabled={submitting}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Recording...' : 'Record Game'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
