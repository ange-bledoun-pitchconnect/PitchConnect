/**
 * ============================================================================
 * 🚀 PITCHCONNECT - Enterprise API Module v7.10.1
 * Path: src/lib/api/index.ts
 * ============================================================================
 * 
 * Complete API utilities for the world's best sports management platform
 * 
 * ✅ All 18 UserRoles supported
 * ✅ All 12 Sports with position validation
 * ✅ Tier-based rate limiting (FREE/PRO/PREMIUM/ENTERPRISE)
 * ✅ GDPR-compliant audit logging
 * ✅ Datadog APM integration
 * ✅ Comprehensive error handling
 * ✅ Type-safe Zod validation
 * 
 * ============================================================================
 */

// =============================================================================
// ERRORS
// =============================================================================

export {
  // Error classes
  ApiError,
  UnauthorizedError,
  InvalidCredentialsError,
  TokenExpiredError,
  SessionExpiredError,
  ForbiddenError,
  InsufficientPermissionsError,
  RoleRequiredError,
  TierRequiredError,
  AccountSuspendedError,
  AccountBannedError,
  BadRequestError,
  ValidationError,
  MissingFieldError,
  InvalidFormatError,
  InvalidSportError,
  InvalidPositionError,
  NotFoundError,
  UserNotFoundError,
  ClubNotFoundError,
  TeamNotFoundError,
  PlayerNotFoundError,
  MatchNotFoundError,
  ConflictError,
  DuplicateResourceError,
  RateLimitError,
  DailyLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  MaintenanceModeError,
  
  // Functions
  errorResponse,
  handleError,
  isApiError,
  isOperationalError,
  
  // Types
  ErrorCode,
  type ErrorResponseBody,
} from './errors';

// =============================================================================
// MIDDLEWARE
// =============================================================================

export {
  // Auth
  requireAuth,
  getUserProfile,
  hasAnyRole,
  hasAllRoles,
  requireAnyRole,
  requireAllRoles,
  isSuperAdmin,
  isAdmin,
  isStaff,
  isManagement,
  hasAnalyticsAccess,
  hasFinancialAccess,
  requireSuperAdmin,
  requireAdmin,
  getRoleLevel,
  hasMinimumRoleLevel,
  hasTierAccess,
  requireTier,
  isClubOwner,
  isClubMember,
  getClubMembership,
  requireClubAccess,
  requireClubStaffAccess,
  isTeamMember,
  requireTeamMembership,
  isTeamCaptain,
  requireTeamCaptain,
  requirePlayerProfile,
  requireCoachProfile,
  requireClubOwnerProfile,
  requireResource,
  requireActivePlayer,
  requireActiveTeam,
  requireMatch,
  isResourceOwner,
  requireResourceOwnership,
  
  // Rate limiting
  checkRateLimit,
  getRateLimitHeaders,
  withRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  isRateLimited,
  TIER_RATE_LIMITS,
  ENDPOINT_LIMITS,
  
  // Logger
  logger,
  createRequestId,
  getRequestId,
  maskSensitiveData,
  
  // Async handler
  asyncHandler,
  withErrorHandling,
  createApiHandler,
  withAuth,
  withAdminRole,
  withoutRateLimit,
  withoutLogging,
  
  // Types
  type UserRole,
  type AccountTier as TierType,
  type UserStatus,
  type ClubMemberRole,
  type SessionUser,
  type UserProfile,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitHeaders,
  type RateLimitMiddlewareOptions,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type AsyncHandler,
  type HandlerOptions,
  type RequestContext as HandlerContext,
  type ApiHandlers,
  
  // Constants
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  ANALYTICS_ROLES,
  FINANCIAL_ROLES,
  TIER_HIERARCHY,
} from './middleware';

// =============================================================================
// VALIDATORS
// =============================================================================

export {
  // Schemas
  SportEnum,
  PositionEnum,
  UserRoleEnum,
  UserStatusEnum,
  AccountTierEnum,
  PreferredFootEnum,
  GenderEnum,
  MatchStatusEnum,
  PlayerStatusEnum,
  InjuryTypeEnum,
  InjurySeverityEnum,
  BodyPartEnum,
  
  // User schemas
  UserCreateSchema,
  UserUpdateSchema,
  UserLoginSchema,
  PasswordResetSchema,
  
  // Player schemas
  PlayerCreateSchema,
  PlayerUpdateSchema,
  PlayerCreateWithValidationSchema,
  
  // Team schemas
  TeamCreateSchema,
  TeamUpdateSchema,
  
  // Club schemas
  ClubCreateSchema,
  ClubUpdateSchema,
  
  // Match schemas
  MatchCreateSchema,
  MatchUpdateSchema,
  MatchEventSchema,
  
  // Injury schemas
  InjuryCreateSchema,
  InjuryUpdateSchema,
  
  // Query schemas
  PaginationQuerySchema,
  SearchQuerySchema,
  
  // ID param schemas
  IdParamSchema,
  ClubIdParamSchema,
  TeamIdParamSchema,
  PlayerIdParamSchema,
  MatchIdParamSchema,
  
  // Validation functions
  validateBody,
  validateQuery,
  validateParams,
  validatePositionForSport,
  getValidPositions,
  getPositionEnumForSport,
  
  // Position data
  POSITIONS_BY_SPORT,
  
  // Types
  type Sport,
  type UserCreate,
  type UserUpdate,
  type UserLogin,
  type PlayerCreate,
  type PlayerUpdate,
  type TeamCreate,
  type TeamUpdate,
  type ClubCreate,
  type ClubUpdate,
  type MatchCreate,
  type MatchUpdate,
  type MatchEvent,
  type InjuryCreate,
  type InjuryUpdate,
  type PaginationQuery,
  type SearchQuery,
} from './validators';

// =============================================================================
// UTILS (Re-exported from utils/index.ts)
// =============================================================================

export * from './utils';

// =============================================================================
// VERSION
// =============================================================================

export const API_VERSION = '7.10.1';
export const API_MODULE_NAME = 'pitchconnect-api';
