// ============================================================================
// 📸 MEDIA SCHEMA - PitchConnect v7.5.0
// ============================================================================

import { z } from 'zod';

export const SportSchema = z.enum(['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL']);
export const MediaTypeSchema = z.enum(['VIDEO', 'IMAGE', 'DOCUMENT', 'AUDIO']);
export const MediaCategorySchema = z.enum([
  'MATCH_HIGHLIGHT', 'TRAINING_SESSION', 'PLAYER_PROFILE', 'TEAM_PHOTO',
  'ANALYSIS', 'INTERVIEW', 'BEHIND_THE_SCENES', 'PROMOTIONAL',
  'MEDICAL', 'TACTICAL', 'SCOUTING', 'NEWS', 'EVENT',
  // Sport-specific
  'FOOTBALL_HIGHLIGHTS', 'RUGBY_HIGHLIGHTS', 'CRICKET_HIGHLIGHTS',
  'BASKETBALL_HIGHLIGHTS', 'HOCKEY_HIGHLIGHTS', 'NETBALL_HIGHLIGHTS',
  'OTHER',
]);
export const MediaVisibilitySchema = z.enum(['PUBLIC', 'CLUB_ONLY', 'TEAM_ONLY', 'STAFF_ONLY', 'PRIVATE']);
export const MediaStatusSchema = z.enum(['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED', 'DELETED']);

export const MEDIA_LIMITS = {
  MAX_FILE_SIZE_IMAGE: 10 * 1024 * 1024,      // 10MB
  MAX_FILE_SIZE_VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  MAX_FILE_SIZE_AUDIO: 100 * 1024 * 1024,     // 100MB
  MAX_FILE_SIZE_DOCUMENT: 50 * 1024 * 1024,   // 50MB
  MAX_TITLE: 200,
  MAX_DESCRIPTION: 2000,
  MAX_TAGS: 20,
  MAX_TAG_LENGTH: 30,
  MAX_BATCH_ITEMS: 50,
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const UploadMediaSchema = z.object({
  clubId: z.string().cuid(),
  teamId: z.string().cuid().nullable().optional(),
  sport: SportSchema.optional(),
  type: MediaTypeSchema,
  title: z.string().min(1).max(MEDIA_LIMITS.MAX_TITLE),
  description: z.string().max(MEDIA_LIMITS.MAX_DESCRIPTION).optional(),
  category: MediaCategorySchema,
  visibility: MediaVisibilitySchema.default('CLUB_ONLY'),
  tags: z.array(z.string().max(MEDIA_LIMITS.MAX_TAG_LENGTH)).max(MEDIA_LIMITS.MAX_TAGS).default([]),
  matchId: z.string().cuid().optional(),
  trainingSessionId: z.string().cuid().optional(),
  playerId: z.string().cuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateMediaSchema = z.object({
  title: z.string().min(1).max(MEDIA_LIMITS.MAX_TITLE).optional(),
  description: z.string().max(MEDIA_LIMITS.MAX_DESCRIPTION).optional(),
  category: MediaCategorySchema.optional(),
  visibility: MediaVisibilitySchema.optional(),
  tags: z.array(z.string().max(MEDIA_LIMITS.MAX_TAG_LENGTH)).max(MEDIA_LIMITS.MAX_TAGS).optional(),
});

export const CreateClipSchema = z.object({
  sourceMediaId: z.string().cuid(),
  title: z.string().min(1).max(MEDIA_LIMITS.MAX_TITLE),
  description: z.string().max(MEDIA_LIMITS.MAX_DESCRIPTION).optional(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  visibility: MediaVisibilitySchema.default('CLUB_ONLY'),
  tags: z.array(z.string().max(MEDIA_LIMITS.MAX_TAG_LENGTH)).max(MEDIA_LIMITS.MAX_TAGS).default([]),
}).refine(data => data.endTime > data.startTime, { message: 'End time must be after start time', path: ['endTime'] });

export const CreateShareLinkSchema = z.object({
  mediaId: z.string().cuid(),
  expiresAt: z.union([z.string().datetime(), z.date()]).optional(),
  maxViews: z.number().int().min(1).max(10000).optional(),
  password: z.string().min(4).max(50).optional(),
  allowDownload: z.boolean().default(false),
});

export const MediaFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().nullable().optional(),
  sport: z.union([SportSchema, z.array(SportSchema)]).optional(),
  type: z.union([MediaTypeSchema, z.array(MediaTypeSchema)]).optional(),
  category: z.union([MediaCategorySchema, z.array(MediaCategorySchema)]).optional(),
  visibility: z.union([MediaVisibilitySchema, z.array(MediaVisibilitySchema)]).optional(),
  status: z.union([MediaStatusSchema, z.array(MediaStatusSchema)]).optional(),
  playerId: z.string().cuid().optional(),
  matchId: z.string().cuid().optional(),
  trainingSessionId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'views', 'duration']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const BatchDeleteSchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(MEDIA_LIMITS.MAX_BATCH_ITEMS),
});

export const BatchUpdateVisibilitySchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1).max(MEDIA_LIMITS.MAX_BATCH_ITEMS),
  visibility: MediaVisibilitySchema,
});

export const TranscodeRequestSchema = z.object({
  mediaId: z.string().cuid(),
  qualities: z.array(z.enum(['360p', '480p', '720p', '1080p', '4k'])).min(1),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export function getMaxFileSize(type: z.infer<typeof MediaTypeSchema>): number {
  const sizes: Record<z.infer<typeof MediaTypeSchema>, number> = {
    IMAGE: MEDIA_LIMITS.MAX_FILE_SIZE_IMAGE,
    VIDEO: MEDIA_LIMITS.MAX_FILE_SIZE_VIDEO,
    AUDIO: MEDIA_LIMITS.MAX_FILE_SIZE_AUDIO,
    DOCUMENT: MEDIA_LIMITS.MAX_FILE_SIZE_DOCUMENT,
  };
  return sizes[type];
}

export function getAllowedMimeTypes(type: z.infer<typeof MediaTypeSchema>): string[] {
  const types: Record<z.infer<typeof MediaTypeSchema>, string[]> = {
    IMAGE: ALLOWED_IMAGE_TYPES,
    VIDEO: ALLOWED_VIDEO_TYPES,
    AUDIO: ALLOWED_AUDIO_TYPES,
    DOCUMENT: ALLOWED_DOCUMENT_TYPES,
  };
  return types[type];
}

export type Sport = z.infer<typeof SportSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type MediaCategory = z.infer<typeof MediaCategorySchema>;
export type MediaVisibility = z.infer<typeof MediaVisibilitySchema>;
export type MediaStatus = z.infer<typeof MediaStatusSchema>;
export type UploadMediaInput = z.infer<typeof UploadMediaSchema>;
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;
export type CreateClipInput = z.infer<typeof CreateClipSchema>;
export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;
export type MediaFilters = z.infer<typeof MediaFiltersSchema>;