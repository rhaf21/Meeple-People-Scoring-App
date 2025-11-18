import { config } from 'dotenv';
config({ path: '.env.local' });

import { migrateAllPlayerBadges } from '../lib/services/badges';

async function main() {
  console.log('Starting badge migration...\n');

  try {
    const results = await migrateAllPlayerBadges();

    console.log('=== Badge Migration Complete ===\n');
    console.log(`Total players processed: ${results.totalPlayers}`);

    const totalBadges = results.results.reduce((sum, r) => sum + r.badgesAwarded, 0);
    console.log(`Total badges awarded: ${totalBadges}\n`);

    console.log('Results by player:');
    console.log('-'.repeat(50));

    for (const result of results.results) {
      if (result.badgesAwarded > 0) {
        console.log(`\n${result.playerName}: ${result.badgesAwarded} badges`);
        result.badges.forEach(badge => console.log(`  - ${badge}`));
      } else {
        console.log(`\n${result.playerName}: No new badges`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
