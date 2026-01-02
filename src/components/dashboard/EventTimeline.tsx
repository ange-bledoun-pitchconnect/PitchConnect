/**
 * ============================================================================
 * EventTimeline Component
 * ============================================================================
 * 
 * Enterprise-grade match event timeline with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All match viewers
 * - COACH: Review match events
 * - ANALYST: Event analysis
 * - REFEREE: Official record
 * 
 * SCHEMA ALIGNMENT:
 * - MatchEvent model
 * - Sport enum (all 12 sports)
 * 
 * FEATURES:
 * - Sport-specific event icons and colors
 * - Chronological display
 * - Event filtering by type/team
 * - Live event animation
 * - Score tracking
 * - Dark mode support
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportEventTypes,
  type Sport,
  type MatchEventType,
  type EventCategory,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TimelineEvent {
  id: string;
  matchId: string;
  type: string;
  team: 'home' | 'away';
  player?: {
    id: string;
    name: string;
    number: number;
  };
  secondPlayer?: {
    id: string;
    name: string;
    number: number;
  };
  minute: number;
  injuryTime?: number;
  period: number;
  notes?: string;
  timestamp: string;
  modifiers?: string[];
}

export interface EventTimelineProps {
  /** Sport type for event configuration */
  sport: Sport;
  /** Events to display */
  events: TimelineEvent[];
  /** Home team name */
  homeTeamName?: string;
  /** Away team name */
  awayTeamName?: string;
  /** Show filtering options */
  showFilters?: boolean;
  /** Enable live animation for new events */
  isLive?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** On event click */
  onEventClick?: (event: TimelineEvent) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EventTimeline({
  sport,
  events,
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  showFilters = true,
  isLive = false,
  compact = false,
  className,
  onEventClick,
}: EventTimelineProps) {
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const eventTypes = useMemo(() => getSportEventTypes(sport), [sport]);

  // Filter state
  const [selectedTeam, setSelectedTeam] = useState<'all' | 'home' | 'away'>('all');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  // Create event type lookup map
  const eventTypeMap = useMemo(() => {
    return eventTypes.reduce((acc, et) => {
      acc[et.key] = et;
      return acc;
    }, {} as Record<string, MatchEventType>);
  }, [eventTypes]);

  // Get unique categories from events
  const categories = useMemo(() => {
    const cats = new Set(eventTypes.map((et) => et.category));
    return ['all', ...Array.from(cats)] as (EventCategory | 'all')[];
  }, [eventTypes]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (selectedTeam !== 'all' && event.team !== selectedTeam) return false;
        if (selectedCategory !== 'all') {
          const eventType = eventTypeMap[event.type];
          if (eventType?.category !== selectedCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by period then minute
        if (a.period !== b.period) return a.period - b.period;
        return a.minute - b.minute;
      });
  }, [events, selectedTeam, selectedCategory, eventTypeMap]);

  // Calculate running score
  const getScoreAtEvent = (eventIndex: number): { home: number; away: number } => {
    const score = { home: 0, away: 0 };
    const scoringEvents = filteredEvents.slice(0, eventIndex + 1);

    scoringEvents.forEach((event) => {
      const eventType = eventTypeMap[event.type];
      if (eventType?.category === 'scoring' && eventType.points) {
        if (event.team === 'home') {
          score.home += eventType.points;
        } else {
          score.away += eventType.points;
        }
      }
    });

    return score;
  };

  // Get event display info
  const getEventDisplay = (event: TimelineEvent) => {
    const eventType = eventTypeMap[event.type];
    
    if (!eventType) {
      return {
        icon: '📝',
        label: event.type,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
      };
    }

    return {
      icon: eventType.icon,
      label: eventType.label,
      color: eventType.color,
      bgColor: eventType.bgColor,
    };
  };

  // Format minute display
  const formatMinute = (event: TimelineEvent): string => {
    if (event.injuryTime && event.injuryTime > 0) {
      return `${event.minute}+${event.injuryTime}'`;
    }
    return `${event.minute}'`;
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    all: 'All Events',
    scoring: 'Scoring',
    disciplinary: 'Cards',
    substitution: 'Subs',
    set_piece: 'Set Pieces',
    time: 'Time',
    other: 'Other',
  };

  return (
    <Card className={className}>
      <CardHeader className={cn(compact && 'pb-3')}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{sportConfig.icon}</span>
              Match Timeline
            </CardTitle>
            <CardDescription>
              Chronological event log for {sportConfig.name}
            </CardDescription>
          </div>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            {/* Team Filter */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'home', label: homeTeamName },
                  { key: 'away', label: awayTeamName },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedTeam(option.key as 'all' | 'home' | 'away')}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedTeam === option.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events recorded yet</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const display = getEventDisplay(event);
              const score = getScoreAtEvent(index);
              const isLatest = isLive && index === filteredEvents.length - 1;

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cn(
                    'flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0',
                    onEventClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 py-2 rounded-lg',
                    isLatest && 'animate-pulse'
                  )}
                >
                  {/* Timeline Indicator */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                        display.bgColor
                      )}
                    >
                      {display.icon}
                    </div>
                    {index < filteredEvents.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 min-h-[20px]" />
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pt-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn('font-semibold', display.color)}>
                        {display.label}
                        {event.modifiers && event.modifiers.length > 0 && (
                          <span className="text-gray-500 font-normal ml-1">
                            ({event.modifiers.join(', ').replace(/_/g, ' ')})
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={event.team === 'home' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {event.team === 'home' ? homeTeamName : awayTeamName}
                        </Badge>
                        {/* Running Score (for scoring events) */}
                        {eventTypeMap[event.type]?.category === 'scoring' && (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {score.home} - {score.away}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Player Info */}
                    {event.player && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">#{event.player.number}</span>{' '}
                        {event.player.name}
                      </p>
                    )}

                    {/* Second Player (for substitutions) */}
                    {event.secondPlayer && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">
                        → <span className="font-medium">#{event.secondPlayer.number}</span>{' '}
                        {event.secondPlayer.name}
                      </p>
                    )}

                    {/* Time and Notes */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMinute(event)}
                      </span>
                      <span>
                        {sportConfig.periodName} {event.period}
                      </span>
                      {event.notes && (
                        <span className="italic">"{event.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Event Count */}
        {filteredEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

EventTimeline.displayName = 'EventTimeline';

export default EventTimeline;
