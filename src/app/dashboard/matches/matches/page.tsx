// ============================================================================
// 📋 MATCHES DASHBOARD PAGE v7.4.0
// ============================================================================
// /dashboard/matches - List with advanced filtering, real-time, accessible
// ============================================================================

import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Trophy,
  Radio,
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
  Users,
  MapPin,
  Tv,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Match, MatchFilters } from '@/types/match';
import type { MatchStatus, MatchType, Sport } from '@prisma/client';
import { MATCH_STATUS_CONFIG, MATCH_TYPE_CONFIG, LIVE_STATUSES } from '@/types/match';
import { getSportDisplayName, getSportEmoji } from '@/lib/config/sports';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Matches | PitchConnect',
  description: 'View and manage all matches across your clubs and competitions',
};

// ============================================================================
// DATA FETCHING
// ============================================================================

interface SearchParams {
  status?: string;
  type?: string;
  sport?: string;
  search?: string;
  page?: string;
  view?: string;
}

async function getMatches(
  userId: string,
  clubIds: string[],
  searchParams: SearchParams
) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { homeClubId: { in: clubIds } },
      { awayClubId: { in: clubIds } },
    ],
  };
  
  // Status filter
  if (searchParams.status && searchParams.status !== 'all') {
    if (searchParams.status === 'live') {
      where.status = { in: LIVE_STATUSES };
    } else if (searchParams.status === 'upcoming') {
      where.status = 'SCHEDULED';
      where.kickOffTime = { gte: new Date() };
    } else if (searchParams.status === 'finished') {
      where.status = 'FINISHED';
    } else {
      where.status = searchParams.status as MatchStatus;
    }
  }
  
  // Type filter
  if (searchParams.type && searchParams.type !== 'all') {
    where.matchType = searchParams.type as MatchType;
  }
  
  // Search filter
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { homeClub: { name: { contains: searchParams.search, mode: 'insensitive' } } },
      { awayClub: { name: { contains: searchParams.search, mode: 'insensitive' } } },
      { venue: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }
  
  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
        homeClub: {
          select: { id: true, name: true, shortName: true, logo: true, sport: true },
        },
        awayClub: {
          select: { id: true, name: true, shortName: true, logo: true, sport: true },
        },
        competition: {
          select: { id: true, name: true, shortName: true, logo: true },
        },
        venueRelation: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // Live matches first
        { kickOffTime: 'desc' },
      ],
      skip,
      take: pageSize,
    }),
    prisma.match.count({ where }),
  ]);
  
  return {
    matches,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function getQuickStats(clubIds: string[]) {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));
  
  const [live, today, upcoming, finished] = await Promise.all([
    prisma.match.count({
      where: {
        deletedAt: null,
        OR: [
          { homeClubId: { in: clubIds } },
          { awayClubId: { in: clubIds } },
        ],
        status: { in: LIVE_STATUSES },
      },
    }),
    prisma.match.count({
      where: {
        deletedAt: null,
        OR: [
          { homeClubId: { in: clubIds } },
          { awayClubId: { in: clubIds } },
        ],
        kickOffTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.match.count({
      where: {
        deletedAt: null,
        OR: [
          { homeClubId: { in: clubIds } },
          { awayClubId: { in: clubIds } },
        ],
        status: 'SCHEDULED',
        kickOffTime: { gte: new Date() },
      },
    }),
    prisma.match.count({
      where: {
        deletedAt: null,
        OR: [
          { homeClubId: { in: clubIds } },
          { awayClubId: { in: clubIds } },
        ],
        status: 'FINISHED',
      },
    }),
  ]);
  
  return { live, today, upcoming, finished };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config = MATCH_STATUS_CONFIG[status];
  const isLive = LIVE_STATUSES.includes(status);
  
  return (
    <Badge
      className={`${config.bgColor} ${config.darkBgColor} ${config.color} gap-1`}
      aria-label={`Match status: ${config.label}`}
    >
      {isLive && (
        <span 
          className="h-2 w-2 rounded-full bg-current animate-pulse"
          aria-hidden="true"
        />
      )}
      {config.label}
    </Badge>
  );
}

function MatchTypeBadge({ type }: { type: MatchType }) {
  const config = MATCH_TYPE_CONFIG[type];
  
  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.darkBgColor} ${config.color} text-xs`}
    >
      {config.label}
    </Badge>
  );
}

function formatMatchDate(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Today, ${format(date, 'HH:mm')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'HH:mm')}`;
  }
  
  return format(date, 'EEE, d MMM yyyy, HH:mm');
}

interface MatchCardProps {
  match: Match & {
    homeClub: { name: string; shortName: string | null; logo: string | null; sport: Sport };
    awayClub: { name: string; shortName: string | null; logo: string | null; sport: Sport };
    homeTeam: { name: string; logo: string | null };
    awayTeam: { name: string; logo: string | null };
    competition?: { name: string; shortName: string | null } | null;
    venueRelation?: { name: string; city: string | null } | null;
  };
}

