// ============================================================================
// 📹 MEDIA TYPES - PitchConnect v7.3.0
// ============================================================================
// Types for MediaContent model - supports VIDEO, IMAGE, DOCUMENT, AUDIO
// Includes processing status, visibility controls, and associations
// ============================================================================

import type {
  MediaContent,
  MediaType,
  MediaCategory,
  MediaVisibility,
  MediaProcessingStatus,
  VideoProcessingProvider,
  VideoQuality,
  ClubMemberRole,
  User,
  Club,
  Team,
  Match,
  TrainingSession,
} from '@prisma/client';

// ============================================================================
// RE-EXPORT ENUMS
// ============================================================================

export type {
  MediaType,
  MediaCategory,
  MediaVisibility,
  MediaProcessingStatus,
  VideoProcessingProvider,
  VideoQuality,
};

// ============================================================================
// MEDIA CONTENT TYPES
// ============================================================================

/**
 * Media content with all relations
 */
export interface MediaContentWithRelations extends MediaContent {
  uploader: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  club?: Pick<Club, 'id' | 'name' | 'slug' | 'logo'> | null;
  team?: Pick<Team, 'id' | 'name'> | null;
  match?: Pick<Match, 'id' | 'kickOffTime' | 'homeScore' | 'awayScore'> | null;
  training?: Pick<TrainingSession, 'id' | 'name' | 'startTime'> | null;
}

/**
 * Media content for list views (minimal data)
 */
export interface MediaContentListItem {
  id: string;
  type: MediaType;
  category: MediaCategory;
  title: string;
  thumbnailUrl: string | null;
  url: string;
  duration: number | null;
  processingStatus: MediaProcessingStatus;
  visibility: MediaVisibility;
  viewCount: number;
  createdAt: Date;
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

/**
 * Video quality variant
 */
export interface VideoQualityVariant {
  quality: VideoQuality;
  url: string;
  width: number;
  height: number;
  bitrate: number;
  size: number;
}

/**
 * Media metadata
 */
export interface MediaMetadata {
  // Video/Audio metadata
  codec?: string;
  bitrate?: number;
  frameRate?: number;
  audioChannels?: number;
  audioCodec?: string;
  
  // Image metadata
  colorSpace?: string;
  hasAlpha?: boolean;
  
  // Document metadata
  pageCount?: number;
  author?: string;
  
  // Processing metadata
  processingStartedAt?: string;
  processingCompletedAt?: string;
  processingDurationMs?: number;
  
  // Source metadata
  originalFilename?: string;
  uploadSource?: string;
  
  // Custom metadata
  [key: string]: unknown;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

/**
 * Upload request input
 */
export interface UploadMediaInput {
  file: File;
  title: string;
  description?: string;
  type: MediaType;
  category: MediaCategory;
  visibility?: MediaVisibility;
  tags?: string[];
  
  // Associations (at least one required for non-org uploads)
  organisationId?: string;
  clubId?: string;
  teamId?: string;
  matchId?: string;
  trainingId?: string;
  
  // Access control
  accessRoles?: ClubMemberRole[];
  isPublic?: boolean;
  
  // Video clip timestamps
  startTimestamp?: number;
  endTimestamp?: number;
  parentMediaId?: string;
  
  // Custom metadata
  metadata?: Record<string, unknown>;
}

/**
 * Upload response
 */
export interface UploadMediaResponse {
  media: MediaContentWithRelations;
  uploadUrl?: string; // For resumable uploads
  processingQueued: boolean;
}

/**
 * Presigned upload URL response
 */
export interface PresignedUploadResponse {
  uploadUrl: string;
  uploadId: string;
  expiresAt: Date;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

/**
 * Multipart upload part
 */
export interface MultipartUploadPart {
  partNumber: number;
  uploadUrl: string;
  size: number;
}

/**
 * Complete multipart upload input
 */
export interface CompleteMultipartUploadInput {
  uploadId: string;
  parts: Array<{
    partNumber: number;
    etag: string;
  }>;
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

/**
 * Update media input
 */
export interface UpdateMediaInput {
  title?: string;
  description?: string;
  category?: MediaCategory;
  visibility?: MediaVisibility;
  tags?: string[];
  accessRoles?: ClubMemberRole[];
  isPublic?: boolean;
  
  // Video clip timestamps
  startTimestamp?: number;
  endTimestamp?: number;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Media filters
 */
export interface MediaFilters {
  type?: MediaType | MediaType[];
  category?: MediaCategory | MediaCategory[];
  visibility?: MediaVisibility | MediaVisibility[];
  processingStatus?: MediaProcessingStatus | MediaProcessingStatus[];
  
