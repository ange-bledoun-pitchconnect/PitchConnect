import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { CoachDashboardClient } from './components/CoachDashboardClient';
import { prisma } from '@/lib/prisma';

export default async function CoachDashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get current user with coach profile
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      coachProfile: {
        include: {
          teams: {
            include: {
              club: true,
            },
          },
        },
      },
    },
  });

  // Get all team IDs this coach manages
  const allTeamIds = user?.coachProfile?.teams.map(t => t.id) || [];

  // If coach has no teams, show empty state
  if (allTeamIds.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            No Teams Assigned
          </h1>
          <p className="text-gray-400">
            You are not currently assigned to any teams.
          </p>
        </div>
      </div>
    );
  }

  // FETCH ALL DATA SERVER-SIDE (filtered by all accessible teams)
  
  // 1. Squad Data
  const squadData = await prisma.team.findMany({
    where: {
      id: { in: allTeamIds },
    },
    include: {
      players: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { jerseyNumber: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // 2. Recent Matches
  const recentMatches = await prisma.match.findMany({
    where: {
      OR: [
        { homeTeamId: { in: allTeamIds } },
        { awayTeamId: { in: allTeamIds } },
      ],
      status: 'COMPLETED',
    },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 10,
  });

  // 3. Upcoming Matches
  const upcomingMatches = await prisma.match.findMany({
    where: {
      OR: [
        { homeTeamId: { in: allTeamIds } },
        { awayTeamId: { in: allTeamIds } },
      ],
      status: 'SCHEDULED',
      date: { gte: new Date() },
    },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
    take: 5,
  });

  // 4. Top Performers (aggregate stats)
  const playerProfiles = await prisma.player.findMany({
    where: {
      teams: {
        some: {
          id: { in: allTeamIds },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      stats: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      goals: 'desc',
    },
    take: 10,
  });

  // Serialize data for client component (remove Date objects)
  const serializedData = {
    user: {
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      createdAt: user?.createdAt.toISOString(),
      updatedAt: user?.updatedAt.toISOString(),
    },
    squadData: squadData.map(team => ({
      teamId: team.id,
      teamName: team.name,
      players: team.players.map(player => ({
        id: player.id,
        userId: player.userId,
        user: player.user,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        height: player.height,
        weight: player.weight,
        stats: {
          goals: player.goals || 0,
          assists: player.assists || 0,
          minutesPlayed: player.minutesPlayed || 0,
          appearances: player.appearances || 0,
        },
      })),
    })),
    recentMatches: recentMatches.map(m => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date.toISOString(),
      venue: m.venue,
      status: m.status,
    })),
    upcomingMatches: upcomingMatches.map(m => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      date: m.date.toISOString(),
      venue: m.venue,
      status: m.status,
    })),
    topPerformers: playerProfiles.map(player => ({
      playerId: player.id,
      goals: player.goals || 0,
      assists: player.assists || 0,
      minutesPlayed: player.minutesPlayed || 0,
      appearances: player.appearances || 0,
      player: {
        id: player.id,
        user: player.user,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
      },
    })),
  };

  // Pass ALL data to client component
  return <CoachDashboardClient data={serializedData} />;
}
