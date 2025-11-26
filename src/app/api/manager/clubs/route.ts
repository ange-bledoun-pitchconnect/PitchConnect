// src/app/api/manager/clubs/route.ts
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
    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Get all clubs for this manager
    const clubs = await prisma.club.findMany({
      where: { managerId: manager.id },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clubs);
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get manager profile
    let manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    // Auto-create manager profile if doesn't exist
    if (!manager) {
      manager = await prisma.manager.create({
        data: { userId: session.user.id },
      });
    }

    // Parse form data
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const description = formData.get('description') as string;
    const country = formData.get('country') as string;
    const city = formData.get('city') as string;
    const foundedYear = parseInt(formData.get('foundedYear') as string);
    const homeVenue = formData.get('homeVenue') as string;
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

    // Check if club code already exists for this manager
    const existingClub = await prisma.club.findFirst({
      where: {
        code: code.toUpperCase(),
        managerId: manager.id,
      },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: 'A club with this code already exists' },
        { status: 400 }
      );
    }

    // Handle logo upload (if needed, you can integrate with cloud storage)
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      // TODO: Implement cloud storage (e.g., AWS S3, Cloudinary, Supabase Storage)
      // For now, we'll store as base64 or implement later
      console.log('Logo upload not yet implemented. File:', logoFile.name);
    }

    // Create club
    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase(),
        description: description || null,
        country: country || 'United Kingdom',
        city: city || null,
        foundedYear: foundedYear || null,
        homeVenue: homeVenue || null,
        primaryColor: primaryColor || '#1f2937',
        secondaryColor: secondaryColor || '#f59e0b',
        logo: logoUrl,
        website: website || null,
        email: email || null,
        phone: phone || null,
        managerId: manager.id,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    return NextResponse.json(club, { status: 201 });
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
