import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;

    // Get match with all related data
    const match = await prisma.match.findUnique({
      where: { id: matchId },
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
        events: {
          include: {
            player: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            minute: 'asc',
          },
        },
        playerAttendances: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Calculate attendance stats
    const attendance = {
      available: match.playerAttendances.filter((a) => 
        a.status === 'AVAILABLE' || a.status === 'CONFIRMED'
      ).length,
      unavailable: match.playerAttendances.filter((a) => 
        a.status === 'UNAVAILABLE' || a.status === 'INJURED' || a.status === 'ILL'
      ).length,
      pending: match.playerAttendances.filter((a) => 
        a.status === 'MAYBE' || !a.status
      ).length,
    };

    return NextResponse.json({
      match: {
        id: match.id,
        date: match.date.toISOString(),
        venue: match.venue,
        status: match.status,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        attendanceDeadline: match.attendanceDeadline?.toISOString() || null,
        homeTeam: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          club: match.homeTeam.club,
        },
        awayTeam: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          club: match.awayTeam.club,
        },
        attendance,
        events: match.events.map((event) => ({
          id: event.id,
          type: event.type,
          minute: event.minute,
          player: event.player
            ? `${event.player.firstName} ${event.player.lastName}`
            : null,
          additionalInfo: event.additionalInfo,
        })),
      },
    });
  } catch (error) {
    console.error('Get match error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
