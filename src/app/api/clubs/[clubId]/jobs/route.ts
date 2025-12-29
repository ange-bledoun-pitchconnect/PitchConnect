// ============================================================================
// 💼 JOB API ROUTES - PitchConnect v7.3.0
// ============================================================================
// RESTful API endpoints for job postings
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  CreateJobPostingSchema,
  generateJobSlug,
  JobTypeSchema,
  JobStatusSchema,
  ExperienceLevelSchema,
} from '@/schemas/job.schema';

// ============================================================================
// GET /api/clubs/[clubId]/jobs - List job postings for a club
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await auth();
    const { clubId } = params;
    const { searchParams } = new URL(request.url);

    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } },
        { status: 404 }
      );
    }

    // Parse query parameters
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.JobPostingWhereInput = {
      clubId,
      deletedAt: null,
    };

    // Check if user is club manager (can see all statuses)
    let isManager = false;
    if (session?.user?.id) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER'] },
        },
      });
      isManager = !!membership;
    }

    // Non-managers can only see published jobs
    if (!isManager) {
      where.status = 'PUBLISHED';
    } else if (statusParam) {
      const statuses = statusParam.split(',').filter(s => {
        const result = JobStatusSchema.safeParse(s.trim());
        return result.success;
      });
      if (statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] as any : { in: statuses as any };
      }
    }

    if (typeParam) {
      const types = typeParam.split(',').filter(t => {
        const result = JobTypeSchema.safeParse(t.trim());
        return result.success;
      });
      if (types.length > 0) {
        where.type = types.length === 1 ? types[0] as any : { in: types as any };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total
    const total = await prisma.jobPosting.count({ where });

    // Get jobs
    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        location: true,
        isRemote: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
        currency: true,
        showSalary: true,
        experienceLevel: true,
        applicationDeadline: true,
        viewCount: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        data: jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + jobs.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('GET /api/clubs/[clubId]/jobs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/clubs/[clubId]/jobs - Create job posting
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { clubId } = params;
    const body = await request.json();

    // Add clubId to body for validation
    body.clubId = clubId;

    // Validate input
    const parseResult = CreateJobPostingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create jobs' } },
        { status: 403 }
      );
    }

    // Get club for slug
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { slug: true },
    });

    if (!club) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = generateJobSlug(input.title, club.slug);

    // Create job
    const job = await prisma.jobPosting.create({
      data: {
        clubId,
        organisationId: input.organisationId,
        postedById: session.user.id,
        title: input.title,
        slug,
        description: input.description,
        responsibilities: input.responsibilities,
        requirements: input.requirements,
        benefits: input.benefits,
        type: input.type,
        experienceLevel: input.experienceLevel,
        location: input.location,
        isRemote: input.isRemote,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        salaryType: input.salaryType,
        currency: input.currency,
        showSalary: input.showSalary,
        skills: input.skills,
        qualifications: input.qualifications,
        applicationDeadline: input.applicationDeadline,
        startDate: input.startDate,
        contactEmail: input.contactEmail,
        applicationUrl: input.applicationUrl,
        status: input.status,
        metadata: input.metadata as Prisma.JsonValue,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            sport: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: job,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/clubs/[clubId]/jobs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create job' } },
      { status: 500 }
    );
  }
}