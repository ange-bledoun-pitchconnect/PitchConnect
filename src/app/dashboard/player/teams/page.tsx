/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Player Teams v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/teams/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport-specific icons per team
 * ✅ Sport-specific stat labels
 * ✅ Sport-specific positions displayed
 * ✅ Multi-sport team membership
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  MapPin, Calendar, Trophy, Plus, Settings, Users, Target, Award,
  Shield, ArrowLeft, ArrowRight,
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
  stats?: { matches: number; primaryStat: number; secondaryStat: number };
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
              club: { select: { id: true, name: true, shortName: true, logo: true, city: true, country: true, sport: true, primaryColor: true } },
              _count: { select: { players: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
      statistics: { orderBy: { season: 'desc' }, take: 1 },
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
      club: { ...tp.team.club, sport: (tp.team.club.sport as Sport) || 'FOOTBALL' },
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
// MAIN PAGE COMPONENT
// ============================================================================

export default async function PlayerTeamsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const { memberships } = await getPlayerTeams(session.user.id);

  // Group teams by sport
  const teamsBySport = memberships.reduce((acc, m) => {
    const sport = m.team.club.sport;
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(m);
    return acc;
  }, {} as Record<Sport, TeamMembership[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
            <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">My Teams</h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">Manage your teams across all sports</p>
          </div>
        </div>
        <Link
          href="/dashboard/player/browse-teams"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Join Team
        </Link>
      </div>

      {/* TEAMS BY SPORT */}
      {memberships.length === 0 ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-12 text-center">
          <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No teams yet</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Browse and join teams to start playing</p>
          <Link
            href="/dashboard/player/browse-teams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg"
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
                <span className="px-2 py-1 bg-neutral-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 text-xs font-semibold rounded">
                  {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                </span>
              </div>

              {/* Teams Grid */}
              <div className="grid md:grid-cols-2 gap-6">
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

      {/* INFO BOX */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">💡 Multi-Sport Support</p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              You can play multiple sports and be a member of teams across Football, Netball, Rugby, Basketball, Cricket, Hockey, and more! Each sport tracks your performance with sport-specific statistics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEAM CARD COMPONENT
// ============================================================================

function TeamCard({ membership, sportConfig, statLabels }: { 
  membership: TeamMembership; 
  sportConfig: typeof SPORT_CONFIGS.FOOTBALL;
  statLabels: ReturnType<typeof getStatLabels>;
}) {
  const { team, isCaptain, isViceCaptain, position, jerseyNumber, joinedAt, stats } = membership;

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm overflow-hidden hover:shadow-lg transition-all">
      {/* Header */}
      <div 
        className="p-6 border-b border-neutral-200 dark:border-charcoal-700"
        style={{ 
          background: team.club.primaryColor 
            ? `linear-gradient(135deg, ${team.club.primaryColor}15 0%, transparent 100%)` 
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%)' 
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{sportConfig.icon}</span>
              <h3 className="text-xl font-bold text-charcoal-900 dark:text-white">{team.name}</h3>
            </div>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gold-500" />
              {team.club.name}
            </p>
          </div>
          {(isCaptain || isViceCaptain) && (
            <span className="px-3 py-1 bg-gradient-to-r from-gold-500 to-orange-400 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {isCaptain ? 'Captain' : 'Vice Captain'}
            </span>
          )}
        </div>
        {team.ageGroup && (
          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded">
            {team.ageGroup}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Position & Number */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">POSITION</p>
            <p className="font-bold text-blue-700 dark:text-blue-400">{getPositionLabel(position)}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">SHIRT NUMBER</p>
            <p className="font-bold text-purple-700 dark:text-purple-400 text-xl">#{jerseyNumber || '-'}</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600">
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gold-500" /> MEMBER SINCE
          </p>
          <p className="font-bold text-charcoal-900 dark:text-white">
            {new Date(joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats - Sport-specific labels */}
        {stats && (
          <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 rounded-lg border border-gold-200 dark:border-gold-800">
            <p className="text-xs text-charcoal-700 dark:text-charcoal-300 font-bold mb-3 uppercase tracking-wider">Season Stats</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Users className="w-5 h-5 text-gold-600" />
                </div>
                <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{stats.matches}</p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">Matches</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.primaryStat}</p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">{statLabels.primaryStat}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white dark:bg-charcoal-800 rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200 dark:border-gold-800">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.secondaryStat}</p>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">{statLabels.secondaryStat}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href={`/dashboard/teams/${team.id}/squad`}
            className="px-4 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700 font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Squad
          </Link>
          <Link
            href={`/dashboard/teams/${team.id}/settings`}
            className="px-4 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700 font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
        </div>
      </div>
    </div>
  );
}