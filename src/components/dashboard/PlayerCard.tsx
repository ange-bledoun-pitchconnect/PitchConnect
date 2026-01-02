/**
 * ============================================================================
 * PlayerCard Component
 * ============================================================================
 * 
 * Enterprise-grade player profile card with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users viewing player profiles
 * - COACH: Player management
 * - SCOUT: Player evaluation
 * - ANALYST: Performance analysis
 * 
 * SCHEMA ALIGNMENT:
 * - Player model
 * - Sport enum (all 12 sports)
 * - Position enum (sport-specific)
 * 
 * FEATURES:
 * - Sport-specific stats display
 * - Position-aware styling
 * - Multiple view modes (compact, detailed, preview)
 * - Player photo with fallback
 * - Status indicators (active, injured, on loan)
 * - Contract status
 * - Injury tracking
 * - Quick action buttons
 * - Dark mode support
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Edit2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Star,
  Activity,
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

export type PlayerStatus = 'ACTIVE' | 'INACTIVE' | 'INJURED' | 'ON_LOAN' | 'SUSPENDED' | 'RETURNING';

export interface PlayerStats {
  [key: string]: number | undefined;
}

export interface PlayerInjury {
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  estimatedReturn?: string;
  description?: string;
}

export interface PlayerContract {
  endDate?: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'NEGOTIATING';
}

export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  position: string;
  sport: Sport;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  preferredHand?: 'LEFT' | 'RIGHT' | 'BOTH';
  shirtNumber?: number;
  nationality: string;
  dateOfBirth?: string;
  photo?: string;
  status: PlayerStatus;
  isCaptain?: boolean;
  rating?: number;
}

export interface PlayerCardProps {
  /** Player data */
  player: Player;
  /** Player statistics */
  stats?: PlayerStats;
  /** Injury information */
  injury?: PlayerInjury;
  /** Contract information */
  contract?: PlayerContract;
  /** Display mode */
  mode?: 'compact' | 'detailed' | 'preview';
  /** Show stats */
  showStats?: boolean;
  /** Loading state */
  loading?: boolean;
  /** View profile callback */
  onViewProfile?: (playerId: string) => void;
  /** View stats callback */
  onViewStats?: (playerId: string) => void;
  /** Edit callback */
  onEdit?: (playerId: string) => void;
  /** Remove callback */
  onRemove?: (playerId: string) => void;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get position category color
 */
function getPositionColor(position: string, sport: Sport): string {
  const posLower = position.toLowerCase();
  
  // Goalkeepers/Goaltenders
  if (posLower.includes('goalkeeper') || posLower.includes('goaltender') || posLower.includes('keeper') || posLower === 'gk') {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
  }
  
  // Defense
  if (posLower.includes('defense') || posLower.includes('defender') || posLower.includes('back') || posLower === 'cb' || posLower === 'lb' || posLower === 'rb') {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
  }
  
  // Midfield
  if (posLower.includes('midfield') || posLower.includes('mid') || posLower === 'cm' || posLower === 'cdm' || posLower === 'cam') {
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  }
  
  // Attack/Forward
  if (posLower.includes('forward') || posLower.includes('attack') || posLower.includes('striker') || posLower === 'st' || posLower === 'cf' || posLower === 'lw' || posLower === 'rw') {
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  }
  
  // Default
  return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
}

/**
 * Get status badge style
 */
