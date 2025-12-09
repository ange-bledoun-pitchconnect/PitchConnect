/**
 * Bulk Add Players to Team API
 *
 * POST /api/manager/clubs/[clubId]/teams/[teamId]/players/bulk
 *
 * Adds multiple players to a team by email. Creates or links existing user accounts
 * to the team as players.
 *
 * Authorization: Only club owner can access
 *
 * Request Body:
 * {
 *   players: Array<{
 *     email: string,
 *     position: string
 *   }>
 * }
 *
 * Response:
 * {
 *   success: number,
 *   failed: number,
 *   errors: Array<{email: string, error: string}>,
 *   players: Array<{id, firstName, lastName, position, email}>
 * }
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

    // Verify club exists and user owns it
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify team exists and belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validation
    if (!Array.isArray(body.players) || body.players.length === 0) {
      return NextResponse.json(
        { error: 'Players array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (body.players.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 players can be added at once' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
      players: [] as any[],
    };

    // Process each player
    for (const playerData of body.players) {
      try {
        // Validate email
        if (!playerData.email?.trim()) {
          results.failed++;
          results.errors.push({
            email: playerData.email,
            error: 'Email is required',
          });
          continue;
        }

        const email = playerData.email.trim().toLowerCase();

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          results.failed++;
          results.errors.push({
            email,
            error: 'User not found',
          });
          continue;
        }

        // Check if player already exists
        const existingPlayer = await prisma.player.findUnique({
          where: { userId: user.id },
        });

        // Check if already on this team via PlayerTeam (raw SQL)
        if (existingPlayer) {
          const playerTeamRecord = await prisma.$queryRaw`
            SELECT * FROM "PlayerTeam" WHERE "playerId" = ${existingPlayer.id} AND "teamId" = ${teamId}
          `;

          if (playerTeamRecord && Array.isArray(playerTeamRecord) && playerTeamRecord.length > 0) {
            results.failed++;
            results.errors.push({
              email,
              error: 'Player already on team',
            });
            continue;
          }
        }

        // Create or get player
        let player = existingPlayer;
        if (!player) {
          player = await prisma.player.create({
            data: {
              userId: user.id,
              firstName: user.firstName || 'Unknown',
              lastName: user.lastName || 'Unknown',
              dateOfBirth: user.dateOfBirth || new Date('1990-01-01'),
              nationality: user.nationality || 'Unknown',
              position: playerData.position || 'MIDFIELDER',
              preferredFoot: playerData.preferredFoot || 'RIGHT',
              status: 'ACTIVE',
            },
          });
        }

        // Add player to team via PlayerTeam (raw SQL insert)
        await prisma.$executeRaw`
          INSERT INTO "PlayerTeam" ("playerId", "teamId", "joinedAt")
          VALUES (${player.id}, ${teamId}, NOW())
          ON CONFLICT DO NOTHING
        `;

        results.success++;
        results.players.push({
          id: player.id,
          firstName: user.firstName,
          lastName: user.lastName,
          position: player.position,
          email: user.email,
        });
      } catch (err) {
        results.failed++;
        results.errors.push({
          email: playerData.email,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error(
      'POST /api/manager/clubs/[clubId]/teams/[teamId]/players/bulk error:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to bulk import players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
