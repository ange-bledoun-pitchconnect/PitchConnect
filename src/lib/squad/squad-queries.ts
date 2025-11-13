import { prisma } from '@/lib/prisma';

export async function getCoachSquadByTeams(teamIds: string[]) {
  const teams = await prisma.team.findMany({
    where: {
      id: { in: teamIds },
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

  return teams.map(team => ({
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
      currentTeamId: player.currentTeamId,
      stats: {
        goals: player.goals || 0,
        assists: player.assists || 0,
        minutesPlayed: player.minutesPlayed || 0,
        appearances: player.appearances || 0,
      },
    })),
  }));
}
