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
  score?: number;
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
      score: undefined,
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

  function updateScore(playerId: string, newScore: number) {
    const updatedPlayers = gamePlayers.map((p) =>
      p.playerId === playerId ? { ...p, score: newScore } : p
    );
    setGamePlayers(updatedPlayers);
  }

  function setWinner(playerId: string) {
    const updatedPlayers = gamePlayers.map((p) => ({
      ...p,
      rank: p.playerId === playerId ? 1 : 0, // Winner gets rank 1, others get 0 (no rank)
    }));
    setGamePlayers(updatedPlayers);
  }

  // Calculate ranks from scores for Pointing System
  function calculateRanksFromScores(): GamePlayer[] {
    const playersWithScores = gamePlayers.filter((p) => p.score !== undefined && p.score !== null);

    // Sort by score descending
    const sorted = [...playersWithScores].sort((a, b) => (b.score || 0) - (a.score || 0));

    // Assign ranks with tie handling
    const ranked: GamePlayer[] = [];
    let currentRank = 1;

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        // Same score as previous player, same rank
        ranked.push({ ...sorted[i], rank: ranked[i - 1].rank });
      } else {
        // New rank
        ranked.push({ ...sorted[i], rank: currentRank });
      }
      currentRank++;
    }

    return ranked;
  }

  async function handleSubmit() {
    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    // For Winner Takes All, only require 1 player
    const minPlayers = selectedGame.scoringMode === 'winner-takes-all' ? 1 : 2;
    if (gamePlayers.length < minPlayers) {
      setError(`Please add at least ${minPlayers} player${minPlayers > 1 ? 's' : ''}`);
      return;
    }

    let resultsToSubmit: GamePlayer[];

    if (selectedGame.scoringMode === 'winner-takes-all') {
      // For Winner Takes All: validate exactly 1 winner
      const winnersCount = gamePlayers.filter((p) => p.rank === 1).length;
      if (winnersCount !== 1) {
        setError('Please select exactly one winner');
        return;
      }

      // Submit only the winner, but track all players who participated
      resultsToSubmit = gamePlayers.filter((p) => p.rank === 1);
    } else {
      // For Pointing System: validate all scores are entered
      const playersWithoutScores = gamePlayers.filter((p) => p.score === undefined || p.score === null);
      if (playersWithoutScores.length > 0) {
        setError('Please enter scores for all players');
        return;
      }

      // Calculate ranks from scores
      resultsToSubmit = calculateRanksFromScores();
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGame._id,
          playerCount: gamePlayers.length, // Total players who participated
          results: resultsToSubmit.map((p) => ({
            playerId: p.playerId,
            playerName: p.playerName,
            rank: p.rank,
            score: p.score,
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

            {/* Step 3: Enter Scores/Select Winner */}
            {gamePlayers.length > 0 && selectedGame && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                {selectedGame.scoringMode === 'winner-takes-all' ? (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Select Winner</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose the player who won this game. Winner gets all points.
                    </p>
                    <div className="space-y-2">
                      {gamePlayers.map((player) => (
                        <button
                          key={player.playerId}
                          onClick={() => setWinner(player.playerId)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                            player.rank === 1
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{player.playerName}</span>
                            {player.rank === 1 && (
                              <span className="text-green-600 dark:text-green-400 text-sm font-semibold">✓ Winner</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Enter Scores</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enter the final score for each player. Rankings will be calculated automatically. Ties are detected automatically.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const rankedPlayers = calculateRanksFromScores();
                        return gamePlayers.map((player) => {
                          const rankedPlayer = rankedPlayers.find((p) => p.playerId === player.playerId);
                          return (
                            <div key={player.playerId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">{player.playerName}</div>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <label htmlFor={`score-${player.playerId}`} className="text-sm text-gray-600 dark:text-gray-400">
                                    Score:
                                  </label>
                                  <input
                                    type="number"
                                    id={`score-${player.playerId}`}
                                    value={player.score || ''}
                                    onChange={(e) => updateScore(player.playerId, Number(e.target.value))}
                                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="0"
                                  />
                                </div>
                                {rankedPlayer && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    → Rank {rankedPlayer.rank}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
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
