// ============================================================================
// 📦 PITCHCONNECT TYPE DEFINITIONS - Central Export v7.5.0
// Path: src/types/index.ts
// ============================================================================
//
// Central barrel file for all type definitions.
// Re-exports from domain-specific type files for convenience.
//
// USAGE:
//   import { Sport, Player, Match, UserRole } from '@/types';
//
// For specific domains, you can also import directly:
//   import { Sport, Position, SPORT_CONFIGS } from '@/types/player';
//   import { Match, MatchEvent } from '@/types/match';
//
// ============================================================================

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export type {
  // Core auth types
  UserRole,
  PermissionName,
  UserStatus,
  AccountTier,
  
  // Credentials & registration
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChange,
  EmailVerification,
  
  // Two-factor
  TwoFactorSetup,
  TwoFactorVerify,
  
  // Session types
  SessionUser,
  AuthSession,
  AuthState,
  
  // Token types
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  
  // Authorization
  AuthorizationResult,
  AuthorizationContext,
  RouteProtection,
  
  // OAuth
  OAuthProvider,
  OAuthAccountLink,
  OAuthProfile,
  
  // Security
  LoginAttempt,
  ActiveSession,
  SecurityEventType,
  SecurityEvent,
  
  // API
  ApiKey,
  ApiKeyCreated,
  
  // Invitation
  UserInvitation,
  InvitationAcceptance,
  
  // Errors
  AuthErrorCode,
  AuthError,
  
  // Responses
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  
  // Utilities
  AuthenticatedUser,
  PublicUserInfo,
} from './auth';

export {
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  CLUB_MANAGEMENT_ROLES,
  COACHING_ROLES,
  MEDICAL_ROLES,
  PLAYER_ROLES,
  FAMILY_ROLES,
  STAFF_ROLES,
  isValidRole,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getHighestRole,
  isHigherRole,
} from './auth';

// ============================================================================
// PLAYER & SPORTS
// ============================================================================

export type {
  // Core sport types
  Sport,
  Position,
  SportConfig,
  ScoreBreakdownConfig,
  
  // Fitness & Health
  FitnessStatus,
  FitnessAssessmentType,
  InjurySeverity,
  InjuryStatus,
  AvailabilityStatus,
} from './player';

export {
  // Sport configurations
  SPORT_CONFIGS,
  
  // Status configurations
  FITNESS_STATUS_CONFIG,
  INJURY_SEVERITY_CONFIG,
  INJURY_STATUS_CONFIG,
  AVAILABILITY_STATUS_CONFIG,
  
  // Common data
  COMMON_INJURIES,
  
  // Helper functions
  getStatLabels,
  getPositionsForSport,
  getFormationsForSport,
  calculateTotalScore,
  formatPosition,
  getEventTypesForSport,
  usesScoreBreakdown,
  getSportByName,
  getAllSports,
} from './player';

// ============================================================================
// MATCH SYSTEM
// ============================================================================

export type {
  // Core match types
  Match,
  MatchEvent,
  MatchSquad,
  MatchAttendance,
  PlayerMatchPerformance,
  MatchOfficial,
  
  // Score breakdowns
  ScoreBreakdown,
  FootballScoreBreakdown,
  RugbyScoreBreakdown,
  BasketballScoreBreakdown,
  CricketScoreBreakdown,
  AmericanFootballScoreBreakdown,
  HockeyScoreBreakdown,
  NetballScoreBreakdown,
  GenericScoreBreakdown,
  
  // Filters & queries
  MatchFilters,
  MatchPermissions,
  
  // API responses
  MatchListResponse,
  MatchDetailResponse,
  
  // Live match
  LiveMatchUpdate,
  LiveMatchTimeline,
} from './match';

export {
  MATCH_STATUS_CONFIG,
  MATCH_TYPE_CONFIG,
  LIVE_STATUSES,
  FINISHED_STATUSES,
  PENDING_STATUSES,
} from './match';

// ============================================================================
// MEDICAL & FITNESS
// ============================================================================

export type {
  // Injury types
  Injury,
  InjuryLocation,
  
  // Medical records
  MedicalRecord,
  MedicalRecordType,
  
  // Fitness
  FitnessAssessment,
  FitnessMetrics,
  
  // Return to play
  RTPStage,
  
  // Access control
  MedicalAccessConfig,
  
  // Concussion
  ConcussionProtocol,
} from './medical';

export {
  INJURY_LOCATIONS,
  INJURY_TYPES,
  MEDICAL_RECORD_TYPES,
  RTP_PROTOCOL,
  MEDICAL_ACCESS_BY_ROLE,
  CONCUSSION_PROTOCOLS,
  
  // Helper functions
  getInjurySeverityColor,
  getFitnessStatusColor,
  getDaysSinceInjury,
  getDaysToReturn,
  getRTPStage,
  getRTPProgress,
  canAccessMedicalRecords,
} from './medical';

// ============================================================================
// TRAINING
// ============================================================================

