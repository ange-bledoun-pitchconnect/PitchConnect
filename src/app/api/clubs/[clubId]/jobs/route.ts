// ============================================================================
// 💼 CLUB JOBS API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET  /api/clubs/[clubId]/jobs - List job postings for a club
// POST /api/clubs/[clubId]/jobs - Create a new job posting
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { 
  JobPostingStatus, 
  JobCategory, 
  ClubMemberRole, 
  EmploymentType, 
  ExperienceLevel,
  Prisma 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface JobListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  category: JobCategory;
  role: ClubMemberRole;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  location: string | null;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    period: string | null;
  };
  status: JobPostingStatus;
  isUrgent: boolean;
  isFeatured: boolean;
  deadline: string | null;
  viewCount: number;
  applicationCount: number;
  publishedAt: string | null;
  createdAt: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const JOB_CATEGORIES = [
  'COACHING', 'MANAGEMENT', 'MEDICAL', 'ANALYSIS', 'SCOUTING',
  'ADMINISTRATION', 'MEDIA', 'OPERATIONS', 'FINANCE', 'YOUTH_DEVELOPMENT',
  'PERFORMANCE', 'OTHER'
] as const;

const CLUB_MEMBER_ROLES = [
  'OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER', 'STAFF',
  'TREASURER', 'SCOUT', 'ANALYST', 'MEDICAL_STAFF', 'PHYSIOTHERAPIST',
  'NUTRITIONIST', 'PSYCHOLOGIST', 'PERFORMANCE_COACH', 'GOALKEEPING_COACH',
  'KIT_MANAGER', 'MEDIA_OFFICER', 'VIDEO_ANALYST'
] as const;

const EMPLOYMENT_TYPES = [
  'FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 
  'INTERNSHIP', 'VOLUNTEER', 'FREELANCE', 'SEASONAL'
] as const;

const EXPERIENCE_LEVELS = [
  'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'DIRECTOR', 'EXECUTIVE'
] as const;

