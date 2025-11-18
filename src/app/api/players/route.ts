/**
 * Players API Endpoints
 * GET    /api/players       - Get all players (with filters)
 * POST   /api/players       - Create new player
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { Prisma, Position, PreferredFoot } from '@prisma/client';

// ========================================
// TYPES & INTERFACES
// ========================================

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}

interface CreatePlayerBody {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  position: string;
  preferredFoot?: string;
  height?: number | string;
  weight?: number | string;
}

// ========================================
// VALIDATION HELPERS
// ========================================

function isValidPosition(value: string): value is Position {
  return ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'].includes(value);
}

function isValidPreferredFoot(value: string): value is PreferredFoot {
  return ['LEFT', 'RIGHT', 'BOTH'].includes(value);
}

// ========================================
// GET /api/players
// Get all players with optional filtering
// ========================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const position = searchParams.get('position');

    // Build Prisma where clause with proper typing
    const where: Prisma.PlayerWhereInput = {};

    if (teamId) {
      where.teams = {
        some: { teamId },
      };
    }

    if (position) {
      // Validate and cast position to enum
      if (isValidPosition(position)) {
        where.position = position;
      } else {
        return NextResponse.json(
          {
            error:
              'Invalid position. Must be one of: GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD',
          },
          { status: 400 }
        );
      }
    }

    const players = await db.player.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        teams: {
          include: { team: true },
        },
        stats: true,
      },
      take: 50,
    });

    return NextResponse.json(players, { status: 200 });
  } catch (error) {
    console.error('[API] Players GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/players
// Create new player
// ========================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePlayerBody = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      position,
      preferredFoot,
      height,
      weight,
    } = body;

    // Validation
    if (!firstName || !lastName || !position) {
      return NextResponse.json(
        {
          error: 'Missing required fields: firstName, lastName, position',
        },
        { status: 400 }
      );
    }

    // Validate position enum
    if (!isValidPosition(position)) {
      return NextResponse.json(
        {
          error:
            'Invalid position. Must be one of: GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD',
        },
        { status: 400 }
      );
    }

    // Validate preferredFoot if provided
    let validatedPreferredFoot: PreferredFoot | undefined;
    if (preferredFoot) {
      if (isValidPreferredFoot(preferredFoot)) {
        validatedPreferredFoot = preferredFoot;
      } else {
        return NextResponse.json(
          {
            error:
              'Invalid preferredFoot. Must be one of: LEFT, RIGHT, BOTH',
          },
          { status: 400 }
        );
      }
    }

    const sessionUser = session.user as SessionUser;

    // Build player data object with proper null handling for optional fields
    const playerData: Prisma.PlayerUncheckedCreateInput = {
      userId: sessionUser.id,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth
        ? new Date(dateOfBirth)
        : new Date('2000-01-01'),
      nationality: nationality || 'Not Specified',
      position,
      preferredFoot: validatedPreferredFoot || 'RIGHT',
      height: height ? parseFloat(String(height)) : null, // ✅ Use null, not undefined
      weight: weight ? parseFloat(String(weight)) : null, // ✅ Use null, not undefined
    };

    // Create player
    const player = await db.player.create({
      data: playerData,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('[API] Players POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}