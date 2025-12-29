// ============================================================================
// 📝 MATCH EVENTS PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId]/events - Record and manage match events
// ============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  Activity,
  Shield,
  Clock,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  Check,
  Loader2,
  Target,
  Zap,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useRealTimeMatch } from '@/hooks/useRealTimeMatch';
import {
  getSportConfig,
  getSportEventTypes,
  getEventIcon,
  getEventLabel,
  EVENT_TYPE_CONFIG,
  getPositionDisplay,
} from '@/lib/config/sports';
import { MATCH_STATUS_CONFIG, LIVE_STATUSES } from '@/types/match';
import type { MatchEventType, Sport, Position } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface EventFormData {
  eventType: MatchEventType;
  minute: number;
  secondaryMinute: number | null;
  period: string;
  teamSide: 'home' | 'away';
  playerId: string | null;
  assistPlayerId: string | null;
  relatedPlayerId: string | null;
  goalType: string | null;
  cardReason: string | null;
  details: string;
}

interface Player {
  id: string;
  jerseyNumber: number | null;
  position: Position | null;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Squad {
  playerId: string;
  player: Player;
  teamId: string;
  status: string;
  shirtNumber: number | null;
}

// ============================================================================
// EVENT QUICK BUTTONS
// ============================================================================

function EventQuickButton({
  eventType,
  onClick,
  teamSide,
}: {
  eventType: MatchEventType;
  onClick: () => void;
  teamSide: 'home' | 'away';
}) {
  const config = EVENT_TYPE_CONFIG[eventType];
  if (!config) return null;

  return (
    <Button
      variant="outline"
      className={`h-auto py-3 px-4 flex flex-col items-center gap-1 ${
        teamSide === 'home'
          ? 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30'
          : 'hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30'
      }`}
      onClick={onClick}
    >
      <span className="text-2xl">{config.icon}</span>
      <span className="text-xs font-medium">{config.shortLabel}</span>
    </Button>
  );
}

// ============================================================================
// EVENT FORM
// ============================================================================

interface EventFormProps {
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  homeSquad: Squad[];
  awaySquad: Squad[];
  sport: Sport;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
  homeTeamName: string;
  awayTeamName: string;
}

function EventForm({
  formData,
  setFormData,
  homeSquad,
  awaySquad,
  sport,
  isSubmitting,
  onSubmit,
  onCancel,
  mode,
  homeTeamName,
  awayTeamName,
}: EventFormProps) {
  const eventTypes = getSportEventTypes(sport);
  const eventConfig = EVENT_TYPE_CONFIG[formData.eventType];
  const currentSquad = formData.teamSide === 'home' ? homeSquad : awaySquad;

  const handleChange = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant={formData.teamSide === 'home' ? 'default' : 'outline'}
          className={formData.teamSide === 'home' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          onClick={() => handleChange('teamSide', 'home')}
        >
          <Shield className="mr-2 h-4 w-4" />
          {homeTeamName}
        </Button>
        <Button
          type="button"
          variant={formData.teamSide === 'away' ? 'default' : 'outline'}
          className={formData.teamSide === 'away' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          onClick={() => handleChange('teamSide', 'away')}
        >
          <Shield className="mr-2 h-4 w-4" />
          {awayTeamName}
        </Button>
      </div>

      {/* Event Type */}
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select
          value={formData.eventType}
          onValueChange={(value) => handleChange('eventType', value as MatchEventType)}
        >
          <SelectTrigger>
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{getEventIcon(formData.eventType)}</span>
                <span>{getEventLabel(formData.eventType)}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <span>{getEventIcon(type)}</span>
                  <span>{getEventLabel(type)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Minute & Period */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minute">Minute</Label>
          <Input
            id="minute"
            type="number"
            min={0}
            max={120}
            value={formData.minute}
            onChange={(e) => handleChange('minute', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period">Period</Label>
          <Select
            value={formData.period}
            onValueChange={(value) => handleChange('period', value)}
          >
            <SelectTrigger id="period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1H">1st Half</SelectItem>
              <SelectItem value="2H">2nd Half</SelectItem>
              <SelectItem value="ET1">Extra Time 1st</SelectItem>
              <SelectItem value="ET2">Extra Time 2nd</SelectItem>
              <SelectItem value="PEN">Penalties</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Player Selection */}
      {eventConfig?.requiresPlayer && (
        <div className="space-y-2">
          <Label>Player</Label>
          <Select
            value={formData.playerId || ''}
            onValueChange={(value) => handleChange('playerId', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {currentSquad.map((squad) => (
                <SelectItem key={squad.playerId} value={squad.playerId}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono w-6 text-center">
                      {squad.shirtNumber || '-'}
                    </span>
                    <span>
                      {squad.player.user.firstName} {squad.player.user.lastName}
                    </span>
                    {squad.player.position && (
                      <Badge variant="outline" className="text-xs">
                        {getPositionDisplay(squad.player.position)}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Assist Player (for goals) */}
      {eventConfig?.requiresAssist && (
        <div className="space-y-2">
          <Label>Assist (optional)</Label>
          <Select
            value={formData.assistPlayerId || ''}
            onValueChange={(value) => handleChange('assistPlayerId', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assist player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No assist</SelectItem>
              {currentSquad
                .filter((s) => s.playerId !== formData.playerId)
                .map((squad) => (
                  <SelectItem key={squad.playerId} value={squad.playerId}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono w-6 text-center">
                        {squad.shirtNumber || '-'}
                      </span>
                      <span>
                        {squad.player.user.firstName} {squad.player.user.lastName}
                      </span>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Related Player (for substitutions) */}
      {eventConfig?.requiresRelatedPlayer && (
        <div className="space-y-2">
          <Label>
            {eventConfig.isSubstitution ? 'Replaced Player' : 'Related Player'}
          </Label>
          <Select
            value={formData.relatedPlayerId || ''}
            onValueChange={(value) => handleChange('relatedPlayerId', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {currentSquad
                .filter((s) => s.playerId !== formData.playerId)
                .map((squad) => (
                  <SelectItem key={squad.playerId} value={squad.playerId}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono w-6 text-center">
                        {squad.shirtNumber || '-'}
                      </span>
                      <span>
                        {squad.player.user.firstName} {squad.player.user.lastName}
                      </span>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Goal Type (for goals) */}
      {formData.eventType === 'GOAL' && (
        <div className="space-y-2">
          <Label>Goal Type</Label>
          <Select
            value={formData.goalType || ''}
            onValueChange={(value) => handleChange('goalType', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select goal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Open Play</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="free_kick">Free Kick</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
              <SelectItem value="volley">Volley</SelectItem>
              <SelectItem value="long_range">Long Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Card Reason (for cards) */}
      {eventConfig?.isCard && (
        <div className="space-y-2">
          <Label>Reason</Label>
          <Input
            value={formData.cardReason || ''}
            onChange={(e) => handleChange('cardReason', e.target.value || null)}
            placeholder="e.g., Unsporting behavior, Dangerous tackle"
          />
        </div>
      )}

      {/* Additional Details */}
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={formData.details}
          onChange={(e) => handleChange('details', e.target.value)}
          placeholder="Additional details about the event..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Add Event' : 'Update Event'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MatchEventsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initialFormData: EventFormData = {
    eventType: 'GOAL',
    minute: 1,
    secondaryMinute: null,
    period: '1H',
    teamSide: 'home',
    playerId: null,
    assistPlayerId: null,
    relatedPlayerId: null,
    goalType: null,
    cardReason: null,
    details: '',
  };

  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  // Fetch match data
  const {
    match,
    events,
    isLive,
    currentMinute,
    refresh,
    addEvent,
    isLoading,
    error: fetchError,
  } = useRealTimeMatch({
    matchId,
    enabled: true,
    pollingInterval: 30000,
  });

  // Get squads from match
  const homeSquad: Squad[] = match?.squads?.filter((s) => s.teamId === match.homeTeamId) || [];
  const awaySquad: Squad[] = match?.squads?.filter((s) => s.teamId === match.awayTeamId) || [];
  const sport = match?.homeClub?.sport || 'FOOTBALL';
  const sportConfig = getSportConfig(sport);
  const eventTypes = getSportEventTypes(sport);

  // Common event types for quick buttons
  const quickEvents: MatchEventType[] = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION_ON'];

  // Open dialog for new event
  const handleNewEvent = useCallback((teamSide: 'home' | 'away', eventType?: MatchEventType) => {
    setFormData({
      ...initialFormData,
      teamSide,
      eventType: eventType || 'GOAL',
      minute: isLive ? currentMinute : 1,
    });
    setSelectedEventId(null);
    setIsDialogOpen(true);
  }, [isLive, currentMinute]);

  // Open dialog for edit
  const handleEditEvent = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    setFormData({
      eventType: event.eventType,
      minute: event.minute,
      secondaryMinute: event.secondaryMinute,
      period: event.period || '1H',
      teamSide: event.teamSide || 'home',
      playerId: event.playerId,
      assistPlayerId: event.assistPlayerId,
      relatedPlayerId: event.relatedPlayerId,
      goalType: event.goalType,
      cardReason: event.cardReason,
      details: JSON.stringify(event.details) || '',
    });
    setSelectedEventId(eventId);
    setIsDialogOpen(true);
  }, [events]);

  // Submit event
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = selectedEventId
        ? `/api/matches/${matchId}/events/${selectedEventId}`
        : `/api/matches/${matchId}/events`;

      const response = await fetch(url, {
        method: selectedEventId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save event');
      }

      const data = await response.json();

      if (!selectedEventId) {
        addEvent(data.event);
      }

      setSuccess(selectedEventId ? 'Event updated' : 'Event added');
      setIsDialogOpen(false);
      refresh();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!selectedEventId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${selectedEventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setSuccess('Event deleted');
      setIsDeleteDialogOpen(false);
      refresh();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !match) {
    return (
      <main className="container py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="container py-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Match Not Found</h2>
          <Button asChild>
            <Link href="/dashboard/matches">Back to Matches</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/matches/${matchId}`} className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Match
          </Link>
        </Button>

        {isLive && (
          <Badge variant="destructive" className="animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white mr-2" />
            LIVE - {currentMinute}'
          </Badge>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Match Events</h1>
        <p className="text-muted-foreground">
          Record and manage events for this match
        </p>
      </div>

      {/* Quick Event Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add Event
          </CardTitle>
          <CardDescription>
            Click to quickly add common events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Home Team */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {match.homeClub?.shortName || match.homeClub?.name}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quickEvents.map((eventType) => (
                  <EventQuickButton
                    key={`home-${eventType}`}
                    eventType={eventType}
                    teamSide="home"
                    onClick={() => handleNewEvent('home', eventType)}
                  />
                ))}
              </div>
            </div>

            {/* Away Team */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-medium">
                  {match.awayClub?.shortName || match.awayClub?.name}
                </span>
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quickEvents.map((eventType) => (
                  <EventQuickButton
                    key={`away-${eventType}`}
                    eventType={eventType}
                    teamSide="away"
                    onClick={() => handleNewEvent('away', eventType)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <Button onClick={() => handleNewEvent('home')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Event Timeline
            <Badge variant="outline" className="ml-auto">
              {events.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events recorded yet</p>
              <p className="text-sm">Click the buttons above to add events</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {events.map((event) => {
                  const isHome = event.teamSide === 'home';
                  
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                        isHome ? 'border-l-4 border-l-blue-500' : 'border-r-4 border-r-orange-500'
                      }`}
                    >
                      <Badge variant="outline" className="font-mono min-w-[50px] justify-center">
                        {event.minute}'
                      </Badge>
                      
                      <span className="text-2xl" aria-hidden="true">
                        {getEventIcon(event.eventType)}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {getEventLabel(event.eventType)}
                        </p>
                        {event.player && (
                          <p className="text-sm text-muted-foreground truncate">
                            {event.player.user?.firstName} {event.player.user?.lastName}
                            {event.assistPlayer && (
                              <span className="ml-1">
                                (assist: {event.assistPlayer.user?.firstName?.charAt(0)}.{' '}
                                {event.assistPlayer.user?.lastName})
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      <Badge variant={isHome ? 'default' : 'secondary'} className="text-xs">
                        {isHome
                          ? match.homeClub?.shortName || 'Home'
                          : match.awayClub?.shortName || 'Away'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditEvent(event.id)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Event Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEventId ? 'Edit Event' : 'Add Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEventId
                ? 'Update the event details below'
                : 'Record a new match event'}
            </DialogDescription>
          </DialogHeader>

          <EventForm
            formData={formData}
            setFormData={setFormData}
            homeSquad={homeSquad}
            awaySquad={awaySquad}
            sport={sport}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            mode={selectedEventId ? 'edit' : 'create'}
            homeTeamName={match.homeClub?.shortName || match.homeClub?.name || 'Home'}
            awayTeamName={match.awayClub?.shortName || match.awayClub?.name || 'Away'}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
