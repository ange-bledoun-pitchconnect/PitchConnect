// =============================================================================
// 💼 JOBS BOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/jobs - List job postings with multi-sport filtering
// POST /api/jobs - Create new job posting (club members only)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ | Sport-aware filtering & certification validation
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Prisma,
  JobCategory,
  ClubMemberRole,
  EmploymentType,
  ExperienceLevel,
  JobPostingStatus,
  Sport,
  AuditActionType,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  pagination?: PaginationMeta;
  requestId: string;
  timestamp: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// SPORT-SPECIFIC CERTIFICATIONS
// =============================================================================

/**
 * Sport-specific certification requirements/suggestions
 */
const SPORT_CERTIFICATIONS: Record<Sport, string[]> = {
  FOOTBALL: [
    'UEFA Pro License',
    'UEFA A License',
    'UEFA B License',
    'UEFA C License',
    'FA Level 1-4',
    'FA Youth Modules',
    'FA Goalkeeping',
    'FA Futsal',
  ],
  FUTSAL: [
    'UEFA Futsal B License',
    'FA Futsal Level 1-2',
  ],
  BEACH_FOOTBALL: [
    'Beach Soccer Coaching Certificate',
  ],
  RUGBY: [
    'World Rugby Level 1-4',
    'RFU Coaching Award',
    'World Rugby First Aid',
    'World Rugby Strength & Conditioning',
  ],
  CRICKET: [
    'ECB Level 1-4',
    'ECB Coach Support Worker',
    'ECB Foundation Coach',
    'ICC Coaching Certification',
  ],
  AMERICAN_FOOTBALL: [
    'USA Football Certification',
    'BAFA Coaching Certificate',
  ],
  BASKETBALL: [
    'FIBA Coaching License',
    'Basketball England Level 1-4',
    'BBL Coaching Certificate',
  ],
  HOCKEY: [
    'England Hockey Level 1-4',
    'FIH Academy Certification',
  ],
  LACROSSE: [
    'US Lacrosse Coaching Certification',
    'England Lacrosse Level 1-3',
  ],
  NETBALL: [
    'England Netball UKCC Level 1-4',
    'INF Coaching Certificate',
  ],
  AUSTRALIAN_RULES: [
    'AFL Level 1-4 Coaching',
  ],
  GAELIC_FOOTBALL: [
    'GAA Foundation Award',
    'GAA Award 1-2',
  ],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Filtering
  category: z.nativeEnum(JobCategory).optional(),
  role: z.nativeEnum(ClubMemberRole).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  sport: z.nativeEnum(Sport).optional(), // NEW: Multi-sport filter
  
  // Location
  location: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  isRemote: z.coerce.boolean().optional(),
  
  // Search
  search: z.string().max(200).optional(),
  skills: z.string().optional(), // Comma-separated
  
  // Sorting
  sortBy: z.enum(['createdAt', 'deadline', 'salaryMax', 'viewCount', 'applicationCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Flags
  urgent: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  clubId: z.string().cuid().optional(),
});

const createJobSchema = z.object({
  // Required
  clubId: z.string().cuid('Invalid club ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  category: z.nativeEnum(JobCategory),
  role: z.nativeEnum(ClubMemberRole),
  
  // Employment details
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  experienceLevel: z.nativeEnum(ExperienceLevel).default(ExperienceLevel.MID),
  
  // Optional details
  shortDescription: z.string().max(300).optional(),
  requirements: z.array(z.string().max(500)).max(20).default([]),
  qualifications: z.array(z.string().max(500)).max(20).default([]),
  certifications: z.array(z.string().max(200)).max(20).default([]),
  skills: z.array(z.string().max(100)).max(30).default([]),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  
  // Compensation
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().length(3).default('GBP'),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL']).optional(),
  benefits: z.array(z.string().max(200)).max(20).default([]),
  bonusStructure: z.record(z.unknown()).optional(),
  
  // Location
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  isRemote: z.boolean().default(false),
  isHybrid: z.boolean().default(false),
  travelRequired: z.boolean().default(false),
  
  // Dates
  deadline: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  
  // Application requirements
  requiresCoverLetter: z.boolean().default(true),
  requiresResume: z.boolean().default(true),
  maxApplications: z.number().int().min(1).max(10000).optional(),
  customQuestions: z.array(z.object({
    question: z.string().max(500),
    required: z.boolean().default(false),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']).default('text'),
    options: z.array(z.string().max(200)).optional(),
  })).max(10).optional(),
  
  // Flags
  isUrgent: z.boolean().default(false),
  isConfidential: z.boolean().default(false),
  
  // Status
  status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
}).refine(
  (data) => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax,
  { message: 'Minimum salary cannot exceed maximum salary', path: ['salaryMin'] }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: string;
    code?: string;
    pagination?: PaginationMeta;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) {
    response.data = data;
  }
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.pagination) response.pagination = options.pagination;

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Format salary for display
 */
function formatSalaryDisplay(
  min: number | null,
  max: number | null,
  currency: string,
  period?: string | null
): string | null {
  if (!min && !max) return null;

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  let display: string;
  if (min && max) {
    display = `${formatter.format(min)} - ${formatter.format(max)}`;
  } else if (min) {
    display = `From ${formatter.format(min)}`;
  } else if (max) {
    display = `Up to ${formatter.format(max)}`;
  } else {
    return null;
  }

  if (period) {
    display += ` ${period.toLowerCase()}`;
  }

  return display;
}

/**
 * Check if user has permission to create job for club
 */
async function hasJobCreationPermission(
  userId: string,
  clubId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { managerId: true, ownerId: true },
  });

  if (!club) return false;
  if (club.managerId === userId || club.ownerId === userId) return true;

  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
    },
  });

  return !!membership;
}

