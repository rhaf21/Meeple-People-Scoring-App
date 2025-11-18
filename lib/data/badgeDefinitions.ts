export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: {
    type: 'games' | 'wins' | 'streak' | 'podiums' | 'points' | 'winRate' | 'variety';
    threshold: number;
    minGames?: number; // For percentage-based badges
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Games Played Badges
  {
    id: 'first-game',
    name: 'First Game',
    description: 'Play your first game',
    icon: '🎮',
    criteria: { type: 'games', threshold: 1 }
  },
  {
    id: '10-games',
    name: 'Getting Started',
    description: 'Play 10 games',
    icon: '🎯',
    tier: 'bronze',
    criteria: { type: 'games', threshold: 10 }
  },
  {
    id: '25-games',
    name: 'Regular',
    description: 'Play 25 games',
    icon: '🎲',
    tier: 'silver',
    criteria: { type: 'games', threshold: 25 }
  },
  {
    id: '50-games',
    name: 'Veteran',
    description: 'Play 50 games',
    icon: '⭐',
    tier: 'gold',
    criteria: { type: 'games', threshold: 50 }
  },
  {
    id: '100-games',
    name: 'Legend',
    description: 'Play 100 games',
    icon: '🌟',
    tier: 'platinum',
    criteria: { type: 'games', threshold: 100 }
  },

  // Wins Badges
  {
    id: 'first-win',
    name: 'First Blood',
    description: 'Win your first game',
    icon: '🏆',
    criteria: { type: 'wins', threshold: 1 }
  },
  {
    id: '3-wins',
    name: 'Triple Threat',
    description: 'Win 3 games',
    icon: '🥇',
    tier: 'bronze',
    criteria: { type: 'wins', threshold: 3 }
  },
  {
    id: '10-wins',
    name: 'Champion',
    description: 'Win 10 games',
    icon: '👑',
    tier: 'silver',
    criteria: { type: 'wins', threshold: 10 }
  },
  {
    id: '25-wins',
    name: 'Dominator',
    description: 'Win 25 games',
    icon: '💪',
    tier: 'gold',
    criteria: { type: 'wins', threshold: 25 }
  },
  {
    id: '50-wins',
    name: 'Master',
    description: 'Win 50 games',
    icon: '🎖️',
    tier: 'platinum',
    criteria: { type: 'wins', threshold: 50 }
  },

  // Win Streak Badges
  {
    id: '3-streak',
    name: 'On Fire',
    description: 'Win 3 games in a row',
    icon: '🔥',
    tier: 'bronze',
    criteria: { type: 'streak', threshold: 3 }
  },
  {
    id: '5-streak',
    name: 'Unstoppable',
    description: 'Win 5 games in a row',
    icon: '💥',
    tier: 'silver',
    criteria: { type: 'streak', threshold: 5 }
  },
  {
    id: '10-streak',
    name: 'Legendary Streak',
    description: 'Win 10 games in a row',
    icon: '⚡',
    tier: 'gold',
    criteria: { type: 'streak', threshold: 10 }
  },

  // Podium Badges
  {
    id: '10-podiums',
    name: 'Bronze Star',
    description: 'Finish top 3 in 10 games',
    icon: '🥉',
    tier: 'bronze',
    criteria: { type: 'podiums', threshold: 10 }
  },
  {
    id: '25-podiums',
    name: 'Silver Star',
    description: 'Finish top 3 in 25 games',
    icon: '🥈',
    tier: 'silver',
    criteria: { type: 'podiums', threshold: 25 }
  },
  {
    id: '50-podiums',
    name: 'Gold Star',
    description: 'Finish top 3 in 50 games',
    icon: '🏅',
    tier: 'gold',
    criteria: { type: 'podiums', threshold: 50 }
  },

  // Points Badges
  {
    id: '100-points',
    name: 'Point Collector',
    description: 'Earn 100 total points',
    icon: '💰',
    tier: 'bronze',
    criteria: { type: 'points', threshold: 100 }
  },
  {
    id: '500-points',
    name: 'Point Hoarder',
    description: 'Earn 500 total points',
    icon: '💎',
    tier: 'silver',
    criteria: { type: 'points', threshold: 500 }
  },
  {
    id: '1000-points',
    name: 'Point Master',
    description: 'Earn 1000 total points',
    icon: '👛',
    tier: 'gold',
    criteria: { type: 'points', threshold: 1000 }
  },

  // Win Rate Badges
  {
    id: '50-winrate',
    name: 'Sharp Shooter',
    description: 'Achieve 50% win rate (min 10 games)',
    icon: '🎯',
    tier: 'bronze',
    criteria: { type: 'winRate', threshold: 50, minGames: 10 }
  },
  {
    id: '60-winrate',
    name: 'Elite',
    description: 'Achieve 60% win rate (min 20 games)',
    icon: '🦅',
    tier: 'silver',
    criteria: { type: 'winRate', threshold: 60, minGames: 20 }
  },
  {
    id: '75-winrate',
    name: 'Perfectionist',
    description: 'Achieve 75% win rate (min 20 games)',
    icon: '💯',
    tier: 'gold',
    criteria: { type: 'winRate', threshold: 75, minGames: 20 }
  },

  // Game Variety Badges
  {
    id: '3-variety',
    name: 'Explorer',
    description: 'Play 3 different games',
    icon: '🗺️',
    tier: 'bronze',
    criteria: { type: 'variety', threshold: 3 }
  },
  {
    id: '5-variety',
    name: 'Versatile',
    description: 'Play 5 different games',
    icon: '🧭',
    tier: 'silver',
    criteria: { type: 'variety', threshold: 5 }
  },
  {
    id: '10-variety',
    name: 'Jack of All Trades',
    description: 'Play 10 different games',
    icon: '🃏',
    tier: 'gold',
    criteria: { type: 'variety', threshold: 10 }
  },
];

// Helper function to get badge definition by ID
export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === badgeId);
}

// Get tier color for styling
export function getTierColor(tier?: string): string {
  switch (tier) {
    case 'bronze':
      return 'text-amber-600 dark:text-amber-500';
    case 'silver':
      return 'text-sky-500 dark:text-sky-400';
    case 'gold':
      return 'text-yellow-400 dark:text-yellow-300';
    case 'platinum':
      return 'text-purple-500 dark:text-purple-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
}

// Get tier background color for badge cards
export function getTierBgColor(tier?: string): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600';
    case 'silver':
      return 'bg-sky-50 dark:bg-sky-900/20 border-sky-400 dark:border-sky-600';
    case 'gold':
      return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-500';
    case 'platinum':
      return 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500';
    default:
      return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
  }
}
