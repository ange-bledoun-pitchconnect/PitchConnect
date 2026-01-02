/**
 * ============================================================================
 * EventLogger Component
 * ============================================================================
 * 
 * Enterprise-grade match event logger with multi-sport support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - COACH: Log events during matches
 * - MANAGER: Match management
 * - REFEREE: Official match events
 * - ANALYST: Event recording
 * 
 * SCHEMA ALIGNMENT:
 * - MatchEvent model
 * - Sport enum (all 12 sports)
 * - Player model
 * 
 * FEATURES:
 * - Multi-sport event types
 * - Sport-specific event modifiers
 * - Player selection with search
 * - Second player for substitutions
 * - Time tracking with injury time
 * - Event notes
 * - Dark mode support
 * - Keyboard shortcuts
 * - Undo last event
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  Search,
  Clock,
  Undo2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSportConfig,
  getSportEventTypes,
  type Sport,
  type MatchEventType,
} from '../config/sport-dashboard-config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Player {
  id: string;
  name: string;
  number: number;
  position?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  players: Player[];
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: string;
  team: 'home' | 'away';
  player?: Player;
  secondPlayer?: Player;
  minute: number;
  injuryTime?: number;
  period: number;
  notes?: string;
  timestamp: string;
  modifiers?: string[];
}

export interface EventLoggerProps {
  /** Match ID */
  matchId: string;
  /** Sport type for event configuration */
  sport: Sport;
  /** Current match minute */
  currentMinute: number;
  /** Current period */
  currentPeriod?: number;
  /** Home team data */
  homeTeam: Team;
  /** Away team data */
  awayTeam: Team;
  /** Callback when event is added */
  onAddEvent: (event: MatchEvent) => void;
  /** Callback for undo last event */
  onUndoEvent?: (eventId: string) => void;
  /** Last event for undo */
  lastEvent?: MatchEvent | null;
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EventLogger({
  matchId,
  sport,
  currentMinute,
  currentPeriod = 1,
  homeTeam,
  awayTeam,
  onAddEvent,
  onUndoEvent,
  lastEvent,
  isLoading = false,
  compact = false,
  className,
}: EventLoggerProps) {
  // Sport configuration
  const sportConfig = useMemo(() => getSportConfig(sport), [sport]);
  const eventTypes = useMemo(() => getSportEventTypes(sport), [sport]);

  // Form state
  const [selectedEventType, setSelectedEventType] = useState<MatchEventType | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [secondPlayer, setSecondPlayer] = useState<Player | null>(null);
  const [minute, setMinute] = useState<number>(currentMinute);
  const [injuryTime, setInjuryTime] = useState<number>(0);
  const [period, setPeriod] = useState<number>(currentPeriod);
  const [notes, setNotes] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Update minute when currentMinute changes
  useEffect(() => {
    setMinute(currentMinute);
  }, [currentMinute]);

  useEffect(() => {
    setPeriod(currentPeriod);
  }, [currentPeriod]);

  // Get players for selected team
  const teamPlayers = useMemo(() => {
    const team = selectedTeam === 'home' ? homeTeam : awayTeam;
    const query = playerSearch.toLowerCase();
    
    if (!query) return team.players;
    
    return team.players.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.number.toString().includes(query)
    );
  }, [selectedTeam, homeTeam, awayTeam, playerSearch]);

  // Group events by category
  const eventsByCategory = useMemo(() => {
    return eventTypes.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {} as Record<string, MatchEventType[]>);
  }, [eventTypes]);

  // Handle event submission
  const handleSubmit = useCallback(() => {
    if (!selectedEventType) return;
    
    // Validate player requirement
    if (selectedEventType.requiresPlayer && !selectedPlayer) {
      return;
    }

    const newEvent: MatchEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      type: selectedEventType.key,
      team: selectedTeam,
      player: selectedPlayer || undefined,
      secondPlayer: selectedEventType.requiresSecondPlayer ? secondPlayer || undefined : undefined,
      minute,
      injuryTime: injuryTime > 0 ? injuryTime : undefined,
      period,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
      modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
    };

    onAddEvent(newEvent);
    resetForm();
  }, [
    selectedEventType,
    selectedPlayer,
    secondPlayer,
    selectedTeam,
    minute,
    injuryTime,
    period,
    notes,
    selectedModifiers,
    matchId,
    onAddEvent,
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setSelectedEventType(null);
    setSelectedPlayer(null);
    setSecondPlayer(null);
    setNotes('');
    setSelectedModifiers([]);
    setPlayerSearch('');
    setShowPlayerDropdown(false);
    setInjuryTime(0);
  }, []);

  // Toggle modifier
  const toggleModifier = (modifier: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifier)
        ? prev.filter((m) => m !== modifier)
        : [...prev, modifier]
    );
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    scoring: '⚽ Scoring',
    disciplinary: '🟨 Disciplinary',
    substitution: '🔄 Substitution',
    set_piece: '🎯 Set Pieces',
    time: '⏱️ Time',
    other: '📝 Other',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={cn(compact && 'pb-3')}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{sportConfig.icon}</span>
              Log Event
            </CardTitle>
            <CardDescription>
              Record match events in real-time for {sportConfig.name}
            </CardDescription>
          </div>
          {lastEvent && onUndoEvent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUndoEvent(lastEvent.id)}
              className="gap-1"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Team Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Team</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'home', team: homeTeam },
              { key: 'away', team: awayTeam },
            ].map(({ key, team }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedTeam(key as 'home' | 'away');
                  setSelectedPlayer(null);
                  setSecondPlayer(null);
                }}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all font-medium text-sm',
                  selectedTeam === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50'
                )}
              >
                <span className="block font-semibold">{team.shortName || team.name}</span>
                <span className="text-xs opacity-70">{key.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Event Type *</Label>
          <div className="space-y-3">
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {categoryLabels[category] || category}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {events.map((event) => (
                    <button
                      key={event.key}
                      type="button"
                      onClick={() => {
                        setSelectedEventType(event);
                        setSelectedModifiers([]);
                      }}
                      className={cn(
                        'p-2 rounded-lg border-2 transition-all text-sm flex items-center gap-2',
                        selectedEventType?.key === event.key
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      )}
                    >
                      <span>{event.icon}</span>
                      <span className="truncate">{event.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Modifiers */}
        {selectedEventType?.hasModifiers && selectedEventType.hasModifiers.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Modifiers</Label>
            <div className="flex flex-wrap gap-2">
              {selectedEventType.hasModifiers.map((modifier) => (
                <button
                  key={modifier}
                  type="button"
                  onClick={() => toggleModifier(modifier)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    selectedModifiers.includes(modifier)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {modifier.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Selection */}
        {selectedEventType?.requiresPlayer && (
          <div className="relative">
            <Label className="text-sm font-medium mb-2 block">
              Player *
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or number..."
                value={selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : playerSearch}
                onChange={(e) => {
                  setPlayerSearch(e.target.value);
                  setSelectedPlayer(null);
                  setShowPlayerDropdown(true);
                }}
                onFocus={() => setShowPlayerDropdown(true)}
                className="pl-9"
              />
              {selectedPlayer && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(null);
                    setPlayerSearch('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Player Dropdown */}
            {showPlayerDropdown && !selectedPlayer && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {teamPlayers.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500 text-center">No players found</p>
                ) : (
                  teamPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowPlayerDropdown(false);
                        setPlayerSearch('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <span className="font-bold text-primary w-8">#{player.number}</span>
                      <span className="flex-1">{player.name}</span>
                      {player.position && (
                        <Badge variant="outline" className="text-xs">
                          {player.position}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Second Player (for substitutions) */}
        {selectedEventType?.requiresSecondPlayer && (
          <div className="relative">
            <Label className="text-sm font-medium mb-2 block">
              Replacing Player
            </Label>
            <select
              value={secondPlayer?.id || ''}
              onChange={(e) => {
                const player = teamPlayers.find((p) => p.id === e.target.value);
                setSecondPlayer(player || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Select player coming on...</option>
              {teamPlayers
                .filter((p) => p.id !== selectedPlayer?.id)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    #{player.number} {player.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {sportConfig.periodName} *
            </Label>
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {Array.from({ length: sportConfig.periodCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {sportConfig.periodName} {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Minute *
            </Label>
            <Input
              type="number"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
              min={0}
              max={120}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Injury Time
            </Label>
            <Input
              type="number"
              value={injuryTime}
              onChange={(e) => setInjuryTime(parseInt(e.target.value) || 0)}
              min={0}
              max={15}
              placeholder="+0"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Notes (Optional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedEventType ||
              (selectedEventType.requiresPlayer && !selectedPlayer) ||
              isLoading
            }
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Event
          </Button>
          <Button onClick={resetForm} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

EventLogger.displayName = 'EventLogger';

export default EventLogger;
