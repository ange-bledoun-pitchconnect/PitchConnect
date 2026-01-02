/**
 * ============================================================================
 * PLAYER CARD COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * World-class multi-sport player card component.
 * Displays player info with sport-specific positions and stats.
 * 
 * FEATURES:
 * - 12-sport position support
 * - Sport-specific stat display
 * - Jersey number badge
 * - Position-based color coding
 * - Avatar with fallback
 * - Hover actions
 * - Responsive design
 * - Dark mode support
 * - Accessibility (ARIA, keyboard nav)
 * 
 * @version 2.0.0
 * @path src/components/player/PlayerCard.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useMemo } from 'react';
import { MoreHorizontal, User, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SPORT_POSITIONS,
  getPositionByCode,
  getCategoryColor,
  type Position,
} from '@/config/sport-positions-config';
import {
  SPORT_STATS,
  getCardStats,
  formatStatValue,
  type StatDefinition,
} from '@/config/sport-stats-config';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerCardPlayer {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
  /** Sport-specific position code (e.g., "GK", "ST", "PG") */
  position: string;
  /** Jersey number */
  jerseyNumber?: number | null;
  /** Height in cm */
  height?: number | null;
  /** Weight in kg */
  weight?: number | null;
  /** Player statistics (keyed by stat key) */
  stats?: Record<string, number | null>;
  /** Performance rating (1-10) */
  rating?: number | null;
  /** Whether player is team captain */
  isCaptain?: boolean;
  /** Whether player is injured */
  isInjured?: boolean;
  /** Player's preferred foot/hand */
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
}

export interface PlayerCardProps {
  /** Player data */
  player: PlayerCardPlayer;
  /** Sport context for position/stat display */
  sport: Sport;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show stats section */
  showStats?: boolean;
  /** Show action buttons on hover */
  showActions?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** View profile action */
  onViewProfile?: (playerId: string) => void;
  /** Send message action */
  onMessage?: (playerId: string) => void;
  /** View stats action */
  onViewStats?: (playerId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPositionDisplay(sport: Sport, positionCode: string): { name: string; color: string } {
  const position = getPositionByCode(sport, positionCode);
  if (position) {
    return {
      name: position.name,
      color: position.color || '#6B7280',
    };
  }
  // Fallback for unknown positions
  return {
    name: positionCode,
    color: '#6B7280',
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlayerCard({
  player,
  sport,
  size = 'md',
  showStats = true,
  showActions = true,
  onClick,
  onViewProfile,
  onMessage,
  onViewStats,
  className,
}: PlayerCardProps) {
  const { user, position, jerseyNumber, stats, rating, isCaptain, isInjured } = player;
  
  // Get position display info
  const positionDisplay = useMemo(() => {
    return getPositionDisplay(sport, position);
  }, [sport, position]);
  
  // Get card stats for this sport
  const cardStatsConfig = useMemo(() => {
    return getCardStats(sport);
  }, [sport]);
  
  // Size configuration
  const sizeConfig = {
    sm: {
      card: 'p-3',
      avatar: 'sm' as const,
      name: 'text-sm',
      position: 'text-[10px]',
      jersey: 'w-6 h-6 text-xs',
      stat: 'text-sm',
      statLabel: 'text-[9px]',
    },
    md: {
      card: 'p-4',
      avatar: 'md' as const,
      name: 'text-base',
      position: 'text-xs',
      jersey: 'w-8 h-8 text-sm',
      stat: 'text-lg',
      statLabel: 'text-[10px]',
    },
    lg: {
      card: 'p-5',
      avatar: 'lg' as const,
      name: 'text-lg',
      position: 'text-sm',
      jersey: 'w-10 h-10 text-base',
      stat: 'text-xl',
      statLabel: 'text-xs',
    },
  };
  
  const config = sizeConfig[size];
  
  return (
    <div
      className={cn(
        'relative group rounded-xl border transition-all duration-300 overflow-hidden',
        'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-charcoal-900 dark:to-charcoal-800',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-lg hover:border-gold-300 dark:hover:border-gold-600',
        'hover:-translate-y-1',
        onClick && 'cursor-pointer',
        config.card,
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-purple-500/5 pointer-events-none" />
      
      {/* Jersey Number Badge */}
      {jerseyNumber !== undefined && jerseyNumber !== null && (
        <div
          className={cn(
            'absolute top-2 right-2 flex items-center justify-center rounded-md font-bold z-10',
            'bg-gold-500 text-charcoal-900 shadow-md',
            config.jersey
          )}
        >
          {jerseyNumber}
        </div>
      )}
      
      {/* Captain/Injury Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {isCaptain && (
          <Badge className="bg-amber-500 text-white text-[10px] px-1.5">
            C
          </Badge>
        )}
        {isInjured && (
          <Badge variant="destructive" className="text-[10px] px-1.5">
            INJ
          </Badge>
        )}
      </div>
      
      {/* Main Content */}
      <div className="relative z-[5] flex flex-col items-center gap-3">
        {/* Avatar */}
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          avatarUrl={user.avatar}
          position={position}
          size={config.avatar}
        />
        
        {/* Player Info */}
        <div className="text-center w-full">
          <h4 className={cn('font-bold text-gray-900 dark:text-white truncate', config.name)}>
            {user.firstName} {user.lastName}
          </h4>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={cn(
                'font-semibold uppercase tracking-wide',
                config.position
              )}
              style={{ color: positionDisplay.color }}
            >
              {positionDisplay.name}
            </span>
            {rating !== undefined && rating !== null && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300"
              >
                {rating.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Stats */}
        {showStats && stats && cardStatsConfig.length > 0 && (
          <div className="w-full grid grid-cols-3 gap-2 mt-1">
            {cardStatsConfig.slice(0, 3).map((statConfig) => {
              const value = stats[statConfig.key];
              return (
                <div
                  key={statConfig.key}
                  className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-charcoal-800/50"
                >
                  <span className={cn('font-bold text-gold-600 dark:text-gold-400', config.stat)}>
                    {value !== null && value !== undefined
                      ? formatStatValue(statConfig, value)
                      : '-'}
                  </span>
                  <span className={cn('text-gray-500 dark:text-gray-400 uppercase tracking-wide', config.statLabel)}>
                    {statConfig.shortName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Hover Actions */}
        {showActions && (
          <div className="w-full flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2">
            {onViewProfile && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(player.id);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewProfile && (
                  <DropdownMenuItem onClick={() => onViewProfile(player.id)}>
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                )}
                {onViewStats && (
                  <DropdownMenuItem onClick={() => onViewStats(player.id)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Stats
                  </DropdownMenuItem>
                )}
                {onMessage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onMessage(player.id)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

export function PlayerCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeConfig = {
    sm: 'p-3 w-36',
    md: 'p-4 w-44',
    lg: 'p-5 w-52',
  };
  
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse',
        'bg-gray-100 dark:bg-charcoal-800',
        sizeConfig[size]
      )}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Avatar skeleton */}
        <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600" />
        
        {/* Name skeleton */}
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
        
        {/* Position skeleton */}
        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        
        {/* Stats skeleton */}
        <div className="w-full grid grid-cols-3 gap-2 mt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              <div className="w-8 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="w-6 h-2 bg-gray-300 dark:bg-gray-600 rounded mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlayerCard;