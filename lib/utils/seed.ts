import connectDB from './db';
import Player from '../models/Player';
import GameDefinition from '../models/GameDefinition';
import GameSession from '../models/GameSession';
import { calculateScores, getTotalPointsPool } from '../services/scoring';

const samplePlayers = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
];

const sampleGames = [
  { name: 'Wingspan', scoringMode: 'pointing' as const, pointsPerPlayer: 5 },
  { name: 'Wyrmspan', scoringMode: 'pointing' as const, pointsPerPlayer: 5 },
  { name: "Let's Go to Japan", scoringMode: 'pointing' as const, pointsPerPlayer: 5 },
  { name: 'Tapestry', scoringMode: 'pointing' as const, pointsPerPlayer: 5 },
  { name: 'Casting Shadows', scoringMode: 'winner-takes-all' as const, pointsPerPlayer: 3 },
  { name: 'Ark Nova', scoringMode: 'pointing' as const, pointsPerPlayer: 5 },
];

export async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Player.deleteMany({});
    await GameDefinition.deleteMany({});
    await GameSession.deleteMany({});

    // Create players
    console.log('Creating players...');
    const players = await Player.insertMany(
      samplePlayers.map((name) => ({ name }))
    );
    console.log(`Created ${players.length} players`);

    // Create games
    console.log('Creating games...');
    const games = await GameDefinition.insertMany(sampleGames);
    console.log(`Created ${games.length} games`);

    // Create some sample game sessions
    console.log('Creating sample game sessions...');
    const sessions = [];

    // Session 1: Wingspan with 5 players
    const wingspan = games.find((g) => g.name === 'Wingspan')!;
    const session1Players = players.slice(0, 5);
    const session1Results = session1Players.map((player, index) => ({
      playerId: player._id,
      playerName: player.name,
      rank: index + 1,
      score: 100 - index * 10,
    }));

    const scored1 = calculateScores(
      wingspan.scoringMode,
      session1Results.length,
      wingspan.pointsPerPlayer,
      session1Results
    );

    sessions.push({
      gameId: wingspan._id,
      gameName: wingspan.name,
      scoringMode: wingspan.scoringMode,
      playerCount: session1Results.length,
      playedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      results: scored1,
      totalPointsPool: getTotalPointsPool(session1Results.length, wingspan.pointsPerPlayer),
    });

    // Session 2: Casting Shadows with 4 players (winner takes all)
    const castingShadows = games.find((g) => g.name === 'Casting Shadows')!;
    const session2Players = players.slice(0, 4);
    const session2Results = session2Players.map((player, index) => ({
      playerId: player._id,
      playerName: player.name,
      rank: index + 1,
    }));

    const scored2 = calculateScores(
      castingShadows.scoringMode,
      session2Results.length,
      castingShadows.pointsPerPlayer,
      session2Results
    );

    sessions.push({
      gameId: castingShadows._id,
      gameName: castingShadows.name,
      scoringMode: castingShadows.scoringMode,
      playerCount: session2Results.length,
      playedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      results: scored2,
      totalPointsPool: getTotalPointsPool(session2Results.length, castingShadows.pointsPerPlayer),
    });

    // Session 3: Tapestry with 3 players
    const tapestry = games.find((g) => g.name === 'Tapestry')!;
    const session3Players = [players[2], players[0], players[4]]; // Different order
    const session3Results = session3Players.map((player, index) => ({
      playerId: player._id,
      playerName: player.name,
      rank: index + 1,
      score: 150 - index * 20,
    }));

    const scored3 = calculateScores(
      tapestry.scoringMode,
      session3Results.length,
      tapestry.pointsPerPlayer,
      session3Results
    );

    sessions.push({
      gameId: tapestry._id,
      gameName: tapestry.name,
      scoringMode: tapestry.scoringMode,
      playerCount: session3Results.length,
      playedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      results: scored3,
      totalPointsPool: getTotalPointsPool(session3Results.length, tapestry.pointsPerPlayer),
    });

    await GameSession.insertMany(sessions);
    console.log(`Created ${sessions.length} game sessions`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${players.length} players created`);
    console.log(`- ${games.length} games created`);
    console.log(`- ${sessions.length} game sessions created`);

    return {
      players: players.length,
      games: games.length,
      sessions: sessions.length,
    };
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}
