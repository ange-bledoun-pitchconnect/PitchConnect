// =============================================================================
// 💼 SINGLE JOB POSTING API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/jobs/[jobId] - Get job details with sport context
// PUT    /api/jobs/[jobId] - Update job posting
// DELETE /api/jobs/[jobId] - Delete job posting (soft delete)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
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
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    jobId: string;
  };
}

// =============================================================================
// SPORT-SPECIFIC CERTIFICATIONS
// =============================================================================

const SPORT_CERTIFICATIONS: Record<Sport, string[]> = {
  FOOTBALL: [
    'UEFA Pro License', 'UEFA A License', 'UEFA B License', 'UEFA C License',
    'FA Level 1-4', 'FA Youth Modules', 'FA Goalkeeping', 'FA Futsal',
  ],
  FUTSAL: ['UEFA Futsal B License', 'FA Futsal Level 1-2'],
  BEACH_FOOTBALL: ['Beach Soccer Coaching Certificate'],
  RUGBY: [
    'World Rugby Level 1-4', 'RFU Coaching Award',
    'World Rugby First Aid', 'World Rugby Strength & Conditioning',
  ],
  CRICKET: [
    'ECB Level 1-4', 'ECB Coach Support Worker',
    'ECB Foundation Coach', 'ICC Coaching Certification',
  ],
  AMERICAN_FOOTBALL: ['USA Football Certification', 'BAFA Coaching Certificate'],
  BASKETBALL: [
    'FIBA Coaching License', 'Basketball England Level 1-4', 'BBL Coaching Certificate',
  ],
  HOCKEY: ['England Hockey Level 1-4', 'FIH Academy Certification'],
  LACROSSE: ['US Lacrosse Coaching Certification', 'England Lacrosse Level 1-3'],
  NETBALL: ['England Netball UKCC Level 1-4', 'INF Coaching Certificate'],
  AUSTRALIAN_RULES: ['AFL Level 1-4 Coaching'],
  GAELIC_FOOTBALL: ['GAA Foundation Award', 'GAA Award 1-2'],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const updateJobSchema = z.object({
  // Basic info
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(50).max(10000).optional(),
  shortDescription: z.string().max(300).optional().nullable(),
  
  // Classification
  category: z.nativeEnum(JobCategory).optional(),
  role: z.nativeEnum(ClubMemberRole).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  
  // Requirements
  requirements: z.array(z.string().max(500)).max(20).optional(),
  qualifications: z.array(z.string().max(500)).max(20).optional(),
  certifications: z.array(z.string().max(200)).max(20).optional(),
  skills: z.array(z.string().max(100)).max(30).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional().nullable(),
  
  // Compensation
  salaryMin: z.number().min(0).optional().nullable(),
  salaryMax: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  salaryPeriod: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL']).optional().nullable(),
  benefits: z.array(z.string().max(200)).max(20).optional(),
  bonusStructure: z.record(z.unknown()).optional().nullable(),
  
  // Location
  location: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  isRemote: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  travelRequired: z.boolean().optional(),
  
  // Dates
  deadline: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  
  // Application settings
  requiresCoverLetter: z.boolean().optional(),
  requiresResume: z.boolean().optional(),
  maxApplications: z.number().int().min(1).max(10000).optional().nullable(),
  customQuestions: z.array(z.object({
    question: z.string().max(500),
    required: z.boolean().default(false),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']).default('text'),
    options: z.array(z.string().max(200)).optional(),
  })).max(10).optional().nullable(),
  
  // Flags
  isUrgent: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isConfidential: z.boolean().optional(),
  
  // Status
  status: z.nativeEnum(JobPostingStatus).optional(),
});

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

  return NextResponse.json(response, { status: options.status || 200 });
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
 * Check if user has permission to manage this job
 */
async function hasJobManagementPermission(
  userId: string,
  job: {
    createdBy: string;
    clubId: string;
    club: { managerId: string; ownerId: string | null };
  }
): Promise<boolean> {
  // Creator always has permission
  if (job.createdBy === userId) return true;
  
  // Club manager/owner has permission
  if (job.club.managerId === userId || job.club.ownerId === userId) return true;

  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  // Check club membership
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: job.clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
    },
  });

  return !!membership;
}

