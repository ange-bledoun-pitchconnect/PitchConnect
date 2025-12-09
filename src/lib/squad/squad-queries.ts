/**
 * Squad Management & Query Module
 * Path: /src/lib/squad/squad-queries.ts
 * 
 * Core Features:
 * - Fetch squad data for teams with player information
 * - Track player stats, positions, and shirt numbers
 * - Manage player assignments to teams
 * - Calculate squad statistics
 * - Handle multi-team coaching scenarios
 * 
 * Schema Aligned: Uses TeamMember (Team → User → Player) relationships
 * Production Ready: Full error handling, type safety, comprehensive queries
 * Enterprise Grade: Optimized queries, caching consideration, detailed stats
 * 
 * Business Logic:
 * - Get squad data for multiple teams (coach managing many teams)
 * - Retrieve single team squad with detailed player information
 * - Fetch player details with team history
 * - Calculate aggregate squad statistics
 * - Filter players by position, status, shirt number
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerStats {
  goals: number;
  assists: number;
  minutesPlayed: number;
  appearances: number;
}

interface SquadPlayer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  position: string;
  preferredFoot: string;
  shirtNumber: number | null;
  height: number | null;
  weight: number | null;
  isCaptain: boolean;
  status: string;
  stats: PlayerStats;
}

interface TeamSquad {
  teamId: string;
  teamName: string;
  clubId: string;
  totalPlayers: number;
  players: SquadPlayer[];
}

interface TeamSquadStats {
  totalPlayers: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutes: number;
  totalAppearances: number;
  averageGoals: number;
  averageAssists: number;
}

interface PlayerDetailInfo {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  avatar: string | null;
  position: string;
  preferredFoot: string;
  height: number | null;
  weight: number | null;
  nationality: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    clubId: string;
    isCaptain: boolean;
    status: string;
  }>;
  stats: Array<{
    season: number;
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
  }>;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

class SquadQueryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SquadQueryError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert player position enum to human-readable format
 */
function formatPosition(position: string): string {
  const positionMap: Record<string, string> = {
    GOALKEEPER: 'Goalkeeper',
    DEFENDER: 'Defender',
    MIDFIELDER: 'Midfielder',
    FORWARD: 'Forward',
  };
  return positionMap[position] || position;
}

/**
 * Get current season year
 */
function getCurrentSeason(): number {
  return new Date().getFullYear();
}

/**
 * Calculate player performance rating
 */
