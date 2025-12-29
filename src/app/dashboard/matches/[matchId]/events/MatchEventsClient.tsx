'use client';

// ============================================================================
// ⚽ PITCHCONNECT - MATCH EVENTS CLIENT COMPONENT
// ============================================================================
// Real-time event tracking with sport-specific event types and scoring
// ============================================================================

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Clock,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  AlertTriangle,
  Target,
  Users,
  Activity,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Sport, MatchEventType, MatchStatus } from '@prisma/client';
import {
  getSportConfig,
  SPORT_EVENT_TYPES,
  SPORT_SCORING_EVENTS,
  getEventTypeLabel,
  getEventTypeIcon,
} from '@/lib/sport-config';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface MatchEventsClientProps {
  match: MatchWithRelations;
  teamPlayers: TeamPlayerWithRelations[];
  permissions: {
    canManageEvents: boolean;
    userRole: string;
  };
  sport: Sport;
  currentTeamId: string;
}

interface MatchWithRelations {
  id: string;
  status: MatchStatus;
  scheduledAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  homeTeam: {
    id: string;
    name: string;
    club: { id: string; name: string; sport: Sport };
  };
  awayTeam: {
    id: string;
    name: string;
    club: { id: string; name: string; sport: Sport };
  };
  competition: { id: string; name: string } | null;
  venue: { id: string; name: string } | null;
  events: MatchEventWithRelations[];
  lineups: any[];
  currentScore: { home: number; away: number };
}

interface MatchEventWithRelations {
  id: string;
  eventType: MatchEventType;
  minute: number;
  addedTime: number | null;
  teamId: string | null;
  player: {
    id: string;
    user: { firstName: string; lastName: string };
  } | null;
  assistPlayer: {
    id: string;
    user: { firstName: string; lastName: string };
  } | null;
  description: string | null;
  metadata: any;
  createdAt: Date;
}

interface TeamPlayerWithRelations {
  id: string;
  jerseyNumber: number | null;
  position: string | null;
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
}

// ============================================================================
// EVENT TYPE CATEGORIES
// ============================================================================

