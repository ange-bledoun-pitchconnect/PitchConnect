'use client';

// ============================================================================
// 📺 PITCHCONNECT - LIVE MATCH PAGE v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/live/page.tsx
// Real-time live match tracking with multi-sport support
// Schema v7.3.0 aligned - Uses MatchStatus enum
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Activity,
  Users,
  Trophy,
  AlertCircle,
  Timer,
  Radio,
  Tv,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize2,
  Share2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getSportConfig,
  getSportIcon,
  getSportDisplayName,
  getEventTypeLabel,
  getEventTypeIcon,
} from '@/lib/config/sports';
import type { Sport, MatchStatus, MatchEventType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface MatchEvent {
  id: string;
  eventType: string;
  minute: number;
  secondaryMinute: number | null;
  playerId: string | null;
  assistPlayerId: string | null;
  period: string | null;
  playerName?: string;
  assistPlayerName?: string;
  teamSide?: 'home' | 'away';
  createdAt: string;
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
  isBroadcasted: boolean;
  broadcastUrl: string | null;
  events: MatchEvent[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REFRESH_INTERVAL = 30000; // 30 seconds
const LIVE_STATUSES: MatchStatus[] = ['LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES'];

// ============================================================================
// STATUS HELPERS
// ============================================================================

const getStatusInfo = (status: MatchStatus): { label: string; color: string; isLive: boolean } => {
  const statusMap: Record<MatchStatus, { label: string; color: string; isLive: boolean }> = {
    SCHEDULED: { label: 'Scheduled', color: 'bg-blue-500', isLive: false },
    WARMUP: { label: 'Warm Up', color: 'bg-yellow-500', isLive: false },
    LIVE: { label: 'LIVE', color: 'bg-red-500', isLive: true },
    HALFTIME: { label: 'Half Time', color: 'bg-orange-500', isLive: true },
    SECOND_HALF: { label: '2nd Half', color: 'bg-red-500', isLive: true },
    EXTRA_TIME_FIRST: { label: 'Extra Time', color: 'bg-purple-500', isLive: true },
    EXTRA_TIME_SECOND: { label: 'Extra Time', color: 'bg-purple-500', isLive: true },
    PENALTIES: { label: 'Penalties', color: 'bg-red-600', isLive: true },
    FINISHED: { label: 'Full Time', color: 'bg-gray-500', isLive: false },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-700', isLive: false },
    POSTPONED: { label: 'Postponed', color: 'bg-yellow-600', isLive: false },
    ABANDONED: { label: 'Abandoned', color: 'bg-red-700', isLive: false },
    REPLAY_SCHEDULED: { label: 'Replay Scheduled', color: 'bg-blue-600', isLive: false },
    VOIDED: { label: 'Voided', color: 'bg-gray-600', isLive: false },
    DELAYED: { label: 'Delayed', color: 'bg-yellow-500', isLive: false },
    SUSPENDED: { label: 'Suspended', color: 'bg-orange-600', isLive: false },
  };

  return statusMap[status] || { label: status, color: 'bg-gray-500', isLive: false };
};

// ============================================================================
// LIVE PULSE COMPONENT
// ============================================================================

const LivePulse = () => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
  </span>
);

// ============================================================================
// MATCH TIMER COMPONENT
// ============================================================================

interface MatchTimerProps {
  kickOffTime: string;
  status: MatchStatus;
}

const MatchTimer = ({ kickOffTime, status }: MatchTimerProps) => {
  const [currentMinute, setCurrentMinute] = useState(0);

  useEffect(() => {
    const calculateMinute = () => {
      if (!LIVE_STATUSES.includes(status)) return;

      const kickOff = new Date(kickOffTime);
      const now = new Date();
      let diffMinutes = Math.floor((now.getTime() - kickOff.getTime()) / 60000);

      // Adjust for different periods
      if (status === 'SECOND_HALF') {
        diffMinutes = Math.min(90, Math.max(45, diffMinutes));
      } else if (status === 'HALFTIME') {
        diffMinutes = 45;
      } else if (status === 'EXTRA_TIME_FIRST') {
        diffMinutes = Math.min(105, Math.max(90, diffMinutes));
      } else if (status === 'EXTRA_TIME_SECOND') {
        diffMinutes = Math.min(120, Math.max(105, diffMinutes));
      } else {
        diffMinutes = Math.min(45, Math.max(0, diffMinutes));
      }

      setCurrentMinute(diffMinutes);
    };

    calculateMinute();
    const interval = setInterval(calculateMinute, 30000);
    return () => clearInterval(interval);
  }, [kickOffTime, status]);

  if (!LIVE_STATUSES.includes(status)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-white">
      <Timer className="w-5 h-5" />
      <span className="text-2xl font-bold tabular-nums">{currentMinute}'</span>
    </div>
  );
};

// ============================================================================
// EVENT FEED COMPONENT
// ============================================================================

interface EventFeedProps {
  events: MatchEvent[];
  sport: Sport;
}

const EventFeed = ({ events, sport }: EventFeedProps) => {
  const sportConfig = getSportConfig(sport);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-charcoal-500 dark:text-charcoal-400">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No events yet</p>
        <p className="text-sm">Events will appear here as they happen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {events.map((event, index) => {
        const isScoring = sportConfig.scoringEvents.includes(event.eventType as MatchEventType);
        const icon = getEventTypeIcon(event.eventType as MatchEventType);
        const label = getEventTypeLabel(event.eventType as MatchEventType);

        return (
          <div
            key={event.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
              isScoring
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-charcoal-50 dark:bg-charcoal-700/50'
            } ${index === 0 ? 'animate-in fade-in slide-in-from-top-2' : ''}`}
          >
            <div className="flex-shrink-0 text-2xl">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-charcoal-900 dark:text-white">{label}</span>
                <Badge
                  variant="outline"
                  className={
                    event.teamSide === 'home'
                      ? 'border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400'
                      : 'border-orange-300 text-orange-600 dark:border-orange-600 dark:text-orange-400'
                  }
                >
                  {event.teamSide === 'home' ? 'Home' : 'Away'}
                </Badge>
              </div>
              {event.playerName && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  {event.playerName}
                  {event.assistPlayerName && (
                    <span className="text-charcoal-500"> (Assist: {event.assistPlayerName})</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="font-bold text-charcoal-900 dark:text-white">
                {event.minute}'
                {event.secondaryMinute && <span className="text-sm">+{event.secondaryMinute}</span>}
              </span>
              {event.period && (
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{event.period}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LiveMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  // State
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Fetch match data
  const fetchMatch = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsRefreshing(true);

      const response = await fetch(`/api/matches/${matchId}/live`);

      if (!response.ok) {
        throw new Error('Failed to fetch match data');
      }

      const data = await response.json();
      setMatch(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching match:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [matchId]);

  // Initial load
  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !match) return;

    const isLive = LIVE_STATUSES.includes(match.status);
    if (!isLive) return;

    const interval = setInterval(() => {
      fetchMatch(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, match, fetchMatch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 dark:text-green-400 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-300">Loading live match...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-charcoal-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">Error</h2>
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => fetchMatch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) return null;

  const sportConfig = getSportConfig(match.homeTeam.sport);
  const sportIcon = getSportIcon(match.homeTeam.sport);
  const statusInfo = getStatusInfo(match.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <Link
            href={`/dashboard/matches/${match.id}`}
            className="inline-flex items-center gap-2 text-charcoal-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match
          </Link>

          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-400' : 'text-charcoal-400'}
            >
              {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="ml-1 hidden sm:inline">{autoRefresh ? 'Auto' : 'Paused'}</span>
            </Button>

            {/* Manual refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMatch()}
              disabled={isRefreshing}
              className="text-charcoal-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'text-green-400' : 'text-charcoal-400'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Main Score Card */}
        <Card className="mb-6 bg-gradient-to-br from-charcoal-800 to-charcoal-900 border-charcoal-700 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* Status Bar */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {statusInfo.isLive && <LivePulse />}
              <Badge className={`${statusInfo.color} text-white px-4 py-1 text-lg`}>
                {statusInfo.label}
              </Badge>
              <MatchTimer kickOffTime={match.kickOffTime} status={match.status} />
            </div>

            {/* Teams & Score */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home Team */}
              <div className="text-center">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 bg-blue-500/30 rounded-xl flex items-center justify-center text-5xl">
                    {sportIcon}
                  </div>
                )}
                <h2 className="font-bold text-lg sm:text-xl text-white">
                  {match.homeTeam.shortName || match.homeTeam.name}
                </h2>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="text-6xl sm:text-8xl font-bold text-white tabular-nums">
                  {match.homeScore ?? 0}
                  <span className="mx-2 text-charcoal-500">-</span>
                  {match.awayScore ?? 0}
                </div>
                {(match.homeHalftimeScore !== null || match.awayHalftimeScore !== null) && (
                  <p className="text-charcoal-400 mt-2">
                    HT: {match.homeHalftimeScore ?? '-'} - {match.awayHalftimeScore ?? '-'}
                  </p>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-3 bg-orange-500/30 rounded-xl flex items-center justify-center text-5xl">
                    {sportIcon}
                  </div>
                )}
                <h2 className="font-bold text-lg sm:text-xl text-white">
                  {match.awayTeam.shortName || match.awayTeam.name}
                </h2>
              </div>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mt-6 pt-6 border-t border-charcoal-700 text-charcoal-400 text-sm flex-wrap">
              {match.venue && (
                <span className="flex items-center gap-1">
                  <Radio className="w-4 h-4" />
                  {match.venue}
                </span>
              )}
              <span className="flex items-center gap-1">
                {sportIcon} {getSportDisplayName(match.homeTeam.sport)}
              </span>
              {match.isBroadcasted && match.broadcastUrl && (
                <a
                  href={match.broadcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-red-400 hover:text-red-300"
                >
                  <Tv className="w-4 h-4" />
                  Watch Live
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link href={`/dashboard/matches/${match.id}/events`}>
            <Button variant="outline" className="w-full bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700">
              <Activity className="w-4 h-4 mr-2" />
              Events
            </Button>
          </Link>
          <Link href={`/dashboard/matches/${match.id}/lineup`}>
            <Button variant="outline" className="w-full bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700">
              <Users className="w-4 h-4 mr-2" />
              Lineup
            </Button>
          </Link>
          <Link href={`/dashboard/matches/${match.id}/record-result`}>
            <Button variant="outline" className="w-full bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700">
              <Trophy className="w-4 h-4 mr-2" />
              Record
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full bg-charcoal-800 border-charcoal-700 text-white hover:bg-charcoal-700"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                  text: `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`,
                  url: window.location.href,
                });
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Feed */}
          <Card className="bg-charcoal-800 border-charcoal-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Live Events
                </CardTitle>
                {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-charcoal-400" />}
              </div>
              <CardDescription className="text-charcoal-400">
                Real-time match updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventFeed events={match.events} sport={match.homeTeam.sport} />
            </CardContent>
          </Card>

          {/* Match Stats (Placeholder) */}
          <Card className="bg-charcoal-800 border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Match Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Kick-off time */}
              <div className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                <span className="text-charcoal-400">Kick-off</span>
                <span className="text-white font-medium">
                  {new Date(match.kickOffTime).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {/* Venue */}
              {match.venue && (
                <div className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                  <span className="text-charcoal-400">Venue</span>
                  <span className="text-white font-medium">{match.venue}</span>
                </div>
              )}

              {/* Sport */}
              <div className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                <span className="text-charcoal-400">Sport</span>
                <span className="text-white font-medium flex items-center gap-2">
                  {sportIcon} {getSportDisplayName(match.homeTeam.sport)}
                </span>
              </div>

              {/* Last updated */}
              {lastUpdated && (
                <div className="flex items-center justify-between p-3 bg-charcoal-700/50 rounded-lg">
                  <span className="text-charcoal-400">Last Updated</span>
                  <span className="text-white font-medium">
                    {lastUpdated.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* View full match details */}
              <Link href={`/dashboard/matches/${match.id}`} className="block">
                <Button className="w-full bg-charcoal-700 hover:bg-charcoal-600 text-white">
                  View Full Match Details
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-charcoal-500 text-sm">
          <p>
            {autoRefresh
              ? `Auto-refreshing every ${REFRESH_INTERVAL / 1000} seconds`
              : 'Auto-refresh paused'}
          </p>
        </div>
      </div>
    </div>
  );
}
