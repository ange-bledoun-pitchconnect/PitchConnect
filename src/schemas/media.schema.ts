// ============================================================================
// 📹 MEDIA VALIDATION SCHEMAS - PitchConnect v7.3.0
// ============================================================================
// Zod schemas for media content validation
// Supports VIDEO, IMAGE, DOCUMENT, AUDIO with processing controls
// ============================================================================

import { z } from 'zod';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZES,
} from '@/types/media.types';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const MediaTypeSchema = z.enum(['VIDEO', 'IMAGE', 'DOCUMENT', 'AUDIO']);

export const MediaCategorySchema = z.enum([
  // Match Related
  'MATCH_HIGHLIGHT',
  'MATCH_FULL',
  'MATCH_ANALYSIS',
  'GOAL_CLIP',
  'SAVE_CLIP',
  'INCIDENT_CLIP',
  // Training Related
  'TRAINING_SESSION',
  'TRAINING_DRILL',
  'TRAINING_EXERCISE',
  'TRAINING_ANALYSIS',
  // Player Related
  'PLAYER_HIGHLIGHT',
  'PLAYER_INTERVIEW',
  'PLAYER_PROFILE',
  // Team Related
  'TEAM_PROMO',
  'TEAM_ANNOUNCEMENT',
  'PRESS_CONFERENCE',
  // Documents
  'TACTICS_DOCUMENT',
  'MEDICAL_DOCUMENT',
  'CONTRACT_DOCUMENT',
  'REPORT',
  // General
  'THUMBNAIL',
  'PROFILE_PHOTO',
  'BANNER',
  'LOGO',
  'OTHER',
]);

export const MediaVisibilitySchema = z.enum([
  'PUBLIC',
  'CLUB_ONLY',
  'TEAM_ONLY',
  'STAFF_ONLY',
  'PRIVATE',
]);

export const MediaProcessingStatusSchema = z.enum([
  'PENDING',
  'UPLOADING',
  'PROCESSING',
  'TRANSCODING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const VideoQualitySchema = z.enum([
  'Q_360P',
  'Q_480P',
  'Q_720P',
  'Q_1080P',
  'Q_2K',
  'Q_4K',
  'ORIGINAL',
]);

export const ClubMemberRoleSchema = z.enum([
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'PLAYER',
  'STAFF',
  'TREASURER',
  'SCOUT',
  'ANALYST',
  'MEDICAL_STAFF',
  'PHYSIOTHERAPIST',
  'NUTRITIONIST',
  'PSYCHOLOGIST',
  'PERFORMANCE_COACH',
  'GOALKEEPING_COACH',
  'KIT_MANAGER',
  'MEDIA_OFFICER',
  'VIDEO_ANALYST',
]);

// ============================================================================
// UPLOAD SCHEMAS
// ============================================================================

export const UploadMediaSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  
  type: MediaTypeSchema,
  
  category: MediaCategorySchema,
  
  visibility: MediaVisibilitySchema.default('CLUB_ONLY'),
  
  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  
  // Associations
  organisationId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  
  // Access control
  accessRoles: z.array(ClubMemberRoleSchema).optional(),
  isPublic: z.boolean().default(false),
  
  // Video clip timestamps
  startTimestamp: z.number().int().min(0).optional(),
  endTimestamp: z.number().int().min(0).optional(),
  parentMediaId: z.string().cuid().optional(),
  
  // Custom metadata
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => {
    // At least one association required
    return !!(data.organisationId || data.clubId || data.teamId || data.matchId || data.trainingId);
  },
  {
    message: 'At least one association (organisation, club, team, match, or training) is required',
    path: ['clubId'],
  }
).refine(
  (data) => {
    // Validate clip timestamps
    if (data.startTimestamp !== undefined && data.endTimestamp !== undefined) {
      return data.endTimestamp > data.startTimestamp;
    }
    return true;
  },
  {
    message: 'End timestamp must be after start timestamp',
    path: ['endTimestamp'],
  }
);

export type UploadMediaInput = z.infer<typeof UploadMediaSchema>;

// ============================================================================
// FILE VALIDATION SCHEMAS
// ============================================================================

export const FileValidationSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string(),
  size: z.number().int().positive(),
  type: MediaTypeSchema,
}).refine(
  (data) => {
    const maxSize = MAX_FILE_SIZES[data.type];
    return data.size <= maxSize;
  },
  (data) => ({
    message: `File size exceeds maximum allowed (${Math.round(MAX_FILE_SIZES[data.type] / (1024 * 1024))} MB)`,
    path: ['size'],
  })
).refine(
  (data) => {
    let allowedTypes: string[] = [];
    switch (data.type) {
      case 'IMAGE':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'VIDEO':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        break;
      case 'AUDIO':
        allowedTypes = ALLOWED_AUDIO_TYPES;
        break;
      case 'DOCUMENT':
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        break;
    }
    return allowedTypes.includes(data.mimeType);
  },
  (data) => ({
    message: `File type ${data.mimeType} is not allowed for ${data.type}`,
    path: ['mimeType'],
  })
);

export type FileValidationInput = z.infer<typeof FileValidationSchema>;

// ============================================================================
// UPDATE SCHEMAS
// ============================================================================

