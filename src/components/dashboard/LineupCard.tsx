/**
 * ============================================================================
 * LineupCard Component
 * ============================================================================
 * 
 * Enterprise-grade lineup/formation display with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - COACH: Set and view lineups
 * - MANAGER: Team management
 * - PLAYER: View team lineup
 * - ANALYST: Formation analysis
 * - All viewers: Match preview
 * 
 * SCHEMA ALIGNMENT:
 * - Team model
 * - Player model
 * - Sport enum (all 12 sports)
 * - Position enum (sport-specific)
 * 
 * FEATURES:
 * - Sport-specific formations
 * - Visual formation display
 * - Player positions with jersey numbers
 * - Substitutes list
 * - Confirmation status
 * - Captain/vice-captain indicators
 * - Dark mode support
 * - Responsive design
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportFormations,
  type Sport,
  type FormationConfig,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LineupPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isSubstitute?: boolean;
  photo?: string;
  rating?: number;
}

export interface LineupCardProps {
  /** Team name */
  teamName: string;
  /** Team short name */
  teamShortName?: string;
  /** Sport type */
  sport: Sport;
  /** Formation key (e.g., "4-3-3") */
  formation: string;
  /** Starting players */
  players: LineupPlayer[];
  /** Substitute players */
  substitutes?: LineupPlayer[];
  /** Whether lineup is confirmed */
  confirmed?: boolean;
  /** Team primary color */
  primaryColor?: string;
  /** Team secondary color */
  secondaryColor?: string;
  /** Show player ratings */
  showRatings?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** On player click */
  onPlayerClick?: (player: LineupPlayer) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get pitch/court background style based on sport
 */
function getPitchStyle(sport: Sport): string {
  switch (sport) {
    case 'FOOTBALL':
    case 'FUTSAL':
    case 'BEACH_FOOTBALL':
      return 'bg-gradient-to-b from-green-600 to-green-700';
    case 'BASKETBALL':
      return 'bg-gradient-to-b from-amber-700 to-amber-800';
    case 'NETBALL':
      return 'bg-gradient-to-b from-purple-600 to-purple-700';
    case 'RUGBY':
    case 'AUSTRALIAN_RULES':
    case 'GAELIC_FOOTBALL':
      return 'bg-gradient-to-b from-green-700 to-green-800';
    case 'CRICKET':
      return 'bg-gradient-to-b from-amber-500 to-green-600';
    case 'HOCKEY':
      return 'bg-gradient-to-b from-blue-700 to-blue-800';
    case 'LACROSSE':
      return 'bg-gradient-to-b from-indigo-600 to-indigo-700';
    case 'AMERICAN_FOOTBALL':
      return 'bg-gradient-to-b from-green-800 to-green-900';
    default:
      return 'bg-gradient-to-b from-green-600 to-green-700';
  }
}

/**
 * Get player jersey style based on color
 */
function getJerseyStyle(primaryColor?: string, secondaryColor?: string): string {
  const primary = primaryColor || 'blue';
  const secondary = secondaryColor || 'white';
  
  // Map common color names to Tailwind classes
  const colorMap: Record<string, string> = {
    red: 'bg-red-600 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-400 text-black',
    white: 'bg-white text-black border-2 border-gray-300',
    black: 'bg-gray-900 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-600 text-white',
    navy: 'bg-blue-900 text-white',
    gold: 'bg-amber-500 text-black',
  };
  
  return colorMap[primary] || 'bg-blue-600 text-white';
}

// =============================================================================
// PLAYER NODE COMPONENT
// =============================================================================

