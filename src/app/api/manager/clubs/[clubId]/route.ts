/**
 * Club Management API Routes
 * 
 * Handles:
 * - GET: Fetch club details with teams and members
 * - PATCH: Update club information
 * - DELETE: Delete club (if no teams exist)
 * 
 * Authorization: Only club owner can access their own club
 * Schema-aligned: Uses correct Prisma models and fields
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs/[clubId]
 * Fetch complete club details including teams and members
 */
export async function GET(
  _req: NextRequest,
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;

    // Get club with teams and members
    // Get club with teams and members
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        // Include teams with member count
        teams: {
          include: {
            _count: {
              select: {
                members: true, // Team member count
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Include all club members with user details
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        // Include aggregate counts
        _count: {
          select: {
            teams: true,
            members: true,
            members: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization - only club owner can view
    if (club.ownerId !== session.user.id) {
    // Check authorization - only club owner can view
    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error('GET /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/clubs/[clubId]
 * Update club information
 * 
 * Valid fields:
 * - name: string
 * - description: string | null
 * - country: string
 * - city: string | null
 * - foundedYear: number | null
 * - stadiumName: string | null
 * - logoUrl: string | null
 * - primaryColor: string
 * - secondaryColor: string
 * - status: string
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;
    const body = await req.json();

    // Get club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization - only club owner can update
    if (club.ownerId !== session.user.id) {
    // Check authorization - only club owner can update
    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update club with ONLY valid fields from schema
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.country && { country: body.country }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.foundedYear !== undefined && { foundedYear: body.foundedYear }),
        ...(body.stadiumName !== undefined && { stadiumName: body.stadiumName }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.primaryColor && { primaryColor: body.primaryColor }),
        ...(body.secondaryColor && { secondaryColor: body.secondaryColor }),
        ...(body.status && { status: body.status }),
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.country && { country: body.country }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.foundedYear !== undefined && { foundedYear: body.foundedYear }),
        ...(body.stadiumName !== undefined && { stadiumName: body.stadiumName }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.primaryColor && { primaryColor: body.primaryColor }),
        ...(body.secondaryColor && { secondaryColor: body.secondaryColor }),
        ...(body.status && { status: body.status }),
      },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
            category: true,
            status: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
            category: true,
            status: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
            members: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error('PATCH /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/clubs/[clubId]
 * Delete a club
 * 
 * Requirements:
 * - Only club owner can delete
 * - Club must have no teams
 */
export async function DELETE(
  _req: NextRequest,
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId } = params;

    // Get club with teams
    // Get club with teams
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check authorization - only club owner can delete
    if (club.ownerId !== session.user.id) {
    // Check authorization - only club owner can delete
    if (club.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if club has teams
    if (club.teams.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete club with existing teams. Delete all teams first.' },
        { status: 400 }
      );
    }

    // Delete club
    await prisma.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({
      success: true,
      message: 'Club deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/manager/clubs/[clubId] error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