function MatchCard({ match }: MatchCardProps) {
  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = match.status === 'FINISHED';
  const sport = match.homeClub.sport;
  
  return (
    <Link
      href={`/dashboard/matches/${match.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
    >
      <Card 
        className={`
          transition-all duration-200 hover:shadow-md hover:border-primary/50
          ${isLive ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10' : ''}
        `}
      >
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MatchTypeBadge type={match.matchType} />
              {match.competition && (
                <span className="text-xs text-muted-foreground">
                  {match.competition.shortName || match.competition.name}
                </span>
              )}
            </div>
            <MatchStatusBadge status={match.status} />
          </div>
          
          {/* Teams Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {match.homeClub.logo ? (
                <img
                  src={match.homeClub.logo}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {match.homeClub.shortName || match.homeClub.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {match.homeTeam.name}
                </p>
              </div>
            </div>
            
            {/* Score or VS */}
            <div className="flex flex-col items-center px-3">
              {isFinished || isLive ? (
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-2xl font-bold ${
                      (match.homeScore || 0) > (match.awayScore || 0) ? 'text-green-600' : ''
                    }`}
                  >
                    {match.homeScore ?? '-'}
                  </span>
                  <span className="text-muted-foreground">:</span>
                  <span 
                    className={`text-2xl font-bold ${
                      (match.awayScore || 0) > (match.homeScore || 0) ? 'text-green-600' : ''
                    }`}
                  >
                    {match.awayScore ?? '-'}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">VS</span>
              )}
              {isLive && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            
            {/* Away Team */}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <p className="font-semibold truncate">
                  {match.awayClub.shortName || match.awayClub.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {match.awayTeam.name}
                </p>
              </div>
              {match.awayClub.logo ? (
                <img
                  src={match.awayClub.logo}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          
          {/* Footer Row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <time dateTime={match.kickOffTime}>
                  {formatMatchDate(match.kickOffTime)}
                </time>
              </span>
              
              {(match.venueRelation || match.venue) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {match.venueRelation?.name || match.venue}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {match.isBroadcasted && (
                <Tv className="h-3 w-3 text-blue-500" aria-label="Broadcast available" />
              )}
              {match.isFeatured && (
                <Star className="h-3 w-3 text-yellow-500" aria-label="Featured match" />
              )}
              <span>{getSportEmoji(sport)}</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickStatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchesLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="space-y-2 text-right">
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  // Get user's club memberships
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      clubId: true,
      role: true,
    },
  });
  
  const clubIds = memberships.map((m) => m.clubId);
  
  // If no clubs, show empty state
  if (clubIds.length === 0) {
    return (
      <main className="container py-6 space-y-6">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Club Membership</h2>
          <p className="text-muted-foreground mb-4">
            Join a club to view and manage matches.
          </p>
          <Button asChild>
            <Link href="/dashboard/clubs">Browse Clubs</Link>
          </Button>
        </Card>
      </main>
    );
  }
  
  // Fetch data
  const [{ matches, pagination }, stats] = await Promise.all([
    getMatches(session.user.id, clubIds, searchParams),
    getQuickStats(clubIds),
  ]);
  
  const currentView = searchParams.view || 'all';
  
  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">
            View and manage all matches across your clubs
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/matches/create">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Match
          </Link>
        </Button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          label="Live Now"
          value={stats.live}
          icon={Radio}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
        <QuickStatCard
          label="Today"
          value={stats.today}
          icon={Calendar}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <QuickStatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Clock}
          color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
        <QuickStatCard
          label="Completed"
          value={stats.finished}
          icon={CheckCircle}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search matches..."
                className="pl-9"
                defaultValue={searchParams.search}
                aria-label="Search matches"
              />
            </div>
            
            {/* Status Filter */}
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="POSTPONED">Postponed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Type Filter */}
            <Select defaultValue={searchParams.type || 'all'}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LEAGUE">League</SelectItem>
                <SelectItem value="CUP">Cup</SelectItem>
                <SelectItem value="FRIENDLY">Friendly</SelectItem>
                <SelectItem value="TOURNAMENT">Tournament</SelectItem>
                <SelectItem value="PLAYOFF">Playoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* View Tabs */}
      <Tabs defaultValue={currentView} className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            All Matches
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-1">
            <Radio className="h-4 w-4" />
            Live
            {stats.live > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.live}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Finished
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentView} className="mt-6">
          <Suspense fallback={<MatchesLoading />}>
            {matches.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchParams.search || searchParams.status || searchParams.type
                    ? 'Try adjusting your filters'
                    : 'Create your first match to get started'}
                </p>
                <Button asChild>
                  <Link href="/dashboard/matches/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Match
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4" role="list" aria-label="Matches list">
                {matches.map((match) => (
                  <div key={match.id} role="listitem">
                    <MatchCard match={match as MatchCardProps['match']} />
                  </div>
                ))}
              </div>
            )}
          </Suspense>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav 
              className="flex items-center justify-center gap-2 mt-6"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                asChild
              >
                <Link
                  href={`/dashboard/matches?page=${pagination.page - 1}`}
                  aria-label="Previous page"
                >
                  Previous
                </Link>
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                asChild
              >
                <Link
                  href={`/dashboard/matches?page=${pagination.page + 1}`}
                  aria-label="Next page"
                >
                  Next
                </Link>
              </Button>
            </nav>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
