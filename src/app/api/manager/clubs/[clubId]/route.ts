/**
 * Club Management API Routes
 * 
 * Handles:
 * - GET: Fetch club details with teams, members, and stats
 * - PATCH: Update club information with validation
 * - DELETE: Delete club (if no teams exist)
 * 
 * Authorization: Only club owner can access their own club
 * Schema-aligned: Uses enhanced Prisma schema with new fields
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs/[clubId]
 * Fetch complete club details including teams, members, and statistics
 * 
 * Returns:
 * - Club details with owner info
 * - Teams with member counts
 * - Club members with roles
 * - Aggregate statistics
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId } = params;

    // Get club with teams and members
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        // Include teams with detailed information
        teams: {
          include: {
            members: {
              select: {
                id: true,
                userId: true,
                role: true,
              },
            },
            _count: {
              select: {
                members: true,
                joinRequests: true,
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
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Include aggregate counts
        _count: {
          select: {
            teams: true,
            members: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Check authorization - only club owner can view
    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: club,
    });
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
 * Update club information with comprehensive validation
 * 
 * Valid fields:
 * - name: string (required)
 * - description: string | null
 * - country: string
 * - city: string | null
 * - foundedYear: number | null
 * - stadiumName: string | null
 * - stadiumCapacity: number | null
 * - logoUrl: string | null
 * - coverUrl: string | null
 * - primaryColor: string (hex color)
 * - secondaryColor: string (hex color)
 * - website: string | null
 * - socialLinks: { twitter?: string, instagram?: string, facebook?: string }
 * - status: string (ACTIVE, INACTIVE, SUSPENDED)
 * - type: TeamType enum (PROFESSIONAL, SEMI_PROFESSIONAL, AMATEUR, YOUTH, POWERLEAGUE, ACADEMY)
 * - timezone: string
 * - currency: string
 * 
 * Authorization: Only club owner can update
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId } = params;
    const body = await req.json();

    // Validate required fields
    if (body.name && typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid name: must be a string' },
        { status: 400 }
      );
    }

    if (body.primaryColor && !isValidHexColor(body.primaryColor)) {
      return NextResponse.json(
        { error: 'Invalid primaryColor: must be a valid hex color' },
        { status: 400 }
      );
    }

    if (body.secondaryColor && !isValidHexColor(body.secondaryColor)) {
      return NextResponse.json(
        { error: 'Invalid secondaryColor: must be a valid hex color' },
        { status: 400 }
      );
    }

    if (body.stadiumCapacity && typeof body.stadiumCapacity !== 'number') {
      return NextResponse.json(
        { error: 'Invalid stadiumCapacity: must be a number' },
        { status: 400 }
      );
    }

    // Get club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Check authorization - only club owner can update
    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Build update data object with only valid fields
    const updateData: any = {};

    // Basic club info
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.foundedYear !== undefined) updateData.foundedYear = body.foundedYear;

    // Stadium info
    if (body.stadiumName !== undefined) updateData.stadiumName = body.stadiumName;
    if (body.stadiumCapacity !== undefined) updateData.stadiumCapacity = body.stadiumCapacity;

    // Media
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.coverUrl !== undefined) updateData.coverUrl = body.coverUrl;

    // Colors
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;

    // Web/Social
    if (body.website !== undefined) updateData.website = body.website;
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;

    // Status & Type
    if (body.status !== undefined) updateData.status = body.status;
    if (body.type !== undefined) updateData.type = body.type;

    // Localization
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.currency !== undefined) updateData.currency = body.currency;

    // Update club
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
                id: true,
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Club updated successfully',
      data: updatedClub,
    });
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
 * Delete a club with strict validation
 * 
 * Requirements:
 * - Only club owner can delete
 * - Club must have no teams (all teams must be deleted first)
 * - Soft delete recommended - consider setting status to INACTIVE instead
 * 
 * Authorization: Only club owner
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { clubId } = params;

    // Get club with teams
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Check authorization - only club owner can delete
    if (club.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the club owner' },
        { status: 403 }
      );
    }

    // Check if club has teams
    if (club.teams.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete club with existing teams',
          message: `This club has ${club.teams.length} team(s): ${club.teams.map(t => t.name).join(', ')}. Delete all teams first.`,
          teamCount: club.teams.length,
          teams: club.teams,
        },
        { status: 400 }
      );
    }

    // Check for active members
    const memberCount = await prisma.clubMember.count({
      where: { clubId },
    });

    if (memberCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete club with active members',
          message: `This club has ${memberCount} member(s). Remove all members first.`,
          memberCount,
        },
        { status: 400 }
      );
    }

    // Delete club (cascade will handle related records per schema)
    await prisma.club.delete({
      where: { id: clubId },
    });

    return NextResponse.json({
      success: true,
      message: 'Club deleted successfully',
      deletedClubId: clubId,
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

/**
 * Utility: Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}
