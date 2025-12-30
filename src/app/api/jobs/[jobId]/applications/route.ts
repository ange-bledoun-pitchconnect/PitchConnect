// =============================================================================
// 💼 JOB APPLICATIONS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/jobs/[jobId]/applications - List applications (job owner/admin only)
// POST /api/jobs/[jobId]/applications - Submit application
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ | Certification validation enabled
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Prisma,
  JobApplicationStatus,
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
    'FA Level 1', 'FA Level 2', 'FA Level 3', 'FA Level 4',
    'FA Youth Module 1', 'FA Youth Module 2', 'FA Youth Module 3',
    'FA Goalkeeping Level 1', 'FA Goalkeeping Level 2',
    'FA Futsal Level 1', 'FA Futsal Level 2',
  ],
  FUTSAL: ['UEFA Futsal B License', 'FA Futsal Level 1', 'FA Futsal Level 2'],
  BEACH_FOOTBALL: ['Beach Soccer Coaching Certificate'],
  RUGBY: [
    'World Rugby Level 1', 'World Rugby Level 2', 'World Rugby Level 3', 'World Rugby Level 4',
    'RFU Coaching Award', 'World Rugby First Aid', 'World Rugby Strength & Conditioning',
  ],
  CRICKET: [
    'ECB Level 1', 'ECB Level 2', 'ECB Level 3', 'ECB Level 4',
    'ECB Coach Support Worker', 'ECB Foundation Coach', 'ICC Coaching Certification',
  ],
  AMERICAN_FOOTBALL: ['USA Football Certification', 'BAFA Coaching Certificate'],
  BASKETBALL: [
    'FIBA Coaching License', 'Basketball England Level 1', 'Basketball England Level 2',
    'Basketball England Level 3', 'Basketball England Level 4', 'BBL Coaching Certificate',
  ],
  HOCKEY: ['England Hockey Level 1', 'England Hockey Level 2', 'England Hockey Level 3', 'England Hockey Level 4', 'FIH Academy Certification'],
  LACROSSE: ['US Lacrosse Coaching Certification', 'England Lacrosse Level 1', 'England Lacrosse Level 2', 'England Lacrosse Level 3'],
  NETBALL: ['England Netball UKCC Level 1', 'England Netball UKCC Level 2', 'England Netball UKCC Level 3', 'England Netball UKCC Level 4', 'INF Coaching Certificate'],
  AUSTRALIAN_RULES: ['AFL Level 1 Coaching', 'AFL Level 2 Coaching', 'AFL Level 3 Coaching', 'AFL Level 4 Coaching'],
  GAELIC_FOOTBALL: ['GAA Foundation Award', 'GAA Award 1', 'GAA Award 2'],
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(JobApplicationStatus).optional(),
  hasCoachProfile: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(['createdAt', 'rating', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const applicationSchema = z.object({
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  portfolioUrl: z.string().url('Invalid portfolio URL').optional(),
  linkedInUrl: z.string().url('Invalid LinkedIn URL').optional(),
  customAnswers: z.record(z.string().max(2000)).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Check if user has permission to view applications for a job
 */
async function hasApplicationViewPermission(
  userId: string,
  job: {
    createdBy: string;
    clubId: string;
    club: { managerId: string; ownerId: string | null };
  }
): Promise<boolean> {
  if (job.createdBy === userId) return true;
  if (job.club.managerId === userId || job.club.ownerId === userId) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

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

/**
 * Calculate certification match score
 */
function calculateCertificationMatch(
  applicantCerts: string[],
  requiredCerts: string[],
  sport: Sport
): {
  matchScore: number;
  matchedCerts: string[];
  missingCerts: string[];
  bonusCerts: string[];
} {
  const sportCerts = SPORT_CERTIFICATIONS[sport] || [];
  const matchedCerts: string[] = [];
  const missingCerts: string[] = [];
  const bonusCerts: string[] = [];

  // Check required certifications
  for (const required of requiredCerts) {
    const hasMatch = applicantCerts.some(
      (cert) =>
        cert.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(cert.toLowerCase())
    );
    if (hasMatch) {
      matchedCerts.push(required);
    } else {
      missingCerts.push(required);
    }
  }

  // Check for bonus certifications (sport-relevant but not required)
  for (const cert of applicantCerts) {
    const isSportRelevant = sportCerts.some(
      (sc) =>
        sc.toLowerCase().includes(cert.toLowerCase()) ||
        cert.toLowerCase().includes(sc.toLowerCase())
    );
    const isAlreadyMatched = matchedCerts.some(
      (mc) =>
        mc.toLowerCase().includes(cert.toLowerCase()) ||
        cert.toLowerCase().includes(mc.toLowerCase())
    );
    
    if (isSportRelevant && !isAlreadyMatched) {
      bonusCerts.push(cert);
    }
  }

  // Calculate match score
  const requiredWeight = requiredCerts.length > 0 ? (matchedCerts.length / requiredCerts.length) * 100 : 100;
  const bonusWeight = bonusCerts.length * 5; // 5% bonus per extra relevant cert
  const matchScore = Math.min(100, requiredWeight + bonusWeight);

  return {
    matchScore: Math.round(matchScore),
    matchedCerts,
    missingCerts,
    bonusCerts,
  };
}

// =============================================================================
// GET HANDLER - List Applications (Admin Only)
// =============================================================================

export async function GET(
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

    // 3. Fetch job and verify permission
    const job = await prisma.jobPosting.findUnique({
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

    if (!job || job.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'Job posting not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    const hasPermission = await hasApplicationViewPermission(session.user.id, {
      createdBy: job.createdBy,
      clubId: job.clubId,
      club: job.club,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view applications',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      hasCoachProfile: searchParams.get('hasCoachProfile'),
      minRating: searchParams.get('minRating'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
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

    const { page, limit, status, hasCoachProfile, minRating, sortBy, sortOrder } = queryResult.data;
    const skip = (page - 1) * limit;

    // 5. Build where clause
    const where: Prisma.JobApplicationWhereInput = {
      jobPostingId: jobId,
    };

    if (status) where.status = status;
    if (hasCoachProfile !== undefined) {
      where.coachId = hasCoachProfile ? { not: null } : null;
    }
    if (minRating) {
      where.rating = { gte: minRating };
    }

    // 6. Fetch applications
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              nationality: true,
              roles: true,
            },
          },
          coach: {
            select: {
              id: true,
              coachType: true,
              certifications: true,
              specialization: true,
              yearsExperience: true,
              overallRating: true,
              totalPlayersCoached: true,
              matchesManaged: true,
              winRate: true,
              isVerified: true,
              licenseNumber: true,
              licenseExpiry: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // 7. Get status breakdown
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobPostingId: jobId },
      _count: true,
    });

    // 8. Calculate certification match for each applicant
    const formattedApplications = applications.map((app) => {
      const certMatch = app.coach
        ? calculateCertificationMatch(
            app.coach.certifications || [],
            job.certifications || [],
            job.club.sport
          )
        : null;

      return {
        id: app.id,
        status: app.status,
        
        // Applicant info
        user: {
          id: app.user.id,
          name: `${app.user.firstName} ${app.user.lastName}`,
          email: app.user.email,
          avatar: app.user.avatar,
          nationality: app.user.nationality,
          roles: app.user.roles,
        },
        
        // Coach profile (if exists)
        coach: app.coach
          ? {
              id: app.coach.id,
              type: app.coach.coachType,
              certifications: app.coach.certifications,
              specialization: app.coach.specialization,
              yearsExperience: app.coach.yearsExperience,
              rating: app.coach.overallRating,
              playersCoached: app.coach.totalPlayersCoached,
              matchesManaged: app.coach.matchesManaged,
              winRate: app.coach.winRate,
              isVerified: app.coach.isVerified,
              licenseNumber: app.coach.licenseNumber,
              licenseValid: app.coach.licenseExpiry
                ? new Date(app.coach.licenseExpiry) > new Date()
                : null,
            }
          : null,
        
        // Certification match analysis
        certificationMatch: certMatch,
        
        // Application content
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        portfolioUrl: app.portfolioUrl,
        linkedInUrl: app.linkedInUrl,
        customAnswers: app.customAnswers,
        
        // Snapshot (historical data at application time)
        applicantSnapshot: app.applicantSnapshot,
        
        // Review data
        rating: app.rating,
        reviewNotes: app.reviewNotes,
        reviewedBy: app.reviewedBy,
        reviewedAt: app.reviewedAt?.toISOString(),
        
        // Interview
        interviewDate: app.interviewDate?.toISOString(),
        interviewLocation: app.interviewLocation,
        interviewNotes: app.interviewNotes,
        interviewRating: app.interviewRating,
        
        // Offer
        offerDate: app.offerDate?.toISOString(),
        offerSalary: app.offerSalary,
        offerAcceptedAt: app.offerAcceptedAt?.toISOString(),
        offerDeclinedAt: app.offerDeclinedAt?.toISOString(),
        
        // Timestamps
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      };
    });

    // 9. Format response
    return createResponse(
      {
        job: {
          id: job.id,
          title: job.title,
          sport: job.club.sport,
          club: job.club.name,
          requiredCertifications: job.certifications,
        },
        applications: formattedApplications,
        statusCounts: statusCounts.reduce(
          (acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      {
        success: true,
        message: `Retrieved ${applications.length} applications`,
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
    console.error(`[${requestId}] Applications GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch applications',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Submit Application
// =============================================================================

export async function POST(
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

    // 3. Fetch job and validate
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            sport: true,
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

    // Validate job is open for applications
    if (job.status !== JobPostingStatus.OPEN) {
      return createResponse(null, {
        success: false,
        error: 'This job is no longer accepting applications',
        code: 'JOB_CLOSED',
        requestId,
        status: 400,
      });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return createResponse(null, {
        success: false,
        error: 'The application deadline has passed',
        code: 'DEADLINE_PASSED',
        requestId,
        status: 400,
      });
    }

    if (job.maxApplications && job._count.applications >= job.maxApplications) {
      return createResponse(null, {
        success: false,
        error: 'This job has reached its maximum number of applications',
        code: 'MAX_APPLICATIONS_REACHED',
        requestId,
        status: 400,
      });
    }

    // 4. Check for existing application
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_userId: {
          jobPostingId: jobId,
          userId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return createResponse(null, {
        success: false,
        error: 'You have already applied for this job',
        code: 'ALREADY_APPLIED',
        requestId,
        status: 409,
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

    const validation = applicationSchema.safeParse(body);
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

    // 6. Validate required fields based on job settings
    if (job.requiresCoverLetter && !data.coverLetter) {
      return createResponse(null, {
        success: false,
        error: 'Cover letter is required for this application',
        code: 'COVER_LETTER_REQUIRED',
        requestId,
        status: 400,
      });
    }

    if (job.requiresResume && !data.resumeUrl) {
      return createResponse(null, {
        success: false,
        error: 'Resume/CV is required for this application',
        code: 'RESUME_REQUIRED',
        requestId,
        status: 400,
      });
    }

    // Validate custom questions
    if (job.customQuestions && Array.isArray(job.customQuestions)) {
      const questions = job.customQuestions as Array<{ question: string; required: boolean }>;
      for (const q of questions) {
        if (q.required && (!data.customAnswers || !data.customAnswers[q.question])) {
          return createResponse(null, {
            success: false,
            error: `Answer required for: "${q.question}"`,
            code: 'CUSTOM_ANSWER_REQUIRED',
            requestId,
            status: 400,
          });
        }
      }
    }

    // 7. Get user's profile and coach data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        coach: {
          select: {
            id: true,
            coachType: true,
            certifications: true,
            specialization: true,
            yearsExperience: true,
            qualifications: true,
            overallRating: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 8. Calculate certification match
    const certMatch = user.coach
      ? calculateCertificationMatch(
          user.coach.certifications || [],
          job.certifications || [],
          job.club.sport
        )
      : null;

    // 9. Create applicant snapshot
    const applicantSnapshot = {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      roles: user.roles,
      appliedAt: new Date().toISOString(),
      ...(user.coach && {
        coachType: user.coach.coachType,
        certifications: user.coach.certifications,
        specialization: user.coach.specialization,
        yearsExperience: user.coach.yearsExperience,
        qualifications: user.coach.qualifications,
        overallRating: user.coach.overallRating,
        isVerified: user.coach.isVerified,
        certificationMatch: certMatch,
      }),
    };

    // 10. Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId: jobId,
        userId: session.user.id,
        coachId: user.coach?.id,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolioUrl,
        linkedInUrl: data.linkedInUrl,
        customAnswers: data.customAnswers,
        applicantSnapshot,
        status: JobApplicationStatus.PENDING,
      },
    });

    // 11. Update job application count
    await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        applicationCount: { increment: 1 },
      },
    });

    // 12. Notify job creator (fire and forget)
    prisma.notification.create({
      data: {
        userId: job.createdBy,
        title: 'New Job Application',
        message: `${user.firstName} ${user.lastName} has applied for ${job.title}`,
        type: 'JOB_APPLICATION',
        link: `/dashboard/clubs/${job.clubId}/jobs/${jobId}/applications`,
        metadata: {
          jobId,
          applicationId: application.id,
          applicantName: `${user.firstName} ${user.lastName}`,
          certificationMatch: certMatch?.matchScore,
        },
      },
    }).catch(() => {});

    // 13. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'JOB_APPLICATION_SUBMITTED' as AuditActionType,
        resourceType: 'JOB_APPLICATION',
        resourceId: application.id,
        afterState: {
          jobId,
          jobTitle: job.title,
          clubName: job.club.name,
          sport: job.club.sport,
          certificationMatch: certMatch?.matchScore,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 14. Format response
    const response = {
      id: application.id,
      status: application.status,
      job: {
        id: job.id,
        title: job.title,
        club: job.club.name,
        sport: job.club.sport,
      },
      certificationAnalysis: certMatch
        ? {
            matchScore: certMatch.matchScore,
            matchedCertifications: certMatch.matchedCerts,
            missingCertifications: certMatch.missingCerts,
            bonusCertifications: certMatch.bonusCerts,
          }
        : null,
      createdAt: application.createdAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: `Application submitted successfully for ${job.title} at ${job.club.name}`,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Applications POST error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to submit application',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