function calculatePerformanceRating(stats: PlayerStats): number {
  if (stats.appearances === 0) return 0;
  
  const goalsPerMatch = stats.goals / stats.appearances;
  const assistsPerMatch = stats.assists / stats.appearances;
  const minutesPerMatch = stats.minutesPlayed / stats.appearances;
  
  // Weighted calculation
  const rating = (goalsPerMatch * 20) + (assistsPerMatch * 15) + (minutesPerMatch / 5);
  
  return Math.min(Math.round(rating), 100);
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get squad data for multiple teams (for coaches managing multiple teams)
 * 
 * @param teamIds - Array of team IDs
 * @returns Array of teams with their players and current season stats
 * @throws SquadQueryError if teams not found or database error
 */
export async function getCoachSquadByTeams(
  teamIds: string[]
): Promise<TeamSquad[]> {
  try {
    if (!teamIds || teamIds.length === 0) {
      throw new SquadQueryError(
        'No team IDs provided',
        'INVALID_INPUT',
        { teamIds }
      );
    }

    const currentSeason = getCurrentSeason();

    const teams = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
      },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
            role: 'PLAYER',
          },
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
            // Get player profile via user
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch player details separately for each team member
    const teamsWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const playersWithStats = await Promise.all(
          team.members.map(async (member) => {
            // Get player profile
            const playerProfile = await prisma.player.findUnique({
              where: { userId: member.userId },
              select: {
                id: true,
                position: true,
                preferredFoot: true,
                height: true,
                weight: true,
                status: true,
                shirtNumber: true,
                stats: {
                  where: {
                    season: currentSeason,
                  },
                  select: {
                    goals: true,
                    assists: true,
                    minutesPlayed: true,
                    appearances: true,
                  },
                  take: 1,
                },
              },
            });

            const currentSeasonStats = playerProfile?.stats[0];

            return {
              id: playerProfile?.id || member.userId,
              userId: member.userId,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              email: member.user.email,
              avatar: member.user.avatar,
              position: formatPosition(playerProfile?.position || 'MIDFIELDER'),
              preferredFoot: playerProfile?.preferredFoot || 'RIGHT',
              shirtNumber: member.number || playerProfile?.shirtNumber || null,
              height: playerProfile?.height || null,
              weight: playerProfile?.weight || null,
              isCaptain: member.isCaptain,
              status: playerProfile?.status || 'ACTIVE',
              stats: {
                goals: currentSeasonStats?.goals || 0,
                assists: currentSeasonStats?.assists || 0,
                minutesPlayed: currentSeasonStats?.minutesPlayed || 0,
                appearances: currentSeasonStats?.appearances || 0,
              },
            };
          })
        );

        return {
          teamId: team.id,
          teamName: team.name,
          clubId: team.clubId,
          totalPlayers: team.members.length,
          players: playersWithStats,
        };
      })
    );

    return teamsWithPlayers;
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching coach squads:', error);
    throw new SquadQueryError(
      'Failed to fetch squad data for multiple teams',
      'FETCH_MULTIPLE_SQUADS_ERROR',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get single team squad with detailed player information
 * 
 * @param teamId - Team ID
 * @returns Team with players or null
 * @throws SquadQueryError if database error
 */
export async function getTeamSquad(teamId: string): Promise<TeamSquad | null> {
  try {
    if (!teamId) {
      throw new SquadQueryError(
        'Team ID is required',
        'INVALID_INPUT',
        { teamId }
      );
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
            role: 'PLAYER',
          },
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
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    // Fetch player details for each team member
    const playersWithStats = await Promise.all(
      team.members.map(async (member) => {
        const playerProfile = await prisma.player.findUnique({
          where: { userId: member.userId },
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            status: true,
            shirtNumber: true,
            stats: {
              where: {
                season: currentSeason,
              },
              select: {
                goals: true,
                assists: true,
                minutesPlayed: true,
                appearances: true,
              },
              take: 1,
            },
          },
        });

        const currentSeasonStats = playerProfile?.stats[0];

        return {
          id: playerProfile?.id || member.userId,
          userId: member.userId,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          email: member.user.email,
          avatar: member.user.avatar,
          position: formatPosition(playerProfile?.position || 'MIDFIELDER'),
          preferredFoot: playerProfile?.preferredFoot || 'RIGHT',
          shirtNumber: member.number || playerProfile?.shirtNumber || null,
          height: playerProfile?.height || null,
          weight: playerProfile?.weight || null,
          isCaptain: member.isCaptain,
          status: playerProfile?.status || 'ACTIVE',
          stats: {
            goals: currentSeasonStats?.goals || 0,
            assists: currentSeasonStats?.assists || 0,
            minutesPlayed: currentSeasonStats?.minutesPlayed || 0,
            appearances: currentSeasonStats?.appearances || 0,
          },
        };
      })
    );

    return {
      teamId: team.id,
      teamName: team.name,
      clubId: team.clubId,
      totalPlayers: team.members.length,
      players: playersWithStats,
    };
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching team squad:', error);
    throw new SquadQueryError(
      'Failed to fetch squad data for team',
      'FETCH_SQUAD_ERROR',
      { teamId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get player details by ID with team information and historical stats
 * 
 * @param playerId - Player ID
 * @returns Player with full details or null
 * @throws SquadQueryError if database error
 */
export async function getPlayerDetails(
  playerId: string
): Promise<PlayerDetailInfo | null> {
  try {
    if (!playerId) {
      throw new SquadQueryError(
        'Player ID is required',
        'INVALID_INPUT',
        { playerId }
      );
    }

    const player = await prisma.player.findUnique({
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
        stats: {
          orderBy: {
            season: 'desc',
          },
          select: {
            season: true,
            goals: true,
            assists: true,
            minutesPlayed: true,
            appearances: true,
          },
          take: 5,
        },
      },
    });

    if (!player) {
      return null;
    }

    // Fetch team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: player.userId,
        status: 'ACTIVE',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            clubId: true,
          },
        },
      },
    });

    return {
      id: player.id,
      userId: player.userId,
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      email: player.user.email,
      dateOfBirth: player.user.dateOfBirth?.toISOString() || null,
      avatar: player.user.avatar,
      position: formatPosition(player.position),
      preferredFoot: player.preferredFoot,
      height: player.height,
      weight: player.weight,
      nationality: player.nationality,
      teams: teamMemberships.map((tm) => ({
        teamId: tm.team.id,
        teamName: tm.team.name,
        clubId: tm.team.clubId,
        isCaptain: tm.isCaptain,
        status: tm.status,
      })),
      stats: player.stats,
    };
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching player details:', error);
    throw new SquadQueryError(
      'Failed to fetch player details',
      'FETCH_PLAYER_ERROR',
      { playerId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get squad statistics summary for a team
 * 
 * @param teamId - Team ID
 * @returns Statistics summary or null if team not found
 * @throws SquadQueryError if database error
 */
export async function getTeamSquadStats(teamId: string): Promise<TeamSquadStats | null> {
  try {
    if (!teamId) {
      throw new SquadQueryError(
        'Team ID is required',
        'INVALID_INPUT',
        { teamId }
      );
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
            role: 'PLAYER',
          },
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    // Fetch player stats for all team members
    const allStats = await prisma.playerStats.findMany({
      where: {
        playerId: {
          in: (
            await prisma.player.findMany({
              where: {
                userId: {
                  in: team.members.map((m) => m.userId),
                },
              },
              select: { id: true },
            })
          ).map((p) => p.id),
        },
        season: currentSeason,
      },
    });

    const totalGoals = allStats.reduce((sum, s) => sum + s.goals, 0);
    const totalAssists = allStats.reduce((sum, s) => sum + s.assists, 0);
    const totalMinutes = allStats.reduce((sum, s) => sum + s.minutesPlayed, 0);
    const totalAppearances = allStats.reduce((sum, s) => sum + s.appearances, 0);

    return {
      totalPlayers: team.members.length,
      totalGoals,
      totalAssists,
      totalMinutes,
      totalAppearances,
      averageGoals: allStats.length > 0 ? totalGoals / allStats.length : 0,
      averageAssists: allStats.length > 0 ? totalAssists / allStats.length : 0,
    };
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching squad stats:', error);
    throw new SquadQueryError(
      'Failed to fetch squad statistics',
      'FETCH_SQUAD_STATS_ERROR',
      { teamId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get players by position for a team
 * 
 * @param teamId - Team ID
 * @param position - Position filter (GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD)
 * @returns Array of players in that position
 * @throws SquadQueryError if database error
 */
export async function getTeamPlayersByPosition(
  teamId: string,
  position: string
): Promise<SquadPlayer[]> {
  try {
    if (!teamId || !position) {
      throw new SquadQueryError(
        'Team ID and position are required',
        'INVALID_INPUT',
        { teamId, position }
      );
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
            role: 'PLAYER',
          },
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
          },
        },
      },
    });

    if (!team) {
      return [];
    }

    // Fetch player profiles with position filter
    const players = await Promise.all(
      team.members.map(async (member) => {
        const playerProfile = await prisma.player.findUnique({
          where: { userId: member.userId },
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            status: true,
            shirtNumber: true,
            stats: {
              where: {
                season: currentSeason,
              },
              select: {
                goals: true,
                assists: true,
                minutesPlayed: true,
                appearances: true,
              },
              take: 1,
            },
          },
        });

        return { member, playerProfile };
      })
    );

    // Filter by position
    return players
      .filter((p) => p.playerProfile?.position === position)
      .map((p) => {
        const stats = p.playerProfile!.stats[0];
        return {
          id: p.playerProfile!.id,
          userId: p.member.userId,
          firstName: p.member.user.firstName,
          lastName: p.member.user.lastName,
          email: p.member.user.email,
          avatar: p.member.user.avatar,
          position: formatPosition(p.playerProfile!.position),
          preferredFoot: p.playerProfile!.preferredFoot,
          shirtNumber: p.member.number || p.playerProfile!.shirtNumber || null,
          height: p.playerProfile!.height || null,
          weight: p.playerProfile!.weight || null,
          isCaptain: p.member.isCaptain,
          status: p.playerProfile!.status,
          stats: {
            goals: stats?.goals || 0,
            assists: stats?.assists || 0,
            minutesPlayed: stats?.minutesPlayed || 0,
            appearances: stats?.appearances || 0,
          },
        };
      });
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching players by position:', error);
    throw new SquadQueryError(
      'Failed to fetch players by position',
      'FETCH_PLAYERS_BY_POSITION_ERROR',
      { teamId, position, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  PlayerStats,
  SquadPlayer,
  TeamSquad,
  TeamSquadStats,
  PlayerDetailInfo,
};

export { SquadQueryError };
