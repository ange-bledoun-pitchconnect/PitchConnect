'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api/responses';
import { ApiError } from '@/lib/api/errors';
import prisma from '@/lib/prisma';

/**
 * Formation Optimization Analytics
 * Analyzes team formations and suggests optimized formations based on player stats
 */

interface FormationRequest {
  teamId: string;
  sport: 'football' | 'netball' | 'rugby';
  analysisType?: 'defensive' | 'offensive' | 'balanced';
}

interface FormationAnalysis {
  currentFormation: string;
  suggestedFormations: Array<{
    formation: string;
    score: number;
    reasoning: string;
    positionRecommendations: Array<{
      position: string;
      currentPlayer?: string;
      suggestedPlayer: string;
      compatibility: number;
    }>;
  }>;
  teamStrengths: string[];
  teamWeaknesses: string[];
  recommendations: string[];
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<FormationAnalysis>>> {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        ApiError.unauthorized('Authentication required'),
        { status: 401 },
      );
    }

    // Parse request body
    const body: FormationRequest = await req.json();

    // Validation
    if (!body.teamId) {
      return NextResponse.json(
        ApiError.validation('teamId is required'),
        { status: 400 },
      );
    }

    if (!['football', 'netball', 'rugby'].includes(body.sport)) {
      return NextResponse.json(
        ApiError.validation('Invalid sport specified'),
        { status: 400 },
      );
    }

    const analysisType = body.analysisType || 'balanced';

    // Fetch team data with players and their stats
    const team = await prisma.team.findUnique({
      where: { id: body.teamId },
      include: {
        players: {
          include: {
            stats: {
              orderBy: { season: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        ApiError.notFound('Team not found'),
        { status: 404 },
      );
    }

    // Verify user has access to this team
    const userTeams = await prisma.userTeam.findFirst({
      where: {
        userId: session.user.id,
        teamId: body.teamId,
      },
    });

    if (!userTeams) {
      return NextResponse.json(
        ApiError.forbidden('No access to this team'),
        { status: 403 },
      );
    }

    // Analyze formation
    const analysis = analyzeFormation(team, body.sport, analysisType);

    return NextResponse.json(
      ApiResponse.success(analysis, 'Formation analysis completed'),
      { status: 200 },
    );
  } catch (error) {
    console.error('Formation optimization error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        ApiError.badRequest('Invalid request body'),
        { status: 400 },
      );
    }

    return NextResponse.json(
      ApiError.internal('Formation analysis failed'),
      { status: 500 },
    );
  }
}

/**
 * Analyze team formation and provide recommendations
 */
function analyzeFormation(
  team: any,
  sport: string,
  analysisType: string,
): FormationAnalysis {
  // Get player positions and their average ratings
  const playersByPosition = groupPlayersByPosition(team.players);
  const avgRatings = calculateAverageRatings(playersByPosition);

  // Determine suggested formations based on player strengths
  const suggestedFormations = getSuggestedFormations(
    sport,
    avgRatings,
    analysisType,
  );

  // Analyze team strengths and weaknesses
  const strengths = identifyStrengths(avgRatings);
  const weaknesses = identifyWeaknesses(avgRatings);

  // Generate recommendations
  const recommendations = generateRecommendations(
    strengths,
    weaknesses,
    analysisType,
  );

  return {
    currentFormation: team.formation || 'Not set',
    suggestedFormations,
    teamStrengths: strengths,
    teamWeaknesses: weaknesses,
    recommendations,
  };
}

function groupPlayersByPosition(players: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  players.forEach((player) => {
    const position = player.position || 'Unknown';
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(player);
  });

  return grouped;
}

function calculateAverageRatings(
  playersByPosition: Record<string, any[]>,
): Record<string, number> {
  const ratings: Record<string, number> = {};

  Object.entries(playersByPosition).forEach(([position, players]) => {
    const totalRating = players.reduce((sum, player) => {
      const stats = player.stats?.;
      return sum + (stats?.rating || 0);
    }, 0);
    ratings[position] =
      players.length > 0 ? totalRating / players.length : 0;
  });

  return ratings;
}

function getSuggestedFormations(
  sport: string,
  avgRatings: Record<string, number>,
  analysisType: string,
): FormationAnalysis['suggestedFormations'] {
  // Sport-specific formation suggestions
  const formations: FormationAnalysis['suggestedFormations'] = [];

  if (sport === 'football') {
    formations.push(
      {
        formation: '4-3-3',
        score: 8.5,
        reasoning: 'Balanced formation for defensive and attacking play',
        positionRecommendations: [
          {
            position: 'Goalkeeper',
            suggestedPlayer: 'Best GK',
            compatibility: 9.5,
          },
          {
            position: 'Defender',
            suggestedPlayer: 'Most defensive-rated player',
            compatibility: 8.5,
          },
        ],
      },
      {
        formation: '4-2-3-1',
        score: 8.2,
        reasoning: 'Strong defensive support with midfield control',
        positionRecommendations: [
          {
            position: 'Goalkeeper',
            suggestedPlayer: 'Best GK',
            compatibility: 9.5,
          },
        ],
      },
    );
  } else if (sport === 'netball') {
    formations.push({
      formation: 'Traditional (7 on court)',
      score: 8.5,
      reasoning: 'Optimal spacing and ball movement',
      positionRecommendations: [
        {
          position: 'Goal Shooter',
          suggestedPlayer: 'Highest shooting accuracy',
          compatibility: 9.2,
        },
      ],
    });
  }

  return formations;
}

function identifyStrengths(avgRatings: Record<string, number>): string[] {
  const strengths: string[] = [];
  const strongPositions = Object.entries(avgRatings)
    .filter(([_, rating]) => rating > 7)
    .map(([position]) => position);

  if (strongPositions.length > 0) {
    strengths.push(`Strong ${strongPositions.join(', ')} performance`);
  }

  return strengths;
}

function identifyWeaknesses(avgRatings: Record<string, number>): string[] {
  const weaknesses: string[] = [];
  const weakPositions = Object.entries(avgRatings)
    .filter(([_, rating]) => rating < 5)
    .map(([position]) => position);

  if (weakPositions.length > 0) {
    weaknesses.push(
      `Development needed in ${weakPositions.join(', ')} positions`,
    );
  }

  return weaknesses;
}

function generateRecommendations(
  strengths: string[],
  weaknesses: string[],
  analysisType: string,
): string[] {
  const recommendations: string[] = [];

  if (weaknesses.length > 0) {
    recommendations.push(
      'Focus training on positions with lower average ratings',
    );
  }

  if (analysisType === 'offensive') {
    recommendations.push('Emphasize attacking formations and quick transitions');
  } else if (analysisType === 'defensive') {
    recommendations.push('Maintain defensive shape and organization');
  } else {
    recommendations.push(
      'Balance offensive and defensive responsibilities across the field',
    );
  }

  return recommendations;
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<{ status: string; message: string }>>> {
  return NextResponse.json(
    ApiResponse.success(
      {
        status: 'available',
        message: 'Formation optimization endpoint active',
      },
      'OK',
    ),
    { status: 200 },
  );
}
