'use client';

/**
 * PitchConnect Match Events Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/events/page.tsx
 *
 * Features:
 * ✅ Record match events (goals, assists, cards, substitutions)
 * ✅ Track event timeline with minute stamps
 * ✅ Live score calculation
 * ✅ Support for goals, own goals, assists, cards, substitutions
 * ✅ Custom card icons (yellow/red)
 * ✅ Player selection with jersey numbers
 * ✅ Substitution tracking (on/off)
 * ✅ Event notes and descriptions
 * ✅ Delete events with confirmation
 * ✅ Complete match and record final score
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Responsive grid layout
 * ✅ Loading and empty states
 * ✅ Dark mode support
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Goal,
  Heart,
  AlertTriangle,
  Users,
  Clock,
  Check,
  X,
  Trash2,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  position: string;
  jerseyNumber?: number;
}

interface MatchEvent {
  id: string;
  eventType:
    | 'GOAL'
    | 'ASSIST'
    | 'YELLOW_CARD'
    | 'RED_CARD'
    | 'SUBSTITUTION_ON'
    | 'SUBSTITUTION_OFF'
    | 'OWN_GOAL';
  minute: number;
  player: Player;
  note?: string;
  substitutedPlayerId?: string;
}

interface Match {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore?: number;
  awayScore?: number;
  status: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// CUSTOM CARD ICON COMPONENTS
// ============================================================================

const YellowCardIcon = ({ className = 'w-6 h-6' }) => (
  <div
    className={`${className} rounded-sm border-2 border-yellow-500 bg-yellow-400`}
  />
);

const RedCardIcon = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} rounded-sm border-2 border-red-600 bg-red-500`} />
);

// ============================================================================
// EVENT TYPES CONFIGURATION
// ============================================================================

const EVENT_TYPES = [
  { value: 'GOAL', label: 'Goal', icon: Goal, color: 'text-green-600 dark:text-green-400' },
  {
    value: 'OWN_GOAL',
    label: 'Own Goal',
    icon: Heart,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    value: 'ASSIST',
    label: 'Assist',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'YELLOW_CARD',
    label: 'Yellow Card',
    icon: YellowCardIcon,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    value: 'RED_CARD',
    label: 'Red Card',
    icon: RedCardIcon,
    color: 'text-red-700 dark:text-red-500',
  },
  {
    value: 'SUBSTITUTION_ON',
    label: 'Sub On',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'SUBSTITUTION_OFF',
    label: 'Sub Off',
    icon: Users,
    color: 'text-orange-600 dark:text-orange-400',
  },
];

// ============================================================================
// TOAST COMPONENT
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

const EventCard = ({
  event,
  config,
  onDelete,
  isDeleting,
}: {
  event: MatchEvent;
  config: (typeof EVENT_TYPES)[0] | undefined;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const IconComponent = config?.icon || Goal;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-neutral-100 p-3 dark:bg-charcoal-700">
            <IconComponent
              className={`h-6 w-6 ${config?.color || 'text-charcoal-600'}`}
            />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <p className="font-bold text-charcoal-900 dark:text-white">
                {event.player.user.firstName} {event.player.user.lastName}
              </p>
              <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400">
                {event.player.position}
                {event.player.jerseyNumber && ` #${event.player.jerseyNumber}`}
              </span>
            </div>
            <p className="mb-2 text-sm text-charcoal-600 dark:text-charcoal-400">
              {config?.label}
            </p>
            {event.note && (
              <p className="text-xs italic text-charcoal-500 dark:text-charcoal-500">
                {event.note}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-charcoal-600 dark:text-charcoal-400">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">{event.minute}'</span>
          </div>
          <button
            onClick={() => onDelete(event.id)}
            disabled={isDeleting}
            className="rounded bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MatchEventsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;
  const matchId = params.matchId as string;

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form state
  const [selectedEventType, setSelectedEventType] = useState('GOAL');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [minute, setMinute] = useState('45');
  const [note, setNote] = useState('');
  const [substitutedPlayer, setSubstitutedPlayer] = useState('');

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchData();
  }, [clubId, teamId, matchId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matchRes, playersRes, eventsRes] = await Promise.all([
        fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}`
        ),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
        fetch(
          `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/events`
        ),
      ]);

      if (!matchRes.ok) throw new Error('Failed to fetch match');
      if (!playersRes.ok) throw new Error('Failed to fetch players');
      if (!eventsRes.ok) throw new Error('Failed to fetch events');

      const [matchData, playersData, eventsData] = await Promise.all([
        matchRes.json(),
        playersRes.json(),
        eventsRes.json(),
      ]);

      setMatch(matchData);
      setTeamPlayers(playersData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load match data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer) {
      showToast('Please select a player', 'error');
      return;
    }

    const minuteNum = parseInt(minute);
    if (!minute || minuteNum < 0 || minuteNum > 120) {
      showToast('Minute must be between 0 and 120', 'error');
      return;
    }

    if (selectedEventType.includes('SUBSTITUTION') && !substitutedPlayer) {
      showToast('Please select the substituted player', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: selectedEventType,
            playerId: selectedPlayer,
            minute: minuteNum,
            note: note || null,
            substitutedPlayerId: substitutedPlayer || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add event');
      }

      const newEvent = await response.json();
      setEvents([...events, newEvent].sort((a, b) => a.minute - b.minute));

      // Reset form
      setSelectedPlayer('');
      setMinute('45');
      setNote('');
      setSubstitutedPlayer('');
      showToast('Event added successfully!', 'success');
    } catch (error) {
      console.error('Error adding event:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to add event',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsDeletingId(eventId);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/events/${eventId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(events.filter((e) => e.id !== eventId));
      showToast('Event deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCompleteMatch = async () => {
    // Count goals from events
    const homeGoals = events.filter((e) => e.eventType === 'GOAL').length;
    const awayGoals = events.filter((e) => e.eventType === 'OWN_GOAL').length;

    if (homeGoals === 0 && awayGoals === 0) {
      showToast('Match must have at least one goal recorded', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeScore: homeGoals,
            awayScore: awayGoals,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete match');
      }

      showToast('Match completed successfully!', 'success');

      setTimeout(() => {
        router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}`);
      }, 1000);
    } catch (error) {
      console.error('Error completing match:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to complete match',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // COMPUTED STATE
  // ========================================================================

  const goalCount = events.filter((e) => e.eventType === 'GOAL').length;
  const ownGoalCount = events.filter((e) => e.eventType === 'OWN_GOAL').length;
  const eventTypeConfig = EVENT_TYPES.find(
    (et) => et.value === selectedEventType
  );

  // ========================================================================
  // RENDER - LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading match events...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - NOT FOUND STATE
  // ========================================================================

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Match not found
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - MAIN PAGE
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-gold-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="mb-1 text-3xl font-bold text-charcoal-900 dark:text-white">
                Match Events
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track goals, cards, and substitutions
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-charcoal-800">
              <p className="text-xs uppercase tracking-widest text-charcoal-600 dark:text-charcoal-400">
                Live Score
              </p>
              <p className="text-4xl font-bold text-gold-600 dark:text-gold-400">
                {goalCount} - {ownGoalCount}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ADD EVENT FORM */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 lg:col-span-1 h-fit">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-gold-500" />
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Add Event
              </h2>
            </div>
            <p className="mb-6 text-sm text-charcoal-600 dark:text-charcoal-400">
              Record match incidents
            </p>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Event Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.value}
                      type="button"
                      onClick={() => {
                        setSelectedEventType(et.value);
                        setSubstitutedPlayer('');
                      }}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        selectedEventType === et.value
                          ? 'bg-gold-500 text-white dark:bg-gold-600'
                          : 'bg-neutral-100 text-charcoal-900 hover:bg-neutral-200 dark:bg-charcoal-700 dark:text-white dark:hover:bg-charcoal-600'
                      }`}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Player <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                >
                  <option value="">Select player...</option>
                  {teamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user.firstName} {p.user.lastName}
                      {p.jerseyNumber && ` (#${p.jerseyNumber})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Minute <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="45"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                />
              </div>

              {/* Substitution Player */}
              {selectedEventType.includes('SUBSTITUTION') && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                    {selectedEventType === 'SUBSTITUTION_ON'
                      ? 'Replacing'
                      : 'Replaced By'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={substitutedPlayer}
                    onChange={(e) => setSubstitutedPlayer(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                  >
                    <option value="">Select player...</option>
                    {teamPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user.firstName} {p.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Note (Optional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Header from corner"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-bold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 inline h-4 w-4" />
                    Add Event
                  </>
                )}
              </button>
            </form>
          </div>

          {/* EVENTS TIMELINE */}
          <div className="space-y-4 lg:col-span-2">
            {/* EMPTY STATE */}
            {events.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-white text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <div className="px-6 py-16">
                  <AlertCircle className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                  <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                    No events yet
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    Add events as they happen during the match
                  </p>
                </div>
              </div>
            ) : (
              <>
                {events.map((event) => {
                  const config = EVENT_TYPES.find((et) => et.value === event.eventType);
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      config={config}
                      onDelete={handleDeleteEvent}
                      isDeleting={isDeletingId === event.id}
                    />
                  );
                })}
              </>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 border-t border-neutral-200 pt-4 dark:border-charcoal-700">
              <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`} className="flex-1">
                <button className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                  Cancel
                </button>
              </Link>
              <button
                onClick={handleCompleteMatch}
                disabled={isSubmitting || events.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 px-4 py-2 font-bold text-white transition-all hover:from-green-600 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
