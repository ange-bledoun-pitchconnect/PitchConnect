// ============================================================================
// 🤝 JOIN REQUEST VALIDATION SCHEMAS - PitchConnect v7.3.0
// ============================================================================
// Zod schemas for join request validation
// Covers creation, review, filtering, and all input validation
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const JoinRequestStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]);

export type JoinRequestStatus = z.infer<typeof JoinRequestStatusSchema>;

/**
 * Review action statuses (subset)
 */
export const ReviewStatusSchema = z.enum(['APPROVED', 'REJECTED']);

export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

// ============================================================================
// SOCIAL LINKS SCHEMA
// ============================================================================

export const SocialLinksSchema = z.object({
  instagram: z
    .string()
    .url('Invalid Instagram URL')
    .regex(/instagram\.com/, 'Must be an Instagram URL')
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url('Invalid Twitter/X URL')
    .regex(/twitter\.com|x\.com/, 'Must be a Twitter/X URL')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('Invalid LinkedIn URL')
    .regex(/linkedin\.com/, 'Must be a LinkedIn URL')
    .optional()
    .or(z.literal('')),
  highlightReel: z
    .string()
    .url('Invalid highlight reel URL')
    .optional()
    .or(z.literal('')),
}).optional().nullable();

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// ============================================================================
// CREATE JOIN REQUEST SCHEMA
// ============================================================================