// =============================================================================
// GET HANDLER - Get Job Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { jobId } = params;

  try {
    // Validate jobId
    if (!jobId || jobId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid job ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // Fetch job with all related data
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
            logo: true,
            banner: true,
            description: true,
            city: true,
            country: true,
            sport: true,
            teamType: true,
            website: true,
            twitter: true,
            instagram: true,
            facebook: true,
            youtube: true,
            foundedYear: true,
            isVerified: true,
            followerCount: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job || job.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Job posting not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // Increment view count (fire and forget)
    prisma.jobPosting.update({
      where: { id: jobId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // Check if current user has applied
    const session = await getServerSession(authOptions);
    let hasApplied = false;
    let applicationStatus = null;
    let canManage = false;

    if (session?.user?.id) {
      // Check application status
      const application = await prisma.jobApplication.findUnique({
        where: {
          jobPostingId_userId: {
            jobPostingId: jobId,
            userId: session.user.id,
          },
        },
        select: { status: true, createdAt: true },
      });

      hasApplied = !!application;
      applicationStatus = application?.status ?? null;

      // Check management permission
      canManage = await hasJobManagementPermission(session.user.id, {
        createdBy: job.createdBy,
        clubId: job.clubId,
        club: {
          managerId: job.club.id, // We need actual values
          ownerId: null,
        },
      });
    }

    // Get sport-specific certifications
    const sportCertifications = SPORT_CERTIFICATIONS[job.club.sport] || [];

    // Get similar jobs
    const similarJobs = await prisma.jobPosting.findMany({
      where: {
        status: JobPostingStatus.OPEN,
        deletedAt: null,
        id: { not: jobId },
        OR: [
          { clubId: job.clubId },
          { category: job.category },
          { role: job.role },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        club: {
          select: {
            name: true,
            logo: true,
            sport: true,
          },
        },
        isRemote: true,
        city: true,
      },
      take: 5,
    });

    // Format response
    const response = {
      id: job.id,
      slug: job.slug,
      title: job.title,
      description: job.description,
      shortDescription: job.shortDescription,
      
      // Classification
      category: job.category,
      role: job.role,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      
      // Sport context
      sport: job.club.sport,
      sportCertifications,
      
      // Requirements
      requirements: job.requirements,
      qualifications: job.qualifications,
      certifications: job.certifications,
      skills: job.skills,
      yearsExperience: job.yearsExperience,
      
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
      benefits: job.benefits,
      bonusStructure: job.bonusStructure,
      
      // Location
      location: job.location,
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      travelRequired: job.travelRequired,
      
      // Status & Dates
      status: job.status,
      deadline: job.deadline?.toISOString(),
      startDate: job.startDate?.toISOString(),
      publishedAt: job.publishedAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      
      // Deadline info
      isExpired: job.deadline ? new Date(job.deadline) < new Date() : false,
      daysUntilDeadline: job.deadline
        ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
      
      // Flags
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      isConfidential: job.isConfidential,
      
      // Application settings
      requiresCoverLetter: job.requiresCoverLetter,
      requiresResume: job.requiresResume,
      maxApplications: job.maxApplications,
      customQuestions: job.customQuestions,
      
      // Stats
      viewCount: job.viewCount,
      applicationCount: job._count.applications,
      shortlistedCount: job.shortlistedCount,
      
      // User context
      hasApplied,
      applicationStatus,
      canManage,
      
      // Club
      club: job.club,
      
      // Related
      similarJobs,
      
      // Creator (for admins)
      ...(canManage && {
        createdBy: {
          id: job.creator.id,
          name: `${job.creator.firstName} ${job.creator.lastName}`,
        },
      }),
    };

    return createResponse(response, {
      success: true,
      message: 'Job details retrieved successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Job GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch job details',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PUT HANDLER - Update Job
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { jobId } = params;

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

    // 2. Validate jobId
    if (!jobId || jobId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid job ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing job
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            managerId: true,
            ownerId: true,
            sport: true,
          },
        },
      },
    });

    if (!existingJob || existingJob.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Job posting not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permission
    const hasPermission = await hasJobManagementPermission(session.user.id, {
      createdBy: existingJob.createdBy,
      clubId: existingJob.clubId,
      club: existingJob.club,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to update this job',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Parse and validate request body
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

    const validation = updateJobSchema.safeParse(body);
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

    // 6. Build update data
    const updateData: Record<string, unknown> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'deadline' || key === 'startDate') {
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = value;
        }
      }
    });

    // Set publishedAt if status changed to OPEN
    if (data.status === JobPostingStatus.OPEN && !existingJob.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // 7. Update job
    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
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

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOB_POSTING_UPDATED' as AuditActionType,
        resourceType: 'JOB_POSTING',
        resourceId: jobId,
        beforeState: {
          title: existingJob.title,
          status: existingJob.status,
        },
        afterState: updateData,
        changes: Object.keys(updateData),
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 9. Format response
    const response = {
      id: updatedJob.id,
      slug: updatedJob.slug,
      title: updatedJob.title,
      status: updatedJob.status,
      sport: updatedJob.club.sport,
      club: updatedJob.club,
      updatedAt: updatedJob.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: 'Job posting updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Job PUT error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update job posting',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Soft Delete Job
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { jobId } = params;

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

    // 2. Validate jobId
    if (!jobId || jobId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid job ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing job
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          select: {
            id: true,
            managerId: true,
            ownerId: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!existingJob || existingJob.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Job posting not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permission
    const hasPermission = await hasJobManagementPermission(session.user.id, {
      createdBy: existingJob.createdBy,
      clubId: existingJob.clubId,
      club: existingJob.club,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this job',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Soft delete
    await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        deletedAt: new Date(),
        status: JobPostingStatus.CANCELLED,
      },
    });

    // 6. Notify applicants if any (fire and forget)
    if (existingJob._count.applications > 0) {
      prisma.notification.createMany({
        data: await prisma.jobApplication.findMany({
          where: { jobPostingId: jobId },
          select: { userId: true },
        }).then((apps) =>
          apps.map((app) => ({
            userId: app.userId,
            title: 'Job Posting Closed',
            message: `The job posting "${existingJob.title}" has been closed.`,
            type: 'JOB_CLOSED',
            metadata: { jobId },
          }))
        ),
      }).catch(() => {});
    }

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOB_POSTING_DELETED' as AuditActionType,
        resourceType: 'JOB_POSTING',
        resourceId: jobId,
        beforeState: {
          title: existingJob.title,
          status: existingJob.status,
          applicationCount: existingJob._count.applications,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    return createResponse(null, {
      success: true,
      message: 'Job posting deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Job DELETE error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete job posting',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
