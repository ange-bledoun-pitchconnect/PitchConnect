// =============================================================================
// 💼 SINGLE JOB POSTING API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/jobs/[jobId] - Get job details
// PUT /api/jobs/[jobId] - Update job posting
// DELETE /api/jobs/[jobId] - Delete job posting
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(50).optional(),
  shortDescription: z.string().max(200).optional(),
  requirements: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  benefits: z.array(z.string()).optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isRemote: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  deadline: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  isUrgent: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'FILLED']).optional(),
});

// =============================================================================
// GET HANDLER - Get Job Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Fetch job with related data
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            foundedYear: true,
            isVerified: true,
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
      return NextResponse.json(
        { error: 'Not found', message: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget)
    prisma.jobPosting.update({
      where: { id: jobId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {}); // Ignore errors for view count

    // Check if current user has already applied
    const session = await getServerSession(authOptions);
    let hasApplied = false;
    let applicationStatus = null;

    if (session?.user?.id) {
      const application = await prisma.jobApplication.findUnique({
        where: {
          jobPostingId_userId: {
            jobPostingId: jobId,
            userId: session.user.id,
          },
        },
        select: { status: true },
      });
      
      hasApplied = !!application;
      applicationStatus = application?.status ?? null;
    }

    // Format salary display
    let salaryDisplay = null;
    if (job.salaryMin || job.salaryMax) {
      const formatSalary = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: job.currency,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      if (job.salaryMin && job.salaryMax) {
        salaryDisplay = `${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}`;
      } else if (job.salaryMin) {
        salaryDisplay = `From ${formatSalary(job.salaryMin)}`;
      } else if (job.salaryMax) {
        salaryDisplay = `Up to ${formatSalary(job.salaryMax)}`;
      }

      if (job.salaryPeriod) {
        salaryDisplay += ` ${job.salaryPeriod.toLowerCase()}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        slug: job.slug,
        title: job.title,
        description: job.description,
        shortDescription: job.shortDescription,
        category: job.category,
        role: job.role,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        requirements: job.requirements,
        qualifications: job.qualifications,
        certifications: job.certifications,
        skills: job.skills,
        yearsExperience: job.yearsExperience,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryDisplay,
        currency: job.currency,
        salaryPeriod: job.salaryPeriod,
        benefits: job.benefits,
        location: job.location,
        city: job.city,
        country: job.country,
        isRemote: job.isRemote,
        isHybrid: job.isHybrid,
        travelRequired: job.travelRequired,
        status: job.status,
        isUrgent: job.isUrgent,
        isFeatured: job.isFeatured,
        isConfidential: job.isConfidential,
        deadline: job.deadline?.toISOString(),
        startDate: job.startDate?.toISOString(),
        publishedAt: job.publishedAt?.toISOString(),
        createdAt: job.createdAt.toISOString(),
        viewCount: job.viewCount,
        applicationCount: job._count.applications,
        requiresCoverLetter: job.requiresCoverLetter,
        requiresResume: job.requiresResume,
        customQuestions: job.customQuestions,
        club: job.club,
        hasApplied,
        applicationStatus,
        isExpired: job.deadline ? new Date(job.deadline) < new Date() : false,
        daysUntilDeadline: job.deadline 
          ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      },
    });

  } catch (error) {
    console.error('[JOB_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT HANDLER - Update Job
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update a job posting' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // 2. Fetch job and verify permissions
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

    if (!job || job.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Job posting not found' },
        { status: 404 }
      );
    }

    const hasPermission = 
      job.createdBy === session.user.id ||
      job.club.managerId === session.user.id ||
      job.club.ownerId === session.user.id ||
      job.club.members.length > 0;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this job posting' },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json();
    const parseResult = updateJobSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 4. Update job
    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
        publishedAt: data.status === 'OPEN' && !job.publishedAt ? new Date() : undefined,
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
      data: updatedJob,
      message: 'Job posting updated successfully',
    });

  } catch (error) {
    console.error('[JOB_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update job posting' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE HANDLER - Delete Job
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete a job posting' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // 2. Fetch job and verify permissions
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        club: true,
      },
    });

    if (!job || job.deletedAt) {
      return NextResponse.json(
        { error: 'Not found', message: 'Job posting not found' },
        { status: 404 }
      );
    }

    const hasPermission = 
      job.createdBy === session.user.id ||
      job.club.managerId === session.user.id ||
      job.club.ownerId === session.user.id;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this job posting' },
        { status: 403 }
      );
    }

    // 3. Soft delete
    await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully',
    });

  } catch (error) {
    console.error('[JOB_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to delete job posting' },
      { status: 500 }
    );
  }
}