function getStatusStyle(status: PlayerStatus): { color: string; bg: string; label: string } {
  switch (status) {
    case 'ACTIVE':
      return { color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Active' };
    case 'INACTIVE':
      return { color: 'text-gray-700', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Inactive' };
    case 'INJURED':
      return { color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Injured' };
    case 'ON_LOAN':
      return { color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'On Loan' };
    case 'SUSPENDED':
      return { color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Suspended' };
    case 'RETURNING':
      return { color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Returning' };
    default:
      return { color: 'text-gray-700', bg: 'bg-gray-100', label: status };
  }
}

/**
 * Calculate age from DOB
 */
function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get rating color
 */
function getRatingColor(rating: number): string {
  if (rating >= 8.5) return 'bg-green-500 text-white';
  if (rating >= 7.5) return 'bg-blue-500 text-white';
  if (rating >= 6.5) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}

// =============================================================================
// COMPACT MODE
// =============================================================================

function PlayerCardCompact({
  player,
  stats,
  sportConfig,
  keyStats,
  onViewProfile,
}: {
  player: Player;
  stats?: PlayerStats;
  sportConfig: ReturnType<typeof getSportConfig>;
  keyStats: SportStatistic[];
  onViewProfile?: (id: string) => void;
}) {
  const statusStyle = getStatusStyle(player.status);
  const positionColor = getPositionColor(player.position, player.sport);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewProfile?.(player.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewProfile?.(player.id)}
    >
      <div className="flex items-center gap-3">
        {/* Photo */}
        <div className="relative w-12 h-12 flex-shrink-0">
          {player.photo ? (
            <Image
              src={player.photo}
              alt={`${player.firstName} ${player.lastName}`}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
              {player.firstName.charAt(0)}
              {player.lastName.charAt(0)}
            </div>
          )}
          {/* Status Indicator */}
          <div
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
              player.status === 'ACTIVE' && 'bg-green-500',
              player.status === 'INJURED' && 'bg-red-500',
              player.status === 'ON_LOAN' && 'bg-blue-500',
              player.status === 'SUSPENDED' && 'bg-orange-500',
              player.status === 'INACTIVE' && 'bg-gray-400'
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {player.firstName} {player.lastName}
            </h3>
            {player.isCaptain && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn('text-xs', positionColor)}>
              {player.position}
            </Badge>
            {player.shirtNumber && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                #{player.shirtNumber}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        {player.rating && (
          <div className="text-right">
            <Badge className={cn('text-sm font-bold', getRatingColor(player.rating))}>
              {player.rating.toFixed(1)}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlayerCard({
  player,
  stats,
  injury,
  contract,
  mode = 'detailed',
  showStats = true,
  loading = false,
  onViewProfile,
  onViewStats,
  onEdit,
  onRemove,
  className,
}: PlayerCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sportConfig = useMemo(() => getSportConfig(player.sport), [player.sport]);
  const sportStats = useMemo(() => getSportStatistics(player.sport), [player.sport]);

  // Get top 4 stats for display
  const keyStats = useMemo(() => sportStats.slice(0, 4), [sportStats]);

  const playerAge = useMemo(() => calculateAge(player.dateOfBirth), [player.dateOfBirth]);
  const statusStyle = getStatusStyle(player.status);
  const positionColor = getPositionColor(player.position, player.sport);

  // Loading skeleton
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
        <CardContent className="p-4 space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode
  if (mode === 'compact') {
    return (
      <PlayerCardCompact
        player={player}
        stats={stats}
        sportConfig={sportConfig}
        keyStats={keyStats}
        onViewProfile={onViewProfile}
      />
    );
  }

  // Detailed mode
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      {/* Header with Photo */}
      <div className="relative h-32 bg-gradient-to-br from-primary to-primary/60">
        {player.photo && (
          <Image
            src={player.photo}
            alt={`${player.firstName} ${player.lastName}`}
            fill
            className="object-cover"
          />
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={cn(statusStyle.bg, statusStyle.color, 'text-xs')}>
            {statusStyle.label}
          </Badge>
        </div>

        {/* Sport Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs">
            {sportConfig.icon} {sportConfig.name}
          </Badge>
        </div>

        {/* Shirt Number */}
        {player.shirtNumber && (
          <div className="absolute bottom-3 left-3 w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-lg text-primary shadow-lg">
            #{player.shirtNumber}
          </div>
        )}

        {/* Captain Badge */}
        {player.isCaptain && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            <Star className="w-3 h-3 fill-white" />
            Captain
          </div>
        )}
      </div>

      {/* Body */}
      <CardContent className="p-4 space-y-4">
        {/* Name & Position */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {player.firstName} {player.lastName}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={positionColor}>{player.position}</Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {player.nationality}
            </span>
            {playerAge && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {playerAge} years
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {showStats && stats && (
          <div className="grid grid-cols-4 gap-2">
            {keyStats.map((stat) => {
              const value = stats[stat.key];
              if (value === undefined) return null;

              return (
                <div
                  key={stat.key}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center"
                >
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.type === 'percentage' ? `${value}%` : value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {stat.shortLabel}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Rating */}
        {player.rating && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Rating
            </span>
            <Badge className={cn('text-lg font-bold', getRatingColor(player.rating))}>
              {player.rating.toFixed(1)}
            </Badge>
          </div>
        )}

        {/* Injury Alert */}
        {injury && player.status === 'INJURED' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-800 dark:text-red-300 text-sm">
                {injury.type}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  injury.severity === 'SEVERE' && 'border-red-500 text-red-500',
                  injury.severity === 'MODERATE' && 'border-orange-500 text-orange-500',
                  injury.severity === 'MINOR' && 'border-yellow-500 text-yellow-500'
                )}
              >
                {injury.severity}
              </Badge>
            </div>
            {injury.estimatedReturn && (
              <p className="text-xs text-red-700 dark:text-red-400">
                Est. Return: {new Date(injury.estimatedReturn).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Contract Status */}
        {contract && (
          <div
            className={cn(
              'p-3 rounded-lg border',
              contract.status === 'ACTIVE'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : contract.status === 'EXPIRED'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {contract.status === 'ACTIVE' && contract.endDate
                  ? `Contract until ${new Date(contract.endDate).getFullYear()}`
                  : `Contract ${contract.status.toLowerCase()}`}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        {onViewProfile && (
          <Button
            size="sm"
            onClick={() => onViewProfile(player.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Profile
          </Button>
        )}
        {onViewStats && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewStats(player.id)}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Stats
          </Button>
        )}
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(player.id)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
