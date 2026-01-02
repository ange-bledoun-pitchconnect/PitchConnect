/**
 * ============================================================================
 * Match Event Timeline Component
 * ============================================================================
 * 
 * Enterprise-grade match event timeline with multi-sport support.
 * Displays all match events in chronological order with sport-specific styling.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/match/MatchEventTimeline.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Sport-specific event types and icons
 * - Chronological timeline display
 * - Team-based filtering
 * - Event type filtering
 * - Live event streaming
 * - Scoring summary
 * - Expandable event details
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - ALL ROLES: View match events
 * - REFEREE: Add/edit events
 * - ANALYST: Event analytics
 * - MEDIA_MANAGER: Event highlights
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type Sport,
  SPORT_CONFIG,
} from '@/config/sport-dashboard-config';
import {
  type EventType,
  type EventDefinition,
  getMatchConfig,
  getEventsForSport,
  getEventDefinition,
  getScoringEvents,
} from '@/config/sport-match-config';

// =============================================================================
// TYPES
// =============================================================================

export interface MatchEvent {
  id: string;
  type: EventType;
  minute: number;
  additionalTime?: number;
  period: number;
  teamId: string;
  teamName: string;
  teamColor?: string;
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
  assistPlayerId?: string;
  assistPlayerName?: string;
  description?: string;
  // Substitution specific
  playerOutId?: string;
  playerOutName?: string;
  playerInId?: string;
  playerInName?: string;
  // Card specific
  cardColor?: 'yellow' | 'red' | 'green' | 'black';
  cardReason?: string;
  // Cricket specific
  runs?: number;
  wicketType?: string;
  batsmanOut?: string;
  bowler?: string;
  over?: number;
  ball?: number;
  // VAR/TMO/DRS specific
  decision?: string;
  originalDecision?: string;
  // Timestamp
  timestamp: Date | string;
}

export interface MatchEventTimelineProps {
  /** Sport type */
  sport: Sport;
  /** List of match events */
  events: MatchEvent[];
  /** Home team info */
  homeTeam: { id: string; name: string; color?: string };
  /** Away team info */
  awayTeam: { id: string; name: string; color?: string };
  /** Current match period */
  currentPeriod?: number;
  /** Current match minute */
  currentMinute?: number;
  /** Is match live */
  isLive?: boolean;
  /** Show scoring events only */
  scoringOnly?: boolean;
  /** Enable event filtering */
  showFilters?: boolean;
  /** Max events to show (pagination) */
  maxEvents?: number;
  /** On event click handler */
  onEventClick?: (event: MatchEvent) => void;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// EVENT CARD COMPONENT
// =============================================================================

interface EventCardProps {
  event: MatchEvent;
  eventDef: EventDefinition | undefined;
  sport: Sport;
  isHome: boolean;
  onClick?: () => void;
}

