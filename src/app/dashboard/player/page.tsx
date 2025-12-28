/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Dashboard v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/page.tsx
 * ============================================================================
 * 
 * FIXED: Uses correct Prisma schema field names:
 * - Match uses homeTeam/awayTeam (not homeClub/awayClub)
 * - Simplified queries to avoid schema mismatches
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy, Target, Calendar, TrendingUp, Award, Activity, Users, Search,
  ArrowRight, Shield, MapPin, Bell,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS, getStatLabels } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerDashboardData(userId: string) {
  // Get player with basic relations
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      statistics: { orderBy: { season: 'desc' }, take: 1 },
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: { select: { id: true, name: true, logo: true, sport: true } },
            },
          },
        },
      },
    },
  });

  if (!player) return null;

  // Get primary sport from first team
  const primarySport = (player.teamPlayers[0]?.team?.club?.sport as Sport) || 'FOOTBALL';
  const teamIds = player.teamPlayers.map((tp) => tp.teamId);

  // Get upcoming matches for player's teams
  const upcomingMatches = teamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'SCHEDULED',
          kickOffTime: { gte: new Date() },
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
          ],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 3,
      })
    : [];

  // Get recent match results for form calculation
  const recentMatches = teamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          status: 'FINISHED',
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
          ],
        },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
        orderBy: { kickOffTime: 'desc' },
        take: 5,
      })
    : [];

  // Calculate recent form
  const recentForm: ('W' | 'D' | 'L')[] = recentMatches.map((m) => {
    const isHome = teamIds.includes(m.homeTeamId);
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const theirScore = isHome ? m.awayScore : m.homeScore;
    if (ourScore === null || theirScore === null) return 'D';
    if (ourScore > theirScore) return 'W';
    if (ourScore < theirScore) return 'L';
    return 'D';
  });

  const currentStats = player.statistics[0];

  return {
    stats: {
      goals: currentStats?.goals || 0,
      assists: currentStats?.assists || 0,
      matches: currentStats?.matches || 0,
      averageRating: currentStats?.averageRating || null,
    },
    teams: player.teamPlayers.map((tp) => ({
      id: tp.team.id,
      name: tp.team.name,
      isCaptain: tp.isCaptain,
      club: tp.team.club,
      sport: (tp.team.club.sport as Sport) || 'FOOTBALL',
    })),
    upcomingMatches: upcomingMatches.map((m) => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      isHome: teamIds.includes(m.homeTeamId),
    })),
    recentForm,
    primarySport,
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const data = await getPlayerDashboardData(session.user.id);
  const sport = data?.primarySport || 'FOOTBALL';
  const sportConfig = SPORT_CONFIGS[sport];
  const statLabels = getStatLabels(sport);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          <span className="text-4xl">{sportConfig.icon}</span> Player Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Track your {sportConfig.name} performance, stats, and upcoming matches
        </p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label={statLabels.primaryStat}
          value={data?.stats.goals || 0}
          icon={<Target className="w-8 h-8 text-green-500" />}
          hoverColor="hover:border-green-400 dark:hover:border-green-600"
        />
        <StatCard
          label={statLabels.secondaryStat}
          value={data?.stats.assists || 0}
          icon={<Activity className="w-8 h-8 text-blue-500" />}
          hoverColor="hover:border-blue-400 dark:hover:border-blue-600"
        />
        <StatCard
          label="Matches Played"
          value={data?.stats.matches || 0}
          icon={<Calendar className="w-8 h-8 text-purple-500" />}
          hoverColor="hover:border-purple-400 dark:hover:border-purple-600"
        />
        <StatCard
          label="Match Rating"
          value={data?.stats.averageRating?.toFixed(1) || '-'}
          icon={<Award className="w-8 h-8 text-orange-500" />}
          hoverColor="hover:border-orange-400 dark:hover:border-orange-600"
        />
      </div>

      {/* RECENT FORM */}
      {data?.recentForm && data.recentForm.length > 0 && (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            Recent Form
          </h2>
          <div className="flex items-center gap-2">
            {data.recentForm.map((result, idx) => (
              <span
                key={idx}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                  result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-orange-400'
                }`}
              >
                {result}
              </span>
            ))}
            <span className="ml-4 text-sm text-charcoal-600 dark:text-charcoal-400">
              Last {data.recentForm.length} matches
            </span>
          </div>
        </div>
      )}

      {/* QUICK ACCESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAccessCard
          href="/dashboard/player/stats"
          icon={<TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title={`${sportConfig.name} Statistics`}
          description={`View detailed ${sportConfig.name.toLowerCase()} performance stats`}
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAccessCard
          href="/dashboard/player/fixtures"
          icon={<Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Match Schedule"
          description={`View upcoming ${sportConfig.name.toLowerCase()} fixtures and history`}
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAccessCard
          href="/dashboard/player/teams"
          icon={<Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="My Teams"
          description="Team roster, standings, and team information"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
      </div>

      {/* MORE QUICK ACCESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAccessCard
          href="/dashboard/player/achievements"
          icon={<Award className="w-8 h-8 text-gold-600 dark:text-gold-400" />}
          title="Achievements"
          description="Unlock badges, earn XP, and climb the ranks"
          gradient="from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20"
          borderColor="border-gold-200 dark:border-gold-800 hover:border-gold-400"
        />
        <QuickAccessCard
          href="/dashboard/player/profile"
          icon={<Users className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
          title="My Profile"
          description="Manage your player profile and preferences"
          gradient="from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
          borderColor="border-pink-200 dark:border-pink-800 hover:border-pink-400"
        />
      </div>

      {/* MY TEAMS */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              My Teams
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Teams you&apos;re currently playing for</p>
          </div>
          <Link
            href="/dashboard/player/browse-teams"
            className="px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <Search className="w-4 h-4" /> Find Teams
          </Link>
        </div>

        <div className="p-6">
          {!data?.teams || data.teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No teams yet</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Browse and join teams to start playing</p>
              <Link
                href="/dashboard/player/browse-teams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg"
              >
                <Search className="w-4 h-4" /> Browse Teams
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {data.teams.map((team) => {
                const teamSportConfig = SPORT_CONFIGS[team.sport];
                return (
                  <Link
                    key={team.id}
                    href={`/dashboard/teams/${team.id}`}
                    className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md text-2xl">
                      {teamSportConfig.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400">
                          {team.name}
                        </p>
                        {team.isCaptain && (
                          <span className="px-2 py-0.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Captain
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
                        <span>{teamSportConfig.icon}</span> {team.club.name}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-charcoal-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* UPCOMING MATCHES */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming Matches
          </h2>
          <Link href="/dashboard/player/fixtures" className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6">
          {!data?.upcomingMatches || data.upcomingMatches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No upcoming matches</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">Join a team to see your match schedule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.upcomingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-charcoal-900 dark:text-white">
                        {new Date(match.kickOffTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {new Date(match.kickOffTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-neutral-300 dark:bg-charcoal-600" />
                    <div>
                      <p className="font-semibold text-charcoal-900 dark:text-white">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </p>
                      {match.venue && (
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {match.venue}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${match.isHome ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                    {match.isHome ? 'Home' : 'Away'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold-500" />
            Activity Feed
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No activity yet</h3>
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-4">
              Follow teams and players to see their updates here
            </p>
            <Link
              href="/dashboard/player/discover"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm"
            >
              <Search className="w-4 h-4" /> Discover
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, hoverColor }: { label: string; value: number | string; icon: React.ReactNode; hoverColor: string }) {
  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${hoverColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1 font-medium">{label}</p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAccessCard({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}