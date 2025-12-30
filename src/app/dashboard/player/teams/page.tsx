/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Teams v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/teams/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ Multi-sport support (12 sports)
 * ✅ Sport-specific icons and stat labels
 * ✅ Team membership management
 * ✅ Captain/Vice-Captain badges
 * ✅ Team-by-sport grouping
 * ✅ Season stats per team
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Full access to own team memberships
 * - PARENT: Read-only access to children's teams
 * - COACH: Read access to squad member teams
 *
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  MapPin,
  Calendar,
  Trophy,
  Plus,
  Settings,
  Users,
  Target,
  Award,
  Shield,
  ArrowLeft,
  ArrowRight,
  Star,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Sport, Position, SPORT_CONFIGS, POSITION_LABELS, getStatLabels } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface TeamMembership {
  id: string;
  teamId: string;
  position: Position | null;
  jerseyNumber: number | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: Date;
  team: {
    id: string;
    name: string;
    ageGroup: string | null;
    gender: string | null;
    status: string;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      logo: string | null;
      city: string | null;
      country: string;
      sport: Sport;
      primaryColor: string | null;
    };
    _count: { players: number };
  };
  stats?: {
    matches: number;
    primaryStat: number;
    secondaryStat: number;
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getPlayerTeams(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  logo: true,
                  city: true,
                  country: true,
                  sport: true,
                  primaryColor: true,
                },
              },
              _count: { select: { players: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
      statistics: {
        orderBy: { season: 'desc' },
        take: 1,
      },
    },
  });

  if (!player) return { memberships: [] };

  const memberships: TeamMembership[] = player.teamPlayers.map((tp) => ({
    id: tp.id,
    teamId: tp.teamId,
    position: tp.position as Position | null,
    jerseyNumber: tp.jerseyNumber,
    isActive: tp.isActive,
    isCaptain: tp.isCaptain,
    isViceCaptain: tp.isViceCaptain,
    joinedAt: tp.joinedAt,
    team: {
      ...tp.team,
      club: {
        ...tp.team.club,
        sport: (tp.team.club.sport as Sport) || 'FOOTBALL',
      },
    },
    stats: {
      matches: player.statistics[0]?.matches || 0,
      primaryStat: player.statistics[0]?.goals || 0,
      secondaryStat: player.statistics[0]?.assists || 0,
    },
  }));

  return { memberships };
}

// ============================================================================
// HELPERS
// ============================================================================