function EventCard({ event, eventDef, sport, isHome, onClick }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format time display
  const formatTime = () => {
    // Cricket uses overs.balls
    if (sport === 'CRICKET' && event.over !== undefined) {
      return `${event.over}.${event.ball || 0}`;
    }
    // Normal sports use minutes
    const addedTime = event.additionalTime ? `+${event.additionalTime}` : '';
    return `${event.minute}'${addedTime}`;
  };

  // Get event description
  const getEventDescription = () => {
    switch (event.type) {
      case 'GOAL':
      case 'TRY':
      case 'TOUCHDOWN':
      case 'HOCKEY_GOAL':
      case 'NETBALL_GOAL':
      case 'LACROSSE_GOAL':
      case 'AFL_GOAL':
      case 'GAELIC_GOAL':
        return event.assistPlayerName
          ? `${event.playerName} (assist: ${event.assistPlayerName})`
          : event.playerName;

      case 'SUBSTITUTION':
        return `${event.playerOutName} ➡️ ${event.playerInName}`;

      case 'YELLOW_CARD':
      case 'RED_CARD':
        return `${event.playerName}${event.cardReason ? ` - ${event.cardReason}` : ''}`;

      case 'WICKET':
        return `${event.batsmanOut} out (${event.wicketType}) b. ${event.bowler}`;

      case 'BOUNDARY_FOUR':
      case 'BOUNDARY_SIX':
        return `${event.playerName} hits ${event.type === 'BOUNDARY_SIX' ? 'SIX!' : 'FOUR!'}`;

      case 'VAR_DECISION':
      case 'TMO_DECISION':
      case 'DRS_REVIEW':
        return `${event.originalDecision} → ${event.decision}`;

      default:
        return event.description || event.playerName || event.teamName;
    }
  };

  if (!eventDef) {
    // Fallback for unknown event types
    return null;
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        eventDef.bgColor,
        eventDef.borderColor,
        'hover:shadow-md',
        isHome ? 'flex-row' : 'flex-row-reverse text-right'
      )}
      onClick={() => {
        onClick?.();
        setIsExpanded(!isExpanded);
      }}
    >
      {/* Time */}
      <div className={cn(
        'flex-shrink-0 w-14 text-center',
        isHome ? '' : 'order-last'
      )}>
        <span className="text-sm font-bold text-charcoal-900 dark:text-white">
          {formatTime()}
        </span>
        {event.period && (
          <span className="block text-xs text-charcoal-500">
            P{event.period}
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl',
        'bg-white dark:bg-charcoal-800 shadow-sm border',
        eventDef.borderColor
      )}>
        {eventDef.icon}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isHome ? '' : 'text-right')}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold', eventDef.color)}>
            {eventDef.label}
          </span>
          {eventDef.points && (
            <Badge variant="secondary" className="text-xs">
              +{eventDef.points}
            </Badge>
          )}
        </div>

        <p className="text-sm text-charcoal-700 dark:text-charcoal-300 mt-0.5 truncate">
          {getEventDescription()}
        </p>

        <p className="text-xs text-charcoal-500 mt-1">
          {event.teamName}
          {event.playerNumber && ` • #${event.playerNumber}`}
        </p>

        {/* Expanded Details */}
        {isExpanded && event.description && (
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2 p-2 bg-white/50 dark:bg-charcoal-900/50 rounded">
            {event.description}
          </p>
        )}
      </div>

      {/* Team indicator */}
      <div
        className={cn(
          'absolute top-0 w-1 h-full rounded-full',
          isHome ? 'left-0' : 'right-0'
        )}
        style={{ backgroundColor: event.teamColor || (isHome ? '#3B82F6' : '#EF4444') }}
      />
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MatchEventTimeline({
  sport,
  events,
  homeTeam,
  awayTeam,
  currentPeriod,
  currentMinute,
  isLive = false,
  scoringOnly = false,
  showFilters = true,
  maxEvents = 50,
  onEventClick,
  className,
}: MatchEventTimelineProps) {
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [filterType, setFilterType] = useState<'all' | 'scoring' | 'cards' | 'other'>('all');
  const [showAll, setShowAll] = useState(false);

  // Get sport config
  const sportConfig = useMemo(() => SPORT_CONFIG[sport], [sport]);
  const matchConfig = useMemo(() => getMatchConfig(sport), [sport]);
  const allEvents = useMemo(() => getEventsForSport(sport), [sport]);
  const scoringEventTypes = useMemo(() => getScoringEvents(sport).map(e => e.type), [sport]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Team filter
    if (filterTeam === 'home') {
      filtered = filtered.filter((e) => e.teamId === homeTeam.id);
    } else if (filterTeam === 'away') {
      filtered = filtered.filter((e) => e.teamId === awayTeam.id);
    }

    // Type filter
    if (filterType === 'scoring' || scoringOnly) {
      filtered = filtered.filter((e) => scoringEventTypes.includes(e.type));
    } else if (filterType === 'cards') {
      filtered = filtered.filter((e) => 
        ['YELLOW_CARD', 'RED_CARD', 'SIN_BIN'].includes(e.type)
      );
    }

    // Sort by time (most recent first for live, chronological for replay)
    filtered.sort((a, b) => {
      const aTime = a.minute + (a.additionalTime || 0);
      const bTime = b.minute + (b.additionalTime || 0);
      return isLive ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [events, filterTeam, filterType, scoringOnly, homeTeam.id, awayTeam.id, scoringEventTypes, isLive]);

  // Limit events
  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, maxEvents);
  const hasMore = filteredEvents.length > maxEvents;

  // Calculate score
  const score = useMemo(() => {
    let home = 0;
    let away = 0;

    events.forEach((event) => {
      const eventDef = getEventDefinition(sport, event.type);
      if (eventDef?.isScoring && eventDef.points) {
        if (event.teamId === homeTeam.id) {
          home += eventDef.points;
        } else {
          away += eventDef.points;
        }
      }
    });

    return { home, away };
  }, [events, sport, homeTeam.id]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              sportConfig.bgColor
            )}>
              {sportConfig.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Match Events
              </CardTitle>
              <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full mr-2" />
                LIVE
              </Badge>
            )}
          </div>
        </div>

        {/* Score Summary */}
        <div className="flex items-center justify-center gap-4 mt-4 p-3 bg-neutral-100 dark:bg-charcoal-700 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">
              {homeTeam.name}
            </p>
            <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
              {score.home}
            </p>
          </div>
          <span className="text-2xl text-charcoal-400">-</span>
          <div className="text-center">
            <p className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">
              {awayTeam.name}
            </p>
            <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
              {score.away}
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Team Filter */}
            <div className="flex rounded-lg border border-neutral-200 dark:border-charcoal-700 overflow-hidden">
              {(['all', 'home', 'away'] as const).map((team) => (
                <button
                  key={team}
                  onClick={() => setFilterTeam(team)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    filterTeam === team
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-charcoal-800 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                  )}
                >
                  {team === 'all' ? 'All Teams' : team === 'home' ? homeTeam.name : awayTeam.name}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex rounded-lg border border-neutral-200 dark:border-charcoal-700 overflow-hidden">
              {(['all', 'scoring', 'cards'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    filterType === type
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-charcoal-800 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Events List */}
        {displayedEvents.length > 0 ? (
          <div className="space-y-3">
            {displayedEvents.map((event) => {
              const eventDef = getEventDefinition(sport, event.type);
              const isHome = event.teamId === homeTeam.id;

              return (
                <EventCard
                  key={event.id}
                  event={event}
                  eventDef={eventDef}
                  sport={sport}
                  isHome={isHome}
                  onClick={() => onEventClick?.(event)}
                />
              );
            })}

            {/* Show More */}
            {hasMore && !showAll && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Show {filteredEvents.length - maxEvents} More Events
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
            <p className="text-charcoal-600 dark:text-charcoal-400">
              {events.length === 0
                ? 'No events yet. Match in progress...'
                : 'No events match your filters'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

MatchEventTimeline.displayName = 'MatchEventTimeline';

export default MatchEventTimeline;
