import { prisma } from '@/lib/prisma';

// ========================================
// TYPES
// ========================================

interface PlayerStats {
  goals: number;
  assists: number;
  minutesPlayed: number;
  appearances: number;
}

interface SquadPlayer {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  position: string;
  shirtNumber: number | null;
  stats: PlayerStats;
}

interface TeamSquad {
  teamId: string;
  teamName: string;
  players: SquadPlayer[];
}

// ========================================
// QUERIES
// ========================================

/**
 * Get squad data for multiple teams (for coaches managing multiple teams)
 * @param teamIds - Array of team IDs
 * @returns Array of teams with their players and stats
 */
export async function getCoachSquadByTeams(
  teamIds: string[]
): Promise<TeamSquad[]> {
  const teams = await prisma.team.findMany({
    where: {
      id: { in: teamIds },
    },
    include: {
      players: {
        include: {
          player: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
              stats: {
                where: {
                  season: new Date().getFullYear(),
                },
                take: 1,
                orderBy: {
                  updatedAt: 'desc',
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    players: team.players.map(teamPlayer => {
      const player = teamPlayer.player;
      const currentSeasonStats = player.stats[0];

      return {
        id: player.id,
        userId: player.userId,
        user: player.user,
        position: player.position,
        shirtNumber: player.shirtNumber,
        stats: {
          goals: currentSeasonStats?.goals || 0,
          assists: currentSeasonStats?.assists || 0,
          minutesPlayed: currentSeasonStats?.minutesPlayed || 0,
          appearances: currentSeasonStats?.appearances || 0,
        },
      };
    }),
  }));
}

/**
 * Get single team squad with detailed player information
 * @param teamId - Team ID
 * @returns Team with players or null
 */
export async function getTeamSquad(teamId: string): Promise<TeamSquad | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        include: {
          player: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
              stats: {
                where: {
                  season: new Date().getFullYear(),
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  return {
    teamId: team.id,
    teamName: team.name,
    players: team.players.map(teamPlayer => {
      const player = teamPlayer.player;
      const currentSeasonStats = player.stats[0];

      return {
        id: player.id,
        userId: player.userId,
        user: player.user,
        position: player.position,
        shirtNumber: player.shirtNumber,
        stats: {
          goals: currentSeasonStats?.goals || 0,
          assists: currentSeasonStats?.assists || 0,
          minutesPlayed: currentSeasonStats?.minutesPlayed || 0,
          appearances: currentSeasonStats?.appearances || 0,
        },
      };
    }),
  };
}

/**
 * Get player details by ID with team information
 * @param playerId - Player ID
 * @returns Player with details or null
 */
export async function getPlayerDetails(playerId: string) {
  return await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          dateOfBirth: true,
        },
      },
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              clubId: true,
            },
          },
        },
      },
      stats: {
        orderBy: {
          season: 'desc',
        },
        take: 5,
      },
    },
  });
}

/**
 * Get squad statistics summary for a team
 * @param teamId - Team ID
 * @returns Statistics summary
 */
export async function getTeamSquadStats(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        include: {
          player: {
            include: {
              stats: {
                where: {
                  season: new Date().getFullYear(),
                },
              },
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  const currentSeason = new Date().getFullYear();
  const allStats = team.players.flatMap(tp =>
    tp.player.stats.filter(s => s.season === currentSeason)
  );

  return {
    totalPlayers: team.players.length,
    totalGoals: allStats.reduce((sum, s) => sum + s.goals, 0),
    totalAssists: allStats.reduce((sum, s) => sum + s.assists, 0),
    totalMinutes: allStats.reduce((sum, s) => sum + s.minutesPlayed, 0),
    totalAppearances: allStats.reduce((sum, s) => sum + s.appearances, 0),
    averageGoals: allStats.length > 0 ? allStats.reduce((sum, s) => sum + s.goals, 0) / allStats.length : 0,
    averageAssists: allStats.length > 0 ? allStats.reduce((sum, s) => sum + s.assists, 0) / allStats.length : 0,
  };
}
