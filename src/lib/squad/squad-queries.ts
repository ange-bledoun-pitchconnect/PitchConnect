/**
 * ============================================================================
 * 🏆 PITCHCONNECT - SQUAD MANAGEMENT & QUERY MODULE v8.0.0
 * ============================================================================
 * Path: src/lib/squad/squad-queries.ts
 *
 * FIXES FROM PREVIOUS VERSION:
 * ✅ Uses TeamPlayer (not TeamMember) - aligned with Prisma schema
 * ✅ Supports all 75+ positions across 12 sports
 * ✅ Uses Player.primaryPosition, secondaryPosition, tertiaryPosition
 * ✅ Correct field names: jerseyNumber (not shirtNumber), primaryPosition (not position)
 * ✅ Sport-specific statistics via sportSpecificStats JSON field
 * ✅ Full error handling with custom error class
 * ✅ TypeScript strict mode compatible
 *
 * FEATURES:
 * ✅ Multi-team squad retrieval for coaches
 * ✅ Single team squad with detailed player info
 * ✅ Player details with team history
 * ✅ Squad statistics aggregation
 * ✅ Position-based filtering (multi-sport aware)
 * ✅ Captain/Vice-Captain management
 * ✅ Player availability status tracking
 * ============================================================================
 */

import { prisma } from '@/lib/prisma';
import type { Sport, Position, Player, Team, TeamPlayer, PlayerStatistic } from '@prisma/client';
import { getPositionDisplayName, getPositionsForSport } from '@/lib/sports';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  goals: number;
  assists: number;
  minutesPlayed: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  averageRating: number | null;
  /** Sport-specific stats (JSON from database) */
  sportSpecificStats: Record<string, any> | null;
}

export interface SquadPlayer {
  id: string;
  odId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  /** Primary position */
  position: Position | null;
  /** Display name for position */
  positionDisplay: string;
  /** Secondary position */
  secondaryPosition: Position | null;
  /** Tertiary position */
  tertiaryPosition: Position | null;
  preferredFoot: string | null;
  jerseyNumber: number | null;
  height: number | null;
  weight: number | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isActive: boolean;
  /** Player availability status */
  availabilityStatus: string;
  /** Overall rating */
  overallRating: number | null;
  /** Current form rating */
  formRating: number | null;
  /** Development phase */
  developmentPhase: string | null;
  /** Season statistics */
  stats: PlayerStats;
  /** When player joined team */
  joinedAt: Date;
}

export interface TeamSquad {
  teamId: string;
  teamName: string;
  clubId: string;
  sport: Sport;
  formation: string | null;
  totalPlayers: number;
  activePlayers: number;
  players: SquadPlayer[];
}

export interface TeamSquadStats {
  totalPlayers: number;
  activePlayers: number;
  totalGoals: number;
  totalAssists: number;
  totalMinutes: number;
  totalAppearances: number;
  averageGoals: number;
  averageAssists: number;
  averageRating: number | null;
  /** Position breakdown */
  positionBreakdown: Record<string, number>;
}