// =============================================================================
// GET HANDLER - List Jobs
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      role: searchParams.get('role'),
      employmentType: searchParams.get('employmentType'),
      experienceLevel: searchParams.get('experienceLevel'),
      sport: searchParams.get('sport'),
      location: searchParams.get('location'),
      city: searchParams.get('city'),
      country: searchParams.get('country'),
      isRemote: searchParams.get('isRemote'),
      search: searchParams.get('search'),
      skills: searchParams.get('skills'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      urgent: searchParams.get('urgent'),
      featured: searchParams.get('featured'),
      clubId: searchParams.get('clubId'),
    });

    if (!queryResult.success) {
      return createResponse(null, {
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const {
      page,
      limit,
      category,
      role,
      employmentType,
      experienceLevel,
      sport,
      location,
      city,
      country,
      isRemote,
      search,
      skills,
      sortBy,
      sortOrder,
      urgent,
      featured,
      clubId,
    } = queryResult.data;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.JobPostingWhereInput = {
      status: JobPostingStatus.OPEN,
      deletedAt: null,
      OR: [
        { deadline: null },
        { deadline: { gte: new Date() } },
      ],
    };

    // Category/Role filters
    if (category) where.category = category;
    if (role) where.role = role;
    if (employmentType) where.employmentType = employmentType;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    // Sport filter - joins to club
    if (sport) {
      where.club = { sport };
    }

    // Location filters
    if (location) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { country: { contains: location, mode: 'insensitive' } },
            { location: { contains: location, mode: 'insensitive' } },
          ],
        },
      ];
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (isRemote) where.isRemote = true;

    // Search filter
    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Skills filter
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        where.skills = { hasSome: skillList };
      }
    }

    // Flags
    if (urgent) where.isUrgent = true;
    if (featured) where.isFeatured = true;
    if (clubId) where.clubId = clubId;

    // Build orderBy - featured and urgent jobs first
    const orderBy: Prisma.JobPostingOrderByWithRelationInput[] = [
      { isFeatured: 'desc' },
      { isUrgent: 'desc' },
      { [sortBy]: sortOrder },
    ];

    // Execute queries
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortName: true,
              logo: true,
              banner: true,
              city: true,
              country: true,
              sport: true,
              teamType: true,
              isVerified: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Get sport-specific certification suggestions for the requested sport
    const sportCertifications = sport ? SPORT_CERTIFICATIONS[sport] : null;

    // Format response
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      shortDescription: job.shortDescription,
      
      // Classification
      category: job.category,
      role: job.role,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      
      // Sport context
      sport: job.club.sport,
      
      // Compensation
      salary: {
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.currency,
        period: job.salaryPeriod,
        display: formatSalaryDisplay(
          job.salaryMin,
          job.salaryMax,
          job.currency,
          job.salaryPeriod
        ),
      },
      
      // Location
      location: job.location,
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      
      // Skills
      skills: job.skills,
      
      // Flags
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      
      // Dates
      deadline: job.deadline?.toISOString(),
      startDate: job.startDate?.toISOString(),
      publishedAt: job.publishedAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      
      // Stats
      viewCount: job.viewCount,
      applicationCount: job._count.applications,
      
      // Club
      club: job.club,
      
      // Deadline info
      isExpired: job.deadline ? new Date(job.deadline) < new Date() : false,
      daysUntilDeadline: job.deadline
        ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return createResponse(
      {
        jobs: formattedJobs,
        ...(sportCertifications && { suggestedCertifications: sportCertifications }),
      },
      {
        success: true,
        message: `Retrieved ${formattedJobs.length} job postings`,
        requestId,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Jobs GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch jobs',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Job
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    // 3. Validate request body
    const validation = createJobSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Verify club exists and get sport
    const club = await prisma.club.findUnique({
      where: { id: data.clubId },
      select: {
        id: true,
        name: true,
        slug: true,
        sport: true,
        city: true,
        country: true,
      },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Check permission
    const hasPermission = await hasJobCreationPermission(session.user.id, data.clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create jobs for this club',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 6. Validate certifications against sport (warning, not blocking)
    const sportCerts = SPORT_CERTIFICATIONS[club.sport] || [];
    const unmatchedCerts = data.certifications.filter(
      (cert) => !sportCerts.some((sc) => sc.toLowerCase().includes(cert.toLowerCase()))
    );
    
    const certificationWarning = unmatchedCerts.length > 0
      ? `Note: Some certifications may not be standard for ${club.sport}: ${unmatchedCerts.join(', ')}`
      : null;

    // 7. Generate unique slug
    const existingJobs = await prisma.jobPosting.findMany({
      where: { clubId: data.clubId },
      select: { slug: true },
    });
    const slug = generateSlug(data.title, existingJobs.map((j) => j.slug));

    // 8. Create job posting
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
        bonusStructure: data.bonusStructure,
        
        location: data.location,
        city: data.city ?? club.city,
        country: data.country ?? club.country,
        isRemote: data.isRemote,
        isHybrid: data.isHybrid,
        travelRequired: data.travelRequired,
        
        deadline: data.deadline ? new Date(data.deadline) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        
        requiresCoverLetter: data.requiresCoverLetter,
        requiresResume: data.requiresResume,
        maxApplications: data.maxApplications,
        customQuestions: data.customQuestions,
        
        isUrgent: data.isUrgent,
        isConfidential: data.isConfidential,
        
        status: data.status as JobPostingStatus,
        publishedAt: data.status === 'OPEN' ? new Date() : null,
        
        createdBy: session.user.id,
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
      },
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOB_POSTING_CREATED' as AuditActionType,
        resourceType: 'JOB_POSTING',
        resourceId: job.id,
        afterState: {
          title: job.title,
          clubId: job.clubId,
          status: job.status,
          sport: club.sport,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 10. Format response
    const response = {
      id: job.id,
      slug: job.slug,
      title: job.title,
      status: job.status,
      sport: club.sport,
      club: job.club,
      createdAt: job.createdAt.toISOString(),
      publishedAt: job.publishedAt?.toISOString(),
      ...(certificationWarning && { warning: certificationWarning }),
      suggestedCertifications: sportCerts,
    };

    return createResponse(response, {
      success: true,
      message: data.status === 'OPEN'
        ? 'Job posting created and published'
        : 'Job posting saved as draft',
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Jobs POST error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create job posting',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
