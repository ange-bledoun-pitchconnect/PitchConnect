// ============================================================================
// 🤝 JOIN REQUEST TYPES - PitchConnect v7.3.0
// ============================================================================
// Complete type definitions for Team Join Request workflow
// Supports player applications to join teams with full review process
// ============================================================================

import type {
  TeamJoinRequest,
  JoinRequestStatus,
  User,
  Player,
  Team,
  Club,
  ClubMemberRole,
} from '@prisma/client';

// ============================================================================
// RE-EXPORT ENUMS
// ============================================================================

export type { JoinRequestStatus };

/**
 * All possible join request statuses
 */
export const JOIN_REQUEST_STATUSES: JoinRequestStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
];

// ============================================================================
// BASE USER & PLAYER TYPES
// ============================================================================

/**
 * Minimal user info for display
 */
export interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  phone?: string | null;
}

/**
 * Player with user information
 */
export interface PlayerWithUser extends Player {
  user: UserBasicInfo;
}

/**
 * Player info for join request display
 */
export interface JoinRequestPlayerInfo {
  id: string;
  primaryPosition: string | null;
  secondaryPositions: string[];
  dateOfBirth: Date | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  preferredFoot: string | null;
  overallRating: number | null;
  user: UserBasicInfo;
}

// ============================================================================
// TEAM & CLUB TYPES
// ============================================================================

/**
 * Club basic info
 */
export interface ClubBasicInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  sport: string;
  city: string | null;
  country: string | null;
}

/**
 * Team with club info
 */
export interface TeamWithClub extends Team {
  club: ClubBasicInfo;
}

/**
 * Team info for join request
 */
export interface JoinRequestTeamInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  ageGroup: string | null;
  gender: string | null;
  division: string | null;
  club: ClubBasicInfo;
}

// ============================================================================
// JOIN REQUEST TYPES
// ============================================================================

/**
 * Full join request with all relations
 */
export interface JoinRequestWithRelations extends TeamJoinRequest {
  player: JoinRequestPlayerInfo;
  team: JoinRequestTeamInfo;
  reviewedBy?: UserBasicInfo | null;
}

/**
 * Join request for list views (optimized)
 */
export interface JoinRequestListItem {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  position: string | null;
  experience: string | null;
  availability: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  reviewedAt: Date | null;
  player: {
    id: string;
    primaryPosition: string | null;
    dateOfBirth: Date | null;
    overallRating: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      email: string;
    };
  };
  team: {
    id: string;
    name: string;
    slug: string;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Join request detail view
 */
export interface JoinRequestDetail extends JoinRequestWithRelations {
  daysUntilExpiry: number | null;
  canWithdraw: boolean;
  canReview: boolean;
}

// ============================================================================
// CREATE/UPDATE INPUT TYPES
// ============================================================================

/**
 * Create join request input
 */
export interface CreateJoinRequestInput {
  teamId: string;
  playerId: string;
  message?: string | null;
  position?: string | null;
  experience?: string | null;
  availability?: string | null;
  references?: string | null;
  previousClubs?: string | null;
  achievements?: string | null;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    highlightReel?: string;
  } | null;
  metadata?: Record<string, unknown>;
}

/**
 * Review join request input (approve or reject)
 */
export interface ReviewJoinRequestInput {
  requestId: string;
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string | null;
  jerseyNumber?: number | null;
  squadRole?: string | null;
  contractType?: string | null;
  startDate?: Date | string | null;
  internalNotes?: string | null;
}

/**
 * Withdraw join request input
 */
export interface WithdrawJoinRequestInput {
  requestId: string;
  reason?: string | null;
}

/**
 * Update join request input (before review)
 */
export interface UpdateJoinRequestInput {
  message?: string | null;
  position?: string | null;
  experience?: string | null;
  availability?: string | null;
  references?: string | null;
  previousClubs?: string | null;
  achievements?: string | null;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    highlightReel?: string;
  } | null;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Join request filters
 */
export interface JoinRequestFilters {
  teamId?: string;
  clubId?: string;
  playerId?: string;
  status?: JoinRequestStatus | JoinRequestStatus[];
  position?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  isExpired?: boolean;
  hasReviewer?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'expiresAt' | 'status' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedJoinRequestResponse {
  data: JoinRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Join request statistics for a team
 */
export interface JoinRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  expired: number;
  averageResponseTimeHours: number;
  approvalRate: number;
  thisWeek: number;
  thisMonth: number;
  byPosition: Array<{
    position: string;
    count: number;
  }>;
}

/**
 * Team join request summary (for dashboard)
 */
export interface TeamJoinRequestSummary {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  pendingCount: number;
  recentRequests: JoinRequestListItem[];
  oldestPendingDate: Date | null;
}

/**
 * Club-wide join request summary
 */
export interface ClubJoinRequestSummary {
  clubId: string;
  clubName: string;
  totalPending: number;
  teamSummaries: TeamJoinRequestSummary[];
}

/**
 * Player's request history stats
 */
export interface PlayerRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  successRate: number;
  averageWaitTimeHours: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Join request notification types
 */
export type JoinRequestNotificationType =
  | 'join_request_submitted'
  | 'join_request_received'
  | 'join_request_approved'
  | 'join_request_rejected'
  | 'join_request_withdrawn'
  | 'join_request_expiring'
  | 'join_request_expired';

/**
 * Join request notification payload
 */
export interface JoinRequestNotificationPayload {
  type: JoinRequestNotificationType;
  requestId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  teamId: string;
  teamName: string;
  clubName: string;
  message?: string | null;
  reviewNotes?: string | null;
  expiresAt?: Date | null;
  timestamp: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
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
 * Create join request response
 */
export interface CreateJoinRequestResponse {
  request: JoinRequestWithRelations;
  notificationSent: boolean;
  existingRequestWarning?: string;
}

/**
 * Review join request response
 */
export interface ReviewJoinRequestResponse {
  request: JoinRequestWithRelations;
  teamPlayerCreated: boolean;
  teamPlayerId?: string;
  notificationSent: boolean;
}

/**
 * Withdraw join request response
 */
export interface WithdrawJoinRequestResponse {
  request: JoinRequestWithRelations;
  notificationSent: boolean;
}

/**
 * Bulk review response
 */
export interface BulkReviewResponse {
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    requestId: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

/**
 * Roles that can manage join requests
 */
export const JOIN_REQUEST_MANAGER_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
];

/**
 * Join request permissions
 */
export interface JoinRequestPermissions {
  canView: boolean;
  canCreate: boolean;
  canReview: boolean;
  canWithdraw: boolean;
  canDelete: boolean;
  canBulkReview: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default expiry period in days
 */
export const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Maximum message length
 */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Maximum experience description length
 */
export const MAX_EXPERIENCE_LENGTH = 1000;

/**
 * Status display configuration
 */
export const STATUS_CONFIG: Record<
  JoinRequestStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'clock',
    description: 'Awaiting review from team management',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
    description: 'Request approved - player added to team',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'x-circle',
    description: 'Request was not approved',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'arrow-left',
    description: 'Player withdrew their request',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'clock',
    description: 'Request expired without review',
  },
};