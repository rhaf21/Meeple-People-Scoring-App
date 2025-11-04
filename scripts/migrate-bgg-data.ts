#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '../lib/utils/db';
import GameDefinition from '../lib/models/GameDefinition';
import { searchBGGWithRetry, getBGGGameDetailsWithRetry } from '../lib/services/bggService';

interface MigrationStats {
  total: number;
  updated: number;
  notFound: number;
  failed: number;
  skipped: number;
}

async function migrateBGGData(dryRun: boolean = false, limit: number = 0) {
  console.log('\n🎲 BGG Data Migration Script\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  LIVE MODE (will update database)'}\n`);
  if (limit > 0) {
    console.log(`Limit: Processing only ${limit} game(s)\n`);
  }

  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    notFound: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find all games without BGG data
    let query = GameDefinition.find({
      $or: [
        { bggId: { $exists: false } },
        { bggId: null },
      ]
    });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const games = await query;

    stats.total = games.length;

    if (stats.total === 0) {
      console.log('✨ All games already have BGG data! Nothing to migrate.\n');
      return;
    }

    console.log(`📋 Found ${stats.total} games without BGG data\n`);
    console.log('─'.repeat(80));

    for (const game of games) {
      console.log(`\n🎮 Processing: ${game.name}`);

      try {
        // Search BGG for the game
        console.log('   🔍 Searching BGG...');
        const searchResults = await searchBGGWithRetry(game.name);

        if (searchResults.length === 0) {
          console.log('   ⚠️  Not found on BGG - skipping');
          stats.notFound++;
          continue;
        }

        // Use the first result (best match)
        const bggGame = searchResults[0];
        console.log(`   ✓ Found: "${bggGame.name}" (BGG ID: ${bggGame.id})`);

        // Fetch detailed information
        console.log('   📥 Fetching details...');
        const details = await getBGGGameDetailsWithRetry(bggGame.id);

        if (dryRun) {
          console.log('   🔍 DRY RUN - Would update with:');
          console.log(`      - BGG ID: ${details.id}`);
          console.log(`      - Description: ${details.description.substring(0, 50)}...`);
          console.log(`      - Players: ${details.minPlayers}-${details.maxPlayers}`);
          console.log(`      - Playing Time: ${details.playingTime} min`);
          console.log(`      - Rating: ${details.rating?.toFixed(1)}/10`);
          console.log(`      - Designers: ${details.designers.join(', ')}`);
          console.log(`      - Categories: ${details.categories.length} categories`);
          console.log(`      - Mechanics: ${details.mechanics.length} mechanics`);
          stats.updated++;
        } else {
          // Update the game with BGG data
          game.bggId = details.id;
          game.description = details.description;
          game.yearPublished = details.yearPublished;
          game.minPlayers = details.minPlayers;
          game.maxPlayers = details.maxPlayers;
          game.playingTime = details.playingTime;
          game.minPlaytime = details.minPlaytime;
          game.maxPlaytime = details.maxPlaytime;
          game.minAge = details.minAge;
          game.designers = details.designers;
          game.artists = details.artists;
          game.publishers = details.publishers;
          game.categories = details.categories;
          game.mechanics = details.mechanics;
          game.bggRating = details.rating;
          game.bggAverageWeight = details.averageWeight;
          game.bggUrl = details.bggUrl;
          game.thumbnailUrl = details.thumbnailUrl;

          // Update image if not already set
          if (!game.imageUrl && details.imageUrl) {
            game.imageUrl = details.imageUrl;
          }

          await game.save();
          console.log('   ✅ Updated successfully!');
          stats.updated++;
        }

        // Rate limiting - wait 1 second between requests to be nice to BGG
        if (games.indexOf(game) < games.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        stats.failed++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Migration Summary:\n');
    console.log(`   Total games processed: ${stats.total}`);
    console.log(`   ✅ ${dryRun ? 'Would be updated' : 'Successfully updated'}: ${stats.updated}`);
    console.log(`   ⚠️  Not found on BGG: ${stats.notFound}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log();

    if (dryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to actually update the database.\n');
    } else {
      console.log('✨ Migration complete!\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Parse limit argument
let limit = 0;
const limitIndex = args.findIndex(arg => arg.startsWith('--limit='));
if (limitIndex !== -1) {
  limit = parseInt(args[limitIndex].split('=')[1]) || 0;
}

// Run migration
migrateBGGData(dryRun, limit)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
