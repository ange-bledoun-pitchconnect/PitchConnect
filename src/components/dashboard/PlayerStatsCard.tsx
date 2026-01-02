/**
 * ============================================================================
 * PlayerStatsCard Component
 * ============================================================================
 * 
 * Enterprise-grade player statistics card with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users viewing player profiles
 * - SCOUT: Player evaluation
 * - ANALYST: Performance analysis
 * - COACH: Squad management
 * 
 * SCHEMA ALIGNMENT:
 * - Player model
 * - PlayerStats model
 * - Sport enum (all 12 sports)
 * - Position enum (sport-specific)
 * 
 * FEATURES:
 * - Sport-specific statistics display
 * - Dynamic stat categories
 * - Trend indicators
 * - Rating system
 * - Position-based stat highlights
 * - Dark mode support
 * - Clickable/expandable
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportStatistics,
  type Sport,
  type SportStatistic,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PlayerStatValue {
  key: string;
  value: number;
  previousValue?: number;
}

export interface PlayerStatsCardProps {
  /** Player ID */
  playerId: string;
  /** Player name */
  name: string;
  /** Jersey number */
  number: number;
  /** Position */
  position: string;
  /** Sport type */
  sport: Sport;
  /** Team/Club name */
  club?: string;
  /** Player photo URL */
  photo?: string;
  /** Overall rating */
  rating?: number;
  /** Last match rating */
  lastMatchRating?: number;
  /** Performance trend */
  trend?: 'up' | 'down' | 'stable';
  /** Season statistics */
  stats: PlayerStatValue[];
  /** Is captain */
  isCaptain?: boolean;
  /** Show expanded by default */
  defaultExpanded?: boolean;
  /** On card click */
  onClick?: (playerId: string) => void;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rating color based on value
 */
function getRatingColor(rating: number): string {
  if (rating >= 8.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (rating >= 7.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (rating >= 6.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (rating >= 5.5) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

/**
 * Get position category for icon
 */
function getPositionIcon(position: string): React.ReactNode {
  const posLower = position.toLowerCase();
  if (posLower.includes('goal') || posLower.includes('keeper')) {
    return <Shield className="w-4 h-4" />;
  }
  if (posLower.includes('defend') || posLower.includes('back')) {
    return <Shield className="w-4 h-4" />;
  }
  if (posLower.includes('mid') || posLower.includes('center')) {
    return <Zap className="w-4 h-4" />;
  }
  if (posLower.includes('forward') || posLower.includes('attack') || posLower.includes('striker')) {
    return <Target className="w-4 h-4" />;
  }
  return <Star className="w-4 h-4" />;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PlayerStatsCard({
  playerId,
  name,
  number,
  position,
  sport,
  club,
  photo,
  rating,
  lastMatchRating,
  trend = 'stable',
  stats,
  isCaptain = false,
  defaultExpanded = false,
  onClick,
  className,
}: PlayerStatsCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const sportStats = useMemo(() => getSportStatistics(sport), [sport]);

  // Create stat definition lookup
  const statDefinitions = useMemo(() => {
    return sportStats.reduce((acc, stat) => {
      acc[stat.key] = stat;
      return acc;
    }, {} as Record<string, SportStatistic>);
  }, [sportStats]);

  // Get key stats (first 4) and detail stats (rest)
  const { keyStats, detailStats } = useMemo(() => {
    const key: PlayerStatValue[] = [];
    const detail: PlayerStatValue[] = [];

    stats.forEach((stat, index) => {
      if (index < 4) {
        key.push(stat);
      } else {
        detail.push(stat);
      }
    });

    return { keyStats: key, detailStats: detail };
  }, [stats]);

  // Calculate trend from previous values
  const getTrendIndicator = (stat: PlayerStatValue) => {
    if (stat.previousValue === undefined) return null;
    
    const def = statDefinitions[stat.key];
    const improved = def?.higherIsBetter
      ? stat.value > stat.previousValue
      : stat.value < stat.previousValue;
    const declined = def?.higherIsBetter
      ? stat.value < stat.previousValue
      : stat.value > stat.previousValue;

    if (improved) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    }
    if (declined) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    }
    return null;
  };

  // Format stat value
  const formatStatValue = (stat: PlayerStatValue): string => {
    const def = statDefinitions[stat.key];
    if (!def) return stat.value.toString();

    switch (def.type) {
      case 'percentage':
        return `${stat.value}${def.unit || '%'}`;
      case 'duration':
        return `${stat.value}${def.unit || 'min'}`;
      case 'distance':
        return `${stat.value}${def.unit || 'm'}`;
      case 'ratio':
        return stat.value.toFixed(2);
      default:
        return stat.value.toString();
    }
  };

  // Get stat label
  const getStatLabel = (key: string): string => {
    const def = statDefinitions[key];
    return def?.shortLabel || def?.label || key;
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-lg',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={() => onClick?.(playerId)}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            {/* Photo / Avatar */}
            <div className="relative flex-shrink-0">
              {photo ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src={photo}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              {/* Jersey Number Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
                {number}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                  {name}
                </h3>
                {isCaptain && (
                  <Badge variant="secondary" className="text-xs px-1.5">C</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs gap-1">
                  {getPositionIcon(position)}
                  {position}
                </Badge>
                <span className="text-sm">{sportConfig.icon}</span>
              </div>
              {club && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {club}
                </p>
              )}
            </div>

            {/* Rating & Trend */}
            <div className="text-right flex-shrink-0">
              {rating !== undefined && (
                <Badge className={cn('text-sm font-bold', getRatingColor(rating))}>
                  {rating.toFixed(1)}
                </Badge>
              )}
              <div className="flex items-center justify-end gap-1 mt-1">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {keyStats.map((stat) => (
              <div
                key={stat.key}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatStatValue(stat)}
                  </p>
                  {getTrendIndicator(stat)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {getStatLabel(stat.key)}
                </p>
              </div>
            ))}
          </div>

          {/* Last Match Rating */}
          {lastMatchRating !== undefined && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Last Match Rating
              </span>
              <Badge className={cn('font-bold', getRatingColor(lastMatchRating))}>
                {lastMatchRating.toFixed(1)}
              </Badge>
            </div>
          )}
        </div>

        {/* Expandable Detail Stats */}
        {detailStats.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full border-t border-gray-200 dark:border-gray-700 rounded-none py-2 text-gray-600 dark:text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show All Stats ({detailStats.length} more)
                </>
              )}
            </Button>

            {expanded && (
              <div className="px-4 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                {detailStats.map((stat) => {
                  const def = statDefinitions[stat.key];
                  return (
                    <div
                      key={stat.key}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {def?.label || stat.key}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatStatValue(stat)}
                        </span>
                        {getTrendIndicator(stat)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

PlayerStatsCard.displayName = 'PlayerStatsCard';

export default PlayerStatsCard;
