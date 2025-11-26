// src/app/api/users/search/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!email && !name) {
      return NextResponse.json(
        { error: 'Email or name parameter is required' },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    if (email) {
      whereClause.email = {
        contains: email,
        mode: 'insensitive',
      };
    } else if (name) {
      whereClause.OR = [
        {
          firstName: {
            contains: name,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: name,
            mode: 'insensitive',
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
      take: limit,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    // If exact email match, return single user
    if (email && users.length === 1) {
      return NextResponse.json(users[0]);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users/search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
