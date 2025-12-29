// ============================================================================
// 📺 LIVE MATCH TRACKING PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId]/live - Real-time match tracking
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Radio,
  Clock,
  Shield,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Trophy,
  MapPin,
  Users,
  Play,
  Pause,
  Flag,
  AlertCircle,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useRealTimeMatch, useMatchStats } from '@/hooks/useRealTimeMatch';
import { MATCH_STATUS_CONFIG, LIVE_STATUSES } from '@/types/match';
import {
  getSportConfig,
  getEventIcon,
  getEventLabel,
  getSportDisplayName,
} from '@/lib/config/sports';
import type { Match, MatchEvent, LiveMatchStats } from '@/types/match';
import type { MatchStatus, Sport } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  params: { matchId: string };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ConnectionIndicator({ 
  status 
}: { 
  status: 'connected' | 'connecting' | 'disconnected' | 'polling' 
}) {
  const configs = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    connecting: {
      icon: RefreshCw,
      label: 'Connecting...',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    polling: {
      icon: RefreshCw,
      label: 'Polling',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${config.bgColor}`}
      aria-live="polite"
    >
      <Icon className={`h-3 w-3 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
      <span className={config.color}>{config.label}</span>
    </div>
  );
}

function LiveTimer({ 
  minute, 
  period, 
  injuryTime,
  status,
}: { 
  minute: number; 
  period: string;
  injuryTime: number;
  status: MatchStatus;
}) {
  const isLive = LIVE_STATUSES.includes(status);
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        )}
        <span className="text-4xl font-bold tabular-nums">
          {minute}&apos;
        </span>
        {injuryTime > 0 && (
          <span className="text-xl text-muted-foreground">
            +{injuryTime}
          </span>
        )}
      </div>
      <Badge 
        className={`mt-1 ${
          isLive 
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
            : ''
        }`}
      >
        {period}
      </Badge>
    </div>
  );
}

