// src/app/api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; injuryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, injuryId } = params;

    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const injury = await prisma.injury.findUnique({
      where: { id: injuryId },
    });

    if (!injury) {
      return NextResponse.json({ error: 'Injury not found' }, { status: 404 });
    }

    await prisma.injury.update({
      where: { id: injuryId },
      data: {
        status: 'CLEARED',
        clearedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Injury cleared successfully',
    });
  } catch (error) {
    console.error('PATCH /api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear injury',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
