'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Goal,
  Heart,
  YellowCard,
  RedCard,
  Users,
  Clock,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION_ON' | 'SUBSTITUTION_OFF' | 'OWN_GOAL';
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

const EVENT_TYPES = [
  { value: 'GOAL', label: 'Goal', icon: Goal, color: 'text-green-600 dark:text-green-400' },
  { value: 'OWN_GOAL', label: 'Own Goal', icon: Heart, color: 'text-red-600 dark:text-red-400' },
  { value: 'ASSIST', label: 'Assist', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
  { value: 'YELLOW_CARD', label: 'Yellow Card', icon: YellowCard, color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'RED_CARD', label: 'Red Card', icon: RedCard, color: 'text-red-700 dark:text-red-500' },
  { value: 'SUBSTITUTION_ON', label: 'Substitution On', icon: Users, color: 'text-purple-600 dark:text-purple-400' },
  { value: 'SUBSTITUTION_OFF', label: 'Substitution Off', icon: Users, color: 'text-orange-600 dark:text-orange-400' },
];

export default function MatchEventsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;
  const matchId = params.matchId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);

  // Form state
  const [selectedEventType, setSelectedEventType] = useState('GOAL');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [minute, setMinute] = useState('45');
  const [note, setNote] = useState('');
  const [substitutedPlayer, setSubstitutedPlayer] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matchRes, playersRes, eventsRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/events`),
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
      setTeamPlayers(playersData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load match data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }

    if (!minute || parseInt(minute) < 0 || parseInt(minute) > 120) {
      toast.error('Minute must be between 0 and 120');
      return;
    }

    if (selectedEventType.includes('SUBSTITUTION') && !substitutedPlayer) {
      toast.error('Please select the player being substituted');
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
            minute: parseInt(minute),
            note: note || null,
            substitutedPlayerId: substitutedPlayer || null,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add event');

      const newEvent = await response.json();
      setEvents([...events, newEvent].sort((a, b) => a.minute - b.minute));

      // Reset form
      setSelectedPlayer('');
      setMinute('45');
      setNote('');
      setSubstitutedPlayer('');
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/matches/${matchId}/events/${eventId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(events.filter((e) => e.id !== eventId));
      toast.success('Event deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleCompleteMatch = async () => {
    // Count goals from events
    const homeGoals = events.filter((e) => e.eventType === 'GOAL').length;
    const awayGoals = events.filter((e) => e.eventType === 'OWN_GOAL').length;

    if (homeGoals === 0 && awayGoals === 0) {
      toast.error('Match must have at least one goal recorded');
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

      if (!response.ok) throw new Error('Failed to complete match');

      toast.success('Match completed successfully!');
      router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}`);
    } catch (error) {
      console.error('Error completing match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete match');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Match not found</p>
        </div>
      </div>
    );
  }

  const eventTypeConfig = EVENT_TYPES.find((et) => et.value === selectedEventType);
  const goalCount = events.filter((e) => e.eventType === 'GOAL').length;
  const ownGoalCount = events.filter((e) => e.eventType === 'OWN_GOAL').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Match Events
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track goals, cards, and substitutions
              </p>
            </div>
            <div className="text-3xl font-bold text-gold-600 dark:text-gold-400">
              {goalCount} - {ownGoalCount}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Add Event</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Record match incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-4">
                {/* Event Type */}
                <div>
                  <Label className="block text-charcoal-700 dark:text-charcoal-300 mb-2 text-sm font-semibold">
                    Event Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        type="button"
                        onClick={() => {
                          setSelectedEventType(et.value);
                          setSubstitutedPlayer('');
                        }}
                        className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedEventType === et.value
                            ? 'bg-gold-500 text-white dark:bg-gold-600'
                            : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                        }`}
                      >
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Selection */}
                <div>
                  <Label htmlFor="player" className="block text-charcoal-700 dark:text-charcoal-300 mb-2 text-sm font-semibold">
                    Player
                  </Label>
                  <select
                    id="player"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
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
                <div>
                  <Label htmlFor="minute" className="block text-charcoal-700 dark:text-charcoal-300 mb-2 text-sm font-semibold">
                    Minute
                  </Label>
                  <Input
                    id="minute"
                    type="number"
                    min="0"
                    max="120"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    placeholder="45"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                {/* Substitution Player */}
                {selectedEventType.includes('SUBSTITUTION') && (
                  <div>
                    <Label htmlFor="subPlayer" className="block text-charcoal-700 dark:text-charcoal-300 mb-2 text-sm font-semibold">
                      {selectedEventType === 'SUBSTITUTION_ON' ? 'Replacing' : 'Replaced By'}
                    </Label>
                    <select
                      id="subPlayer"
                      value={substitutedPlayer}
                      onChange={(e) => setSubstitutedPlayer(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
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
                <div>
                  <Label htmlFor="note" className="block text-charcoal-700 dark:text-charcoal-300 mb-2 text-sm font-semibold">
                    Note (Optional)
                  </Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g., Header from corner"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold disabled:opacity-50"
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
              </form>
            </CardContent>
          </Card>

          {/* Events Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {events.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                    No events yet
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    Add events as they happen during the match
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {events.map((event) => {
                  const config = EVENT_TYPES.find((et) => et.value === event.eventType);
                  const IconComponent = config?.icon || Goal;

                  return (
                    <Card
                      key={event.id}
                      className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 bg-neutral-100 dark:bg-charcoal-700 rounded-lg`}>
                              <IconComponent className={`w-6 h-6 ${config?.color || 'text-charcoal-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-charcoal-900 dark:text-white">
                                  {event.player.user.firstName} {event.player.user.lastName}
                                </p>
                                <span className="text-xs bg-neutral-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 px-2 py-1 rounded">
                                  {event.player.position}
                                  {event.player.jerseyNumber && ` #${event.player.jerseyNumber}`}
                                </span>
                              </div>
                              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">
                                {config?.label}
                              </p>
                              {event.note && (
                                <p className="text-xs text-charcoal-500 dark:text-charcoal-500 italic">
                                  {event.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-charcoal-600 dark:text-charcoal-400">
                                <Clock className="w-4 h-4" />
                                <span className="font-semibold">{event.minute}'</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}

            {/* Complete Match Button */}
            <div className="flex gap-4 pt-4">
              <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleCompleteMatch}
                disabled={isSubmitting || events.length === 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white font-bold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Match
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
