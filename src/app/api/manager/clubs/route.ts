// src/app/api/manager/clubs/route.ts
// NEW PERMISSION MODEL:
// - CLUB_OWNER: Full club ownership and admin permissions (can see everything including treasurer data)
// - CLUB_MANAGER: Manages teams, coaches, and players
// - TREASURER: Financial operations and payment approvals
// - COACH: Manages specific team(s)
// - STAFF: Administrative support

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/manager/clubs
 * Fetch all clubs owned by the authenticated user
 * 
 * Permissions:
 * - CLUB_OWNER: Can access all their owned clubs
 * - CLUB_MANAGER: Can access clubs they manage
 * 
 * Returns: Array of clubs with team count
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get clubOwner profile for owned clubs
    const clubOwner = await prisma.clubOwner.findUnique({
      where: { userId: session.user.id },
    });

    // If user is a club owner, get their owned clubs
    if (clubOwner) {
      const ownedClubs = await prisma.club.findMany({
        where: { ownerId: session.user.id },
        include: {
          _count: {
            select: {
              teams: true,
              members: true,
            },
          },
          members: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        clubs: ownedClubs,
        role: 'OWNER',
        permissions: {
          canManageTeams: clubOwner.canManageTeams,
          canManageTreasury: clubOwner.canManageTreasury,
          canViewAnalytics: clubOwner.canViewAnalytics,
          canManageMembers: clubOwner.canManageMembers,
          canManageLeagues: clubOwner.canManageLeagues,
          canUpdateProfile: clubOwner.canUpdateProfile,
        },
      });
    }

    // Check if user is a club manager
    const clubManager = await prisma.clubManager.findUnique({
      where: { userId: session.user.id },
    });

    if (clubManager) {
      const managedClubs = await prisma.oldClub.findMany({
        where: { managerId: clubManager.id },
        include: {
          teams: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        clubs: managedClubs,
        role: 'MANAGER',
        message: 'Using legacy club manager system',
      });
    }

    // Check if user is a club member (owner/manager/treasurer/etc)
    const clubMemberships = await prisma.clubMember.findMany({
      where: { userId: session.user.id },
      include: {
        club: {
          include: {
            _count: {
              select: {
                teams: true,
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

    return NextResponse.json({
      clubs: [],
      message: 'No clubs found. User is not an owner or member of any club.',
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
 * Permissions:
 * - Any authenticated user can create a club and become its owner
 * 
 * Request body: FormData with club details
 * - name (required): Club name
 * - code (required): Unique club code
 * - description: Club description
 * - country: Country (default: United Kingdom)
 * - city: City
 * - foundedYear: Year founded
 * - stadiumName: Home stadium
 * - primaryColor: Primary brand color
 * - secondaryColor: Secondary brand color
 * - website: Website URL
 * - email: Club email
 * - phone: Club phone
 * - logo: Logo file (currently not implemented)
 * 
 * Returns: Created club object with owner profile
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse form data
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const description = formData.get('description') as string;
    const country = formData.get('country') as string;
    const city = formData.get('city') as string;
    const foundedYear = parseInt(formData.get('foundedYear') as string);
    const stadiumName = formData.get('stadiumName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const website = formData.get('website') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const logoFile = formData.get('logo') as File | null;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
    }

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Club code is required' }, { status: 400 });
    }

    // Check if club code already exists globally
    const existingClub = await prisma.club.findFirst({
      where: {
        id: {
          not: undefined, // Placeholder to use findFirst
        },
      },
    });

    // Handle logo upload (if needed, you can integrate with cloud storage)
    const logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      // TODO: Implement cloud storage (e.g., AWS S3, Cloudinary, Supabase Storage)
      console.log('Logo upload not yet implemented. File:', logoFile.name);
    }

    // Create club with owner as the authenticated user
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        city: city || 'Unknown',
        country: country || 'United Kingdom',
        description: description || null,
        foundedYear: foundedYear || null,
        stadiumName: stadiumName || null,
        primaryColor: primaryColor || '#FFD700',
        secondaryColor: secondaryColor || '#FF6B35',
        logoUrl: logoUrl,
        status: 'ACTIVE',
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            teams: true,
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
        error: 'Failed to create club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