export type {
  // Core training types
  TrainingSessionWithRelations,
  TrainingSessionListItem,
  TrainingAttendanceWithPlayer,
  TrainingMedia,
  CoachWithUser,
  
  // Input types
  CreateTrainingSessionInput,
  UpdateTrainingSessionInput,
  TrainingDrill,
  
  // Attendance
  RecordAttendanceInput,
  BulkAttendanceInput,
  AttendanceSummary,
  PlayerAttendanceRecord,
  
  // Filters
  TrainingSessionFilters,
  PaginationOptions as TrainingPaginationOptions,
  
  // Analytics
  TrainingAnalytics,
  CategoryBreakdown,
  IntensityBreakdown,
  CoachBreakdown,
  TeamBreakdown,
  TimeSeriesData,
  
  // Calendar
  TrainingCalendarEvent,
  CalendarViewOptions,
  
  // Templates
  TrainingTemplate,
  CreateFromTemplateInput,
  
  // Recurring
  RecurringTrainingSchedule,
  RecurrenceRule,
  
  // API
  CreateTrainingSessionResponse,
  ConflictWarning,
  TrainingNotificationPayload,
} from './training.types';

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type {
  // Core notification types
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  Notification,
  NotificationMetadata,
  NotificationAction,
  
  // Preferences
  NotificationPreferences,
  NotificationChannelConfig,
  
  // Filters
  NotificationFilters,
  NotificationSortOptions,
  
  // Push
  FCMNotificationPayload,
} from './notification';

export {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPE_CATEGORY,
  DEFAULT_CHANNEL_CONFIG,
  
  // Helper functions
  getCategoryForType,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTitle,
  shouldUseSMS,
  getTypesForCategory,
  groupNotificationsByDate,
  getUnreadCountByCategory,
} from './notification';

// ============================================================================
// MEDIA
// ============================================================================

export type {
  // Core media types
  MediaContentWithRelations,
  MediaContentListItem,
  VideoQualityVariant,
  MediaMetadata,
  
  // Upload types
  UploadMediaInput,
  UploadMediaResponse,
  PresignedUploadResponse,
  MultipartUploadPart,
  CompleteMultipartUploadInput,
  
  // Update types
  UpdateMediaInput,
  
  // Filters
  MediaFilters,
  PaginationOptions as MediaPaginationOptions,
  PaginatedMediaResponse,
  
  // Processing
  MediaProcessingJob,
  ProcessingOutput,
  TranscodeRequest,
  ProcessingWebhookPayload,
  
  // Analytics
  MediaAnalytics,
  MediaStorageStats,
  
  // Gallery
  MediaGallery,
  GalleryItem,
  
  // Clips
  CreateClipInput,
  MediaClip,
  
  // Sharing
  MediaShareLink,
  CreateShareLinkInput,
} from './media.types';

export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZES,
  VIDEO_QUALITY_SETTINGS,
} from './media.types';

// ============================================================================
// JOBS & RECRUITMENT
// ============================================================================

export type {
  // Job types
  JobPostingWithRelations,
  JobPostingListItem,
  JobApplicationWithRelations,
  JobApplicationListItem,
  
  // Input types
  CreateJobPostingInput,
  UpdateJobPostingInput,
  CreateJobApplicationInput,
  ReviewApplicationInput,
  
  // Filters
  JobPostingFilters,
  JobApplicationFilters,
  PaginationOptions as JobPaginationOptions,
  
  // Responses
  PaginatedJobResponse,
  PaginatedApplicationResponse,
  
  // Stats
  JobPostingStats,
  ApplicationStats,
  
  // Notifications
  JobNotificationPayload,
  
  // Search
  JobSearchResult,
  JobSearchParams,
} from './job.types';

// ============================================================================
// JOIN REQUESTS
// ============================================================================

export type {
  // Core types
  JoinRequestWithRelations,
  JoinRequestListItem,
  JoinRequestDetail,
  JoinRequestPlayerInfo,
  JoinRequestTeamInfo,
  
  // Input types
  CreateJoinRequestInput,
  ReviewJoinRequestInput,
  WithdrawJoinRequestInput,
  UpdateJoinRequestInput,
  
  // Filters
  JoinRequestFilters,
  PaginationOptions as JoinRequestPaginationOptions,
  PaginatedJoinRequestResponse,
  
  // Stats
  JoinRequestStats,
  TeamJoinRequestSummary,
  ClubJoinRequestSummary,
  PlayerRequestStats,
  
  // Notifications
  JoinRequestNotificationType,
  JoinRequestNotificationPayload,
  
  // Permissions
  JoinRequestPermissions,
  
  // API
  CreateJoinRequestResponse,
  ReviewJoinRequestResponse,
  WithdrawJoinRequestResponse,
  BulkReviewResponse,
} from './join-request.types';

export {
  JOIN_REQUEST_STATUSES,
  STATUS_CONFIG as JOIN_REQUEST_STATUS_CONFIG,
  DEFAULT_EXPIRY_DAYS,
  MAX_MESSAGE_LENGTH,
  MAX_EXPERIENCE_LENGTH,
  JOIN_REQUEST_MANAGER_ROLES,
} from './join-request.types';

// ============================================================================
// COMMON API TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    field?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    duration?: number;
  };
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Generic filter options
 */
export interface FilterOptions {
  search?: string;
  status?: string | string[];
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  duration?: number;
}

// ============================================================================
// ENTITY REFERENCES (Minimal types for relationships)
// ============================================================================

/**
 * Minimal user reference
 */
export interface UserReference {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string | null;
}

/**
 * Minimal club reference
 */
export interface ClubReference {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  sport: import('./player').Sport;
}

/**
 * Minimal team reference
 */
export interface TeamReference {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  clubId: string;
}

/**
 * Minimal player reference
 */
export interface PlayerReference {
  id: string;
  userId: string;
  user: UserReference;
  primaryPosition?: string | null;
  jerseyNumber?: number | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make all properties required except specified keys
 */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

/**
 * Extract the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Make specific fields nullable
 */
export type WithNullable<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * ID type (CUID format)
 */
export type ID = string;

/**
 * ISO date string
 */
export type ISODateString = string;

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = string;

/**
 * Locale string (e.g., 'en-GB', 'es-ES')
 */
export type LocaleString = string;

/**
 * Timezone string (e.g., 'Europe/London', 'America/New_York')
 */
export type TimezoneString = string;