export const UpdateMediaSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullish(),
  
  category: MediaCategorySchema.optional(),
  
  visibility: MediaVisibilitySchema.optional(),
  
  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  
  accessRoles: z.array(ClubMemberRoleSchema).optional(),
  
  isPublic: z.boolean().optional(),
  
  startTimestamp: z.number().int().min(0).optional(),
  endTimestamp: z.number().int().min(0).optional(),
  
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const MediaFiltersSchema = z.object({
  type: z.union([
    MediaTypeSchema,
    z.array(MediaTypeSchema),
  ]).optional(),
  
  category: z.union([
    MediaCategorySchema,
    z.array(MediaCategorySchema),
  ]).optional(),
  
  visibility: z.union([
    MediaVisibilitySchema,
    z.array(MediaVisibilitySchema),
  ]).optional(),
  
  processingStatus: z.union([
    MediaProcessingStatusSchema,
    z.array(MediaProcessingStatusSchema),
  ]).optional(),
  
  organisationId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  uploadedBy: z.string().cuid().optional(),
  
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  
  minDuration: z.number().int().min(0).optional(),
  maxDuration: z.number().int().min(0).optional(),
});

export type MediaFilters = z.infer<typeof MediaFiltersSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationOptions = z.infer<typeof PaginationSchema>;

// ============================================================================
// PROCESSING SCHEMAS
// ============================================================================

export const TranscodeRequestSchema = z.object({
  mediaId: z.string().cuid('Invalid media ID'),
  qualities: z.array(VideoQualitySchema).min(1),
  generateThumbnails: z.boolean().default(true),
  thumbnailCount: z.number().int().min(1).max(10).default(3),
  webhookUrl: z.string().url().optional(),
});

export type TranscodeRequest = z.infer<typeof TranscodeRequestSchema>;

// ============================================================================
// CLIP SCHEMAS
// ============================================================================

export const CreateClipSchema = z.object({
  sourceMediaId: z.string().cuid('Invalid source media ID'),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTimestamp: z.number().int().min(0),
  endTimestamp: z.number().int().min(0),
  category: MediaCategorySchema.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
}).refine(
  (data) => data.endTimestamp > data.startTimestamp,
  {
    message: 'End timestamp must be after start timestamp',
    path: ['endTimestamp'],
  }
).refine(
  (data) => (data.endTimestamp - data.startTimestamp) >= 1,
  {
    message: 'Clip must be at least 1 second long',
    path: ['endTimestamp'],
  }
).refine(
  (data) => (data.endTimestamp - data.startTimestamp) <= 300,
  {
    message: 'Clip cannot be longer than 5 minutes',
    path: ['endTimestamp'],
  }
);

export type CreateClipInput = z.infer<typeof CreateClipSchema>;

// ============================================================================
// SHARE LINK SCHEMAS
// ============================================================================

export const CreateShareLinkSchema = z.object({
  mediaId: z.string().cuid('Invalid media ID'),
  expiresIn: z.number().int().min(1).max(720).optional(), // 1 hour to 30 days
  password: z.string().min(4).max(50).optional(),
  maxViews: z.number().int().min(1).max(10000).optional(),
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;

// ============================================================================
// PRESIGNED UPLOAD SCHEMAS
// ============================================================================

export const RequestPresignedUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().positive(),
  type: MediaTypeSchema,
  
  // Upload context
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
});

export type RequestPresignedUploadInput = z.infer<typeof RequestPresignedUploadSchema>;

export const CompleteUploadSchema = z.object({
  uploadId: z.string().min(1),
  mediaId: z.string().cuid(),
  
  // File info after upload
  url: z.string().url(),
  cdnUrl: z.string().url().optional(),
  sizeBytes: z.number().int().positive(),
  
  // Dimensions (for images/videos)
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().int().min(0).optional(),
  
  // Thumbnail
  thumbnailUrl: z.string().url().optional(),
});

export type CompleteUploadInput = z.infer<typeof CompleteUploadSchema>;

// ============================================================================
// BATCH OPERATIONS SCHEMAS
// ============================================================================

export const BatchDeleteSchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(50),
});

export type BatchDeleteInput = z.infer<typeof BatchDeleteSchema>;

export const BatchUpdateVisibilitySchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(50),
  visibility: MediaVisibilitySchema,
});

export type BatchUpdateVisibilityInput = z.infer<typeof BatchUpdateVisibilitySchema>;

export const BatchAddTagsSchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(50),
  tags: z.array(z.string().max(50)).min(1).max(10),
});

export type BatchAddTagsInput = z.infer<typeof BatchAddTagsSchema>;

// ============================================================================
// QUERY PARAM SCHEMAS (for API routes)
// ============================================================================

export const GetMediaQuerySchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  visibility: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get allowed MIME types for a media type
 */
export function getAllowedMimeTypes(type: z.infer<typeof MediaTypeSchema>): string[] {
  switch (type) {
    case 'IMAGE':
      return ALLOWED_IMAGE_TYPES;
    case 'VIDEO':
      return ALLOWED_VIDEO_TYPES;
    case 'AUDIO':
      return ALLOWED_AUDIO_TYPES;
    case 'DOCUMENT':
      return ALLOWED_DOCUMENT_TYPES;
    default:
      return [];
  }
}

/**
 * Validate file for upload
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  mediaType: z.infer<typeof MediaTypeSchema>
): { valid: boolean; error?: string } {
  const allowedTypes = getAllowedMimeTypes(mediaType);
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed for ${mediaType}`,
    };
  }
  
  const maxSize = MAX_FILE_SIZES[mediaType];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${Math.round(maxSize / (1024 * 1024))} MB)`,
    };
  }
  
  return { valid: true };
}

/**
 * Parse comma-separated tags
 */
export function parseTags(tagsString: string | undefined): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 20);
}