export const CreateJoinRequestSchema = z.object({
  teamId: z
    .string()
    .min(1, 'Team ID is required')
    .cuid('Invalid team ID format'),
  
  playerId: z
    .string()
    .min(1, 'Player ID is required')
    .cuid('Invalid player ID format'),
  
  message: z
    .string()
    .max(2000, 'Message must be 2000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  position: z
    .string()
    .max(50, 'Position must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  experience: z
    .string()
    .max(1000, 'Experience must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  availability: z
    .string()
    .max(500, 'Availability must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  references: z
    .string()
    .max(1000, 'References must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  previousClubs: z
    .string()
    .max(500, 'Previous clubs must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  achievements: z
    .string()
    .max(1000, 'Achievements must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  socialLinks: SocialLinksSchema,
  
  metadata: z.record(z.unknown()).optional(),
});

export type CreateJoinRequestInput = z.infer<typeof CreateJoinRequestSchema>;

// ============================================================================
// UPDATE JOIN REQUEST SCHEMA
// ============================================================================

export const UpdateJoinRequestSchema = z.object({
  message: z
    .string()
    .max(2000, 'Message must be 2000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  position: z
    .string()
    .max(50, 'Position must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  experience: z
    .string()
    .max(1000, 'Experience must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  availability: z
    .string()
    .max(500, 'Availability must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  references: z
    .string()
    .max(1000, 'References must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  previousClubs: z
    .string()
    .max(500, 'Previous clubs must be 500 characters or less')
    .optional()
    .nullable(),
  
  achievements: z
    .string()
    .max(1000, 'Achievements must be 1000 characters or less')
    .optional()
    .nullable(),
  
  socialLinks: SocialLinksSchema,
});

export type UpdateJoinRequestInput = z.infer<typeof UpdateJoinRequestSchema>;

// ============================================================================
// REVIEW JOIN REQUEST SCHEMA
// ============================================================================

export const ReviewJoinRequestSchema = z.object({
  requestId: z
    .string()
    .min(1, 'Request ID is required')
    .cuid('Invalid request ID format'),
  
  status: ReviewStatusSchema,
  
  reviewNotes: z
    .string()
    .max(1000, 'Review notes must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  // For approved requests
  jerseyNumber: z
    .number()
    .int('Jersey number must be a whole number')
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must be 99 or less')
    .optional()
    .nullable(),
  
  squadRole: z
    .string()
    .max(50, 'Squad role must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  contractType: z
    .string()
    .max(50, 'Contract type must be 50 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  
  startDate: z.coerce.date().optional().nullable(),
  
  internalNotes: z
    .string()
    .max(1000, 'Internal notes must be 1000 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
}).refine(
  (data) => {
    // If rejecting, don't require jersey details
    if (data.status === 'REJECTED') return true;
    // Approval doesn't require anything extra, just recommended
    return true;
  },
  {
    message: 'Invalid review data',
  }
);

export type ReviewJoinRequestInput = z.infer<typeof ReviewJoinRequestSchema>;

// ============================================================================
// WITHDRAW JOIN REQUEST SCHEMA
// ============================================================================

export const WithdrawJoinRequestSchema = z.object({
  requestId: z
    .string()
    .min(1, 'Request ID is required')
    .cuid('Invalid request ID format'),
  
  reason: z
    .string()
    .max(500, 'Reason must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

export type WithdrawJoinRequestInput = z.infer<typeof WithdrawJoinRequestSchema>;

// ============================================================================
// BULK REVIEW SCHEMA
// ============================================================================

export const BulkReviewSchema = z.object({
  requestIds: z
    .array(z.string().cuid('Invalid request ID'))
    .min(1, 'At least one request ID is required')
    .max(50, 'Maximum 50 requests can be processed at once'),
  
  status: ReviewStatusSchema,
  
  reviewNotes: z
    .string()
    .max(500, 'Review notes must be 500 characters or less')
    .optional()
    .nullable(),
});

export type BulkReviewInput = z.infer<typeof BulkReviewSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const JoinRequestFiltersSchema = z.object({
  teamId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  playerId: z.string().cuid().optional(),
  status: z
    .union([
      JoinRequestStatusSchema,
      z.array(JoinRequestStatusSchema),
    ])
    .optional(),
  position: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
  isExpired: z.boolean().optional(),
  hasReviewer: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export type JoinRequestFilters = z.infer<typeof JoinRequestFiltersSchema>;

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be 100 or less')
    .default(20),
  
  sortBy: z
    .enum(['createdAt', 'expiresAt', 'status', 'reviewedAt'])
    .default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationOptions = z.infer<typeof PaginationSchema>;

// ============================================================================
// QUERY SCHEMA (Filters + Pagination)
// ============================================================================

export const GetJoinRequestsQuerySchema = JoinRequestFiltersSchema.merge(
  PaginationSchema
);

export type GetJoinRequestsQuery = z.infer<typeof GetJoinRequestsQuerySchema>;

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Request ID parameter schema
 */
export const RequestIdParamSchema = z.object({
  requestId: z.string().cuid('Invalid request ID'),
});

/**
 * Team ID parameter schema
 */
export const TeamIdParamSchema = z.object({
  teamId: z.string().cuid('Invalid team ID'),
});

/**
 * Player ID parameter schema
 */
export const PlayerIdParamSchema = z.object({
  playerId: z.string().cuid('Invalid player ID'),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and parse create input
 */
export function validateCreateInput(input: unknown): CreateJoinRequestInput {
  return CreateJoinRequestSchema.parse(input);
}

/**
 * Validate and parse review input
 */
export function validateReviewInput(input: unknown): ReviewJoinRequestInput {
  return ReviewJoinRequestSchema.parse(input);
}

/**
 * Validate and parse filters
 */
export function validateFilters(input: unknown): JoinRequestFilters {
  return JoinRequestFiltersSchema.parse(input);
}

/**
 * Safe parse with error handling
 */
export function safeParseCreateInput(input: unknown): {
  success: boolean;
  data?: CreateJoinRequestInput;
  error?: z.ZodError;
} {
  const result = CreateJoinRequestSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Safe parse review input
 */
export function safeParseReviewInput(input: unknown): {
  success: boolean;
  data?: ReviewJoinRequestInput;
  error?: z.ZodError;
} {
  const result = ReviewJoinRequestSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  
  return formatted;
}

/**
 * Get first validation error message
 */
export function getFirstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message || 'Validation failed';
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Field length limits
 */
export const FIELD_LIMITS = {
  message: 2000,
  position: 50,
  experience: 1000,
  availability: 500,
  references: 1000,
  previousClubs: 500,
  achievements: 1000,
  reviewNotes: 1000,
  internalNotes: 1000,
  reason: 500,
  squadRole: 50,
  contractType: 50,
  search: 100,
} as const;

/**
 * Pagination limits
 */
export const PAGINATION_LIMITS = {
  minPage: 1,
  maxLimit: 100,
  defaultLimit: 20,
  bulkMaxItems: 50,
} as const;

/**
 * Jersey number limits
 */
export const JERSEY_LIMITS = {
  min: 1,
  max: 99,
} as const;