const EVENT_CATEGORIES = {
  scoring: ['GOAL', 'TRY', 'TOUCHDOWN', 'CONVERSION', 'PENALTY_GOAL', 'DROP_GOAL', 'FIELD_GOAL', 'THREE_POINTER', 'PENALTY_SCORED', 'OWN_GOAL'],
  disciplinary: ['YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD', 'MAJOR_PENALTY', 'MINOR_PENALTY'],
  substitution: ['SUBSTITUTION_ON', 'SUBSTITUTION_OFF'],
  gameFlow: ['KICKOFF', 'HALFTIME', 'FULLTIME', 'INJURY_TIME', 'TIMEOUT', 'PERIOD_START', 'PERIOD_END'],
  var: ['VAR_REVIEW', 'VAR_DECISION'],
  other: ['INJURY', 'ASSIST', 'PENALTY_MISSED', 'PENALTY_SAVED'],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MatchEventsClient({
  match,
  teamPlayers,
  permissions,
  sport,
  currentTeamId,
}: MatchEventsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sportConfig = getSportConfig(sport);

  // State
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MatchEventWithRelations | null>(null);
  const [matchTimer, setMatchTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');

  // Get available event types for this sport
  const availableEventTypes = useMemo(() => {
    return SPORT_EVENT_TYPES[sport] || [];
  }, [sport]);

  // Categorize events by type
  const categorizedEvents = useMemo(() => {
    return {
      scoring: match.events.filter(e => EVENT_CATEGORIES.scoring.includes(e.eventType)),
      disciplinary: match.events.filter(e => EVENT_CATEGORIES.disciplinary.includes(e.eventType)),
      substitutions: match.events.filter(e => EVENT_CATEGORIES.substitution.includes(e.eventType)),
      gameFlow: match.events.filter(e => EVENT_CATEGORIES.gameFlow.includes(e.eventType)),
    };
  }, [match.events]);

  // Match timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && match.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        setMatchTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, match.status]);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current match minute from timer
  const currentMinute = Math.floor(matchTimer / 60);

  // Determine if it's our team's event
  const isOurTeam = (teamId: string | null) => teamId === currentTeamId;

  return (
    <div className="space-y-6">
      {/* Match Header with Score */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Match
          </button>

          {/* Match Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                match.status === 'IN_PROGRESS'
                  ? 'bg-green-500/20 text-green-300'
                  : match.status === 'COMPLETED'
                  ? 'bg-white/20 text-white'
                  : 'bg-yellow-500/20 text-yellow-300'
              }`}
            >
              {match.status === 'IN_PROGRESS' ? '● LIVE' : match.status}
            </span>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-8">
          {/* Home Team */}
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold truncate">{match.homeTeam.name}</h2>
            <p className="text-sm text-white/70">Home</p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{match.currentScore.home}</span>
            <span className="text-3xl text-white/50">-</span>
            <span className="text-5xl font-bold">{match.currentScore.away}</span>
          </div>

          {/* Away Team */}
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold truncate">{match.awayTeam.name}</h2>
            <p className="text-sm text-white/70">Away</p>
          </div>
        </div>

        {/* Match Timer & Controls */}
        {match.status === 'IN_PROGRESS' && permissions.canManageEvents && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-mono">{formatTimer(matchTimer)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {isTimerRunning ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setMatchTimer(0)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/70">
          {match.competition && (
            <span>{match.competition.name}</span>
          )}
          {match.venue && (
            <span>📍 {match.venue.name}</span>
          )}
          <span>{format(new Date(match.scheduledAt), 'PPP')}</span>
        </div>
      </div>

      {/* Add Event Button */}
      {permissions.canManageEvents && match.status === 'IN_PROGRESS' && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Event ({currentMinute}')
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Match Stats
        </button>
      </div>

      {/* Content */}
      {activeTab === 'timeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {match.events.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No events recorded yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {match.status === 'IN_PROGRESS'
                    ? 'Start adding events to track the match'
                    : 'Events will appear here once the match starts'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {match.events
                  .sort((a, b) => b.minute - a.minute)
                  .map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      sport={sport}
                      isHomeTeam={event.teamId === match.homeTeam.id}
                      homeTeamName={match.homeTeam.name}
                      awayTeamName={match.awayTeam.name}
                      canEdit={permissions.canManageEvents}
                      onEdit={() => {
                        setSelectedEvent(event);
                        setShowAddEventModal(true);
                      }}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            {/* Scoring Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Scoring Summary
              </h3>
              <div className="space-y-3">
                {categorizedEvents.scoring.length === 0 ? (
                  <p className="text-sm text-gray-500">No scoring events yet</p>
                ) : (
                  categorizedEvents.scoring.map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getEventTypeIcon(event.eventType)}</span>
                        <span className="text-gray-900 dark:text-white">
                          {event.player?.user.lastName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-gray-500">{event.minute}'</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Disciplinary Summary */}
            {categorizedEvents.disciplinary.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Cards & Penalties
                </h3>
                <div className="space-y-3">
                  {categorizedEvents.disciplinary.map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getEventTypeIcon(event.eventType)}</span>
                        <span className="text-gray-900 dark:text-white">
                          {event.player?.user.lastName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-gray-500">{event.minute}'</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Substitutions */}
            {categorizedEvents.substitutions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Substitutions
                </h3>
                <div className="space-y-3">
                  {categorizedEvents.substitutions
                    .filter(e => e.eventType === 'SUBSTITUTION_ON')
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">↑</span>
                          <span className="text-gray-900 dark:text-white">
                            {event.player?.user.lastName || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-gray-500">{event.minute}'</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sport-specific Event Types */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                {sportConfig.name} Event Types
              </h4>
              <div className="flex flex-wrap gap-1">
                {availableEventTypes.slice(0, 10).map((eventType) => (
                  <span
                    key={eventType}
                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {getEventTypeLabel(eventType, sport)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <MatchStatsView
          match={match}
          events={match.events}
          sport={sport}
        />
      )}

      {/* Add/Edit Event Modal */}
      {showAddEventModal && (
        <AddEventModal
          match={match}
          teamPlayers={teamPlayers}
          sport={sport}
          currentMinute={currentMinute}
          availableEventTypes={availableEventTypes}
          currentTeamId={currentTeamId}
          editingEvent={selectedEvent}
          onClose={() => {
            setShowAddEventModal(false);
            setSelectedEvent(null);
          }}
          onSubmit={() => {
            setShowAddEventModal(false);
            setSelectedEvent(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

function EventCard({
  event,
  sport,
  isHomeTeam,
  homeTeamName,
  awayTeamName,
  canEdit,
  onEdit,
}: {
  event: MatchEventWithRelations;
  sport: Sport;
  isHomeTeam: boolean;
  homeTeamName: string;
  awayTeamName: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const eventIcon = getEventTypeIcon(event.eventType);
  const eventLabel = getEventTypeLabel(event.eventType, sport);

  const isScoring = EVENT_CATEGORIES.scoring.includes(event.eventType);
  const isDisciplinary = EVENT_CATEGORIES.disciplinary.includes(event.eventType);
  const isGameFlow = EVENT_CATEGORIES.gameFlow.includes(event.eventType);

  // Determine background color based on event type
  const getBgColor = () => {
    if (isScoring) return isHomeTeam
      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
      : 'bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500';
    if (isDisciplinary) return isHomeTeam
      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
      : 'bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-500';
    if (isGameFlow) return 'bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-400';
    return 'bg-white dark:bg-gray-800';
  };

  return (
    <div className={`rounded-lg shadow p-4 ${getBgColor()}`}>
      <div className={`flex items-start gap-4 ${!isHomeTeam && !isGameFlow ? 'flex-row-reverse text-right' : ''}`}>
        {/* Minute */}
        <div className="flex-shrink-0 w-12 text-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {event.minute}'
          </span>
          {event.addedTime && event.addedTime > 0 && (
            <span className="text-xs text-gray-500">+{event.addedTime}</span>
          )}
        </div>

        {/* Event Icon */}
        <div className="flex-shrink-0 text-2xl">
          {eventIcon}
        </div>

        {/* Event Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {eventLabel}
            </span>
            {!isGameFlow && (
              <span className="text-sm text-gray-500">
                ({isHomeTeam ? homeTeamName : awayTeamName})
              </span>
            )}
          </div>

          {event.player && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {event.player.user.firstName} {event.player.user.lastName}
              {event.assistPlayer && (
                <span className="text-gray-500">
                  {' '}(assist: {event.assistPlayer.user.firstName} {event.assistPlayer.user.lastName})
                </span>
              )}
            </p>
          )}

          {event.description && (
            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
          )}
        </div>

        {/* Edit Button */}
        {canEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MATCH STATS VIEW
// ============================================================================

function MatchStatsView({
  match,
  events,
  sport,
}: {
  match: MatchWithRelations;
  events: MatchEventWithRelations[];
  sport: Sport;
}) {
  // Calculate stats from events
  const stats = useMemo(() => {
    const homeStats: Record<string, number> = {};
    const awayStats: Record<string, number> = {};

    events.forEach((event) => {
      const isHome = event.teamId === match.homeTeam.id;
      const target = isHome ? homeStats : awayStats;
      target[event.eventType] = (target[event.eventType] || 0) + 1;
    });

    return { home: homeStats, away: awayStats };
  }, [events, match.homeTeam.id]);

  // Define stat rows to display
  const statRows = [
    { key: 'GOAL', label: 'Goals' },
    { key: 'ASSIST', label: 'Assists' },
    { key: 'YELLOW_CARD', label: 'Yellow Cards' },
    { key: 'RED_CARD', label: 'Red Cards' },
    { key: 'SUBSTITUTION_ON', label: 'Substitutions' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">Match Statistics</h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {statRows.map(({ key, label }) => {
          const homeValue = stats.home[key] || 0;
          const awayValue = stats.away[key] || 0;
          const total = homeValue + awayValue || 1;
          const homePercent = (homeValue / total) * 100;

          return (
            <div key={key} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {homeValue}
                </span>
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {awayValue}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${homePercent}%` }}
                />
                <div
                  className="h-full bg-gray-400 transition-all"
                  style={{ width: `${100 - homePercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ADD EVENT MODAL
// ============================================================================

function AddEventModal({
  match,
  teamPlayers,
  sport,
  currentMinute,
  availableEventTypes,
  currentTeamId,
  editingEvent,
  onClose,
  onSubmit,
}: {
  match: MatchWithRelations;
  teamPlayers: TeamPlayerWithRelations[];
  sport: Sport;
  currentMinute: number;
  availableEventTypes: MatchEventType[];
  currentTeamId: string;
  editingEvent: MatchEventWithRelations | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState({
    eventType: editingEvent?.eventType || ('' as MatchEventType),
    minute: editingEvent?.minute || currentMinute,
    addedTime: editingEvent?.addedTime || 0,
    teamId: editingEvent?.teamId || currentTeamId,
    playerId: editingEvent?.player?.id || '',
    assistPlayerId: editingEvent?.assistPlayer?.id || '',
    description: editingEvent?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group events by category
  const eventsByCategory = useMemo(() => {
    const categories: Record<string, MatchEventType[]> = {
      Scoring: [],
      Disciplinary: [],
      Substitution: [],
      'Game Flow': [],
      Other: [],
    };

    availableEventTypes.forEach((eventType) => {
      if (EVENT_CATEGORIES.scoring.includes(eventType)) {
        categories.Scoring.push(eventType);
      } else if (EVENT_CATEGORIES.disciplinary.includes(eventType)) {
        categories.Disciplinary.push(eventType);
      } else if (EVENT_CATEGORIES.substitution.includes(eventType)) {
        categories.Substitution.push(eventType);
      } else if (EVENT_CATEGORIES.gameFlow.includes(eventType)) {
        categories['Game Flow'].push(eventType);
      } else {
        categories.Other.push(eventType);
      }
    });

    return categories;
  }, [availableEventTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingEvent
        ? `/api/matches/${match.id}/events/${editingEvent.id}`
        : `/api/matches/${match.id}/events`;

      const response = await fetch(url, {
        method: editingEvent ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if event type needs a player
  const needsPlayer = !EVENT_CATEGORIES.gameFlow.includes(formData.eventType);
  const needsAssist = EVENT_CATEGORIES.scoring.includes(formData.eventType);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingEvent ? 'Edit Event' : 'Add Match Event'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Event Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type *
              </label>
              <div className="space-y-2">
                {Object.entries(eventsByCategory).map(([category, events]) => {
                  if (events.length === 0) return null;
                  return (
                    <div key={category}>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(
                          selectedCategory === category ? null : category
                        )}
                        className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        {category}
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            selectedCategory === category ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {selectedCategory === category && (
                        <div className="grid grid-cols-2 gap-2 mt-2 p-2">
                          {events.map((eventType) => (
                            <button
                              key={eventType}
                              type="button"
                              onClick={() => setFormData({ ...formData, eventType })}
                              className={`flex items-center gap-2 p-2 text-sm rounded-lg border transition-colors ${
                                formData.eventType === eventType
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span>{getEventTypeIcon(eventType)}</span>
                              <span className="truncate">{getEventTypeLabel(eventType, sport)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {formData.eventType && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <span>{getEventTypeIcon(formData.eventType)}</span>
                  <span className="font-medium text-primary-700 dark:text-primary-300">
                    {getEventTypeLabel(formData.eventType, sport)}
                  </span>
                </div>
              )}
            </div>

            {/* Minute */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minute *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={120}
                  value={formData.minute}
                  onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Added Time
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={formData.addedTime}
                  onChange={(e) => setFormData({ ...formData, addedTime: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Team Selection */}
            {!EVENT_CATEGORIES.gameFlow.includes(formData.eventType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, teamId: match.homeTeam.id })}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.teamId === match.homeTeam.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {match.homeTeam.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, teamId: match.awayTeam.id })}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.teamId === match.awayTeam.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {match.awayTeam.name}
                  </button>
                </div>
              </div>
            )}

            {/* Player Selection */}
            {needsPlayer && formData.teamId === currentTeamId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player
                </label>
                <select
                  value={formData.playerId}
                  onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select player...</option>
                  {teamPlayers.map((tp) => (
                    <option key={tp.id} value={tp.player.id}>
                      #{tp.jerseyNumber || '—'} {tp.player.user.firstName} {tp.player.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assist Player (for scoring events) */}
            {needsAssist && formData.teamId === currentTeamId && formData.playerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assist By
                </label>
                <select
                  value={formData.assistPlayerId}
                  onChange={(e) => setFormData({ ...formData, assistPlayerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No assist</option>
                  {teamPlayers
                    .filter((tp) => tp.player.id !== formData.playerId)
                    .map((tp) => (
                      <option key={tp.id} value={tp.player.id}>
                        #{tp.jerseyNumber || '—'} {tp.player.user.firstName} {tp.player.user.lastName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="Additional details about the event..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.eventType}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}