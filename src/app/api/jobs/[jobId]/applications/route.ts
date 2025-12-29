// =============================================================================
// 💼 JOB APPLICATIONS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/jobs/[jobId]/applications - List applications (job owner only)
// POST /api/jobs/[jobId]/applications - Submit application
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

const applicationSchema = z.object({
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  linkedInUrl: z.string().url().optional(),
  customAnswers: z.record(z.string()).optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// GET HANDLER - List Applications (Club Owner/Manager Only)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view applications' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // 2. Verify job exists and user has access
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                isActive: true,
                role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Not found', message: 'Job posting not found' },
        { status: 404 }
      );
    }

    const hasAccess = 
      job.createdBy === session.user.id ||
      job.club.managerId === session.user.id ||
      job.club.ownerId === session.user.id ||
      job.club.members.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to view applications' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy') ?? 'createdAt',
      sortOrder: searchParams.get('sortOrder') ?? 'desc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, status, sortBy, sortOrder } = queryResult.data;
    const skip = (page - 1) * limit;

    // 4. Build where clause
    const where: Prisma.JobApplicationWhereInput = {
      jobPostingId: jobId,
    };

    if (status) {
      where.status = status as any;
    }

    // 5. Fetch applications
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
            },
          },
          coach: {
            select: {
              id: true,
              coachType: true,
              certifications: true,
              yearsExperience: true,
              overallRating: true,
              isVerified: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // 6. Get status counts
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobPostingId: jobId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: applications.map(app => ({
        id: app.id,
        user: app.user,
        coach: app.coach,
        status: app.status,
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        portfolioUrl: app.portfolioUrl,
        linkedInUrl: app.linkedInUrl,
        customAnswers: app.customAnswers,
        rating: app.rating,
        reviewNotes: app.reviewNotes,
        interviewDate: app.interviewDate?.toISOString(),
        createdAt: app.createdAt.toISOString(),
        reviewedAt: app.reviewedAt?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
    });

  } catch (error) {
    console.error('[APPLICATIONS_LIST_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST HANDLER - Submit Application
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to apply for a job' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // 2. Verify job exists and is open
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: { select: { name: true } },
      },
    });

    if (!job || job.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Job posting not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Bad request', message: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Bad request', message: 'The application deadline has passed' },
        { status: 400 }
      );
    }

    if (job.maxApplications && job.applicationCount >= job.maxApplications) {
      return NextResponse.json(
        { error: 'Bad request', message: 'This job has reached its maximum number of applications' },
        { status: 400 }
      );
    }

    // 3. Check if user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_userId: {
          jobPostingId: jobId,
          userId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Conflict', message: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();
    const parseResult = applicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 5. Validate required fields based on job settings
    if (job.requiresCoverLetter && !data.coverLetter) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Cover letter is required for this application' },
        { status: 400 }
      );
    }

    if (job.requiresResume && !data.resumeUrl) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Resume/CV is required for this application' },
        { status: 400 }
      );
    }

    // 6. Get user's coach profile if exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        coach: true,
      },
    });

    // 7. Create applicant snapshot
    const applicantSnapshot = {
      name: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      roles: user?.roles,
      ...(user?.coach ? {
        coachType: user.coach.coachType,
        certifications: user.coach.certifications,
        yearsExperience: user.coach.yearsExperience,
        qualifications: user.coach.qualifications,
        overallRating: user.coach.overallRating,
        isVerified: user.coach.isVerified,
      } : {}),
    };

    // 8. Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId: jobId,
        userId: session.user.id,
        coachId: user?.coach?.id,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolioUrl,
        linkedInUrl: data.linkedInUrl,
        customAnswers: data.customAnswers,
        applicantSnapshot,
        status: 'PENDING',
      },
    });

    // 9. Update job application count
    await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        applicationCount: { increment: 1 },
      },
    });

    // 10. Create notification for job creator (fire and forget)
    prisma.notification.create({
      data: {
        userId: job.createdBy,
        title: 'New Job Application',
        message: `${user?.firstName} ${user?.lastName} has applied for ${job.title}`,
        type: 'JOB_APPLICATION',
        link: `/dashboard/clubs/${job.clubId}/jobs/${jobId}/applications`,
        metadata: {
          jobId,
          applicationId: application.id,
          applicantName: `${user?.firstName} ${user?.lastName}`,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
      },
      message: `Your application for ${job.title} at ${job.club.name} has been submitted successfully`,
    }, { status: 201 });

  } catch (error) {
    console.error('[APPLICATION_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to submit application' },
      { status: 500 }
    );
  }
}