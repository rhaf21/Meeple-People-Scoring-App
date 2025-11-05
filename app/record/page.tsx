'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AddGameModal from '@/components/AddGameModal';
import AddPlayerModal from '@/components/AddPlayerModal';
import { api } from '@/lib/api/client';

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
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [inputMode, setInputMode] = useState<'score' | 'rank'>('score'); // For Pointing System toggle
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [gameSearch, setGameSearch] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Refs for auto-scroll
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  function selectGame(game: Game) {
    setSelectedGame(game);
    setGamePlayers([]);
    setSelectedPlayerIds(new Set());
    setInputMode('score'); // Reset to score mode
    setError('');

    // Auto-scroll to Step 2 after game selection
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function togglePlayerSelection(player: Player) {
    const newSelected = new Set(selectedPlayerIds);
    if (newSelected.has(player._id)) {
      newSelected.delete(player._id);
    } else {
      newSelected.add(player._id);
    }
    setSelectedPlayerIds(newSelected);
    setError('');
  }

  function confirmPlayerSelection() {
    // Convert selected players to gamePlayers
    const selectedPlayers = players.filter((p) => selectedPlayerIds.has(p._id));
    const newGamePlayers: GamePlayer[] = selectedPlayers.map((player, index) => ({
      playerId: player._id,
      playerName: player.name,
      rank: index + 1,
      score: undefined,
    }));
    setGamePlayers(newGamePlayers);

    // Auto-scroll to Step 4 after player confirmation
    setTimeout(() => {
      step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

      // Submit all players: winner gets rank 1, others get rank 0 for tracking games played
      resultsToSubmit = gamePlayers.map((p) => ({
        ...p,
        rank: p.rank === 1 ? 1 : 0,
      }));
    } else {
      // For Pointing System: handle both score and rank modes
      if (inputMode === 'score') {
        // Score mode: validate all scores are entered
        const playersWithoutScores = gamePlayers.filter((p) => p.score === undefined || p.score === null);
        if (playersWithoutScores.length > 0) {
          setError('Please enter scores for all players');
          return;
        }

        // Calculate ranks from scores
        resultsToSubmit = calculateRanksFromScores();
      } else {
        // Rank mode: validate ranks
        const ranks = gamePlayers.map((p) => p.rank);
        const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);

        // Check if ranks start at 1
        if (uniqueRanks[0] !== 1) {
          setError('Rankings must start at 1');
          return;
        }

        // Check for gaps in rankings
        for (let i = 0; i < uniqueRanks.length; i++) {
          if (uniqueRanks[i] !== i + 1) {
            setError(`Invalid rankings: Missing rank ${i + 1}`);
            return;
          }
        }

        // Use ranks as-is, no scores
        resultsToSubmit = gamePlayers;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      await api.createSession({
        gameId: selectedGame._id,
        playerCount: gamePlayers.length, // Total players who participated
        playedAt: new Date(gameDate).toISOString(), // Include the selected date
        results: resultsToSubmit.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          rank: p.rank,
          score: p.score,
        })),
      });

      // Redirect to history page
      router.push('/history');
    } catch (error: any) {
      setError(error.message || 'Failed to record game');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelectedGame(null);
    setGamePlayers([]);
    setSelectedPlayerIds(new Set());
    setGameDate(new Date().toISOString().split('T')[0]);
    setInputMode('score');
    setError('');
  }

  // Handler when new game is added
  async function handleGameAdded(newGameId: string) {
    // Refresh games list
    await fetchGames();

    // Find and select the new game
    const newGame = games.find((g) => g._id === newGameId);
    if (newGame) {
      selectGame(newGame);
    } else {
      // If not found immediately (race condition), fetch again
      const res = await fetch('/api/games?activeOnly=true');
      const data = await res.json();
      const foundGame = data.find((g: Game) => g._id === newGameId);
      if (foundGame) {
        setGames(data);
        selectGame(foundGame);
      }
    }
  }

  // Handler when new player is added
  async function handlePlayerAdded(newPlayerId: string) {
    // Refresh players list
    await fetchPlayers();

    // Auto-select the new player
    const newSelected = new Set(selectedPlayerIds);
    newSelected.add(newPlayerId);
    setSelectedPlayerIds(newSelected);
  }

  // Filter games based on search
  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl text-gray-900 dark:text-gray-100 mb-8">Record Game</h1>

          <div className="space-y-6">
            {/* Step 1: Select Game */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-gray-900 dark:text-gray-100">1. Select Game</h2>
                <button
                  onClick={() => setShowAddGameModal(true)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  + Add Game
                </button>
              </div>
              <div className="space-y-4">
                {/* Search input */}
                <div>
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>

                {/* Game dropdown/list */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredGames.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No games found</p>
                  ) : (
                    filteredGames.map((game) => (
                      <button
                        key={game._id}
                        onClick={() => selectGame(game)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedGame?._id === game._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{game.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {game.scoringMode === 'pointing' ? 'Pointing System' : 'Winner Takes All'} • {game.pointsPerPlayer} pts/player
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Selected game info */}
                {selectedGame && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      ✓ Selected: <span className="font-semibold">{selectedGame.name}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Date */}
            {selectedGame && (
              <div ref={step2Ref} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp animate-delay-100">
                <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">2. Select Date</h2>
                <div>
                  <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Game Date
                  </label>
                  <input
                    type="date"
                    id="gameDate"
                    value={gameDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setGameDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Select the date when this game was played
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Select Players */}
            {selectedGame && (
              <div ref={step3Ref} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp animate-delay-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900 dark:text-gray-100">3. Select Players</h2>
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    + Add Player
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click to select multiple players
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {players.map((player) => (
                      <button
                        key={player._id}
                        onClick={() => togglePlayerSelection(player)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedPlayerIds.has(player._id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedPlayerIds.has(player._id) && '✓ '}{player.name}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedPlayerIds.size > 0 && (
                    <button
                      onClick={confirmPlayerSelection}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg button-hover"
                    >
                      Confirm {selectedPlayerIds.size} Player{selectedPlayerIds.size > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            )}


            {/* Step 4: Enter Results */}
            {gamePlayers.length > 0 && selectedGame && (
              <div ref={step4Ref} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp animate-delay-300">
                {selectedGame.scoringMode === 'winner-takes-all' ? (
                  <>
                    <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-2">4. Select Winner</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose the player who won this game. Winner gets all points.
                    </p>
                    <div className="space-y-2">
                      {gamePlayers.map((player) => (
                        <button
                          key={player.playerId}
                          onClick={() => setWinner(player.playerId)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                            player.rank === 1
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
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
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl text-gray-900 dark:text-gray-100">4. Enter Results</h2>

                      {/* Toggle Switch */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${inputMode === 'score' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          Score
                        </span>
                        <button
                          onClick={() => setInputMode(inputMode === 'score' ? 'rank' : 'score')}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            inputMode === 'score' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-600 dark:bg-gray-500'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                              inputMode === 'score' ? 'left-1' : 'left-8'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${inputMode === 'rank' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          Rank
                        </span>
                      </div>
                    </div>

                    {inputMode === 'score' ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Enter the final score for each player. Rankings will be calculated automatically.
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
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Enter the rank for each player (1 = 1st place, 2 = 2nd place, etc.). Ties are allowed.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {gamePlayers.map((player) => (
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
                                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                  min="1"
                                  max={gamePlayers.length}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
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

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        onGameAdded={handleGameAdded}
      />

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={handlePlayerAdded}
      />
    </div>
  );
}
