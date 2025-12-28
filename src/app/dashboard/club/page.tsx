/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Club Dashboard v2.0
 * Path: src/app/dashboard/club/page.tsx
 * ============================================================================
 * 
 * FIXED: Uses correct Prisma schema:
 * - Matches are between Teams (homeTeam/awayTeam), not Clubs
 * - Queries matches via team IDs
 * 
 * Unified dashboard for CLUB_OWNER, CLUB_MANAGER, CLUB_ADMIN roles
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Building2, Users, Trophy, Calendar, DollarSign, Settings, ArrowRight,
  MapPin, Clock, Shield, Star,
} from 'lucide-react';
import { SPORT_CONFIGS, Sport } from '@/types/player';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getClubDashboardData(userId: string) {
  // Get user's club associations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedClubs: true,
      managedClubs: true,
      clubMemberships: { 
        where: { isActive: true },
        include: { club: true } 
      },
    },
  });

  if (!user) return null;

  // Combine all clubs user has access to (ownedClubs and managedClubs are Club[] directly)
  const ownedClubIds = user.ownedClubs.map(c => c.id);
  const managedClubIds = user.managedClubs.map(c => c.id);
  const memberClubIds = user.clubMemberships.map(cm => cm.clubId);
  const allClubIds = [...new Set([...ownedClubIds, ...managedClubIds, ...memberClubIds])];

  if (allClubIds.length === 0) {
    return { hasClub: false, clubs: [], stats: null, upcomingMatches: [], recentActivity: [] };
  }

  // Get detailed club data with teams
  const clubs = await prisma.club.findMany({
    where: { id: { in: allClubIds } },
    include: {
      teams: {
        select: {
          id: true,
          name: true,
          _count: { select: { players: true, coaches: true } },
        },
      },
      _count: {
        select: {
          teams: true,
          members: true,
        },
      },
    },
  });

  // Get all team IDs from all clubs
  const allTeamIds = clubs.flatMap(c => c.teams.map(t => t.id));

  // Calculate aggregate stats
  const totalTeams = clubs.reduce((sum, c) => sum + c._count.teams, 0);
  const totalMembers = clubs.reduce((sum, c) => sum + c._count.members, 0);
  const totalPlayers = clubs.reduce((sum, c) => 
    sum + c.teams.reduce((ts, t) => ts + t._count.players, 0), 0);
  const totalCoaches = clubs.reduce((sum, c) => 
    sum + c.teams.reduce((ts, t) => ts + t._count.coaches, 0), 0);

  // Get upcoming matches for club's teams
  const upcomingMatches = allTeamIds.length > 0
    ? await prisma.match.findMany({
        where: {
          OR: [
            { homeTeamId: { in: allTeamIds } },
            { awayTeamId: { in: allTeamIds } },
          ],
          status: 'SCHEDULED',
          kickOffTime: { gte: new Date() },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: { kickOffTime: 'asc' },
        take: 5,
      })
    : [];

  // Determine user's role in clubs
  const clubsWithRoles = clubs.map(club => ({
    ...club,
    isOwner: ownedClubIds.includes(club.id),
    isManager: managedClubIds.includes(club.id),
    isMember: memberClubIds.includes(club.id),
  }));

  return {
    hasClub: true,
    clubs: clubsWithRoles,
    stats: {
      totalClubs: clubs.length,
      totalTeams,
      totalPlayers,
      totalCoaches,
      totalMembers,
      totalMatches: upcomingMatches.length,
    },
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      kickOffTime: m.kickOffTime,
      venue: m.venue,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name },
      isHome: allTeamIds.includes(m.homeTeamId),
      sport: (m.homeTeam.sport as Sport) || 'FOOTBALL',
    })),
    recentActivity: [],
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function ClubDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getClubDashboardData(session.user.id);

  if (!data?.hasClub) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Building2 className="w-24 h-24 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-4">
            No Clubs Yet
          </h2>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-8 max-w-md mx-auto">
            You&apos;re not associated with any clubs. Create a new club or request to join an existing one.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard/clubs/create"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Create a Club
            </Link>
            <Link
              href="/dashboard/clubs/browse"
              className="px-6 py-3 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 font-semibold rounded-lg transition-all"
            >
              Browse Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          🏢 Club Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage your clubs, teams, members, and operations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Clubs" value={data.stats?.totalClubs || 0} icon={<Building2 className="w-6 h-6 text-indigo-500" />} />
        <StatCard label="Teams" value={data.stats?.totalTeams || 0} icon={<Trophy className="w-6 h-6 text-gold-500" />} />
        <StatCard label="Players" value={data.stats?.totalPlayers || 0} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard label="Coaches" value={data.stats?.totalCoaches || 0} icon={<Star className="w-6 h-6 text-green-500" />} />
        <StatCard label="Members" value={data.stats?.totalMembers || 0} icon={<Users className="w-6 h-6 text-purple-500" />} />
        <StatCard label="Upcoming" value={data.stats?.totalMatches || 0} icon={<Calendar className="w-6 h-6 text-orange-500" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction href="/dashboard/club/teams" icon={<Trophy className="w-8 h-8 text-gold-600 dark:text-gold-400" />} title="Team Management" description="Manage teams, rosters, and squads" gradient="from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20" borderColor="border-gold-200 dark:border-gold-800 hover:border-gold-400" />
        <QuickAction href="/dashboard/club/members" icon={<Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />} title="Member Management" description="Staff, coaches, and personnel" gradient="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400" />
        <QuickAction href="/dashboard/club/finances" icon={<DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />} title="Finances" description="Budgets, invoices, and payments" gradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" borderColor="border-green-200 dark:border-green-800 hover:border-green-400" />
        <QuickAction href="/dashboard/club/settings" icon={<Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />} title="Club Settings" description="Configuration and preferences" gradient="from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20" borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400" />
      </div>

      {/* My Clubs */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              My Clubs
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Clubs you own or manage</p>
          </div>
          <Link href="/dashboard/clubs/create" className="px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
            Create Club
          </Link>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.clubs.map((club) => {
              const sportConfig = SPORT_CONFIGS[(club.sport as Sport)] || SPORT_CONFIGS.FOOTBALL;
              return (
                <Link key={club.id} href={`/dashboard/clubs/${club.id}`} className="group p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md text-2xl">
                      {sportConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-charcoal-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">{club.name}</p>
                        {club.isOwner && (
                          <span className="px-2 py-0.5 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Owner
                          </span>
                        )}
                        {club.isManager && !club.isOwner && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                            Manager
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                        {club._count.teams} teams • {club._count.members} members
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Matches */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Upcoming Matches
          </h2>
          <Link href="/dashboard/club/fixtures" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
            View All
          </Link>
        </div>
        <div className="p-6">
          {data.upcomingMatches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No upcoming matches</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">Matches will appear here when scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingMatches.map((match) => {
                const sportConfig = SPORT_CONFIGS[match.sport] || SPORT_CONFIGS.FOOTBALL;
                return (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl border border-neutral-200 dark:border-charcoal-600">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{sportConfig.icon}</span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Manage</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}