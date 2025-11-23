import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    // Get drills
    const drills = await prisma.drill.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      drills: drills.map((drill) => ({
        id: drill.id,
        name: drill.name,
        description: drill.description,
        duration: drill.duration,
        intensity: drill.intensity,
        category: drill.category,
        equipment: drill.equipment,
        minPlayers: drill.minPlayers,
        maxPlayers: drill.maxPlayers,
      })),
    });
  } catch (error) {
    console.error('Get drills error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch drills',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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
      category,
      equipment,
      minPlayers,
      maxPlayers,
    } = body;

    if (!name || !description || !duration || !intensity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const drill = await prisma.drill.create({
      data: {
        name,
        description,
        duration: parseInt(duration.toString()),
        intensity,
        category,
        equipment: equipment || null,
        minPlayers: minPlayers ? parseInt(minPlayers.toString()) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers.toString()) : null,
      },
    });

    return NextResponse.json({
      success: true,
      drill,
      message: 'Drill created successfully',
    });
  } catch (error) {
    console.error('Create drill error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create drill',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
