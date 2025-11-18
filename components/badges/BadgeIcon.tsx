'use client';

import { badgeIcons } from './icons';

interface BadgeIconProps {
  badgeId: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  size?: 'sm' | 'md' | 'lg';
  fallbackEmoji?: string;
}

export default function BadgeIcon({ badgeId, tier, size = 'md', fallbackEmoji }: BadgeIconProps) {
  const IconComponent = badgeIcons[badgeId];

  // Size classes
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Tier color classes
  const tierColors = {
    bronze: 'text-amber-600 dark:text-amber-500',
    silver: 'text-sky-500 dark:text-sky-400',
    gold: 'text-yellow-400 dark:text-yellow-300',
    platinum: 'text-purple-500 dark:text-purple-400',
  };

  const colorClass = tier ? tierColors[tier] : 'text-gray-600 dark:text-gray-400';

  // If no icon component found, use fallback emoji
  if (!IconComponent) {
    return (
      <span className={`${sizeClasses[size]} flex items-center justify-center text-2xl`}>
        {fallbackEmoji || '🏅'}
      </span>
    );
  }

  return (
    <IconComponent className={`${sizeClasses[size]} ${colorClass}`} />
  );
}
