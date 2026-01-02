/**
 * ============================================================================
 * 🏆 PITCHCONNECT HOOKS v7.10.1 - ENTERPRISE HOOKS PACKAGE
 * ============================================================================
 * 
 * Multi-sport enterprise React hooks for PitchConnect platform.
 * Full support for 12 sports with authentic terminology.
 * 
 * @version 7.10.1
 * @copyright PitchConnect 2025
 * ============================================================================
 */

// =============================================================================
// FOUNDATION HOOKS
// =============================================================================

export {
  useSportConfig,
  SportConfigProvider,
  getSportConfig,
  getAllSports,
  isValidSport,
  getSportIcon,
  getSportName,
  SPORT_CONFIGS,
  SportEnum,
  MatchStatusEnum,
  type Sport,
  type MatchStatus,
  type SportConfig,
  type ScoringUnit,
  type PeriodConfig,
  type PositionCategory,
  type SportEventType,
} from './useSportConfig';

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

export {
  useAuth,
  getRoleDisplayName,
  getClubRoleDisplayName,
  getRoleBadgeColor,
  isValidUserRole,
  isValidClubRole,
  UserRoleEnum,
  ClubMemberRoleEnum,
  AccountTierEnum,
  UserStatusEnum,
  type UserRole,
  type ClubMemberRole,
  type AccountTier,
  type UserStatus,
  type AuthUser,
  type ClubMembership,
  type UseAuthReturn,
} from './useAuth';

export {
  useMatchPermissions,
  type MatchPermission,
  type MatchContext,
  type UseMatchPermissionsReturn,
} from './useMatchPermissions';

// =============================================================================
// REAL-TIME HOOKS
// =============================================================================

export {
  useRealTimeMatch,
  useMatchTimeline,
  useMatchStats,
  getSocketManager,
  type Match,
  type MatchEvent,
  type TeamStats as MatchTeamStats,
  type LiveMatchStats,
  type PlayerMatchPerformance,
  type UseRealTimeMatchOptions,
  type UseRealTimeMatchReturn,
} from './useRealTimeMatch';

export {
  useMatchSocket,
  type MatchSocketEvent,
  type MatchSocketMessage,
  type UseMatchSocketOptions,
  type UseMatchSocketReturn,
} from './useMatchSocket';

export {
  useLiveStandings,
  type TeamStanding,
  type StandingsGroup,
  type UseLiveStandingsOptions,
  type UseLiveStandingsReturn,
} from './useLiveStandings';

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export {
  useNotifications,
  createScoringNotification,
  createDisciplinaryNotification,
  createSubstitutionNotification,
  createMatchStatusNotification,
  type NotificationType,
  type NotificationConfig,
  type MatchEventPayload,
} from './useNotification';

export {
  useToast,
  type Toast,
  type ToastVariant,
  type ToastOptions,
} from './useToast';

// =============================================================================
// DATA FETCHING
// =============================================================================

export {
  useFetch,
  useMutation,
  type UseFetchReturn,
  type UseMutationReturn,
} from './useFetch';

export {
  useGlobalSearch,
  type SearchEntityType,
  type SearchResult,
  type SearchFilters,
  type UseGlobalSearchOptions,
  type UseGlobalSearchReturn,
} from './useGlobalSearch';

// =============================================================================
// ANALYTICS & EXPORT
// =============================================================================

export {
  useAdvancedAnalytics,
  type PlayerAnalytics,
  type TeamAnalytics,
  type UseAdvancedAnalyticsOptions,
  type UseAdvancedAnalyticsReturn,
} from './useAdvancedAnalytics';

export {
  useExport,
  downloadAsCSV,
  downloadAsJSON,
  type ExportFormat,
  type ExportType,
  type ExportOptions,
  type ExportProgress,
  type UseExportReturn,
} from './useExport';

// =============================================================================
// UI UTILITIES
// =============================================================================

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useThrottle,
  useThrottledCallback,
} from './useDebounce';

export {
  useModal,
  useModalManager,
  type UseModalReturn,
} from './useModal';

export {
  useConfirmDialog,
  type ConfirmDialogVariant,
  type ConfirmDialogConfig,
  type UseConfirmDialogReturn,
} from './useConfirmDialog';

export {
  usePagination,
  type PaginationConfig,
  type UsePaginationReturn,
} from './usePagination';

export {
  useResponsive,
  useMediaQuery,
  useBreakpoint,
  BREAKPOINTS,
  type Breakpoint,
  type UseResponsiveReturn,
} from './useResponsive';

// =============================================================================
// FORM HANDLING
// =============================================================================

export {
  useFormValidation,
  type ValidationRule,
  type FieldConfig,
  type FieldState,
  type UseFormValidationReturn,
} from './useFormValidation';

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export {
  usePerformance,
  type WebVitals,
  type PerformanceThresholds,
  type VitalRating,
  type UsePerformanceOptions,
  type UsePerformanceReturn,
} from './usePerformance';
