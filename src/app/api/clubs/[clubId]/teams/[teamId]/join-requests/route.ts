import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Get join requests for this team
    const joinRequests = await prisma.joinRequest.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    // Get player profiles for users
    const userIds = joinRequests.map((req) => req.userId);
    const playerProfiles = await prisma.player.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        position: true,
        preferredFoot: true,
        shirtNumber: true,
        nationality: true,
      },
    });

    const profileMap = new Map(playerProfiles.map((p) => [p.userId, p]));

    return NextResponse.json({
      joinRequests: joinRequests.map((req) => {
        const profile = profileMap.get(req.userId);
        return {
          id: req.id,
          status: req.status,
          createdAt: req.createdAt.toISOString(),
          user: req.user,
          playerProfile: profile
            ? {
                position: profile.position,
                preferredFoot: profile.preferredFoot,
                jerseyNumber: profile.shirtNumber,
                nationality: profile.nationality,
              }
            : undefined,
        };
      }),
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch join requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
