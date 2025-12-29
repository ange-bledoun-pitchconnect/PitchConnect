// ============================================================================
// 💼 JOB ACTIONS - PitchConnect v7.3.0
// ============================================================================
// Server actions for job posting and application management
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  CreateJobPostingSchema,
  UpdateJobPostingSchema,
  CreateJobApplicationSchema,
  ReviewApplicationSchema,
  JobPostingFiltersSchema,
  PaginationSchema,
  generateJobSlug,
  type CreateJobPostingInput,
  type UpdateJobPostingInput,
  type CreateJobApplicationInput,
  type ReviewApplicationInput,
  type JobPostingFilters,
  type PaginationOptions,
} from '@/schemas/job.schema';
import type {
  JobPostingWithRelations,
  JobPostingListItem,
  JobApplicationWithRelations,
  JobApplicationListItem,
  PaginatedJobResponse,
  PaginatedApplicationResponse,
  JobPostingStats,
  ApplicationStats,
  ApiResponse,
} from '@/types/job.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user can manage jobs for a club
 */
async function canManageJobs(userId: string, clubId: string): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER'] },
    },
  });
  return !!membership;
}

/**
 * Build where clause from filters
 */
function buildJobWhereClause(
  filters: JobPostingFilters
): Prisma.JobPostingWhereInput {
  const where: Prisma.JobPostingWhereInput = {
    deletedAt: null,
  };

  if (filters.clubId) where.clubId = filters.clubId;
  if (filters.organisationId) where.organisationId = filters.organisationId;

  if (filters.type) {
    where.type = Array.isArray(filters.type)
      ? { in: filters.type }
      : filters.type;
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters.experienceLevel) {
    where.experienceLevel = Array.isArray(filters.experienceLevel)
      ? { in: filters.experienceLevel }
      : filters.experienceLevel;
  }

  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }

  if (filters.isRemote !== undefined) {
    where.isRemote = filters.isRemote;
  }

  if (filters.salaryMin) {
    where.salaryMax = { gte: filters.salaryMin };
  }

  if (filters.salaryMax) {
    where.salaryMin = { lte: filters.salaryMax };
  }

  if (filters.skills && filters.skills.length > 0) {
    where.skills = { hasSome: filters.skills };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { club: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters.sport) {
    where.club = { sport: filters.sport as any };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  return where;
}

// ============================================================================
// CREATE JOB POSTING
// ============================================================================

export async function createJobPosting(
  input: CreateJobPostingInput
): Promise<ApiResponse<JobPostingWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Validate input
    const validatedInput = CreateJobPostingSchema.parse(input);

    // Check permission
    const canManage = await canManageJobs(session.user.id, validatedInput.clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create jobs' } };
    }

    // Get club for slug
    const club = await prisma.club.findUnique({
      where: { id: validatedInput.clubId },
      select: { slug: true },
    });

    if (!club) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } };
    }

    // Generate slug
    const slug = generateJobSlug(validatedInput.title, club.slug);

    // Create job posting
    const job = await prisma.jobPosting.create({
      data: {
        clubId: validatedInput.clubId,
        organisationId: validatedInput.organisationId,
        postedById: session.user.id,
        title: validatedInput.title,
        slug,
        description: validatedInput.description,
        responsibilities: validatedInput.responsibilities,
        requirements: validatedInput.requirements,
        benefits: validatedInput.benefits,
        type: validatedInput.type,
        experienceLevel: validatedInput.experienceLevel,
        location: validatedInput.location,
        isRemote: validatedInput.isRemote,
        salaryMin: validatedInput.salaryMin,
        salaryMax: validatedInput.salaryMax,
        salaryType: validatedInput.salaryType,
        currency: validatedInput.currency,
        showSalary: validatedInput.showSalary,
        skills: validatedInput.skills,
        qualifications: validatedInput.qualifications,
        applicationDeadline: validatedInput.applicationDeadline,
        startDate: validatedInput.startDate,
        contactEmail: validatedInput.contactEmail,
        applicationUrl: validatedInput.applicationUrl,
        status: validatedInput.status,
        metadata: validatedInput.metadata as Prisma.JsonValue,
      },
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
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
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

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${validatedInput.clubId}/jobs`);
    revalidatePath('/jobs');

    return {
      success: true,
      data: job as unknown as JobPostingWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating job posting:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create job posting' },
    };
  }
}

// ============================================================================
// GET JOB POSTINGS
// ============================================================================

export async function getJobPostings(
  filters?: JobPostingFilters,
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedJobResponse>> {
  try {
    const validatedFilters = JobPostingFiltersSchema.parse(filters ?? {});
    const validatedPagination = PaginationSchema.parse(pagination ?? {});

    const { page, limit, sortBy, sortOrder } = validatedPagination;
    const skip = (page - 1) * limit;

    const where = buildJobWhereClause(validatedFilters);

    // For public listing, only show published jobs
    if (!validatedFilters.clubId) {
      where.status = 'PUBLISHED';
    }

    const orderBy: Prisma.JobPostingOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const total = await prisma.jobPosting.count({ where });

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy,
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
        createdAt: true,
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            sport: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return {
      success: true,
      data: {
        data: jobs as JobPostingListItem[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + jobs.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' },
    };
  }
}

// ============================================================================
// GET SINGLE JOB POSTING
// ============================================================================

export async function getJobPosting(
  jobIdOrSlug: string
): Promise<ApiResponse<JobPostingWithRelations>> {
  try {
    const isId = jobIdOrSlug.length === 25; // CUID length

    const job = await prisma.jobPosting.findFirst({
      where: {
        ...(isId ? { id: jobIdOrSlug } : { slug: jobIdOrSlug }),
        deletedAt: null,
      },
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
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
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

    if (!job) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }

    // Increment view count
    await prisma.jobPosting.update({
      where: { id: job.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: job as unknown as JobPostingWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching job posting:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch job' },
    };
  }
}

// ============================================================================
// UPDATE JOB POSTING
// ============================================================================

export async function updateJobPosting(
  jobId: string,
  input: UpdateJobPostingInput
): Promise<ApiResponse<JobPostingWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = UpdateJobPostingSchema.parse(input);

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!existingJob) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }

    // Check permission
    const canManage = await canManageJobs(session.user.id, existingJob.clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update this job' } };
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(validatedInput.title && { title: validatedInput.title }),
        ...(validatedInput.description && { description: validatedInput.description }),
        ...(validatedInput.responsibilities !== undefined && { responsibilities: validatedInput.responsibilities }),
        ...(validatedInput.requirements !== undefined && { requirements: validatedInput.requirements }),
        ...(validatedInput.benefits !== undefined && { benefits: validatedInput.benefits }),
        ...(validatedInput.type && { type: validatedInput.type }),
        ...(validatedInput.experienceLevel !== undefined && { experienceLevel: validatedInput.experienceLevel }),
        ...(validatedInput.location !== undefined && { location: validatedInput.location }),
        ...(validatedInput.isRemote !== undefined && { isRemote: validatedInput.isRemote }),
        ...(validatedInput.salaryMin !== undefined && { salaryMin: validatedInput.salaryMin }),
        ...(validatedInput.salaryMax !== undefined && { salaryMax: validatedInput.salaryMax }),
        ...(validatedInput.salaryType !== undefined && { salaryType: validatedInput.salaryType }),
        ...(validatedInput.currency && { currency: validatedInput.currency }),
        ...(validatedInput.showSalary !== undefined && { showSalary: validatedInput.showSalary }),
        ...(validatedInput.skills && { skills: validatedInput.skills }),
        ...(validatedInput.qualifications && { qualifications: validatedInput.qualifications }),
        ...(validatedInput.applicationDeadline !== undefined && { applicationDeadline: validatedInput.applicationDeadline }),
        ...(validatedInput.startDate !== undefined && { startDate: validatedInput.startDate }),
        ...(validatedInput.contactEmail !== undefined && { contactEmail: validatedInput.contactEmail }),
        ...(validatedInput.applicationUrl !== undefined && { applicationUrl: validatedInput.applicationUrl }),
        ...(validatedInput.status && { status: validatedInput.status }),
        ...(validatedInput.metadata && { metadata: validatedInput.metadata as Prisma.JsonValue }),
      },
      include: {
        club: {
          select: { id: true, name: true, slug: true, logo: true, city: true, country: true, sport: true },
        },
        organisation: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        postedBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: { select: { applications: true } },
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/clubs/${existingJob.clubId}/jobs`);
    revalidatePath('/jobs');

    return {
      success: true,
      data: updatedJob as unknown as JobPostingWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error updating job posting:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update job' },
    };
  }
}

