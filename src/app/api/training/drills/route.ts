/**
 * Training Drills API Endpoints
 * GET    /api/training/drills  - Get all drills with filters
 * POST   /api/training/drills  - Create new drill
 * 
 * Schema-Aligned: Drill model in Prisma
 * - name, description, duration, intensity, playerCount
 * - difficulty, category, videoUrl, equipment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { TrainingIntensity, TrainingCategory } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface DrillResponse {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  intensity: TrainingIntensity;
  playerCount: number;
  difficulty: string;
  category: TrainingCategory;
  videoUrl: string | null;
  equipment: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate training intensity
 */
function isValidIntensity(value: string): value is TrainingIntensity {
  return ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'].includes(value);
}

/**
 * Validate training category
 */
function isValidCategory(value: string): value is TrainingCategory {
  return [
    'PASSING',
    'SHOOTING',
    'DEFENDING',
    'POSSESSION',
    'SET_PIECES',
    'CONDITIONING',
    'TACTICAL',
    'RECOVERY',
    'STRENGTH_POWER',
    'SPEED_AGILITY',
  ].includes(value);
}

/**
 * Validate difficulty level
 */
function isValidDifficulty(value: string): boolean {
  return VALID_DIFFICULTIES.includes(value);
}

// ============================================================================
// GET /api/training/drills
// ============================================================================

/**
 * Retrieve all drills with optional filtering by category and intensity
 * 
 * Query parameters:
 * - category: TrainingCategory (filter by category)
 * - intensity: TrainingIntensity (filter by intensity level)
 * - difficulty: string (filter by difficulty)
 * 
 * Returns: Array of Drill objects
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const intensity = searchParams.get('intensity');
    const difficulty = searchParams.get('difficulty');

    // Build where clause
    const where: any = {};

    // Validate and add category filter
    if (category) {
      if (isValidCategory(category)) {
        where.category = category;
      } else {
        return NextResponse.json(
          {
            error: 'Invalid category',
            validCategories: [
              'PASSING',
              'SHOOTING',
              'DEFENDING',
              'POSSESSION',
              'SET_PIECES',
              'CONDITIONING',
              'TACTICAL',
              'RECOVERY',
              'STRENGTH_POWER',
              'SPEED_AGILITY',
            ],
          },
          { status: 400 }
        );
      }
    }

    // Validate and add intensity filter
    if (intensity) {
      if (isValidIntensity(intensity)) {
        where.intensity = intensity;
      } else {
        return NextResponse.json(
          {
            error: 'Invalid intensity',
            validIntensities: ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'],
          },
          { status: 400 }
        );
      }
    }

    // Validate and add difficulty filter
    if (difficulty) {
      if (isValidDifficulty(difficulty)) {
        where.difficulty = difficulty;
      } else {
        return NextResponse.json(
          {
            error: 'Invalid difficulty',
            validDifficulties: VALID_DIFFICULTIES,
          },
          { status: 400 }
        );
      }
    }

    // Fetch drills from database
    const drills = await prisma.drill.findMany({
      where,
      orderBy: [{ category: 'asc' }, { difficulty: 'asc' }, { name: 'asc' }],
    });

    // Transform to response format
    const formattedDrills: DrillResponse[] = drills.map((drill) => ({
      id: drill.id,
      name: drill.name,
      description: drill.description,
      duration: drill.duration,
      intensity: drill.intensity,
      playerCount: drill.playerCount,
      difficulty: drill.difficulty,
      category: drill.category,
      videoUrl: drill.videoUrl,
      equipment: drill.equipment,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedDrills,
        count: formattedDrills.length,
        filters: {
          appliedCategory: category || null,
          appliedIntensity: intensity || null,
          appliedDifficulty: difficulty || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Get drills error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch drills',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training/drills
// ============================================================================

/**
 * Create a new training drill
 * 
 * Request body:
 * - name (required): Drill name
 * - description (required): Detailed description
 * - duration (required): Duration in minutes (integer)
 * - intensity (required): TrainingIntensity enum
 * - playerCount (required): Number of players (integer)
 * - difficulty (required): Difficulty level
 * - category (required): TrainingCategory enum
 * - videoUrl (optional): URL to instructional video
 * - equipment (optional): Array of equipment names
 * 
 * Returns: Created Drill object
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      duration,
      intensity,
      playerCount,
      difficulty,
      category,
      videoUrl,
      equipment,
    } = body;

    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Required fields
    if (!name || !description || !duration || !intensity || !playerCount || !difficulty || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: [
            'name',
            'description',
            'duration',
            'intensity',
            'playerCount',
            'difficulty',
            'category',
          ],
        },
        { status: 400 }
      );
    }

    // Validate intensity
    if (!isValidIntensity(intensity)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid intensity value',
          validIntensities: ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'],
        },
        { status: 400 }
      );
    }

    // Validate category
    if (!isValidCategory(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category value',
          validCategories: [
            'PASSING',
            'SHOOTING',
            'DEFENDING',
            'POSSESSION',
            'SET_PIECES',
            'CONDITIONING',
            'TACTICAL',
            'RECOVERY',
            'STRENGTH_POWER',
            'SPEED_AGILITY',
          ],
        },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!isValidDifficulty(difficulty)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid difficulty value',
          validDifficulties: VALID_DIFFICULTIES,
        },
        { status: 400 }
      );
    }

    // Validate duration (must be positive integer)
    const parsedDuration = parseInt(duration.toString(), 10);
    if (isNaN(parsedDuration) || parsedDuration < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duration must be a positive integer (minutes)',
        },
        { status: 400 }
      );
    }

    // Validate playerCount (must be positive integer)
    const parsedPlayerCount = parseInt(playerCount.toString(), 10);
    if (isNaN(parsedPlayerCount) || parsedPlayerCount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Player count must be a positive integer',
        },
        { status: 400 }
      );
    }

    // Validate name length
    const trimmedName = name.toString().trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Drill name must be between 3 and 100 characters',
        },
        { status: 400 }
      );
    }

    // Validate description length
    const trimmedDescription = description.toString().trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Description must be between 10 and 1000 characters',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // CREATE DRILL
    // ========================================================================

    const drill = await prisma.drill.create({
      data: {
        name: trimmedName,
        description: trimmedDescription,
        duration: parsedDuration,
        intensity,
        playerCount: parsedPlayerCount,
        difficulty,
        category,
        videoUrl: videoUrl ? videoUrl.toString().trim() : null,
        equipment: Array.isArray(equipment)
          ? equipment.map((e: any) => e.toString().trim()).filter((e: string) => e.length > 0)
          : [],
      },
    });

    console.log(`✅ Created drill: ${drill.name}`);

    return NextResponse.json(
      {
        success: true,
        data: drill,
        message: 'Drill created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Create drill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create drill',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
