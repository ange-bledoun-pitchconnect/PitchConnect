// src/app/api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string; coachId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId, coachId } = params;

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

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    });

    if (!coach || coach.teamId !== teamId) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    await prisma.coach.delete({
      where: { id: coachId },
    });

    return NextResponse.json({
      success: true,
      message: 'Coach removed from team successfully',
    });
  } catch (error) {
    console.error('DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
