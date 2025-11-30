/**
 * Global Type Definitions
 * Centralized types for the entire application
 */

// ========================================
// USER TYPES
// ========================================

export type UserRole = 
  | 'SUPERADMIN'
  | 'PLAYER'
  | 'COACH'
  | 'CLUB_MANAGER'
  | 'LEAGUE_ADMIN'
  | 'PARENT';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'BANNED'
  | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  roles: UserRole[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  roles?: UserRole[];
  userType?: UserRole;
}

// ========================================
// PLAYER TYPES
// ========================================

export type Position = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
export type PreferredFoot = 'LEFT' | 'RIGHT' | 'BOTH';

export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  position: Position;
  preferredFoot: PreferredFoot;
  height?: number | null;
  weight?: number | null;
  shirtNumber?: number | null;
  photo?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// TEAM TYPES
// ========================================

export interface Team {
  id: string;
  name: string;
  category: string;
  season: number;
  status: string;
  club?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  joinedAt: Date;
  leftAt?: Date | null;
  isCaptain: boolean;
}

// ========================================
// MATCH TYPES
// ========================================

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  venue?: string | null;
  status: MatchStatus;
  homeGoals?: number | null;
  awayGoals?: number | null;
  attendance?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// FORMATION & TACTIC TYPES
// ========================================

export type Formation = 
  | 'FOUR_FOUR_TWO'
  | 'FOUR_THREE_THREE'
  | 'THREE_FIVE_TWO'
  | 'FIVE_THREE_TWO'
  | 'THREE_FOUR_THREE';

export interface Tactic {
  id: string;
  coachId: string;
  teamId: string;
  name: string;
  formation: Formation;
  description?: string | null;
  playStyle: string;
  defensiveShape: string;
  pressType: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// SUBSCRIPTION & PAYMENT TYPES
// ========================================

export type SubscriptionTier = 'FREE' | 'STANDARD' | 'PROFESSIONAL' | 'ELITE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED' | 'PAST_DUE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  subscriptionId?: string | null;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  invoiceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status: number;
}

export interface ApiErrorResponse {
  error: string;
  status: number;
  timestamp: Date;
}

// ========================================
// FORM TYPES
// ========================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  requestedRole?: UserRole;
  leagueCode?: string;
}

export interface CreatePlayerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  position: Position;
  preferredFoot?: PreferredFoot;
  height?: number;
  weight?: number;
}

// ========================================
// FILTER & PAGINATION TYPES
// ========================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PlayerFilterParams extends PaginationParams {
  teamId?: string;
  position?: Position;
  search?: string;
}

export interface MatchFilterParams extends PaginationParams {
  teamId?: string;
  status?: MatchStatus;
  startDate?: Date;
  endDate?: Date;
}

// ========================================
// CONTEXT TYPES
// ========================================

export interface TeamFilterContextType {
  selectedTeams: string[];
  allTeams: { id: string; name: string }[];
  setSelectedTeams: (teamIds: string[]) => void;
  addTeam: (teamId: string) => void;
  removeTeam: (teamId: string) => void;
  resetToAll: () => void;
  isSingleTeam: boolean;
  selectedTeamNames: string[];
}