// ============================================================================
// DELETE JOB POSTING
// ============================================================================

export async function deleteJobPosting(
  jobId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!existingJob) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }

    const canManage = await canManageJobs(session.user.id, existingJob.clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to delete this job' } };
    }

    await prisma.jobPosting.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/dashboard/clubs/${existingJob.clubId}/jobs`);
    revalidatePath('/jobs');

    return {
      success: true,
      data: { deleted: true },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error deleting job posting:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete job' },
    };
  }
}

// ============================================================================
// CREATE JOB APPLICATION
// ============================================================================

export async function createJobApplication(
  input: CreateJobApplicationInput
): Promise<ApiResponse<JobApplicationWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = CreateJobApplicationSchema.parse(input);

    // Check job exists and is accepting applications
    const job = await prisma.jobPosting.findUnique({
      where: { id: validatedInput.jobId, deletedAt: null },
      select: {
        id: true,
        status: true,
        applicationDeadline: true,
        clubId: true,
      },
    });

    if (!job) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }

    if (job.status !== 'PUBLISHED') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Job is not accepting applications' } };
    }

    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Application deadline has passed' } };
    }

    // Check for existing application
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId: validatedInput.jobId,
        applicantId: session.user.id,
      },
    });

    if (existingApplication) {
      return { success: false, error: { code: 'CONFLICT', message: 'You have already applied for this job' } };
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: validatedInput.jobId,
        applicantId: session.user.id,
        coverLetter: validatedInput.coverLetter,
        resumeUrl: validatedInput.resumeUrl,
        portfolioUrl: validatedInput.portfolioUrl,
        linkedInUrl: validatedInput.linkedInUrl,
        expectedSalary: validatedInput.expectedSalary,
        availableFrom: validatedInput.availableFrom,
        answers: validatedInput.answers as Prisma.JsonValue,
        metadata: validatedInput.metadata as Prisma.JsonValue,
        status: 'PENDING',
      },
      include: {
        job: {
          select: { id: true, title: true, slug: true, clubId: true },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    // TODO: Send notification to hiring managers

    return {
      success: true,
      data: application as unknown as JobApplicationWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error creating job application:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to submit application' },
    };
  }
}

// ============================================================================
// GET JOB APPLICATIONS
// ============================================================================

export async function getJobApplications(
  jobId: string,
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedApplicationResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    // Get job to check permission
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!job) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }

    const canManage = await canManageJobs(session.user.id, job.clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view applications' } };
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination || {};
    const skip = (page - 1) * limit;

    const total = await prisma.jobApplication.count({ where: { jobId } });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        coverLetter: true,
        resumeUrl: true,
        expectedSalary: true,
        availableFrom: true,
        createdAt: true,
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        data: applications as JobApplicationListItem[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + applications.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch applications' },
    };
  }
}

// ============================================================================
// REVIEW APPLICATION
// ============================================================================

export async function reviewApplication(
  input: ReviewApplicationInput
): Promise<ApiResponse<JobApplicationWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const validatedInput = ReviewApplicationSchema.parse(input);

    // Get application to check permission
    const application = await prisma.jobApplication.findUnique({
      where: { id: validatedInput.applicationId },
      select: {
        id: true,
        job: {
          select: { clubId: true },
        },
      },
    });

    if (!application) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } };
    }

    const canManage = await canManageJobs(session.user.id, application.job.clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission to review applications' } };
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: validatedInput.applicationId },
      data: {
        status: validatedInput.status,
        reviewNotes: validatedInput.notes,
        rating: validatedInput.rating,
        interviewDate: validatedInput.interviewDate,
        offerDetails: validatedInput.offerDetails as Prisma.JsonValue,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        job: {
          select: { id: true, title: true, slug: true, clubId: true },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // TODO: Send notification to applicant

    return {
      success: true,
      data: updatedApplication as unknown as JobApplicationWithRelations,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error reviewing application:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to review application' },
    };
  }
}

// ============================================================================
// GET JOB STATS
// ============================================================================

export async function getJobStats(
  clubId: string
): Promise<ApiResponse<JobPostingStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const canManage = await canManageJobs(session.user.id, clubId);
    if (!canManage) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'No permission' } };
    }

    // Get counts by status
    const statusCounts = await prisma.jobPosting.groupBy({
      by: ['status'],
      where: { clubId, deletedAt: null },
      _count: { status: true },
    });

    // Get counts by type
    const typeCounts = await prisma.jobPosting.groupBy({
      by: ['type'],
      where: { clubId, deletedAt: null },
      _count: { type: true },
    });

    // Get counts by experience level
    const expCounts = await prisma.jobPosting.groupBy({
      by: ['experienceLevel'],
      where: { clubId, deletedAt: null, experienceLevel: { not: null } },
      _count: { experienceLevel: true },
    });

    // Get total applications
    const totalApplications = await prisma.jobApplication.count({
      where: { job: { clubId, deletedAt: null } },
    });

    // Count jobs
    const totalJobs = await prisma.jobPosting.count({
      where: { clubId, deletedAt: null },
    });

    const statusMap: Record<string, number> = {};
    for (const sc of statusCounts) {
      statusMap[sc.status] = sc._count.status;
    }

    const stats: JobPostingStats = {
      totalJobs,
      activeJobs: statusMap['PUBLISHED'] || 0,
      closedJobs: (statusMap['CLOSED'] || 0) + (statusMap['FILLED'] || 0),
      draftJobs: statusMap['DRAFT'] || 0,
      totalApplications,
      averageApplicationsPerJob: totalJobs > 0 ? totalApplications / totalJobs : 0,
      byType: typeCounts.map(t => ({ type: t.type, count: t._count.type })),
      byExperience: expCounts
        .filter(e => e.experienceLevel)
        .map(e => ({ level: e.experienceLevel!, count: e._count.experienceLevel })),
    };

    return {
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error getting job stats:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get stats' },
    };
  }
}

// ============================================================================
// GET MY APPLICATIONS (for applicants)
// ============================================================================

export async function getMyApplications(
  pagination?: PaginationOptions
): Promise<ApiResponse<PaginatedApplicationResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination || {};
    const skip = (page - 1) * limit;

    const total = await prisma.jobApplication.count({
      where: { applicantId: session.user.id },
    });

    const applications = await prisma.jobApplication.findMany({
      where: { applicantId: session.user.id },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        coverLetter: true,
        resumeUrl: true,
        expectedSalary: true,
        availableFrom: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            location: true,
            club: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        data: applications as any,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + applications.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    console.error('Error fetching my applications:', error);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch applications' },
    };
  }
}