const JOB_STATUSES = [
  'DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'FILLED', 'CANCELLED', 'EXPIRED'
] as const;

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  status: z.string().transform(s => s?.split(',').filter(Boolean)).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  isRemote: z.string().transform(v => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'deadline', 'viewCount', 'applicationCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  shortDescription: z.string().max(500).optional(),
  category: z.enum(JOB_CATEGORIES),
  role: z.enum(CLUB_MEMBER_ROLES),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('FULL_TIME'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default('MID'),
  requirements: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  yearsExperience: z.number().min(0).max(50).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().length(3).default('GBP'),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL']).optional(),
  benefits: z.array(z.string()).default([]),
  bonusStructure: z.record(z.any()).optional(),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).default('United Kingdom'),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  travelRequired: z.boolean().default(false),
  status: z.enum(JOB_STATUSES).default('DRAFT'),
  deadline: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  isUrgent: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isConfidential: z.boolean().default(false),
  maxApplications: z.number().positive().optional(),
  requiresCoverLetter: z.boolean().default(true),
  requiresResume: z.boolean().default(true),
  customQuestions: z.array(z.object({
    question: z.string(),
    required: z.boolean().default(false),
    type: z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'MULTISELECT']).default('TEXT'),
    options: z.array(z.string()).optional(),
  })).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `jobs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateSlug(title: string, clubSlug: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  return `${titleSlug}-${clubSlug.substring(0, 10)}-${Date.now().toString(36)}`;
}

// ============================================================================
// GET /api/clubs/[clubId]/jobs - List Jobs
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication (optional for public jobs)
    const session = await auth();
    const { clubId } = params;

    // 2. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, slug: true, deletedAt: true },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Check if user is club staff (can see all statuses)
    let isStaff = false;
    if (session?.user?.id) {
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'STAFF'] },
        },
      });
      isStaff = !!membership;
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: queryResult.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { page, limit, search, category, status, employmentType, experienceLevel, isRemote, sortBy, sortOrder } = queryResult.data;

    // 5. Build where clause
    const where: Prisma.JobPostingWhereInput = {
      clubId,
      deletedAt: null,
    };

    // Non-staff can only see published jobs
    if (!isStaff) {
      where.status = 'OPEN';
    } else if (status && status.length > 0) {
      const validStatuses = status.filter(s => JOB_STATUSES.includes(s as any));
      if (validStatuses.length > 0) {
        where.status = validStatuses.length === 1 
          ? validStatuses[0] as JobPostingStatus 
          : { in: validStatuses as JobPostingStatus[] };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (employmentType) where.employmentType = employmentType;
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (isRemote !== undefined) where.isRemote = isRemote;

    // 6. Execute query
    const skip = (page - 1) * limit;

    const [jobs, totalCount] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // 7. Format response
    const formattedJobs: JobListItem[] = jobs.map(job => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      shortDescription: job.shortDescription,
      category: job.category,
      role: job.role,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      location: job.location,
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      salary: {
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.currency,
        period: job.salaryPeriod,
      },
      status: job.status,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      deadline: job.deadline?.toISOString() ?? null,
      viewCount: job.viewCount,
      applicationCount: job._count.applications,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: formattedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
      meta: {
        requestId,
        clubId,
        clubName: club.name,
        isStaff,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[JOBS_LIST_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// POST /api/clubs/[clubId]/jobs - Create Job
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Get club and verify exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, slug: true, sport: true, deletedAt: true },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization - check membership
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    if (!membership && !user?.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to create job postings' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = createJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 5. Validate salary range
    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Minimum salary cannot exceed maximum salary' },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Generate slug
    const slug = generateSlug(input.title, club.slug);

    // 7. Create job posting
    const job = await prisma.$transaction(async (tx) => {
      const newJob = await tx.jobPosting.create({
        data: {
          clubId,
          createdBy: session.user.id,
          title: input.title,
          slug,
          description: input.description,
          shortDescription: input.shortDescription,
          category: input.category as JobCategory,
          role: input.role as ClubMemberRole,
          employmentType: input.employmentType as EmploymentType,
          experienceLevel: input.experienceLevel as ExperienceLevel,
          requirements: input.requirements,
          qualifications: input.qualifications,
          certifications: input.certifications,
          skills: input.skills,
          yearsExperience: input.yearsExperience,
          salaryMin: input.salaryMin,
          salaryMax: input.salaryMax,
          currency: input.currency,
          salaryPeriod: input.salaryPeriod,
          benefits: input.benefits,
          bonusStructure: input.bonusStructure,
          location: input.location,
          city: input.city,
          country: input.country,
          isRemote: input.isRemote,
          isHybrid: input.isHybrid,
          travelRequired: input.travelRequired,
          status: input.status as JobPostingStatus,
          publishedAt: input.status === 'OPEN' ? new Date() : null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          isUrgent: input.isUrgent,
          isFeatured: input.isFeatured,
          isConfidential: input.isConfidential,
          maxApplications: input.maxApplications,
          requiresCoverLetter: input.requiresCoverLetter,
          requiresResume: input.requiresResume,
          customQuestions: input.customQuestions,
        },
        include: {
          club: {
            select: { id: true, name: true, logo: true, sport: true },
          },
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'JOB_POSTED',
          resourceType: 'JobPosting',
          resourceId: newJob.id,
          afterState: {
            id: newJob.id,
            title: newJob.title,
            category: newJob.category,
            status: newJob.status,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return newJob;
    });

    console.log('[JOB_CREATED]', { requestId, jobId: job.id, title: job.title, clubId, userId: session.user.id });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: job.id,
          title: job.title,
          slug: job.slug,
          category: job.category,
          role: job.role,
          status: job.status,
          club: job.club,
          creator: job.creator ? {
            id: job.creator.id,
            name: `${job.creator.firstName} ${job.creator.lastName}`.trim(),
          } : null,
          createdAt: job.createdAt.toISOString(),
        },
        message: 'Job posting created successfully',
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
    );

  } catch (error) {
    console.error('[JOB_CREATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create job posting' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
