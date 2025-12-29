'use client';

// ============================================================================
// ⚽ PITCHCONNECT - MATCH EVENTS CLIENT v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/events/MatchEventsClient.tsx
// Real-time match event tracking with multi-sport support
// Schema v7.3.0 aligned - Uses MatchEventType enum
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Timer,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getSportConfig,
  getEventTypeLabel,
  getEventTypeIcon,
  getSportIcon,
  type SportConfig,
} from '@/lib/config/sports';
import type { Sport, MatchEventType, MatchStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string | null;
  eventType: string;
  minute: number;
  secondaryMinute: number | null;
  period: string | null;
  relatedPlayerId: string | null;
  assistPlayerId: string | null;
  goalType: string | null;
  cardReason: string | null;
  details: Record<string, any> | null;
  videoTimestamp: number | null;
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
  avatar: string | null;
  position: string | null;
  jerseyNumber: number | null;
}

interface TeamInfo {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  sport: Sport;
  primaryColor: string | null;
}

interface MatchData {
  id: string;
  status: MatchStatus;
  kickOffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  venue: string | null;
  homeClubId: string;
  awayClubId: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  events: MatchEvent[];
}

interface MatchEventsClientProps {
  match: MatchData;
  homePlayers: Player[];
  awayPlayers: Player[];
  canManageEvents: boolean;
  currentUserId: string;
}

// Event categories for filtering
type EventCategory = 'all' | 'scoring' | 'disciplinary' | 'substitution' | 'gameFlow';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getEventCategory = (eventType: string, sportConfig: SportConfig): EventCategory => {
  if (sportConfig.scoringEvents.includes(eventType as MatchEventType)) {
    return 'scoring';
  }
  
  const disciplinaryEvents = [
    'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW', 'YELLOW_CARD_RUGBY', 'RED_CARD_RUGBY',
    'SIN_BIN', 'MINOR_PENALTY', 'MAJOR_PENALTY', 'OFFENSIVE_FOUL', 'DEFENSIVE_FOUL',
  ];
  if (disciplinaryEvents.includes(eventType)) {
    return 'disciplinary';
  }
  
  const substitutionEvents = ['SUBSTITUTION_ON', 'SUBSTITUTION_OFF'];
  if (substitutionEvents.includes(eventType)) {
    return 'substitution';
  }
  
  return 'gameFlow';
};

