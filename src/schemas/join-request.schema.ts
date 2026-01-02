// ============================================================================
// 🤝 JOIN REQUEST SCHEMA - PitchConnect v7.5.0
// ============================================================================

import { z } from 'zod';

export const JoinRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']);
export const ReviewStatusSchema = z.enum(['APPROVED', 'REJECTED']);

export const JOIN_REQUEST_LIMITS = {
  MAX_MESSAGE: 1000,
  MAX_EXPERIENCE: 2000,
  MIN_JERSEY: 1,
  MAX_JERSEY: 99,
  MAX_SOCIAL_URL: 255,
  MAX_BULK_REVIEW: 50,
  DEFAULT_EXPIRY_DAYS: 30,
} as const;

export const SocialLinksSchema = z.object({
  instagram: z.string().url().max(JOIN_REQUEST_LIMITS.MAX_SOCIAL_URL).optional(),
  twitter: z.string().url().max(JOIN_REQUEST_LIMITS.MAX_SOCIAL_URL).optional(),
  linkedin: z.string().url().max(JOIN_REQUEST_LIMITS.MAX_SOCIAL_URL).optional(),
  highlightReel: z.string().url().max(JOIN_REQUEST_LIMITS.MAX_SOCIAL_URL).optional(),
}).optional();

export const CreateJoinRequestSchema = z.object({
  teamId: z.string().cuid(),
  playerId: z.string().cuid(),
  message: z.string().max(JOIN_REQUEST_LIMITS.MAX_MESSAGE).optional(),
  preferredPosition: z.string().max(50).optional(),
  preferredJerseyNumber: z.number().int().min(JOIN_REQUEST_LIMITS.MIN_JERSEY).max(JOIN_REQUEST_LIMITS.MAX_JERSEY).optional(),
  experience: z.string().max(JOIN_REQUEST_LIMITS.MAX_EXPERIENCE).optional(),
  socialLinks: SocialLinksSchema,
  availableDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
});

export const UpdateJoinRequestSchema = z.object({
  message: z.string().max(JOIN_REQUEST_LIMITS.MAX_MESSAGE).optional(),
  preferredPosition: z.string().max(50).optional(),
  preferredJerseyNumber: z.number().int().min(JOIN_REQUEST_LIMITS.MIN_JERSEY).max(JOIN_REQUEST_LIMITS.MAX_JERSEY).optional(),
  experience: z.string().max(JOIN_REQUEST_LIMITS.MAX_EXPERIENCE).optional(),
  socialLinks: SocialLinksSchema,
});

export const ReviewJoinRequestSchema = z.object({
  requestId: z.string().cuid(),
  status: ReviewStatusSchema,
  reviewNotes: z.string().max(1000).optional(),
  assignedJerseyNumber: z.number().int().min(JOIN_REQUEST_LIMITS.MIN_JERSEY).max(JOIN_REQUEST_LIMITS.MAX_JERSEY).optional(),
  assignedPosition: z.string().max(50).optional(),
});

export const BulkReviewSchema = z.object({
  requests: z.array(z.object({
    requestId: z.string().cuid(),
    status: ReviewStatusSchema,
    reviewNotes: z.string().max(500).optional(),
  })).min(1).max(JOIN_REQUEST_LIMITS.MAX_BULK_REVIEW),
});

export const WithdrawJoinRequestSchema = z.object({
  requestId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export const JoinRequestFiltersSchema = z.object({
  teamId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  playerId: z.string().cuid().optional(),
  status: z.union([JoinRequestStatusSchema, z.array(JoinRequestStatusSchema)]).optional(),
  search: z.string().max(100).optional(),
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'status', 'playerName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type JoinRequestStatus = z.infer<typeof JoinRequestStatusSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type CreateJoinRequestInput = z.infer<typeof CreateJoinRequestSchema>;
export type UpdateJoinRequestInput = z.infer<typeof UpdateJoinRequestSchema>;
export type ReviewJoinRequestInput = z.infer<typeof ReviewJoinRequestSchema>;
export type BulkReviewInput = z.infer<typeof BulkReviewSchema>;
export type WithdrawJoinRequestInput = z.infer<typeof WithdrawJoinRequestSchema>;
export type JoinRequestFilters = z.infer<typeof JoinRequestFiltersSchema>;