interface PlayerNodeProps {
  player: LineupPlayer;
  jerseyStyle: string;
  showRating?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function PlayerNode({ player, jerseyStyle, showRating, compact, onClick }: PlayerNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center group cursor-pointer"
    >
      {/* Jersey Circle */}
      <div
        className={cn(
          'relative rounded-full flex flex-col items-center justify-center font-bold shadow-lg',
          'transition-transform group-hover:scale-110',
          jerseyStyle,
          compact ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm'
        )}
      >
        {/* Captain Badge */}
        {player.isCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-black">C</span>
          </div>
        )}
        {player.isViceCaptain && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-black">VC</span>
          </div>
        )}

        {/* Position */}
        <span className={cn('text-[10px] opacity-80', compact && 'text-[8px]')}>
          {player.position}
        </span>
        {/* Number */}
        <span className={cn('leading-tight', compact && 'text-xs')}>
          {player.number}
        </span>
      </div>

      {/* Player Name */}
      <p
        className={cn(
          'text-white text-center mt-1 max-w-16 truncate drop-shadow-md',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {player.name.split(' ').pop()}
      </p>

      {/* Rating */}
      {showRating && player.rating && (
        <Badge
          variant="secondary"
          className={cn(
            'mt-0.5',
            player.rating >= 8 && 'bg-green-500 text-white',
            player.rating >= 7 && player.rating < 8 && 'bg-blue-500 text-white',
            player.rating < 7 && 'bg-gray-500 text-white'
          )}
        >
          {player.rating.toFixed(1)}
        </Badge>
      )}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LineupCard({
  teamName,
  teamShortName,
  sport,
  formation,
  players,
  substitutes = [],
  confirmed = false,
  primaryColor,
  secondaryColor,
  showRatings = false,
  compact = false,
  className,
  onPlayerClick,
}: LineupCardProps) {
  const [showSubs, setShowSubs] = useState(false);

  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const formations = useMemo(() => getSportFormations(sport), [sport]);

  // Find the formation config
  const formationConfig = useMemo(() => {
    return formations.find((f) => f.key === formation) || formations[0];
  }, [formations, formation]);

  // Organize players into rows based on formation
  const playerRows = useMemo(() => {
    if (!formationConfig) return [];

    const rows: LineupPlayer[][] = [];
    let playerIndex = 0;

    for (const rowCount of formationConfig.rows) {
      const row: LineupPlayer[] = [];
      for (let i = 0; i < rowCount && playerIndex < players.length; i++) {
        row.push(players[playerIndex]);
        playerIndex++;
      }
      rows.push(row);
    }

    return rows;
  }, [formationConfig, players]);

  const pitchStyle = getPitchStyle(sport);
  const jerseyStyle = getJerseyStyle(primaryColor, secondaryColor);

  // Handle cricket/batting order differently
  const isBattingOrder = sport === 'CRICKET';

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sportConfig.icon}</span>
            <div>
              <CardTitle className="text-lg">{teamName}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formationConfig?.label || formation} Formation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {confirmed ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Confirmed
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Pending
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formation Visualization */}
        {isBattingOrder ? (
          // Cricket: Show batting order as a list
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Batting Order
            </h4>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white w-8">
                    #{player.number}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">
                    {player.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {player.position}
                  </Badge>
                  {player.isCaptain && (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Other sports: Show formation on pitch
          <div
            className={cn(
              'rounded-lg overflow-hidden',
              pitchStyle,
              compact ? 'min-h-[280px]' : 'min-h-[400px]',
              'p-4 flex flex-col justify-between'
            )}
          >
            {/* Pitch markings (simplified) */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              {sport === 'FOOTBALL' && (
                <>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white rounded-full" />
                </>
              )}
            </div>

            {/* Player Rows */}
            {playerRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center items-center gap-2 sm:gap-4"
                style={{
                  flex: 1,
                }}
              >
                {row.map((player) => (
                  <PlayerNode
                    key={player.id}
                    player={player}
                    jerseyStyle={jerseyStyle}
                    showRating={showRatings}
                    compact={compact}
                    onClick={() => onPlayerClick?.(player)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Squad List */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Starting XI
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-bold text-gray-900 dark:text-white w-8">
                  #{player.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {player.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {player.position}
                  </p>
                </div>
                {player.isCaptain && (
                  <Badge variant="secondary" className="text-xs">
                    C
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Substitutes */}
        {substitutes.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowSubs(!showSubs)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Substitutes ({substitutes.length})
              </h4>
              {showSubs ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showSubs && (
              <div className="grid grid-cols-2 gap-2">
                {substitutes.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-70"
                  >
                    <span className="font-bold text-gray-700 dark:text-gray-300 w-8">
                      #{player.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {player.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {player.position}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

LineupCard.displayName = 'LineupCard';

export default LineupCard;
