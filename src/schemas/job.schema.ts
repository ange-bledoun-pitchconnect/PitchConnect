// ============================================================================
// 💼 JOB SCHEMA - PitchConnect v7.5.0
// ============================================================================

import { z } from 'zod';

export const SportSchema = z.enum(['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL']);
export const JobTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'VOLUNTEER', 'SEASONAL']);
export const JobStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'FILLED', 'EXPIRED', 'CANCELLED']);
export const ApplicationStatusSchema = z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']);
export const SalaryTypeSchema = z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL', 'PER_SESSION', 'NEGOTIABLE', 'VOLUNTEER']);
export const ExperienceLevelSchema = z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'DIRECTOR', 'EXECUTIVE']);

export const JOB_LIMITS = { MAX_TITLE: 100, MAX_DESC: 10000, MAX_SKILLS: 20, MAX_QUALIFICATIONS: 10, MAX_BENEFITS: 15 } as const;

export const CreateJobPostingSchema = z.object({
  clubId: z.string().cuid(),
  teamId: z.string().cuid().nullable().optional(),
  sport: SportSchema,
  title: z.string().min(5).max(JOB_LIMITS.MAX_TITLE),
  description: z.string().min(50).max(JOB_LIMITS.MAX_DESC),
  jobType: JobTypeSchema,
  experienceLevel: ExperienceLevelSchema,
  salaryType: SalaryTypeSchema,
  salaryMin: z.number().min(0).nullable().optional(),
  salaryMax: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).default('GBP'),
  location: z.string().max(200).optional(),
  isRemote: z.boolean().default(false),
  skills: z.array(z.string().max(50)).max(JOB_LIMITS.MAX_SKILLS).default([]),
  qualifications: z.array(z.string().max(200)).max(JOB_LIMITS.MAX_QUALIFICATIONS).default([]),
  benefits: z.array(z.string().max(100)).max(JOB_LIMITS.MAX_BENEFITS).default([]),
  applicationDeadline: z.union([z.string().datetime(), z.date()]).optional(),
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  externalUrl: z.string().url().optional(),
  status: JobStatusSchema.default('DRAFT'),
}).refine(data => !data.salaryMin || !data.salaryMax || data.salaryMin <= data.salaryMax, { message: 'Minimum salary must be less than or equal to maximum', path: ['salaryMax'] });

export const UpdateJobPostingSchema = CreateJobPostingSchema.partial().omit({ clubId: true });

export const CreateJobApplicationSchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  expectedSalary: z.number().min(0).optional(),
  availableFrom: z.union([z.string().datetime(), z.date()]).optional(),
  answers: z.record(z.string(), z.string().max(2000)).optional(),
});

export const ReviewApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  status: ApplicationStatusSchema,
  notes: z.string().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
  interviewDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const JobFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  sport: z.union([SportSchema, z.array(SportSchema)]).optional(),
  jobType: z.union([JobTypeSchema, z.array(JobTypeSchema)]).optional(),
  status: z.union([JobStatusSchema, z.array(JobStatusSchema)]).optional(),
  experienceLevel: z.union([ExperienceLevelSchema, z.array(ExperienceLevelSchema)]).optional(),
  isRemote: z.boolean().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  search: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'title', 'salaryMin', 'applicationDeadline']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export function generateJobSlug(title: string, clubName: string): string {
  const slug = `${title}-${clubName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}-${Date.now().toString(36)}`;
}

export function formatSalary(min: number | null, max: number | null, type: string, currency: string = 'GBP'): string {
  const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 });
  if (type === 'VOLUNTEER') return 'Volunteer';
  if (type === 'NEGOTIABLE') return 'Negotiable';
  if (!min && !max) return 'Not specified';
  if (min && max && min === max) return `${fmt.format(min)} ${type.toLowerCase()}`;
  if (min && max) return `${fmt.format(min)} - ${fmt.format(max)} ${type.toLowerCase()}`;
  if (min) return `From ${fmt.format(min)} ${type.toLowerCase()}`;
  if (max) return `Up to ${fmt.format(max)} ${type.toLowerCase()}`;
  return 'Not specified';
}

export type Sport = z.infer<typeof SportSchema>;
export type JobType = z.infer<typeof JobTypeSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;
export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>;
export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
export type JobFilters = z.infer<typeof JobFiltersSchema>;