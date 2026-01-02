/**
 * ============================================================================
 * Team Lineup Component
 * ============================================================================
 * 
 * Enterprise-grade team lineup display with multi-sport support,
 * sport-specific formations, and position visualization.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/match/TeamLineup.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Sport-specific formations and positions
 * - Visual pitch/court representation
 * - Player cards with stats
 * - Substitutes bench
 * - Captain/vice-captain indicators
 * - Injury/card status
 * - Dark mode support
 * - Responsive design
 * 
 * AFFECTED USER ROLES:
 * - PLAYER: View own team lineup
 * - COACH, COACH_PRO: Set lineups
 * - MANAGER, CLUB_MANAGER: Lineup approval
 * - REFEREE: Official lineup check
 * - ANALYST: Lineup analysis
 * - FAN: View match lineups
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Grid3X3,
  Star,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shirt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type Sport,
  SPORT_CONFIG,
  getPositionsForSport,
} from '@/config/sport-dashboard-config';
import { getMatchConfig } from '@/config/sport-match-config';

// =============================================================================
// TYPES
// =============================================================================

export interface LineupPlayer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  number: number;
  position: string;
  positionShort?: string;
  imageUrl?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isStarting?: boolean;
  status?: 'active' | 'injured' | 'suspended' | 'doubtful';
  cardStatus?: 'yellow' | 'red' | 'sin_bin' | 'black' | null;
  stats?: {
    goals?: number;
    assists?: number;
    minutesPlayed?: number;
    rating?: number;
  };
}

export interface TeamLineupProps {
  /** Sport type */
  sport: Sport;
  /** Team info */
  team: {
    id: string;
    name: string;
    shortName?: string;
    color?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  /** Formation (if applicable) */
  formation?: string;
  /** Starting players */
  starters: LineupPlayer[];
  /** Substitute players */
  substitutes: LineupPlayer[];
  /** Side (home/away) for styling */
  side?: 'home' | 'away';
  /** Show formation diagram */
  showFormation?: boolean;
  /** Show player stats */
  showStats?: boolean;
  /** Allow editing */
  editable?: boolean;
  /** On lineup change */
  onLineupChange?: (starters: LineupPlayer[], subs: LineupPlayer[]) => void;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// POSITION GRID LAYOUTS
// =============================================================================

// Formation position mappings (row, col) for visual display
const FOOTBALL_FORMATIONS: Record<string, { name: string; positions: [number, number][] }> = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      [0, 2], // GK
      [1, 0], [1, 1], [1, 3], [1, 4], // DEF
      [2, 0], [2, 1], [2, 3], [2, 4], // MID
      [3, 1], [3, 3], // FWD
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      [0, 2], // GK
      [1, 0], [1, 1], [1, 3], [1, 4], // DEF
      [2, 1], [2, 2], [2, 3], // MID
      [3, 0], [3, 2], [3, 4], // FWD
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      [0, 2], // GK
      [1, 1], [1, 2], [1, 3], // DEF
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], // MID
      [3, 1], [3, 3], // FWD
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      [0, 2], // GK
      [1, 0], [1, 1], [1, 3], [1, 4], // DEF
      [1.5, 1.5], [1.5, 2.5], // CDM
      [2.5, 0], [2.5, 2], [2.5, 4], // CAM
      [3.5, 2], // ST
    ],
  },
};

// Generic formations for other sports
const SPORT_DEFAULT_LAYOUTS: Partial<Record<Sport, [number, number][]>> = {
  BASKETBALL: [
    [0, 2], // PG
    [1, 1], [1, 3], // SG, SF
    [2, 1], [2, 3], // PF, C
  ],
  NETBALL: [
    [0, 1], [0, 3], // GK, GD
    [1, 2], // WD
    [2, 2], // C
    [3, 2], // WA
    [4, 1], [4, 3], // GA, GS
  ],
  RUGBY: [
    [0, 0], [0, 1], [0, 2], // Front Row
    [1, 1], [1, 3], // Locks
    [2, 0], [2, 2], [2, 4], // Back Row
    [3, 1], [3, 3], // Half Backs
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], // Backs
  ],
};

// =============================================================================
// PLAYER CARD COMPONENT
// =============================================================================

