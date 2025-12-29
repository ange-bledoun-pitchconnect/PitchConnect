// ============================================================================
// 📋 MATCH DETAIL PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId] - Comprehensive match overview
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Play,
  Trophy,
  Shield,
  Radio,
  CheckCircle,
  Tv,
  Star,
  Flag,
  ClipboardList,
  Activity,
  UserPlus,
  FileText,
  Share2,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MATCH_STATUS_CONFIG, MATCH_TYPE_CONFIG, LIVE_STATUSES } from '@/types/match';
import {
  getSportConfig,
  getSportDisplayName,
  getFormationDisplay,
  getEventLabel,
  getEventIcon,
  getPositionDisplay,
} from '@/lib/config/sports';
import type { MatchStatus, MatchType, Sport } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  params: { matchId: string };
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      homeClub: { select: { name: true, shortName: true } },
      awayClub: { select: { name: true, shortName: true } },
    },
  });

  if (!match) {
    return { title: 'Match Not Found | PitchConnect' };
  }

  const title = match.title || 
    `${match.homeClub.shortName || match.homeClub.name} vs ${match.awayClub.shortName || match.awayClub.name}`;

  return {
    title: `${title} | PitchConnect`,
    description: `Match details for ${title}`,
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    include: {
      homeTeam: {
        select: { id: true, name: true, logo: true, ageGroup: true },
      },
      awayTeam: {
        select: { id: true, name: true, logo: true, ageGroup: true },
      },
      homeClub: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      awayClub: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      competition: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          type: true,
        },
      },
      venueRelation: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          capacity: true,
          surface: true,
        },
      },
      facilityRelation: {
        select: {
          id: true,
          name: true,
          city: true,
          type: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      events: {
        orderBy: { minute: 'desc' },
        take: 20,
        include: {
          player: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
          assistPlayer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      },
      squads: {
        where: { status: { in: ['STARTING_LINEUP', 'SUBSTITUTE'] } },
        include: {
          player: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { lineupPosition: 'asc' }],
      },
      officials: {
        include: {
          referee: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
  });

  return match;
}

async function getUserPermissions(userId: string, match: NonNullable<Awaited<ReturnType<typeof getMatch>>>) {
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      clubId: { in: [match.homeClubId, match.awayClubId] },
      isActive: true,
      deletedAt: null,
    },
    select: {
      clubId: true,
      role: true,
      canManageMatches: true,
      canManageLineups: true,
    },
  });

  const homeMembership = memberships.find((m) => m.clubId === match.homeClubId);
  const awayMembership = memberships.find((m) => m.clubId === match.awayClubId);

  const isAdmin = memberships.some((m) =>
    ['OWNER', 'MANAGER', 'HEAD_COACH'].includes(m.role) || m.canManageMatches
  );

  return {
    canEdit: isAdmin || match.createdById === userId,
    canManageLineup: memberships.some((m) =>
      ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'].includes(m.role) || m.canManageLineups
    ),
    canRecordEvents: isAdmin,
    canRecordResult: isAdmin,
    isHomeTeamStaff: !!homeMembership,
    isAwayTeamStaff: !!awayMembership,
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config = MATCH_STATUS_CONFIG[status];
  const isLive = LIVE_STATUSES.includes(status);

  return (
    <Badge
      className={`${config.bgColor} ${config.darkBgColor} ${config.color} gap-1 text-sm`}
    >
      {isLive && (
        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </Badge>
  );
}

function MatchTypeBadge({ type }: { type: MatchType }) {
  const config = MATCH_TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.darkBgColor} ${config.color}`}>
      {config.label}
    </Badge>
  );
}

function TeamDisplay({
  club,
  team,
  score,
  isWinner,
  side,
}: {
  club: { name: string; shortName: string | null; logo: string | null };
  team: { name: string; logo: string | null };
  score: number | null;
  isWinner: boolean;
  side: 'home' | 'away';
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${side === 'away' ? 'order-3' : 'order-1'}`}>
      {club.logo ? (
        <img
          src={club.logo}
          alt={`${club.name} logo`}
          className="h-20 w-20 rounded-xl object-cover shadow-lg"
        />
      ) : (
        <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shadow-lg">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="text-center">
        <h2 className={`text-xl font-bold ${isWinner ? 'text-green-600 dark:text-green-400' : ''}`}>
          {club.shortName || club.name}
        </h2>
        <p className="text-sm text-muted-foreground">{team.name}</p>
      </div>
    </div>
  );
}

function ScoreDisplay({
  homeScore,
  awayScore,
  status,
  homePenalties,
  awayPenalties,
}: {
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  homePenalties: number | null;
  awayPenalties: number | null;
}) {
  const isLive = LIVE_STATUSES.includes(status);
  const isFinished = status === 'FINISHED';
  const showScore = isLive || isFinished;

  return (
    <div className="order-2 flex flex-col items-center gap-2">
      {showScore ? (
        <>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-bold tabular-nums">
              {homeScore ?? 0}
            </span>
            <span className="text-3xl text-muted-foreground">-</span>
            <span className="text-5xl font-bold tabular-nums">
              {awayScore ?? 0}
            </span>
          </div>
          {(homePenalties !== null || awayPenalties !== null) && (
            <p className="text-sm text-muted-foreground">
              ({homePenalties ?? 0} - {awayPenalties ?? 0} pens)
            </p>
          )}
        </>
      ) : (
        <span className="text-4xl font-bold text-muted-foreground">VS</span>
      )}
      <MatchStatusBadge status={status} />
    </div>
  );
}

function EventItem({ event }: { event: NonNullable<Awaited<ReturnType<typeof getMatch>>>['events'][0] }) {
  const icon = getEventIcon(event.eventType);
  const label = getEventLabel(event.eventType);
  const playerName = event.player?.user
    ? `${event.player.user.firstName} ${event.player.user.lastName}`
    : 'Unknown';

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{playerName}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <Badge variant="outline" className="tabular-nums">
        {event.minute}&apos;
      </Badge>
    </div>
  );
}