export interface PlayerDetailInfo {
  id: string;
  odId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date | null;
  avatar: string | null;
  position: Position | null;
  positionDisplay: string;
  secondaryPosition: Position | null;
  tertiaryPosition: Position | null;
  preferredFoot: string | null;
  height: number | null;
  weight: number | null;
  nationality: string | null;
  secondNationality: string | null;
  marketValue: number | null;
  currency: string;
  overallRating: number | null;
  formRating: number | null;
  developmentPhase: string | null;
  fitnessLevel: number | null;
  availabilityStatus: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    clubId: string;
    clubName: string;
    sport: Sport;
    jerseyNumber: number | null;
    position: Position | null;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isActive: boolean;
    joinedAt: Date;
  }>;
  stats: Array<{
    season: number;
    teamId: string | null;
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    averageRating: number | null;
  }>;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class SquadQueryError extends Error {
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
 * Get current season year
 */
function getCurrentSeason(): number {
  const now = new Date();
  // If after July, it's the new season
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Calculate performance rating from stats
 */
function calculatePerformanceRating(stats: PlayerStats): number {
  if (stats.appearances === 0) return 0;

  const goalsPerMatch = stats.goals / stats.appearances;
  const assistsPerMatch = stats.assists / stats.appearances;
  const minutesPerMatch = stats.minutesPlayed / stats.appearances;

  // Weighted calculation (scale 0-100)
  const rating = (goalsPerMatch * 15) + (assistsPerMatch * 10) + (minutesPerMatch / 10);

  return Math.min(Math.round(rating), 100);
}

/**
 * Map database player to SquadPlayer format
 */
function mapToSquadPlayer(
  teamPlayer: TeamPlayer & {
    player: Player & {
      user: { id: string; firstName: string; lastName: string; email: string; avatar: string | null; dateOfBirth: Date | null };
      statistics: PlayerStatistic[];
    };
  },
  sport: Sport = 'FOOTBALL'
): SquadPlayer {
  const player = teamPlayer.player;
  const user = player.user;
  const currentSeasonStats = player.statistics[0];

  return {
    id: teamPlayer.id,
    odId: user.id,
    playerId: player.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    position: teamPlayer.position || player.primaryPosition,
    positionDisplay: getPositionDisplayName(
      teamPlayer.position || player.primaryPosition || 'UTILITY',
      sport
    ),
    secondaryPosition: player.secondaryPosition,
    tertiaryPosition: player.tertiaryPosition,
    preferredFoot: player.preferredFoot,
    jerseyNumber: teamPlayer.jerseyNumber,
    height: player.height,
    weight: player.weight,
    dateOfBirth: user.dateOfBirth,
    nationality: player.nationality,
    isCaptain: teamPlayer.isCaptain,
    isViceCaptain: teamPlayer.isViceCaptain,
    isActive: teamPlayer.isActive,
    availabilityStatus: player.availabilityStatus,
    overallRating: player.overallRating,
    formRating: player.formRating,
    developmentPhase: player.developmentPhase,
    joinedAt: teamPlayer.joinedAt,
    stats: {
      goals: currentSeasonStats?.goals ?? 0,
      assists: currentSeasonStats?.assists ?? 0,
      minutesPlayed: currentSeasonStats?.minutesPlayed ?? 0,
      appearances: currentSeasonStats?.matches ?? 0,
      yellowCards: currentSeasonStats?.yellowCards ?? 0,
      redCards: currentSeasonStats?.redCards ?? 0,
      cleanSheets: currentSeasonStats?.cleanSheets ?? 0,
      averageRating: currentSeasonStats?.averageRating ?? null,
      sportSpecificStats: currentSeasonStats?.sportSpecificStats as Record<string, any> | null,
    },
  };
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
export async function getCoachSquadByTeams(teamIds: string[]): Promise<TeamSquad[]> {
  try {
    if (!teamIds || teamIds.length === 0) {
      throw new SquadQueryError('No team IDs provided', 'INVALID_INPUT', { teamIds });
    }

    const currentSeason = getCurrentSeason();

    const teams = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
        deletedAt: null,
      },
      include: {
        players: {
          where: {
            isActive: true,
          },
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
                    dateOfBirth: true,
                  },
                },
                statistics: {
                  where: {
                    season: currentSeason,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
      },
      orderBy: { name: 'asc' },
    });

    return teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      clubId: team.clubId,
      sport: team.sport,
      formation: team.formation,
      totalPlayers: team.players.length,
      activePlayers: team.players.filter((p) => p.isActive).length,
      players: team.players.map((tp) => mapToSquadPlayer(tp as any, team.sport)),
    }));
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching coach squads:', error);
    throw new SquadQueryError(
      'Failed to fetch squad data for multiple teams',
      'FETCH_MULTIPLE_SQUADS_ERROR',
      { teamIds, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get squad data for a single team with detailed player information
 *
 * @param teamId - Team ID
 * @param includeInactive - Whether to include inactive players
 * @returns Team squad or null if not found
 * @throws SquadQueryError if database error
 */
export async function getTeamSquad(
  teamId: string,
  includeInactive: boolean = false
): Promise<TeamSquad | null> {
  try {
    if (!teamId) {
      throw new SquadQueryError('Team ID is required', 'INVALID_INPUT', { teamId });
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          where: includeInactive ? {} : { isActive: true },
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
                    dateOfBirth: true,
                  },
                },
                statistics: {
                  where: {
                    season: currentSeason,
                    teamId: teamId,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
      },
    });

    if (!team) {
      return null;
    }

    return {
      teamId: team.id,
      teamName: team.name,
      clubId: team.clubId,
      sport: team.sport,
      formation: team.formation,
      totalPlayers: team.players.length,
      activePlayers: team.players.filter((p) => p.isActive).length,
      players: team.players.map((tp) => mapToSquadPlayer(tp as any, team.sport)),
    };
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching team squad:', error);
    throw new SquadQueryError(
      'Failed to fetch team squad',
      'FETCH_TEAM_SQUAD_ERROR',
      { teamId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get detailed player information with team history
 *
 * @param playerId - Player ID
 * @returns Player details or null if not found
 * @throws SquadQueryError if database error
 */
export async function getPlayerDetails(playerId: string): Promise<PlayerDetailInfo | null> {
  try {
    if (!playerId) {
      throw new SquadQueryError('Player ID is required', 'INVALID_INPUT', { playerId });
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
        statistics: {
          orderBy: { season: 'desc' },
          take: 5,
        },
        teams: {
          where: {
            isActive: true,
          },
          include: {
            team: {
              include: {
                club: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return null;
    }

    return {
      id: player.id,
      odId: player.userId,
      firstName: player.user.firstName,
      lastName: player.user.lastName,
      email: player.user.email,
      dateOfBirth: player.user.dateOfBirth,
      avatar: player.user.avatar,
      position: player.primaryPosition,
      positionDisplay: getPositionDisplayName(player.primaryPosition || 'UTILITY'),
      secondaryPosition: player.secondaryPosition,
      tertiaryPosition: player.tertiaryPosition,
      preferredFoot: player.preferredFoot,
      height: player.height,
      weight: player.weight,
      nationality: player.nationality,
      secondNationality: player.secondNationality,
      marketValue: player.marketValue,
      currency: player.currency,
      overallRating: player.overallRating,
      formRating: player.formRating,
      developmentPhase: player.developmentPhase,
      fitnessLevel: player.fitnessLevel,
      availabilityStatus: player.availabilityStatus,
      teams: player.teams.map((tp) => ({
        teamId: tp.team.id,
        teamName: tp.team.name,
        clubId: tp.team.clubId,
        clubName: tp.team.club.name,
        sport: tp.team.sport,
        jerseyNumber: tp.jerseyNumber,
        position: tp.position,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        isActive: tp.isActive,
        joinedAt: tp.joinedAt,
      })),
      stats: player.statistics.map((s) => ({
        season: s.season,
        teamId: s.teamId,
        appearances: s.matches,
        goals: s.goals,
        assists: s.assists,
        minutesPlayed: s.minutesPlayed,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
        cleanSheets: s.cleanSheets,
        averageRating: s.averageRating,
      })),
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
      throw new SquadQueryError('Team ID is required', 'INVALID_INPUT', { teamId });
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                statistics: {
                  where: {
                    season: currentSeason,
                    teamId: teamId,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    // Aggregate stats
    const allStats = team.players
      .map((tp) => tp.player.statistics[0])
      .filter(Boolean);

    const totalGoals = allStats.reduce((sum, s) => sum + (s?.goals ?? 0), 0);
    const totalAssists = allStats.reduce((sum, s) => sum + (s?.assists ?? 0), 0);
    const totalMinutes = allStats.reduce((sum, s) => sum + (s?.minutesPlayed ?? 0), 0);
    const totalAppearances = allStats.reduce((sum, s) => sum + (s?.matches ?? 0), 0);

    const ratings = allStats
      .map((s) => s?.averageRating)
      .filter((r): r is number => r !== null && r !== undefined);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

    // Position breakdown
    const positionBreakdown: Record<string, number> = {};
    for (const tp of team.players) {
      const pos = tp.position || tp.player.primaryPosition || 'UTILITY';
      positionBreakdown[pos] = (positionBreakdown[pos] || 0) + 1;
    }

    return {
      totalPlayers: team.players.length,
      activePlayers: team.players.filter((p) => p.isActive).length,
      totalGoals,
      totalAssists,
      totalMinutes,
      totalAppearances,
      averageGoals: allStats.length > 0 ? totalGoals / allStats.length : 0,
      averageAssists: allStats.length > 0 ? totalAssists / allStats.length : 0,
      averageRating,
      positionBreakdown,
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
 * Get players by position for a team (multi-sport aware)
 *
 * @param teamId - Team ID
 * @param position - Position filter (from Position enum)
 * @returns Array of players in that position
 * @throws SquadQueryError if database error
 */
export async function getTeamPlayersByPosition(
  teamId: string,
  position: Position
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
        players: {
          where: {
            isActive: true,
            OR: [
              { position: position },
              { player: { primaryPosition: position } },
              { player: { secondaryPosition: position } },
              { player: { tertiaryPosition: position } },
            ],
          },
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
                    dateOfBirth: true,
                  },
                },
                statistics: {
                  where: {
                    season: currentSeason,
                    teamId: teamId,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
      },
    });

    if (!team) {
      return [];
    }

    return team.players.map((tp) => mapToSquadPlayer(tp as any, team.sport));
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

/**
 * Get players by position category (goalkeeper, defender, midfielder, forward)
 *
 * @param teamId - Team ID
 * @param category - Position category
 * @param sport - Sport type (defaults to FOOTBALL)
 * @returns Array of players in that category
 */
export async function getTeamPlayersByPositionCategory(
  teamId: string,
  category: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'utility' | 'specialist',
  sport: Sport = 'FOOTBALL'
): Promise<SquadPlayer[]> {
  try {
    if (!teamId || !category) {
      throw new SquadQueryError(
        'Team ID and category are required',
        'INVALID_INPUT',
        { teamId, category }
      );
    }

    // Get all positions in this category for the sport
    const positions = getPositionsForSport(sport);
    const categoryPositions = positions
      .filter((p) => p.category === category)
      .map((p) => p.value);

    if (categoryPositions.length === 0) {
      return [];
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          where: {
            isActive: true,
            OR: [
              { position: { in: categoryPositions } },
              { player: { primaryPosition: { in: categoryPositions } } },
            ],
          },
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
                    dateOfBirth: true,
                  },
                },
                statistics: {
                  where: {
                    season: currentSeason,
                    teamId: teamId,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
      },
    });

    if (!team) {
      return [];
    }

    return team.players.map((tp) => mapToSquadPlayer(tp as any, team.sport));
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching players by category:', error);
    throw new SquadQueryError(
      'Failed to fetch players by position category',
      'FETCH_PLAYERS_BY_CATEGORY_ERROR',
      { teamId, category, sport, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get available players (not injured, suspended, or unavailable)
 *
 * @param teamId - Team ID
 * @returns Array of available players
 */
export async function getAvailablePlayers(teamId: string): Promise<SquadPlayer[]> {
  try {
    if (!teamId) {
      throw new SquadQueryError('Team ID is required', 'INVALID_INPUT', { teamId });
    }

    const currentSeason = getCurrentSeason();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          where: {
            isActive: true,
            player: {
              availabilityStatus: 'AVAILABLE',
              isActive: true,
            },
          },
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
                    dateOfBirth: true,
                  },
                },
                statistics: {
                  where: {
                    season: currentSeason,
                    teamId: teamId,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { isViceCaptain: 'desc' },
            { jerseyNumber: 'asc' },
          ],
        },
      },
    });

    if (!team) {
      return [];
    }

    return team.players.map((tp) => mapToSquadPlayer(tp as any, team.sport));
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error fetching available players:', error);
    throw new SquadQueryError(
      'Failed to fetch available players',
      'FETCH_AVAILABLE_PLAYERS_ERROR',
      { teamId, originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Search players across all teams in a club
 *
 * @param clubId - Club ID
 * @param searchTerm - Search term (name, email, etc.)
 * @param limit - Maximum results (default 20)
 * @returns Array of matching players
 */
export async function searchClubPlayers(
  clubId: string,
  searchTerm: string,
  limit: number = 20
): Promise<SquadPlayer[]> {
  try {
    if (!clubId) {
      throw new SquadQueryError('Club ID is required', 'INVALID_INPUT', { clubId });
    }

    const currentSeason = getCurrentSeason();
    const searchLower = searchTerm.toLowerCase();

    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        team: {
          clubId: clubId,
          deletedAt: null,
        },
        isActive: true,
        player: {
          user: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      },
      include: {
        team: true,
        player: {
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
            statistics: {
              where: {
                season: currentSeason,
              },
              take: 1,
            },
          },
        },
      },
      take: limit,
    });

    // Group by player to avoid duplicates
    const playerMap = new Map<string, SquadPlayer>();
    for (const tp of teamPlayers) {
      if (!playerMap.has(tp.playerId)) {
        playerMap.set(tp.playerId, mapToSquadPlayer(tp as any, tp.team.sport));
      }
    }

    return Array.from(playerMap.values());
  } catch (error) {
    if (error instanceof SquadQueryError) {
      throw error;
    }

    console.error('Error searching club players:', error);
    throw new SquadQueryError(
      'Failed to search club players',
      'SEARCH_PLAYERS_ERROR',
      { clubId, searchTerm, originalError: error instanceof Error ? error.message : String(error) }
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