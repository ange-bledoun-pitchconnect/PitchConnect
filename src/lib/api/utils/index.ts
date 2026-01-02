/**
 * ============================================================================
 * 🛠️ PITCHCONNECT - Utils Exports v7.10.1
 * Path: src/lib/api/utils/index.ts
 * ============================================================================
 */

// =============================================================================
// AUDIT LOGGING
// =============================================================================

export {
  createAuditLog,
  logAuthenticationEvent,
  log2FAEvent,
  logResourceCreation,
  logResourceUpdate,
  logResourceDeletion,
  logRoleChange,
  logFinancialTransaction,
  logSubscriptionChange,
  logSecurityIncident,
  logDataExport,
  logBulkOperation,
  logAuditAction,
  logResourceUpdated,
  logResourceCreated,
  logAuthEvent,
  extractRequestDetails,
  getAuditLogsForEntity,
  getAuditLogsForUser,
  getAuditLogsTargetingUser,
  getSecurityAuditLogs,
  getFinancialAuditLogs,
  searchAuditLogs,
  getAuditLogStats,
  deleteOldAuditLogs,
  exportAuditLogsAsJSON,
  type AuditAction,
  type AuditEntityType,
  type AuditSeverity,
  type CreateAuditLogInput,
  type AuditLogResponse,
  type AuditStats,
  type AuditExportOptions,
} from './audit';

// =============================================================================
// API RESPONSES
// =============================================================================

export {
  // Utility functions
  generateRequestId,
  getCurrentTimestamp,
  getStatusMessage,
  getErrorCodeForStatus,
  isSuccessResponse,
  isErrorResponse,
  isClientError,
  isServerError,
  logApiResponse,
  trackApiMetrics,
  
  // Success responses
  successResponse,
  createdResponse,
  acceptedResponse,
  noContentResponse,
  paginatedResponse,
  
  // Error responses
  errorResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  tooManyRequests,
  serverError,
  unavailable,
  
  // NextResponse wrappers
  wrapResponse,
  wrapErrorResponse,
  ok,
  created,
  
  // Builder
  ResponseBuilder,
  
  // Helpers
  createValidationError,
  createValidationErrors,
  hasPagination,
  getErrorDetails,
  formatErrorForDisplay,
  
  // Types
  type ApiResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiErrorDetail,
  type ApiResponseMeta,
  type PaginationMeta,
  type StatusCode,
  type ErrorCode,
  type RequestContext,
} from './responses';

// =============================================================================
// HELPERS
// =============================================================================

export {
  // Pagination
  calculatePagination,
  buildPaginatedResponse,
  
  // Date/Time
  calculateAge,
  parseISODate,
  getSeasonDateRange,
  daysBetween,
  isDateInPast,
  formatDateShort,
  
  // Player/Team
  getValidPositionsForSport,
  isValidPositionForSport,
  getValidShirtNumberRange,
  calculatePlayerMarketValue,
  
  // Match
  isValidMatchMinute,
  getMatchStatus,
  
  // String
  sanitizeEmail,
  truncateString,
  generateSlug,
  capitalize,
  
  // Numeric
  roundTo,
  percentageToDecimal,
  formatNumber,
  formatMinutesToTime,
  
  // Filtering
  buildWhereClause,
  buildOrderByClause,
  
  // Validation
  isValidUUID,
  isValidPhoneNumber,
  isValidURL,
  
  // Response
  buildErrorResponse,
  
  // Logging
  logAPICall,
  logPerformance,
  
  // Types
  type PaginationOptions,
  type PaginatedResponse,
  type DateRange,
  type FilterOptions,
  type SortOptions,
} from './helpers';

// =============================================================================
// VALIDATION
// =============================================================================

export {
  // JSON parsing
  parseJsonBody,
  parseSearchParams,
  
  // Required fields
  validateRequired,
  validateRequiredFields,
  
  // String validation
  validateStringLength,
  validateEmail,
  validatePhoneNumber,
  validateUrl,
  validateUUID,
  
  // Numeric validation
  validateNumber,
  validateInteger,
  validatePositiveNumber,
  
  // Date validation
  validateDate,
  validateDateRange,
  
  // Array validation
  validateArray,
  validateArrayLength,
  
  // Enum validation
  validateEnum,
  
  // File validation
  validateFile,
  validateImageFile,
  validateVideoFile,
  validatePdfFile,
  formatFileSize,
  
  // Pagination
  parsePaginationParams,
  validatePagination,
  
  // Sanitization
  sanitizeInput,
  sanitizeHtml,
  
  // Utilities
  allValid,
  collectErrors,
  mergeValidationResults,
  validateObjectKeys,
  
  // Custom validators
  createRegexValidator,
  createAsyncValidator,
  
  // Types
  type ValidationResult,
  type ValidationOptions,
  type FileValidationOptions,
  type PaginationParams,
  type ParsedPaginationResult,
} from './validation';