function ScoreBoard({
  match,
  sport,
}: {
  match: Match;
  sport: Sport;
}) {
  const sportConfig = getSportConfig(sport);
  const isLive = LIVE_STATUSES.includes(match.status);

  return (
    <Card className={isLive ? 'border-red-500/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.homeClub.logo ? (
              <img
                src={match.homeClub.logo}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <span className="font-bold text-center">
              {match.homeClub.shortName || match.homeClub.name}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2 px-8">
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-bold tabular-nums">
                {match.homeScore ?? 0}
              </span>
              <span className="text-4xl text-muted-foreground">-</span>
              <span className="text-6xl font-bold tabular-nums">
                {match.awayScore ?? 0}
              </span>
            </div>
            {(match.homePenalties !== null || match.awayPenalties !== null) && (
              <span className="text-sm text-muted-foreground">
                ({match.homePenalties ?? 0} - {match.awayPenalties ?? 0} pens)
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.awayClub.logo ? (
              <img
                src={match.awayClub.logo}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <span className="font-bold text-center">
              {match.awayClub.shortName || match.awayClub.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBar({
  label,
  homeValue,
  awayValue,
  isPercentage = false,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  isPercentage?: boolean;
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium tabular-nums">
          {isPercentage ? `${homeValue}%` : homeValue}
        </span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {isPercentage ? `${awayValue}%` : awayValue}
        </span>
      </div>
      <div className="flex h-2 gap-0.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-orange-500 transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: LiveMatchStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatBar
          label="Possession"
          homeValue={stats.home.possession}
          awayValue={stats.away.possession}
          isPercentage
        />
        <StatBar
          label="Shots"
          homeValue={stats.home.shots}
          awayValue={stats.away.shots}
        />
        <StatBar
          label="Shots on Target"
          homeValue={stats.home.shotsOnTarget}
          awayValue={stats.away.shotsOnTarget}
        />
        <StatBar
          label="Corners"
          homeValue={stats.home.corners}
          awayValue={stats.away.corners}
        />
        <StatBar
          label="Fouls"
          homeValue={stats.home.fouls}
          awayValue={stats.away.fouls}
        />
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">🟨</span>
            <span className="font-medium">{stats.home.yellowCards}</span>
          </div>
          <span className="text-muted-foreground">Yellow Cards</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{stats.away.yellowCards}</span>
            <span className="text-yellow-500">🟨</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500">🟥</span>
            <span className="font-medium">{stats.home.redCards}</span>
          </div>
          <span className="text-muted-foreground">Red Cards</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{stats.away.redCards}</span>
            <span className="text-red-500">🟥</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventTimeline({ events, match }: { events: MatchEvent[]; match: Match }) {
  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No events yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {events.map((event) => {
          const icon = getEventIcon(event.eventType);
          const label = getEventLabel(event.eventType);
          const isHome = event.teamSide === 'home';
          const teamName = isHome 
            ? match.homeClub.shortName || match.homeClub.name
            : match.awayClub.shortName || match.awayClub.name;

          return (
            <div
              key={event.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isHome 
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                  : 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <Badge variant="outline" className="tabular-nums shrink-0">
                {event.minute}&apos;
              </Badge>
              <span className="text-2xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {event.player?.user
                    ? `${event.player.user.firstName} ${event.player.user.lastName}`
                    : label}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {label} • {teamName}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function MatchNotStarted({ match }: { match: Match }) {
  const kickOffDate = new Date(match.kickOffTime);

  return (
    <div className="text-center py-12">
      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Match Not Started</h2>
      <p className="text-muted-foreground mb-4">
        Kick-off: {format(kickOffDate, 'EEEE, d MMMM yyyy')} at {format(kickOffDate, 'HH:mm')}
      </p>
      <Button asChild variant="outline">
        <Link href={`/dashboard/matches/${match.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Match Details
        </Link>
      </Button>
    </div>
  );
}

function MatchFinished({ match }: { match: Match }) {
  const homeWins = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWins = (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const isDraw = match.homeScore === match.awayScore;

  return (
    <div className="text-center py-8">
      <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Full Time</h2>
      <p className="text-muted-foreground mb-2">
        {isDraw
          ? 'The match ended in a draw'
          : homeWins
          ? `${match.homeClub.shortName || match.homeClub.name} wins!`
          : `${match.awayClub.shortName || match.awayClub.name} wins!`}
      </p>
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button asChild variant="outline">
          <Link href={`/dashboard/matches/${match.id}`}>
            Match Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LiveMatchPage({ params }: PageProps) {
  const router = useRouter();
  
  const {
    match,
    events,
    stats,
    isLive,
    isFinished,
    currentMinute,
    currentPeriod,
    injuryTime,
    connectionStatus,
    lastUpdated,
    refresh,
    isLoading,
    error,
  } = useRealTimeMatch({
    matchId: params.matchId,
    enabled: true,
    pollingInterval: 10000, // 10 seconds for live matches
    enableWebSocket: true,
  });

  const [activeTab, setActiveTab] = useState('timeline');

  // Handle not found
  useEffect(() => {
    if (!isLoading && !match && !error) {
      router.push('/dashboard/matches');
    }
  }, [isLoading, match, error, router]);

  if (isLoading) {
    return (
      <main className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load match. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={refresh} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </main>
    );
  }

  if (!match) {
    return null;
  }

  const sport = match.homeClub.sport as Sport;
  const sportConfig = getSportConfig(sport);
  const isScheduled = match.status === 'SCHEDULED';

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/dashboard/matches/${match.id}`} aria-label="Back to match">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {isLive ? 'Live Match' : 'Match Tracker'}
              </h1>
              {isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {match.title || `${match.homeClub.shortName} vs ${match.awayClub.shortName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionIndicator status={connectionStatus} />
          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Match Not Started */}
      {isScheduled && <MatchNotStarted match={match} />}

      {/* Live/Finished Content */}
      {!isScheduled && (
        <>
          {/* Timer & Score */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <ScoreBoard match={match} sport={sport} />
            </div>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
                <LiveTimer
                  minute={currentMinute}
                  period={currentPeriod}
                  injuryTime={injuryTime}
                  status={match.status}
                />
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated: {format(lastUpdated, 'HH:mm:ss')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Match Finished Banner */}
          {isFinished && <MatchFinished match={match} />}

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="timeline" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <Flag className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Match Timeline</CardTitle>
                  <CardDescription>
                    Live events as they happen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventTimeline events={events} match={match} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <StatsPanel stats={stats} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-4">
          {match.competition && (
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              {match.competition.name}
            </span>
          )}
          {(match.venueRelation || match.venue) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {match.venueRelation?.name || match.venue}
            </span>
          )}
        </div>
        <Badge className={`${sportConfig.bgColor} ${sportConfig.darkBgColor} ${sportConfig.color}`}>
          {sportConfig.emoji} {getSportDisplayName(sport)}
        </Badge>
      </div>
    </main>
  );
}