interface PlayerCardProps {
  player: LineupPlayer;
  teamColor?: string;
  showStats?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function PlayerCard({
  player,
  teamColor = '#3B82F6',
  showStats,
  compact,
  onClick,
}: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer transition-all',
        compact ? 'p-1' : 'p-2',
        'bg-white dark:bg-charcoal-800 rounded-lg shadow-sm border border-neutral-200 dark:border-charcoal-700',
        'hover:shadow-md hover:border-primary/50'
      )}
    >
      {/* Jersey Number */}
      <div
        className={cn(
          'flex items-center justify-center font-bold text-white rounded-lg',
          compact ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
        )}
        style={{ backgroundColor: teamColor }}
      >
        {player.number}
      </div>

      {/* Player Name */}
      <p className={cn(
        'font-semibold text-charcoal-900 dark:text-white truncate mt-1',
        compact ? 'text-xs' : 'text-sm'
      )}>
        {compact ? player.lastName || player.name.split(' ').pop() : player.name}
      </p>

      {/* Position */}
      <p className={cn(
        'text-charcoal-500 dark:text-charcoal-400',
        compact ? 'text-[10px]' : 'text-xs'
      )}>
        {player.positionShort || player.position}
      </p>

      {/* Status Indicators */}
      <div className="absolute -top-1 -right-1 flex gap-0.5">
        {player.isCaptain && (
          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">C</span>
          </div>
        )}
        {player.isViceCaptain && (
          <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">VC</span>
          </div>
        )}
        {player.cardStatus === 'yellow' && (
          <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
        )}
        {player.cardStatus === 'red' && (
          <div className="w-3 h-4 bg-red-500 rounded-sm" />
        )}
        {player.status === 'injured' && (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Stats (if enabled) */}
      {showStats && player.stats && !compact && (
        <div className="flex gap-2 mt-1 text-[10px] text-charcoal-500">
          {player.stats.goals !== undefined && (
            <span>⚽ {player.stats.goals}</span>
          )}
          {player.stats.assists !== undefined && (
            <span>👟 {player.stats.assists}</span>
          )}
          {player.stats.rating !== undefined && (
            <span>⭐ {player.stats.rating.toFixed(1)}</span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FORMATION DISPLAY COMPONENT
// =============================================================================

interface FormationDisplayProps {
  sport: Sport;
  formation: string;
  players: LineupPlayer[];
  teamColor?: string;
  compact?: boolean;
}

function FormationDisplay({
  sport,
  formation,
  players,
  teamColor,
  compact,
}: FormationDisplayProps) {
  // Get formation layout
  const formationConfig = FOOTBALL_FORMATIONS[formation] || FOOTBALL_FORMATIONS['4-4-2'];
  const positions = sport === 'FOOTBALL' || sport === 'FUTSAL' || sport === 'BEACH_FOOTBALL'
    ? formationConfig.positions
    : SPORT_DEFAULT_LAYOUTS[sport] || formationConfig.positions;

  // Map players to positions
  const positionedPlayers = players.slice(0, positions.length);

  return (
    <div className={cn(
      'relative w-full aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden',
      'border-2 border-white/20'
    )}>
      {/* Pitch markings */}
      <div className="absolute inset-0">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 border-2 border-white/30 rounded-full" />
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1/6 border-2 border-t-0 border-white/30" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-1/6 border-2 border-b-0 border-white/30" />
      </div>

      {/* Players */}
      <div className="relative w-full h-full p-2">
        {positionedPlayers.map((player, index) => {
          const [row, col] = positions[index] || [0, 0];
          const top = `${(row / 4) * 85 + 5}%`;
          const left = `${(col / 4) * 80 + 10}%`;

          return (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ top, left }}
            >
              <PlayerCard
                player={player}
                teamColor={teamColor}
                compact={compact}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeamLineup({
  sport,
  team,
  formation = '4-4-2',
  starters,
  substitutes,
  side = 'home',
  showFormation = true,
  showStats = false,
  editable = false,
  onLineupChange,
  compact = false,
  className,
}: TeamLineupProps) {
  const [showSubs, setShowSubs] = useState(!compact);

  // Get sport config
  const sportConfig = useMemo(() => SPORT_CONFIG[sport], [sport]);
  const matchConfig = useMemo(() => getMatchConfig(sport), [sport]);
  const positions = useMemo(() => getPositionsForSport(sport), [sport]);

  // Determine if sport uses formations
  const hasFormations = matchConfig.formation;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: team.color || '#3B82F6' }}
              >
                {team.shortName?.[0] || team.name[0]}
              </div>
            )}
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {team.name}
                <Badge variant={side === 'home' ? 'default' : 'secondary'} className="text-xs">
                  {side === 'home' ? 'HOME' : 'AWAY'}
                </Badge>
              </CardTitle>
              {hasFormations && formation && (
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                  <Grid3X3 className="w-3 h-3" />
                  Formation: {formation}
                </p>
              )}
            </div>
          </div>

          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-lg',
            sportConfig.bgColor
          )}>
            {sportConfig.icon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Formation View */}
        {showFormation && hasFormations && !compact && (
          <div className="mb-4">
            <FormationDisplay
              sport={sport}
              formation={formation}
              players={starters}
              teamColor={team.color}
              compact={false}
            />
          </div>
        )}

        {/* Starting XI List */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2 flex items-center gap-2">
            <Shirt className="w-4 h-4" />
            Starting Lineup ({starters.length})
          </h4>
          <div className={cn(
            'grid gap-2',
            compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
          )}>
            {starters.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                teamColor={team.color}
                showStats={showStats}
                compact={compact}
              />
            ))}
          </div>
        </div>

        {/* Substitutes */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSubs(!showSubs)}
            className="w-full justify-between mb-2"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              <Users className="w-4 h-4" />
              Substitutes ({substitutes.length})
            </span>
            {showSubs ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showSubs && (
            <div className={cn(
              'grid gap-2',
              compact ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4'
            )}>
              {substitutes.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  teamColor={team.color}
                  showStats={showStats}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Legend */}
        {showStats && !compact && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
            <p className="text-xs text-charcoal-500 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">C</div>
                Captain
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
                Yellow Card
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-4 bg-red-500 rounded-sm" />
                Red Card
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

TeamLineup.displayName = 'TeamLineup';

export default TeamLineup;
