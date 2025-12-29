// ============================================================================
// 💼 JOB VALIDATION SCHEMAS - PitchConnect v7.3.0
// ============================================================================
// Zod schemas for job posting and application validation
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const JobTypeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'VOLUNTEER',
  'SEASONAL',
  'TEMPORARY',
]);

export const JobStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'CLOSED',
  'FILLED',
  'EXPIRED',
  'CANCELLED',
]);

export const ApplicationStatusSchema = z.enum([
  'PENDING',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEWED',
  'OFFERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]);

export const SalaryTypeSchema = z.enum([
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'ANNUAL',
  'PER_MATCH',
  'PER_SESSION',
]);

export const ExperienceLevelSchema = z.enum([
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'MANAGER',
  'DIRECTOR',
  'EXECUTIVE',
]);

// ============================================================================
// CREATE JOB POSTING SCHEMA
// ============================================================================

export const CreateJobPostingSchema = z.object({
  clubId: z.string().cuid('Invalid club ID'),
  organisationId: z.string().cuid('Invalid organisation ID').nullish(),
  
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be 100 characters or less'),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description must be 10000 characters or less'),
  
  responsibilities: z
    .string()
    .max(5000, 'Responsibilities must be 5000 characters or less')
    .nullish(),
  
  requirements: z
    .string()
    .max(5000, 'Requirements must be 5000 characters or less')
    .nullish(),
  
  benefits: z
    .string()
    .max(5000, 'Benefits must be 5000 characters or less')
    .nullish(),
  
  type: JobTypeSchema,
  
  experienceLevel: ExperienceLevelSchema.nullish(),
  
  location: z
    .string()
    .max(200, 'Location must be 200 characters or less')
    .nullish(),
  
  isRemote: z.boolean().default(false),
  
  salaryMin: z
    .number()
    .int()
    .min(0, 'Salary cannot be negative')
    .nullish(),
  
  salaryMax: z
    .number()
    .int()
    .min(0, 'Salary cannot be negative')
    .nullish(),
  
  salaryType: SalaryTypeSchema.nullish(),
  
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .default('GBP'),
  
  showSalary: z.boolean().default(true),
  
  skills: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 skills allowed')
    .default([]),
  
  qualifications: z
    .array(z.string().max(100))
    .max(10, 'Maximum 10 qualifications allowed')
    .default([]),
  
  applicationDeadline: z.coerce.date().nullish(),
  
  startDate: z.coerce.date().nullish(),
  
  contactEmail: z
    .string()
    .email('Invalid email address')
    .nullish(),
  
  applicationUrl: z
    .string()
    .url('Invalid URL')
    .nullish(),
  
  status: JobStatusSchema.default('DRAFT'),
  
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMax >= data.salaryMin;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
).refine(
  (data) => {
    if (data.applicationDeadline) {
      return data.applicationDeadline > new Date();
    }
    return true;
  },
  {
    message: 'Application deadline must be in the future',
    path: ['applicationDeadline'],
  }
);

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;

// ============================================================================
// UPDATE JOB POSTING SCHEMA
// ============================================================================

export const UpdateJobPostingSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be 100 characters or less')
    .optional(),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description must be 10000 characters or less')
    .optional(),
  
  responsibilities: z
    .string()
    .max(5000)
    .nullish(),
  
  requirements: z
    .string()
    .max(5000)
    .nullish(),
  
  benefits: z
    .string()
    .max(5000)
    .nullish(),
  
  type: JobTypeSchema.optional(),
  
  experienceLevel: ExperienceLevelSchema.nullish(),
  
  location: z.string().max(200).nullish(),
  
  isRemote: z.boolean().optional(),
  
  salaryMin: z.number().int().min(0).nullish(),
  
  salaryMax: z.number().int().min(0).nullish(),
  
  salaryType: SalaryTypeSchema.nullish(),
  
  currency: z.string().length(3).optional(),
  
  showSalary: z.boolean().optional(),
  
  skills: z.array(z.string().max(50)).max(20).optional(),
  
  qualifications: z.array(z.string().max(100)).max(10).optional(),
  
  applicationDeadline: z.coerce.date().nullish(),
  
  startDate: z.coerce.date().nullish(),
  
  contactEmail: z.string().email().nullish(),
  
  applicationUrl: z.string().url().nullish(),
  
  status: JobStatusSchema.optional(),
  
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;

// ============================================================================
// CREATE APPLICATION SCHEMA
// ============================================================================

export const CreateJobApplicationSchema = z.object({
  jobId: z.string().cuid('Invalid job ID'),
  
  coverLetter: z
    .string()
    .max(5000, 'Cover letter must be 5000 characters or less')
    .nullish(),
  
  resumeUrl: z
    .string()
    .url('Invalid resume URL')
    .nullish(),
  
  portfolioUrl: z
    .string()
    .url('Invalid portfolio URL')
    .nullish(),
  
  linkedInUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .regex(/linkedin\.com/, 'Must be a LinkedIn URL')
    .nullish(),
  
  expectedSalary: z
    .number()
    .int()
    .min(0)
    .nullish(),
  
  availableFrom: z.coerce.date().nullish(),
  
  answers: z.record(z.unknown()).optional(),
  
  metadata: z.record(z.unknown()).optional(),
});

export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>;

// ============================================================================
// REVIEW APPLICATION SCHEMA
// ============================================================================

export const ReviewApplicationSchema = z.object({
  applicationId: z.string().cuid('Invalid application ID'),
  
  status: z.enum([
    'REVIEWING',
    'SHORTLISTED',
    'INTERVIEWED',
    'OFFERED',
    'REJECTED',
    'WITHDRAWN',
  ]),
  
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .nullish(),
  
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish(),
  
  interviewDate: z.coerce.date().nullish(),
  
  offerDetails: z.record(z.unknown()).optional(),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const JobPostingFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  organisationId: z.string().cuid().optional(),
  type: z.union([JobTypeSchema, z.array(JobTypeSchema)]).optional(),
  status: z.union([JobStatusSchema, z.array(JobStatusSchema)]).optional(),
  experienceLevel: z.union([
    ExperienceLevelSchema,
    z.array(ExperienceLevelSchema),
  ]).optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  skills: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  sport: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type JobPostingFilters = z.infer<typeof JobPostingFiltersSchema>;

export const JobApplicationFiltersSchema = z.object({
  jobId: z.string().cuid().optional(),
  applicantId: z.string().cuid().optional(),
  status: z.union([
    ApplicationStatusSchema,
    z.array(ApplicationStatusSchema),
  ]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type JobApplicationFilters = z.infer<typeof JobApplicationFiltersSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationOptions = z.infer<typeof PaginationSchema>;

// ============================================================================
// SEARCH SCHEMA
// ============================================================================

export const JobSearchSchema = z.object({
  query: z.string().max(100).optional(),
  type: z.array(JobTypeSchema).optional(),
  experienceLevel: z.array(ExperienceLevelSchema).optional(),
  location: z.string().max(100).optional(),
  isRemote: z.boolean().optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  skills: z.array(z.string()).optional(),
  sport: z.array(z.string()).optional(),
  postedWithin: z.number().int().min(1).max(365).optional(),
});

export type JobSearchParams = z.infer<typeof JobSearchSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate slug from title
 */
export function generateJobSlug(title: string, clubSlug: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  const timestamp = Date.now().toString(36);
  return `${clubSlug}-${baseSlug}-${timestamp}`;
}

/**
 * Format salary for display
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  type: string | null,
  currency: string | null,
  showSalary: boolean
): string {
  if (!showSalary) return 'Competitive';
  if (!min && !max) return 'Not specified';
  
  const curr = currency || 'GBP';
  const salaryType = type ? ` ${type.toLowerCase().replace('_', ' ')}` : '';
  
  if (min && max) {
    if (min === max) {
      return `${curr} ${min.toLocaleString()}${salaryType}`;
    }
    return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}${salaryType}`;
  }
  
  if (min) return `From ${curr} ${min.toLocaleString()}${salaryType}`;
  if (max) return `Up to ${curr} ${max.toLocaleString()}${salaryType}`;
  
  return 'Not specified';
}