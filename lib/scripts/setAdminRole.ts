import { config } from 'dotenv';
import { resolve } from 'path';
import connectDB from '../utils/db';
import Player from '../models/Player';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Migration script to set "Rhaf" as admin
 * Run this once: npx tsx lib/scripts/setAdminRole.ts
 */
async function setAdminRole() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find player named "Rhaf" (case-insensitive)
    const player = await Player.findOne({ name: /^rhaf$/i });

    if (!player) {
      console.error('Player "Rhaf" not found in database');
      console.log('Please create the player first or check the name spelling');
      process.exit(1);
    }

    // Update role to admin
    player.role = 'admin';
    await player.save();

    console.log(`✓ Successfully set ${player.name} as admin`);
    console.log(`Player ID: ${player._id}`);
    console.log(`Email: ${player.email || 'Not set'}`);
    console.log(`Role: ${player.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole();
