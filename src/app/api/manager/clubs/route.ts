/**
 * List or Create Clubs API
 *
 * GET /api/manager/clubs
 * POST /api/manager/clubs
 *
 * GET: Retrieves all clubs owned by the authenticated user
 * POST: Creates a new club with the user as owner
 *
 * Permission Model:
 * - CLUB_OWNER: Full club ownership and admin permissions
 * - CLUB_MANAGER: Manages teams, coaches, and players
 * - TREASURER: Financial operations and payment approvals
 * - COACH: Manages specific team(s)
 * - STAFF: Administrative support
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs
 * Fetch all clubs owned by the authenticated user
 *
 * Returns: Array of clubs with member info
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get clubs owned by the authenticated user
    const ownedClubs = await prisma.club.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (clubMemberships.length > 0) {
      return NextResponse.json({
        clubs: clubMemberships.map((m) => m.club),
        memberships: clubMemberships,
        role: clubMemberships[0].role,
      });
    }

    // If user owns clubs, return them
    if (ownedClubs.length > 0) {
      // Get owner profile for permissions
      const ownerProfile = await prisma.clubOwner.findUnique({
        where: { userId: session.user.id },
      });

      return NextResponse.json({
        clubs: ownedClubs,
        role: 'OWNER',
        permissions: ownerProfile
          ? {
              canManageTeams: ownerProfile.canManageTeams,
              canManageTreasury: ownerProfile.canManageTreasury,
              canViewAnalytics: ownerProfile.canViewAnalytics,
              canManageMembers: ownerProfile.canManageMembers,
              canManageLeagues: ownerProfile.canManageLeagues,
              canUpdateProfile: ownerProfile.canUpdateProfile,
            }
          : null,
      });
    }

    // Check if user is a club member (manager/treasurer/coach/staff)
    const clubMemberships = await prisma.clubMember.findMany({
      where: { userId: session.user.id },
      include: {
        club: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (clubMemberships.length > 0) {
      return NextResponse.json({
        clubs: clubMemberships.map((m) => m.club),
        memberships: clubMemberships,
        role: clubMemberships[0].role,
      });
    }

    // User has no clubs
    return NextResponse.json({
      clubs: [],
      message: 'No clubs found. Create a new club or ask to join one.',
    });
  } catch (error) {
    console.error('GET /api/manager/clubs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch clubs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/clubs
 * Create a new club. The authenticated user becomes the club owner.
 *
 * Request body: JSON with club details
 * - name (required): Club name
 * - description: Club description
 * - country: Country (default: United Kingdom)
 * - city: City
 * - foundedYear: Year founded
 * - stadiumName: Home stadium
 * - primaryColor: Primary brand color (default: #FFD700)
 * - secondaryColor: Secondary brand color (default: #FF6B35)
 *
 * Returns: Created club object with owner profile and membership
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      name,
      description,
      country = 'United Kingdom',
      city,
      foundedYear,
      stadiumName,
      primaryColor = '#FFD700',
      secondaryColor = '#FF6B35',
    } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
    }

    // Create club with owner as the authenticated user
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        city: city?.trim() || 'Unknown',
        country: country?.trim() || 'United Kingdom',
        description: description?.trim() || null,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        stadiumName: stadiumName?.trim() || null,
        primaryColor: primaryColor || '#FFD700',
        secondaryColor: secondaryColor || '#FF6B35',
        status: 'ACTIVE',
        ownerId: session.user.id,
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Auto-create ClubOwner profile if it doesn't exist
    const ownerProfile = await prisma.clubOwner.upsert({
      where: { userId: session.user.id },
      update: {}, // No updates if already exists
      create: {
        userId: session.user.id,
        canManageTeams: true,
        canManageTreasury: true,
        canViewAnalytics: true,
        canManageMembers: true,
        canManageLeagues: true,
        canUpdateProfile: true,
        canDeleteClub: false,
        canTransferOwnership: false,
        canViewReports: true,
        canManageSubscriptions: true,
      },
    });

    // Add owner as a club member with OWNER role
    const ownerMember = await prisma.clubMember.upsert({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: session.user.id,
        },
      },
      update: { role: 'OWNER' },
      create: {
        clubId: club.id,
        userId: session.user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(
      {
        success: true,
        club,
        ownerProfile,
        ownerMember,
        message: 'Club created successfully. You are now the club owner.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/manager/clubs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