  // Association filters
  organisationId?: string;
  clubId?: string;
  teamId?: string;
  matchId?: string;
  trainingId?: string;
  uploadedBy?: string;
  
  // Content filters
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  
  // Date filters
  startDate?: Date | string;
  endDate?: Date | string;
  
  // Duration filter (for video/audio)
  minDuration?: number;
  maxDuration?: number;
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
 * Paginated media response
 */
export interface PaginatedMediaResponse {
  data: MediaContentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// PROCESSING TYPES
// ============================================================================

/**
 * Processing job
 */
export interface MediaProcessingJob {
  id: string;
  mediaId: string;
  status: MediaProcessingStatus;
  provider: VideoProcessingProvider;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  output: ProcessingOutput | null;
}

/**
 * Processing output
 */
export interface ProcessingOutput {
  qualities: VideoQualityVariant[];
  thumbnails: string[];
  duration: number;
  metadata: MediaMetadata;
}

/**
 * Transcoding request
 */
export interface TranscodeRequest {
  mediaId: string;
  qualities: VideoQuality[];
  generateThumbnails: boolean;
  thumbnailCount?: number;
  webhookUrl?: string;
}

/**
 * Webhook payload for processing completion
 */
export interface ProcessingWebhookPayload {
  event: 'processing.started' | 'processing.progress' | 'processing.completed' | 'processing.failed';
  mediaId: string;
  status: MediaProcessingStatus;
  progress?: number;
  output?: ProcessingOutput;
  error?: string;
  timestamp: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Media analytics
 */
export interface MediaAnalytics {
  mediaId: string;
  views: number;
  uniqueViews: number;
  downloads: number;
  likes: number;
  shares: number;
  avgWatchTime: number; // in seconds
  completionRate: number; // percentage
  viewsByDate: Array<{ date: string; views: number }>;
  viewsByDevice: Array<{ device: string; views: number }>;
  viewsByLocation: Array<{ location: string; views: number }>;
}

/**
 * Media storage stats
 */
export interface MediaStorageStats {
  totalFiles: number;
  totalSize: number; // bytes
  byType: Array<{ type: MediaType; count: number; size: number }>;
  byCategory: Array<{ category: MediaCategory; count: number; size: number }>;
  usedQuota: number;
  totalQuota: number;
  quotaPercentage: number;
}

// ============================================================================
// GALLERY TYPES
// ============================================================================

/**
 * Media gallery
 */
export interface MediaGallery {
  id: string;
  clubId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  visibility: MediaVisibility;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Gallery item
 */
export interface GalleryItem {
  galleryId: string;
  mediaId: string;
  order: number;
  addedAt: Date;
}

// ============================================================================
// CLIP TYPES
// ============================================================================

/**
 * Create clip from video
 */
export interface CreateClipInput {
  sourceMediaId: string;
  title: string;
  description?: string;
  startTimestamp: number; // seconds
  endTimestamp: number; // seconds
  category?: MediaCategory;
  tags?: string[];
}

/**
 * Clip with source info
 */
export interface MediaClip extends MediaContentListItem {
  sourceMedia: {
    id: string;
    title: string;
    duration: number;
    url: string;
  };
  startTimestamp: number;
  endTimestamp: number;
  clipDuration: number;
}

// ============================================================================
// SHARE TYPES
// ============================================================================

/**
 * Share link
 */
export interface MediaShareLink {
  id: string;
  mediaId: string;
  token: string;
  url: string;
  expiresAt: Date | null;
  password?: string;
  maxViews?: number;
  currentViews: number;
  createdBy: string;
  createdAt: Date;
}

/**
 * Create share link input
 */
export interface CreateShareLinkInput {
  mediaId: string;
  expiresIn?: number; // hours
  password?: string;
  maxViews?: number;
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
// CONSTANTS
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/webm',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const MAX_FILE_SIZES: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  VIDEO: 2 * 1024 * 1024 * 1024, // 2 GB
  AUDIO: 100 * 1024 * 1024, // 100 MB
  DOCUMENT: 50 * 1024 * 1024, // 50 MB
};

export const VIDEO_QUALITY_SETTINGS: Record<VideoQuality, { width: number; height: number; bitrate: number }> = {
  Q_360P: { width: 640, height: 360, bitrate: 800000 },
  Q_480P: { width: 854, height: 480, bitrate: 1400000 },
  Q_720P: { width: 1280, height: 720, bitrate: 2800000 },
  Q_1080P: { width: 1920, height: 1080, bitrate: 5000000 },
  Q_2K: { width: 2560, height: 1440, bitrate: 8000000 },
  Q_4K: { width: 3840, height: 2160, bitrate: 16000000 },
  ORIGINAL: { width: 0, height: 0, bitrate: 0 },
};