const getStatusColor = (status: MatchStatus): string => {
  const colors: Partial<Record<MatchStatus, string>> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    WARMUP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    LIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 animate-pulse',
    HALFTIME: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    SECOND_HALF: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    EXTRA_TIME_FIRST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    EXTRA_TIME_SECOND: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    PENALTIES: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    FINISHED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    POSTPONED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const formatStatusLabel = (status: MatchStatus): string => {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

interface EventCardProps {
  event: MatchEvent;
  homePlayers: Player[];
  awayPlayers: Player[];
  homeClubId: string;
  sportConfig: SportConfig;
}

const EventCard = ({ event, homePlayers, awayPlayers, homeClubId, sportConfig }: EventCardProps) => {
  const allPlayers = [...homePlayers, ...awayPlayers];
  const player = event.playerId ? allPlayers.find((p) => p.id === event.playerId) : null;
  const assistPlayer = event.assistPlayerId ? allPlayers.find((p) => p.id === event.assistPlayerId) : null;
  
  const isHomeEvent = player && homePlayers.some((p) => p.id === player.id);
  const icon = getEventTypeIcon(event.eventType as MatchEventType);
  const label = getEventTypeLabel(event.eventType as MatchEventType);
  const category = getEventCategory(event.eventType, sportConfig);
  
  const categoryColors: Record<EventCategory, string> = {
    all: 'border-gray-200 dark:border-gray-700',
    scoring: 'border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10',
    disciplinary: 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10',
    substitution: 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10',
    gameFlow: 'border-gray-300 dark:border-gray-600',
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${categoryColors[category]} transition-all hover:shadow-md`}
    >
      {/* Minute */}
      <div className="flex-shrink-0 w-16 text-center">
        <div className="text-2xl font-bold text-charcoal-900 dark:text-white">
          {event.minute}'
          {event.secondaryMinute && (
            <span className="text-sm text-charcoal-500">+{event.secondaryMinute}</span>
          )}
        </div>
        {event.period && (
          <div className="text-xs text-charcoal-500 dark:text-charcoal-400">{event.period}</div>
        )}
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 text-3xl">{icon}</div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-charcoal-900 dark:text-white">{label}</span>
          {isHomeEvent !== undefined && (
            <Badge
              variant="outline"
              className={
                isHomeEvent
                  ? 'border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-orange-400 text-orange-600 dark:border-orange-500 dark:text-orange-400'
              }
            >
              {isHomeEvent ? 'Home' : 'Away'}
            </Badge>
          )}
        </div>

        {player && (
          <div className="flex items-center gap-2 mt-1">
            {player.avatar ? (
              <img src={player.avatar} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
            )}
            <span className="text-charcoal-700 dark:text-charcoal-300">
              {player.jerseyNumber && `#${player.jerseyNumber} `}
              {player.name}
            </span>
          </div>
        )}

        {assistPlayer && (
          <div className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
            Assist: {assistPlayer.name}
          </div>
        )}

        {event.cardReason && (
          <div className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
            Reason: {event.cardReason}
          </div>
        )}

        {event.goalType && (
          <div className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
            Type: {event.goalType.replace(/_/g, ' ')}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ADD EVENT MODAL
// ============================================================================

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewEventData) => Promise<void>;
  homePlayers: Player[];
  awayPlayers: Player[];
  sportConfig: SportConfig;
  currentMinute: number;
  isSubmitting: boolean;
}

interface NewEventData {
  eventType: MatchEventType;
  minute: number;
  secondaryMinute?: number;
  period?: string;
  playerId?: string;
  assistPlayerId?: string;
  goalType?: string;
  cardReason?: string;
  team: 'home' | 'away';
}

const AddEventModal = ({
  isOpen,
  onClose,
  onSubmit,
  homePlayers,
  awayPlayers,
  sportConfig,
  currentMinute,
  isSubmitting,
}: AddEventModalProps) => {
  const [formData, setFormData] = useState<Partial<NewEventData>>({
    minute: currentMinute,
    team: 'home',
  });
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  useEffect(() => {
    if (isOpen) {
      setFormData({ minute: currentMinute, team: 'home' });
      setSelectedCategory('all');
    }
  }, [isOpen, currentMinute]);

  if (!isOpen) return null;

  const filteredEventTypes = sportConfig.eventTypes.filter((et) => {
    if (selectedCategory === 'all') return true;
    return getEventCategory(et, sportConfig) === selectedCategory;
  });

  const selectedPlayers = formData.team === 'home' ? homePlayers : awayPlayers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventType || formData.minute === undefined) return;

    await onSubmit({
      eventType: formData.eventType as MatchEventType,
      minute: formData.minute,
      secondaryMinute: formData.secondaryMinute,
      period: formData.period,
      playerId: formData.playerId,
      assistPlayerId: formData.assistPlayerId,
      goalType: formData.goalType,
      cardReason: formData.cardReason,
      team: formData.team || 'home',
    });
  };

  const needsPlayer = [
    'GOAL', 'TRY', 'TOUCHDOWN', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION_ON',
    'SUBSTITUTION_OFF', 'ASSIST', 'THREE_POINTER', 'TWO_POINTER', 'FREE_THROW_MADE',
  ].includes(formData.eventType || '');

  const needsAssist = ['GOAL', 'TRY', 'TOUCHDOWN', 'THREE_POINTER', 'TWO_POINTER'].includes(
    formData.eventType || ''
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-white dark:bg-charcoal-800 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-charcoal-900 dark:text-white">Add Match Event</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                Team
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, team: 'home', playerId: undefined }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.team === 'home'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, team: 'away', playerId: undefined }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.team === 'away'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">Away</span>
                </button>
              </div>
            </div>

            {/* Event Category Filter */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'scoring', 'disciplinary', 'substitution', 'gameFlow'] as EventCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-900'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                Event Type *
              </label>
              <select
                value={formData.eventType || ''}
                onChange={(e) => setFormData((f) => ({ ...f, eventType: e.target.value as MatchEventType }))}
                className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                required
              >
                <option value="">Select event type</option>
                {filteredEventTypes.map((et) => (
                  <option key={et} value={et}>
                    {getEventTypeIcon(et)} {getEventTypeLabel(et)}
                  </option>
                ))}
              </select>
            </div>

            {/* Minute */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Minute *
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={formData.minute || 0}
                  onChange={(e) => setFormData((f) => ({ ...f, minute: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Added Time
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={formData.secondaryMinute || ''}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      secondaryMinute: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Player Selection */}
            {needsPlayer && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Player
                </label>
                <select
                  value={formData.playerId || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, playerId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Select player</option>
                  {selectedPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assist Player */}
            {needsAssist && formData.playerId && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Assist
                </label>
                <select
                  value={formData.assistPlayerId || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, assistPlayerId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">No assist</option>
                  {selectedPlayers
                    .filter((p) => p.id !== formData.playerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Card Reason */}
            {['YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW'].includes(formData.eventType || '') && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={formData.cardReason || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, cardReason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  placeholder="e.g., Dangerous tackle"
                />
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.eventType}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MatchEventsClient({
  match,
  homePlayers,
  awayPlayers,
  canManageEvents,
  currentUserId,
}: MatchEventsClientProps) {
  const router = useRouter();
  const sportConfig = getSportConfig(match.homeTeam.sport);

  // State
  const [events, setEvents] = useState<MatchEvent[]>(match.events);
  const [filterCategory, setFilterCategory] = useState<EventCategory>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchTimer, setMatchTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(
    ['LIVE', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND'].includes(match.status)
  );

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setMatchTimer((t) => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Calculate current minute based on kick-off time
  useEffect(() => {
    if (['LIVE', 'SECOND_HALF'].includes(match.status)) {
      const kickOff = new Date(match.kickOffTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - kickOff.getTime()) / 60000);
      setMatchTimer(Math.max(0, Math.min(diffMinutes, 90)));
    }
  }, [match.kickOffTime, match.status]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterCategory === 'all') return events;
    return events.filter((e) => getEventCategory(e.eventType, sportConfig) === filterCategory);
  }, [events, filterCategory, sportConfig]);

  // Calculate live score from events
  const calculateScore = useCallback(() => {
    let homeScore = 0;
    let awayScore = 0;

    for (const event of events) {
      if (sportConfig.scoringEvents.includes(event.eventType as MatchEventType)) {
        const pointValue = sportConfig.scoring.pointValues[event.eventType] || 1;
        const player = [...homePlayers, ...awayPlayers].find((p) => p.id === event.playerId);
        
        if (player) {
          const isHome = homePlayers.some((p) => p.id === player.id);
          if (isHome) {
            homeScore += pointValue;
          } else {
            awayScore += pointValue;
          }
        }
      }
    }

    return { homeScore, awayScore };
  }, [events, homePlayers, awayPlayers, sportConfig]);

  const { homeScore, awayScore } = calculateScore();

  // Add event handler
  const handleAddEvent = async (data: NewEventData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/matches/${match.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: data.eventType,
          minute: data.minute,
          secondaryMinute: data.secondaryMinute,
          period: data.period,
          playerId: data.playerId,
          assistPlayerId: data.assistPlayerId,
          goalType: data.goalType,
          cardReason: data.cardReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add event');
      }

      const newEvent = await response.json();
      setEvents((prev) => [...prev, newEvent].sort((a, b) => a.minute - b.minute));
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding event:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/matches/${match.id}`}
            className="inline-flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getSportIcon(match.homeTeam.sport)}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">
                  Match Events
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              {canManageEvents && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Score Card */}
        <Card className="mb-6 bg-gradient-to-r from-charcoal-900 to-charcoal-800 dark:from-charcoal-800 dark:to-charcoal-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="text-center flex-1">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto mb-2 bg-blue-500 rounded-lg flex items-center justify-center text-3xl">
                    {getSportIcon(match.homeTeam.sport)}
                  </div>
                )}
                <p className="font-bold text-lg">{match.homeTeam.shortName || match.homeTeam.name}</p>
              </div>

              {/* Score */}
              <div className="text-center px-8">
                <Badge className={`${getStatusColor(match.status)} mb-2`}>
                  {formatStatusLabel(match.status)}
                </Badge>
                <div className="text-5xl sm:text-6xl font-bold">
                  {match.homeScore ?? homeScore} - {match.awayScore ?? awayScore}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-charcoal-300">
                  <Timer className="w-4 h-4" />
                  <span>
                    {matchTimer}'
                    {['LIVE', 'SECOND_HALF'].includes(match.status) && isTimerRunning && (
                      <span className="animate-pulse"> ●</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center flex-1">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto mb-2 bg-orange-500 rounded-lg flex items-center justify-center text-3xl">
                    {getSportIcon(match.awayTeam.sport)}
                  </div>
                )}
                <p className="font-bold text-lg">{match.awayTeam.shortName || match.awayTeam.name}</p>
              </div>
            </div>

            {/* Half-time Score */}
            {(match.homeHalftimeScore !== null || match.awayHalftimeScore !== null) && (
              <div className="text-center mt-4 text-charcoal-400 text-sm">
                Half-time: {match.homeHalftimeScore ?? '-'} - {match.awayHalftimeScore ?? '-'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'scoring', 'disciplinary', 'substitution', 'gameFlow'] as EventCategory[]).map(
            (category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === category
                    ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-900'
                    : 'bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-charcoal-700'
                }`}
              >
                {category === 'all' && 'All Events'}
                {category === 'scoring' && `${sportConfig.scoring.displayLabel}`}
                {category === 'disciplinary' && 'Cards'}
                {category === 'substitution' && 'Subs'}
                {category === 'gameFlow' && 'Other'}
                {filterCategory === category && filteredEvents.length > 0 && (
                  <Badge className="ml-2 bg-white/20">{filteredEvents.length}</Badge>
                )}
              </button>
            )
          )}
        </div>

        {/* Events Timeline */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Event Timeline ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                  No events yet
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {match.status === 'SCHEDULED'
                    ? 'Events will appear here once the match starts'
                    : 'No events match the selected filter'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    homePlayers={homePlayers}
                    awayPlayers={awayPlayers}
                    homeClubId={match.homeClubId}
                    sportConfig={sportConfig}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEvent}
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
        sportConfig={sportConfig}
        currentMinute={matchTimer}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
