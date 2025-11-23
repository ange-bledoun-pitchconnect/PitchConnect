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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Get actual hourly rate from coach profile or contract
    // For now, return default rate
    const hourlyRate = 25; // Default £25/hour

    return NextResponse.json({
      hourlyRate,
      currency: 'GBP',
    });
  } catch (error) {
    console.error('Get coach rate error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch coach rate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