function LineupPlayer({ squad }: { squad: NonNullable<Awaited<ReturnType<typeof getMatch>>>['squads'][0] }) {
  if (!squad.player) return null;

  const name = `${squad.player.user.firstName} ${squad.player.user.lastName}`;
  const position = squad.position ? getPositionDisplay(squad.position) : null;

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={squad.player.user.avatar || undefined} alt="" />
        <AvatarFallback>
          {squad.player.user.firstName[0]}
          {squad.player.user.lastName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {squad.isCaptain && <span className="text-yellow-500 mr-1">©</span>}
          {name}
        </p>
        {position && (
          <p className="text-xs text-muted-foreground">{position}</p>
        )}
      </div>
      {squad.shirtNumber && (
        <Badge variant="outline" className="tabular-nums">
          #{squad.shirtNumber}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function MatchDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const match = await getMatch(params.matchId);

  if (!match) {
    notFound();
  }

  const permissions = await getUserPermissions(session.user.id, match);
  const sport = match.homeClub.sport;
  const sportConfig = getSportConfig(sport);
  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = match.status === 'FINISHED';
  const isScheduled = match.status === 'SCHEDULED';

  // Determine winner
  const homeWins = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWins = (match.awayScore ?? 0) > (match.homeScore ?? 0);

  // Split squads by team
  const homeSquads = match.squads.filter((s) => s.teamId === match.homeTeamId);
  const awaySquads = match.squads.filter((s) => s.teamId === match.awayTeamId);
  const homeStarters = homeSquads.filter((s) => s.status === 'STARTING_LINEUP');
  const homeSubs = homeSquads.filter((s) => s.status === 'SUBSTITUTE');
  const awayStarters = awaySquads.filter((s) => s.status === 'STARTING_LINEUP');
  const awaySubs = awaySquads.filter((s) => s.status === 'SUBSTITUTE');

  // Venue info
  const venueName = match.venueRelation?.name || match.facilityRelation?.name || match.venue;
  const venueCity = match.venueRelation?.city || match.facilityRelation?.city;

  return (
    <main className="container py-6 space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/matches" aria-label="Back to matches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={`${sportConfig.bgColor} ${sportConfig.darkBgColor} ${sportConfig.color}`}>
              {sportConfig.emoji} {getSportDisplayName(sport)}
            </Badge>
            <MatchTypeBadge type={match.matchType} />
            {match.competition && (
              <Badge variant="outline">
                <Trophy className="h-3 w-3 mr-1" />
                {match.competition.shortName || match.competition.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isLive && (
            <Button asChild variant="destructive">
              <Link href={`/dashboard/matches/${match.id}/live`}>
                <Radio className="mr-2 h-4 w-4" />
                Watch Live
              </Link>
            </Button>
          )}

          {permissions.canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/matches/${match.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Match
                  </Link>
                </DropdownMenuItem>
                {permissions.canManageLineup && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/matches/${match.id}/lineup`}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Lineup
                    </Link>
                  </DropdownMenuItem>
                )}
                {permissions.canRecordEvents && (isLive || isFinished) && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/matches/${match.id}/events`}>
                      <Activity className="mr-2 h-4 w-4" />
                      Record Events
                    </Link>
                  </DropdownMenuItem>
                )}
                {permissions.canRecordResult && !isFinished && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/matches/${match.id}/record-result`}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Record Result
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Match
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Match Header Card */}
      <Card className={isLive ? 'border-red-500/50 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/20' : ''}>
        <CardContent className="pt-6">
          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            <TeamDisplay
              club={match.homeClub}
              team={match.homeTeam}
              score={match.homeScore}
              isWinner={isFinished && homeWins}
              side="home"
            />
            <ScoreDisplay
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              status={match.status}
              homePenalties={match.homePenalties}
              awayPenalties={match.awayPenalties}
            />
            <TeamDisplay
              club={match.awayClub}
              team={match.awayTeam}
              score={match.awayScore}
              isWinner={isFinished && awayWins}
              side="away"
            />
          </div>

          {/* Match Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={match.kickOffTime}>
                {format(parseISO(match.kickOffTime), 'EEEE, d MMMM yyyy')}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <time dateTime={match.kickOffTime}>
                {format(parseISO(match.kickOffTime), 'HH:mm')}
              </time>
            </div>
            {venueName && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {venueName}
                {venueCity && `, ${venueCity}`}
              </div>
            )}
            {match.isBroadcasted && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Tv className="h-4 w-4" />
                Broadcast Available
                {match.broadcastUrl && (
                  <a
                    href={match.broadcastUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Formations */}
          {(match.homeFormation || match.awayFormation) && (
            <div className="flex items-center justify-center gap-8 mt-4">
              {match.homeFormation && (
                <Badge variant="outline">
                  {match.homeClub.shortName}: {getFormationDisplay(match.homeFormation)}
                </Badge>
              )}
              {match.awayFormation && (
                <Badge variant="outline">
                  {match.awayClub.shortName}: {getFormationDisplay(match.awayFormation)}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Staff */}
      {permissions.canEdit && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href={`/dashboard/matches/${match.id}/lineup`}>
              <div className="flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Lineup</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href={`/dashboard/matches/${match.id}/events`}>
              <div className="flex flex-col items-center gap-2">
                <Activity className="h-5 w-5" />
                <span>Events</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href={`/dashboard/matches/${match.id}/record-result`}>
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                <span>Result</span>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href={`/dashboard/matches/${match.id}/live`}>
              <div className="flex flex-col items-center gap-2">
                <Radio className="h-5 w-5" />
                <span>Live View</span>
              </div>
            </Link>
          </Button>
        </div>
      )}

      {/* Tabs Content */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="lineups" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Lineups
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <Flag className="h-4 w-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Info
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Events</CardTitle>
              <CardDescription>
                Key moments from the match
              </CardDescription>
            </CardHeader>
            <CardContent>
              {match.events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events recorded yet
                </p>
              ) : (
                <div className="divide-y">
                  {match.events.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lineups Tab */}
        <TabsContent value="lineups" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Home Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {match.homeClub.logo && (
                    <img src={match.homeClub.logo} alt="" className="h-6 w-6 rounded" />
                  )}
                  {match.homeClub.shortName || match.homeClub.name}
                </CardTitle>
                {match.homeFormation && (
                  <CardDescription>
                    Formation: {getFormationDisplay(match.homeFormation)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {homeStarters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Lineup not set
                  </p>
                ) : (
                  <>
                    <h4 className="font-medium mb-2">Starting XI</h4>
                    <div className="divide-y mb-4">
                      {homeStarters.map((squad) => (
                        <LineupPlayer key={squad.id} squad={squad} />
                      ))}
                    </div>
                    {homeSubs.length > 0 && (
                      <>
                        <h4 className="font-medium mb-2">Substitutes</h4>
                        <div className="divide-y">
                          {homeSubs.map((squad) => (
                            <LineupPlayer key={squad.id} squad={squad} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Away Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {match.awayClub.logo && (
                    <img src={match.awayClub.logo} alt="" className="h-6 w-6 rounded" />
                  )}
                  {match.awayClub.shortName || match.awayClub.name}
                </CardTitle>
                {match.awayFormation && (
                  <CardDescription>
                    Formation: {getFormationDisplay(match.awayFormation)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {awayStarters.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Lineup not set
                  </p>
                ) : (
                  <>
                    <h4 className="font-medium mb-2">Starting XI</h4>
                    <div className="divide-y mb-4">
                      {awayStarters.map((squad) => (
                        <LineupPlayer key={squad.id} squad={squad} />
                      ))}
                    </div>
                    {awaySubs.length > 0 && (
                      <>
                        <h4 className="font-medium mb-2">Substitutes</h4>
                        <div className="divide-y">
                          {awaySubs.map((squad) => (
                            <LineupPlayer key={squad.id} squad={squad} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Statistics</CardTitle>
              <CardDescription>
                Detailed statistics will be available after the match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Statistics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Competition</h4>
                  <p>{match.competition?.name || 'Standalone Match'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Match Type</h4>
                  <p>{MATCH_TYPE_CONFIG[match.matchType].label}</p>
                </div>
                {match.stage && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Stage</h4>
                    <p>{match.stage.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {match.matchday && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Matchday</h4>
                    <p>{match.matchday}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Venue</h4>
                  <p>{venueName || 'TBD'}</p>
                </div>
                {match.attendance && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Attendance</h4>
                    <p>{match.attendance.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {match.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="whitespace-pre-wrap">{match.description}</p>
                  </div>
                </>
              )}

              {match.matchReport && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Match Report</h4>
                    <p className="whitespace-pre-wrap">{match.matchReport}</p>
                  </div>
                </>
              )}

              {/* Officials */}
              {match.officials.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Match Officials</h4>
                    <ul className="space-y-1">
                      {match.officials.map((official) => (
                        <li key={official.id} className="text-sm">
                          <span className="text-muted-foreground">{official.role}: </span>
                          {official.referee.user.firstName} {official.referee.user.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Meta */}
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>
                  Created by {match.creator.firstName} {match.creator.lastName} •{' '}
                  {formatDistanceToNow(parseISO(match.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
