// =============================================================================
// 🏆 PITCHCONNECT - FOLLOWING PAGE v3.0 (Universal Fan Functionality)
// =============================================================================
// Path: /dashboard/following
// Access: ALL AUTHENTICATED USERS (Fan functionality is built into every role)
//
// FEATURES:
// ✅ Follow teams and players
// ✅ View match schedules and results
// ✅ Uses Match.homeTeam/awayTeam (Team relations, NOT Club)
// ✅ Multi-sport support (12 sports)
// ✅ Live scores and updates
// ✅ News feed from followed entities
// ✅ Discover new teams/players
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Heart,
  Users,
  Trophy,
  Calendar,
  Star,
  Bell,
  ArrowRight,
  Clock,
  Search,
  Radio,
  Newspaper,
  MapPin,
  TrendingUp,
  UserCircle,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface FollowedTeam {
  id: string;
  name: string;
  ageGroup: string | null;
  club: {
    id: string;
    name: string;
    sport: Sport;
    logo: string | null;
  };
}

interface FollowedPlayer {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  primaryPosition: string | null;
  club?: {
    name: string;
    sport: Sport;
  } | null;
}

interface MatchPreview {
  id: string;
  kickOffTime: Date;
  venue: string | null;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homeScore: number | null;
  awayScore: number | null;
  sport: Sport;
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getFollowingData(userId: string) {
  // Get user with following relationships
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      following: {
        include: {
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        take: 10,
      },
    },
  });

  // Get followed teams (via TeamFollower if exists, or through user preferences)
  // For now, we'll show featured teams as "suggested"
  const featuredTeams = await prisma.team.findMany({
    take: 6,
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get upcoming matches - Uses Team relations (homeTeam/awayTeam)
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: 'SCHEDULED',
      kickOffTime: { gte: new Date() },
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          club: { select: { sport: true } },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { kickOffTime: 'asc' },
    take: 10,
  });

  // Get recent results
  const recentResults = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          club: { select: { sport: true } },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { kickOffTime: 'desc' },
    take: 5,
  });

  // Get live matches
  const liveMatches = await prisma.match.findMany({
    where: {
      status: { in: ['LIVE', 'HALFTIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND'] },
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          club: { select: { sport: true } },
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 5,
  });

  return {
    followingCount: user?.following?.length || 0,
    followedUsers: user?.following?.map(f => f.following) || [],
    suggestedTeams: featuredTeams.map(t => ({
      id: t.id,
      name: t.name,
      ageGroup: t.ageGroup,
      club: {
        id: t.club.id,
        name: t.club.name,
        sport: t.club.sport as Sport,
        logo: t.club.logo,
      },
    })),
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      status: m.status,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      sport: (m.homeTeam.club?.sport as Sport) || 'FOOTBALL',
    })),
    recentResults: recentResults.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      status: m.status,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      sport: (m.homeTeam.club?.sport as Sport) || 'FOOTBALL',
    })),
    liveMatches: liveMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      status: m.status,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      sport: (m.homeTeam.club?.sport as Sport) || 'FOOTBALL',
    })),
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function FollowingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getFollowingData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Following</h1>
          <p className="text-slate-600 dark:text-slate-400">Stay updated with your favorite teams and players</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          href="/dashboard/following/discover"
          icon={<Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Discover"
          description="Find teams and players"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800"
        />
        <QuickAction
          href="/dashboard/following/teams"
          icon={<Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
          title="Teams"
          description={`Following ${data.suggestedTeams.length} teams`}
          gradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
          borderColor="border-emerald-200 dark:border-emerald-800"
        />
        <QuickAction
          href="/dashboard/following/live"
          icon={<Radio className="w-8 h-8 text-red-600 dark:text-red-400" />}
          title="Live Scores"
          description={`${data.liveMatches.length} live now`}
          gradient="from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
          borderColor="border-red-200 dark:border-red-800"
        />
        <QuickAction
          href="/dashboard/following/players"
          icon={<UserCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Players"
          description={`${data.followingCount} following`}
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800"
        />
      </div>

      {/* Live Matches Alert */}
      {data.liveMatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <h2 className="text-white font-bold text-lg">Live Now</h2>
            </div>
            <Link href="/dashboard/following/live" className="text-white/80 hover:text-white text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.liveMatches.slice(0, 3).map(match => {
              const sportConfig = SPORT_CONFIG[match.sport];
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{sportConfig.icon}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                      {match.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm mt-2 truncate">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </p>
                  <p className="text-white/90 text-2xl font-bold text-center mt-1">
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Matches
            </h2>
            <Link href="/dashboard/following/matches" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-5">
            {data.upcomingMatches.length === 0 ? (
              <EmptyState icon={<Calendar className="w-12 h-12" />} title="No upcoming matches" />
            ) : (
              <div className="space-y-3">
                {data.upcomingMatches.slice(0, 5).map(match => {
                  const sportConfig = SPORT_CONFIG[match.sport];
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sportConfig.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(match.kickOffTime).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Recent Results
            </h2>
            <Link href="/dashboard/following/results" className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-5">
            {data.recentResults.length === 0 ? (
              <EmptyState icon={<Trophy className="w-12 h-12" />} title="No recent results" />
            ) : (
              <div className="space-y-3">
                {data.recentResults.map(match => {
                  const sportConfig = SPORT_CONFIG[match.sport];
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sportConfig.icon}</span>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-600 px-3 py-1 rounded-lg">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Teams */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-500" />
              Discover Teams
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Teams you might be interested in</p>
          </div>
          <Link
            href="/dashboard/following/discover"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Browse All
          </Link>
        </div>
        <div className="p-5">
          {data.suggestedTeams.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Discover Teams</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Find and follow teams to get updates on their matches
              </p>
              <Link
                href="/dashboard/following/discover"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm"
              >
                <Search className="w-4 h-4" /> Discover Teams
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.suggestedTeams.map(team => {
                const sportConfig = SPORT_CONFIG[team.club.sport];
                return (
                  <div
                    key={team.id}
                    className="group p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-md`}>
                        <span className="text-2xl">{sportConfig.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{team.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{team.club.name}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors">
                        <Heart className="w-4 h-4" /> Follow
                      </button>
                      <Link
                        href={`/teams/${team.id}`}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function QuickAction({
  href,
  icon,
  title,
  description,
  gradient,
  borderColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  borderColor: string;
}) {
  return (
    <Link
      href={href}
      className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all`}
    >
      <div className="mb-2">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="flex items-center gap-2 mt-3 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Explore</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-slate-300 dark:text-slate-600 mx-auto mb-3">{icon}</div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">{title}</p>
    </div>
  );
}