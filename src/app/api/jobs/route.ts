// =============================================================================
// 💼 JOBS BOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/jobs - List all open job postings with filtering
// POST /api/jobs - Create new job posting (club members only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  category: z.string().optional(),
  role: z.string().optional(),
  employmentType: z.string().optional(),
  experienceLevel: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'deadline', 'salaryMax', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createJobSchema = z.object({
  clubId: z.string().min(1, 'Club ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  shortDescription: z.string().max(200).optional(),
  category: z.enum([
    'COACHING', 'MANAGEMENT', 'MEDICAL', 'ANALYSIS', 'SCOUTING',
    'ADMINISTRATION', 'MEDIA', 'OPERATIONS', 'FINANCE', 'YOUTH_DEVELOPMENT',
    'PERFORMANCE', 'OTHER'
  ]),
  role: z.enum([
    'OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER', 'STAFF',
    'TREASURER', 'SCOUT', 'ANALYST', 'MEDICAL_STAFF', 'PHYSIOTHERAPIST',
    'NUTRITIONIST', 'PSYCHOLOGIST', 'PERFORMANCE_COACH', 'GOALKEEPING_COACH',
    'KIT_MANAGER', 'MEDIA_OFFICER'
  ]),
  employmentType: z.enum([
    'FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY',
    'INTERNSHIP', 'VOLUNTEER', 'FREELANCE', 'SEASONAL'
  ]).default('FULL_TIME'),
  experienceLevel: z.enum([
    'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'DIRECTOR', 'EXECUTIVE'
  ]).default('MID'),
  requirements: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  yearsExperience: z.number().min(0).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().default('GBP'),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL']).optional(),
  benefits: z.array(z.string()).default([]),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  travelRequired: z.boolean().default(false),
  deadline: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  isUrgent: z.boolean().default(false),
  requiresCoverLetter: z.boolean().default(true),
  requiresResume: z.boolean().default(true),
  customQuestions: z.array(z.object({
    question: z.string(),
    required: z.boolean().default(false),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']).default('text'),
    options: z.array(z.string()).optional(),
  })).optional(),
  status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateSlug(title: string, existingSlugs: string[]): string {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// =============================================================================
// GET HANDLER - List Jobs
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      category: searchParams.get('category'),
      role: searchParams.get('role'),
      employmentType: searchParams.get('employmentType'),
      experienceLevel: searchParams.get('experienceLevel'),
      location: searchParams.get('location'),
      isRemote: searchParams.get('isRemote'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy') ?? 'createdAt',
      sortOrder: searchParams.get('sortOrder') ?? 'desc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      page, limit, category, role, employmentType, experienceLevel,
      location, isRemote, search, sortBy, sortOrder
    } = queryResult.data;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.JobPostingWhereInput = {
      status: 'OPEN',
      deletedAt: null,
      OR: [
        { deadline: null },
        { deadline: { gte: new Date() } },
      ],
    };

    if (category) {
      where.category = category as any;
    }

    if (role) {
      where.role = role as any;
    }

    if (employmentType) {
      where.employmentType = employmentType as any;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel as any;
    }

    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { location: { contains: location, mode: 'insensitive' } },
      ];
    }

    if (isRemote) {
      where.isRemote = true;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { skills: { hasSome: [search] } },
          ],
        },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.JobPostingOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Fetch jobs with count
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              city: true,
              country: true,
              sport: true,
              teamType: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { isUrgent: 'desc' },
          orderBy,
        ],
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Format response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      shortDescription: job.shortDescription,
      category: job.category,
      role: job.role,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      salaryPeriod: job.salaryPeriod,
      location: job.location,
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      deadline: job.deadline?.toISOString(),
      startDate: job.startDate?.toISOString(),
      publishedAt: job.publishedAt?.toISOString(),
      viewCount: job.viewCount,
      applicationCount: job._count.applications,
      club: job.club,
    }));

    return NextResponse.json({
      success: true,
      data: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('[JOBS_LIST_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST HANDLER - Create Job
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to create a job posting' },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const parseResult = createJobSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 3. Verify user has permission to post jobs for this club
    const club = await prisma.club.findUnique({
      where: { id: data.clubId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            isActive: true,
            role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Not found', message: 'Club not found' },
        { status: 404 }
      );
    }

    const hasPermission = 
      club.managerId === session.user.id ||
      club.ownerId === session.user.id ||
      club.members.length > 0;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to create job postings for this club' },
        { status: 403 }
      );
    }

    // 4. Generate unique slug
    const existingJobs = await prisma.jobPosting.findMany({
      where: { clubId: data.clubId },
      select: { slug: true },
    });
    
    const slug = generateSlug(data.title, existingJobs.map(j => j.slug));

    // 5. Create job posting
    const job = await prisma.jobPosting.create({
      data: {
        clubId: data.clubId,
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        role: data.role,
        employmentType: data.employmentType,
        experienceLevel: data.experienceLevel,
        requirements: data.requirements,
        qualifications: data.qualifications,
        certifications: data.certifications,
        skills: data.skills,
        yearsExperience: data.yearsExperience,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        salaryPeriod: data.salaryPeriod,
        benefits: data.benefits,
        location: data.location,
        city: data.city ?? club.city,
        country: data.country ?? club.country,
        isRemote: data.isRemote,
        isHybrid: data.isHybrid,
        travelRequired: data.travelRequired,
        status: data.status,
        publishedAt: data.status === 'OPEN' ? new Date() : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        isUrgent: data.isUrgent,
        requiresCoverLetter: data.requiresCoverLetter,
        requiresResume: data.requiresResume,
        customQuestions: data.customQuestions,
        createdBy: session.user.id,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: job,
      message: data.status === 'OPEN' 
        ? 'Job posting created and published successfully'
        : 'Job posting saved as draft',
    }, { status: 201 });

  } catch (error) {
    console.error('[JOB_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}