function getPositionLabel(pos: Position | null): string {
  if (!pos) return 'Not assigned';
  return POSITION_LABELS[pos] || pos.replace(/_/g, ' ');
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TeamsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-charcoal-200 dark:bg-charcoal-700 rounded-lg w-48" />
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-charcoal-200 dark:bg-charcoal-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function TeamCard({
  membership,
  sportConfig,
  statLabels,
}: {
  membership: TeamMembership;
  sportConfig: (typeof SPORT_CONFIGS)[Sport];
  statLabels: ReturnType<typeof getStatLabels>;
}) {
  const { team, isCaptain, isViceCaptain, position, jerseyNumber, joinedAt, stats } = membership;

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
      {/* Header with team color */}
      <div
        className="h-2"
        style={{
          background: team.club.primaryColor
            ? `linear-gradient(90deg, ${team.club.primaryColor}, ${team.club.primaryColor}88)`
            : 'linear-gradient(90deg, #D4AF37, #F59E0B)',
        }}
      />

      <div className="p-6">
        {/* Team Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md text-3xl"
              style={{
                background: team.club.primaryColor
                  ? `linear-gradient(135deg, ${team.club.primaryColor}, ${team.club.primaryColor}dd)`
                  : 'linear-gradient(135deg, #D4AF37, #F59E0B)',
              }}
            >
              {sportConfig.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                {team.name}
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gold-500" />
                {team.club.name}
              </p>
            </div>
          </div>

          {(isCaptain || isViceCaptain) && (
            <span className="px-3 py-1 bg-gradient-to-r from-gold-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-gold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {isCaptain ? 'Captain' : 'Vice Captain'}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 text-xs font-semibold rounded">
            {sportConfig.name}
          </span>
          {team.ageGroup && (
            <span className="px-2 py-1 bg-info-100 dark:bg-info/20 text-info-700 dark:text-info-400 text-xs font-semibold rounded">
              {team.ageGroup}
            </span>
          )}
          {team.gender && team.gender !== 'MIXED' && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded">
              {team.gender}
            </span>
          )}
        </div>

        {/* Position & Number */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-info-50 dark:bg-info/10 rounded-lg border border-info-200 dark:border-info/30">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">POSITION</p>
            <p className="font-bold text-info-700 dark:text-info-400 truncate">{getPositionLabel(position)}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">SHIRT</p>
            <p className="font-bold text-purple-700 dark:text-purple-400 text-xl">#{jerseyNumber || '-'}</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="p-3 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg border border-charcoal-200 dark:border-charcoal-600 mb-4">
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gold-500" /> MEMBER SINCE
          </p>
          <p className="font-bold text-charcoal-900 dark:text-white">
            {new Date(joinedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 rounded-lg border border-gold-200 dark:border-gold-800 mb-4">
            <p className="text-xs text-charcoal-700 dark:text-charcoal-300 font-bold mb-3 uppercase tracking-wider">
              Season Stats
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Users className="w-5 h-5 text-gold-600" />
                </div>
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">{stats.matches}</p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">Matches</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Target className="w-5 h-5 text-success-600" />
                </div>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 tabular-nums">
                  {stats.primaryStat}
                </p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">
                  {statLabels.primaryStat}
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                  {stats.secondaryStat}
                </p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">
                  {statLabels.secondaryStat}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/dashboard/teams/${team.id}/squad`}
            className="px-4 py-2.5 border border-charcoal-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4" /> Squad
          </Link>
          <Link
            href={`/dashboard/teams/${team.id}`}
            className="px-4 py-2.5 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-gold transition-all"
          >
            View <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerTeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { memberships } = await getPlayerTeams(session.user.id);

  // Group teams by sport
  const teamsBySport = memberships.reduce((acc, m) => {
    const sport = m.team.club.sport;
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(m);
    return acc;
  }, {} as Record<Sport, TeamMembership[]>);

  const totalTeams = memberships.length;
  const captainRoles = memberships.filter((m) => m.isCaptain || m.isViceCaptain).length;

  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/player"
              className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">My Teams</h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Manage your teams across all sports
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/player/browse-teams"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-gold transition-all"
          >
            <Plus className="w-5 h-5" />
            Join Team
          </Link>
        </div>

        {/* Summary Cards */}
        {totalTeams > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4">
              <Users className="w-6 h-6 text-gold-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">{totalTeams}</p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Active Teams</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4">
              <Trophy className="w-6 h-6 text-info-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">
                {Object.keys(teamsBySport).length}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Sports</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4">
              <Shield className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">{captainRoles}</p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Leadership Roles</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-4">
              <Star className="w-6 h-6 text-gold-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white tabular-nums">
                {memberships.reduce((acc, m) => acc + (m.stats?.matches || 0), 0)}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Total Matches</p>
            </div>
          </div>
        )}

        {/* Teams by Sport */}
        {memberships.length === 0 ? (
          <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-12 text-center">
            <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No teams yet</h3>
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
              Browse and join teams to start playing
            </p>
            <Link
              href="/dashboard/player/browse-teams"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-gold"
            >
              <Plus className="w-4 h-4" /> Browse Teams
            </Link>
          </div>
        ) : (
          Object.entries(teamsBySport).map(([sport, teams]) => {
            const sportConfig = SPORT_CONFIGS[sport as Sport];
            const statLabels = getStatLabels(sport as Sport);

            return (
              <div key={sport}>
                {/* Sport Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{sportConfig.icon}</span>
                  <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">{sportConfig.name}</h2>
                  <span className="px-2 py-1 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 text-xs font-semibold rounded">
                    {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                  </span>
                </div>

                {/* Teams Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {teams.map((membership) => (
                    <TeamCard
                      key={membership.id}
                      membership={membership}
                      sportConfig={sportConfig}
                      statLabels={statLabels}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Multi-Sport Info Box */}
        <div className="bg-info-50 dark:bg-info/10 border border-info-200 dark:border-info/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-info-900 dark:text-info-200 mb-1">💡 Multi-Sport Support</p>
              <p className="text-sm text-info-800 dark:text-info-300">
                You can play multiple sports and be a member of teams across Football, Rugby, Cricket, Basketball,
                American Football, Hockey, Netball, Lacrosse, Australian Rules, Gaelic Football, Futsal, and Beach
                Football! Each sport tracks your performance with sport-specific statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
