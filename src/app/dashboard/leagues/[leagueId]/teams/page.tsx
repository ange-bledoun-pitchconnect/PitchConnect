// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE TEAMS MANAGEMENT v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/teams/page.tsx
// Purpose: Team management with invite (admin) and request (team manager) system
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ LEAGUE_ADMIN: Can invite any team
// ✅ TEAM_MANAGER: Can request to join
// ✅ Multi-sport support (12 sports)
// ✅ Teams in league display
// ✅ Available teams search
// ✅ Pending invitations tracking
// ✅ Join requests tracking
// ✅ Team removal (admin only)
// ✅ Registration status awareness
// ✅ Dark mode + responsive design
// ✅ Schema-aligned data models
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TeamsManagementClient from './TeamsManagementClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface TeamInLeague {
  id: string;
  name: string;
  ageGroup: string | null;
  category: string;
  joinedAt: Date;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  } | null;
}

interface AvailableTeam {
  id: string;
  name: string;
  ageGroup: string | null;
  category: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  } | null;
}

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  status: string;
  type: 'INVITE' | 'REQUEST';
  createdAt: Date;
  expiresAt: Date | null;
  message: string | null;
  createdBy: {
    firstName: string;
    lastName: string;
  } | null;
}

interface LeagueTeamsData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  isPublic: boolean;
  configuration: {
    maxTeams: number | null;
    registrationOpen: boolean;
  } | null;
  stats: {
    teamsInLeague: number;
    pendingInvitations: number;
    pendingRequests: number;
    availableTeams: number;
  };
  teamsInLeague: TeamInLeague[];
  availableTeams: AvailableTeam[];
  pendingInvitations: Invitation[];
  pendingRequests: Invitation[];
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

async function getLeagueTeamsData(leagueId: string, userId?: string): Promise<{
  data: LeagueTeamsData | null;
  isAdmin: boolean;
  isTeamManager: boolean;
  userTeamIds: string[];
}> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      configuration: {
        select: { maxTeams: true, registrationOpen: true },
      },
      teams: {
        include: {
          club: { select: { id: true, name: true, city: true, country: true } },
        },
        orderBy: { name: 'asc' },
      },
      invitations: {
        where: { status: 'PENDING' },
        include: {
          team: { select: { name: true } },
          createdByUser: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!league) return { data: null, isAdmin: false, isTeamManager: false, userTeamIds: [] };

  // Check user roles
  let isAdmin = false;
  let isTeamManager = false;
  let userTeamIds: string[] = [];

  if (userId) {
    // Check league admin
    const leagueAdmin = await prisma.leagueAdminLeague.findFirst({
      where: {
        leagueId,
        leagueAdmin: { userId },
      },
    });
    isAdmin = !!leagueAdmin;

    // Check team manager
    const userTeamManagerRoles = await prisma.teamManager.findMany({
      where: { userId },
      select: { teamId: true },
    });
    userTeamIds = userTeamManagerRoles.map(tm => tm.teamId);
    isTeamManager = userTeamIds.length > 0;
  }

  // Get available teams (not in this league, matching sport)
  const leagueTeamIds = league.teams.map(t => t.id);
  const invitedTeamIds = league.invitations.map(i => i.teamId);

  const availableTeams = await prisma.team.findMany({
    where: {
      id: { notIn: [...leagueTeamIds, ...invitedTeamIds] },
      sport: league.sport,
      status: 'ACTIVE',
    },
    include: {
      club: { select: { id: true, name: true, city: true, country: true } },
    },
    orderBy: { name: 'asc' },
    take: 50,
  });

  // Separate invitations and requests
  const pendingInvitations = league.invitations
    .filter(i => i.type === 'INVITE')
    .map(i => ({
      id: i.id,
      teamId: i.teamId,
      teamName: i.team.name,
      status: i.status,
      type: 'INVITE' as const,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      message: i.message,
      createdBy: i.createdByUser,
    }));

  const pendingRequests = league.invitations
    .filter(i => i.type === 'REQUEST')
    .map(i => ({
      id: i.id,
      teamId: i.teamId,
      teamName: i.team.name,
      status: i.status,
      type: 'REQUEST' as const,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
      message: i.message,
      createdBy: i.createdByUser,
    }));

  return {
    data: {
      id: league.id,
      name: league.name,
      code: league.code,
      sport: league.sport as Sport,
      isPublic: league.visibility === 'PUBLIC',
      configuration: league.configuration,
      stats: {
        teamsInLeague: league.teams.length,
        pendingInvitations: pendingInvitations.length,
        pendingRequests: pendingRequests.length,
        availableTeams: availableTeams.length,
      },
      teamsInLeague: league.teams.map(t => ({
        id: t.id,
        name: t.name,
        ageGroup: t.ageGroup,
        category: t.category,
        joinedAt: t.createdAt, // Using createdAt as joinedAt for now
        club: t.club,
      })),
      availableTeams: availableTeams.map(t => ({
        id: t.id,
        name: t.name,
        ageGroup: t.ageGroup,
        category: t.category,
        club: t.club,
      })),
      pendingInvitations,
      pendingRequests,
    },
    isAdmin,
    isTeamManager,
    userTeamIds,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeagueTeamsPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const { data, isAdmin, isTeamManager, userTeamIds } = await getLeagueTeamsData(
    params.leagueId, 
    session?.user?.id
  );

  if (!data) {
    notFound();
  }

  // Check access for private leagues
  if (!data.isPublic && !session?.user) {
    notFound();
  }

  const sportConfig = SPORT_CONFIG[data.sport];

  return (
    <TeamsManagementClient
      leagueId={params.leagueId}
      league={data}
      sportConfig={sportConfig}
      isAdmin={isAdmin}
      isTeamManager={isTeamManager}
      userTeamIds={userTeamIds}
    />
  );
}