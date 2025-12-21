import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { homeTeamId, awayTeamId, date, venue, attendanceDeadline } = body;

    if (!homeTeamId || !awayTeamId || !date) {
      return NextResponse.json(
        { error: 'Home team, away team, and date are required' },
        { status: 400 }
      );
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: 'Home and away teams must be different' },
        { status: 400 }
      );
    }

    // Verify teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'One or both teams not found' }, { status: 404 });
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        venue: venue || null,
        attendanceDeadline: attendanceDeadline ? new Date(attendanceDeadline) : null,
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: {
          include: {
            club: {
              select: {
                name: true,
              },
            },
          },
        },
        awayTeam: {
          include: {
            club: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get players from both teams via raw SQL (PlayerTeam table)
    const [homePlayerIds, awayPlayerIds] = await Promise.all([
      prisma.$queryRaw`
        SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${homeTeamId}
      `,
      prisma.$queryRaw`
        SELECT DISTINCT "playerId" FROM "PlayerTeam" WHERE "teamId" = ${awayTeamId}
      `,
    ]);

    // Flatten player IDs from query results
    const homePlayers = (homePlayerIds as any[]).map((p) => ({ playerId: p.playerId }));
    const awayPlayers = (awayPlayerIds as any[]).map((p) => ({ playerId: p.playerId }));
    const allPlayers = [...homePlayers, ...awayPlayers];

    if (allPlayers.length > 0) {
      await prisma.matchAttendance.createMany({
        data: allPlayers.map((player) => ({
          matchId: match.id,
          playerId: player.playerId,
          status: 'AVAILABLE',
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      matchId: match.id,
      message: 'Match created successfully',
      match: {
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        date: match.date.toISOString(),
        venue: match.venue,
        status: match.status,
      },
    });
  } catch (error) {
    console.error('Match creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
