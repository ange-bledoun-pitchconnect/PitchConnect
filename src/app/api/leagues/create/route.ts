import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, code, country, season, pointsWin, pointsDraw, pointsLoss } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'League name and code are required' },
        { status: 400 }
      );
    }

    // Check if league code already exists
    const existingLeague = await prisma.league.findUnique({
      where: { code },
    });

    if (existingLeague) {
      return NextResponse.json(
        { error: 'League code already exists. Please use a different code.' },
        { status: 400 }
      );
    }

    // Create league admin profile if doesn't exist
    let leagueAdmin = await prisma.leagueAdmin.findUnique({
      where: { userId: user.id },
    });

    if (!leagueAdmin) {
      leagueAdmin = await prisma.leagueAdmin.create({
        data: { userId: user.id },
      });
    }

    // Create league
    const league = await prisma.league.create({
      data: {
        name,
        code,
        country: country || 'United Kingdom',
        season: season || new Date().getFullYear(),
        pointsWin: pointsWin || 3,
        pointsDraw: pointsDraw || 1,
        pointsLoss: pointsLoss || 0,
        adminId: leagueAdmin.id,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      leagueId: league.id,
      message: 'League created successfully',
    });
  } catch (error) {
    console.error('League creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create league',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
