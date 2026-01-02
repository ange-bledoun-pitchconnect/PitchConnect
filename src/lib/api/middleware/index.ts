/**
 * ============================================================================
 * 🔧 PITCHCONNECT - Middleware Exports v7.10.1
 * Path: src/lib/api/middleware/index.ts
 * ============================================================================
 */

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

export {
  // Functions
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
  
  // Types
  type UserRole,
  type AccountTier,
  type UserStatus,
  type ClubMemberRole,
  type SessionUser,
  type UserProfile,
  
  // Constants
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  ANALYTICS_ROLES,
  FINANCIAL_ROLES,
  TIER_HIERARCHY,
} from './auth';

// =============================================================================
// RATE LIMIT MIDDLEWARE
// =============================================================================

export {
  checkRateLimit,
  getRateLimitHeaders,
  withRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  isRateLimited,
  TIER_RATE_LIMITS,
  ENDPOINT_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitHeaders,
  type RateLimitMiddlewareOptions,
} from './rateLimit';

// =============================================================================
// LOGGER
// =============================================================================

export {
  logger,
  createRequestId,
  getRequestId,
  maskSensitiveData,
  type LogLevel,
  type LogContext,
  type LogEntry,
} from './logger';

// =============================================================================
// ASYNC HANDLER
// =============================================================================

export {
  asyncHandler,
  withErrorHandling,
  createApiHandler,
  withAuth,
  withAdminRole,
  withoutRateLimit,
  withoutLogging,
  type AsyncHandler,
  type HandlerOptions,
  type RequestContext,
  type ApiHandlers,
} from './asyncHandler';
