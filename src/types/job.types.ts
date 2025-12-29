// ============================================================================
// 💼 JOB TYPES - PitchConnect v7.3.0
// ============================================================================
// Types for Job Posting and Application system
// ============================================================================

import type {
  JobPosting,
  JobApplication,
  JobType,
  JobStatus,
  ApplicationStatus,
  SalaryType,
  ExperienceLevel,
  User,
  Club,
  Organisation,
} from '@prisma/client';

// ============================================================================
// RE-EXPORT ENUMS
// ============================================================================

export type {
  JobType,
  JobStatus,
  ApplicationStatus,
  SalaryType,
  ExperienceLevel,
};

// ============================================================================
// JOB POSTING TYPES
// ============================================================================

/**
 * Job posting with all relations
 */
export interface JobPostingWithRelations extends JobPosting {
  club: Pick<Club, 'id' | 'name' | 'slug' | 'logo' | 'city' | 'country' | 'sport'>;
  organisation?: Pick<Organisation, 'id' | 'name' | 'slug' | 'logo'> | null;
  postedBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  _count?: {
    applications: number;
  };
}

/**
 * Job posting for list views
 */
export interface JobPostingListItem {
  id: string;
  title: string;
  slug: string;
  type: JobType;
  status: JobStatus;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: SalaryType | null;
  currency: string | null;
  experienceLevel: ExperienceLevel | null;
  applicationDeadline: Date | null;
  createdAt: Date;
  club: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    sport: string;
  };
  _count: {
    applications: number;
  };
}

/**
 * Job application with relations
 */
export interface JobApplicationWithRelations extends JobApplication {
  job: Pick<JobPosting, 'id' | 'title' | 'slug' | 'clubId'>;
  applicant: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatar' | 'phone'>;
  reviewedBy?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> | null;
}

/**
 * Application for list views
 */
export interface JobApplicationListItem {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  expectedSalary: number | null;
  availableFrom: Date | null;
  createdAt: Date;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

// ============================================================================
// CREATE/UPDATE TYPES
// ============================================================================

/**
 * Create job posting input
 */
export interface CreateJobPostingInput {
  clubId: string;
  organisationId?: string | null;
  
  title: string;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  
  type: JobType;
  experienceLevel?: ExperienceLevel | null;
  
  location?: string | null;
  isRemote?: boolean;
  
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryType?: SalaryType | null;
  currency?: string | null;
  showSalary?: boolean;
  
  skills?: string[];
  qualifications?: string[];
  
  applicationDeadline?: Date | string | null;
  startDate?: Date | string | null;
  
  contactEmail?: string | null;
  applicationUrl?: string | null;
  
  status?: JobStatus;
  
  metadata?: Record<string, unknown>;
}

/**
 * Update job posting input
 */
export interface UpdateJobPostingInput {
  title?: string;
  description?: string;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  
  type?: JobType;
  experienceLevel?: ExperienceLevel | null;
  
  location?: string | null;
  isRemote?: boolean;
  
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryType?: SalaryType | null;
  currency?: string | null;
  showSalary?: boolean;
  
  skills?: string[];
  qualifications?: string[];
  
  applicationDeadline?: Date | string | null;
  startDate?: Date | string | null;
  
  contactEmail?: string | null;
  applicationUrl?: string | null;
  
  status?: JobStatus;
  
  metadata?: Record<string, unknown>;
}

/**
 * Create job application input
 */
export interface CreateJobApplicationInput {
  jobId: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedInUrl?: string | null;
  expectedSalary?: number | null;
  availableFrom?: Date | string | null;
  answers?: Record<string, unknown>; // Custom questions
  metadata?: Record<string, unknown>;
}

/**
 * Review application input
 */
export interface ReviewApplicationInput {
  applicationId: string;
  status: 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFERED' | 'REJECTED' | 'WITHDRAWN';
  notes?: string | null;
  rating?: number | null;
  interviewDate?: Date | string | null;
  offerDetails?: Record<string, unknown>;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Job posting filters
 */
export interface JobPostingFilters {
  clubId?: string;
  organisationId?: string;
  type?: JobType | JobType[];
  status?: JobStatus | JobStatus[];
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  search?: string;
  sport?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Application filters
 */
export interface JobApplicationFilters {
  jobId?: string;
  applicantId?: string;
  status?: ApplicationStatus | ApplicationStatus[];
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated job response
 */
export interface PaginatedJobResponse {
  data: JobPostingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Paginated application response
 */
export interface PaginatedApplicationResponse {
  data: JobApplicationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// STATS TYPES
// ============================================================================

/**
 * Job posting statistics
 */
export interface JobPostingStats {
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  draftJobs: number;
  totalApplications: number;
  averageApplicationsPerJob: number;
  byType: Array<{ type: JobType; count: number }>;
  byExperience: Array<{ level: ExperienceLevel; count: number }>;
}

/**
 * Application statistics
 */
export interface ApplicationStats {
  total: number;
  pending: number;
  reviewing: number;
  shortlisted: number;
  interviewed: number;
  offered: number;
  rejected: number;
  withdrawn: number;
  averageResponseTime: number; // in days
  conversionRate: number; // percentage
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Job notification payload
 */
export interface JobNotificationPayload {
  type:
    | 'job_posted'
    | 'application_received'
    | 'application_reviewed'
    | 'interview_scheduled'
    | 'offer_made'
    | 'job_closed';
  jobId: string;
  jobTitle: string;
  clubName: string;
  applicantId?: string;
  applicantName?: string;
  status?: ApplicationStatus;
  message?: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Job search result
 */
export interface JobSearchResult extends JobPostingListItem {
  relevanceScore: number;
  matchedSkills: string[];
  matchedLocation: boolean;
}

/**
 * Job search params
 */
export interface JobSearchParams {
  query?: string;
  type?: JobType[];
  experienceLevel?: ExperienceLevel[];
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  sport?: string[];
  postedWithin?: number; // days
}