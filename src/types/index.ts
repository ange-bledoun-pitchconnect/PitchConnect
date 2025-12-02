// ============================================================================
// PitchConnect Type Definitions - Comprehensive SaaS Football League Management
// ============================================================================

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN' | 'SUPER_ADMIN' | 'REFEREE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roles: UserRole[];
  status: UserStatus;
  isSuperAdmin: boolean;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  
  // Account metadata
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relationships
  subscription?: Subscription;
}

export interface UserSession {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

export interface UserProfile extends User {
  stats?: UserStats;
  preferences?: UserPreferences;
}

export interface UserStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsAgainst: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
}

export interface UserPreferences {
  userId: string;
  preferredPosition?: string;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  language: 'EN' | 'FR' | 'ES' | 'DE';
  timezone: string;
  notificationEmail: boolean;
  notificationSMS: boolean;
  notificationPush: boolean;
  darkMode: boolean;
}

// ============================================================================
// CLUB TYPES
// ============================================================================

export type ClubTier = 'AMATEUR' | 'SEMI_PROFESSIONAL' | 'PROFESSIONAL';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  managerId: string;
  manager?: User;
  tier: ClubTier;
  foundedYear?: number;
  city: string;
  country: string;
  stadium?: string;
  capacity?: number;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  
  // Status & metadata
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  verified: boolean;
  createdAt: string;
  updatedAt: string;

  // Statistics
  stats?: ClubStats;
  trophies?: number;
}

export interface ClubStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  averageAttendance?: number;
}

// ============================================================================
// LEAGUE TYPES
// ============================================================================

export type LeagueFormat = 'ROUND_ROBIN' | 'KNOCKOUT' | 'GROUP_STAGE' | 'SWISS';

export type LeagueStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export interface League {
  id: string;
  name: string;
  description?: string;
  createdByUserId: string;
  createdByUser?: User;
  season: number;
  format: LeagueFormat;
  status: LeagueStatus;
  country?: string;
  region?: string;
  tier: ClubTier;
  
  // Configuration
  maxTeams?: number;
  minTeams?: number;
  pointsWin: number; // Typically 3
  pointsDraw: number; // Typically 1
  pointsLoss: number; // Typically 0
  
  // Dates
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;

  // Relationships
  teams?: Club[];
  standings?: Standing[];
  fixtures?: Fixture[];
}

export interface Standing {
  leagueId: string;
  clubId: string;
  club?: Club;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  streak?: 'W' | 'D' | 'L'; // Last result
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

export type PlayerPosition = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' | 'WINGER';

export interface Player {
  id: string;
  userId: string;
  user?: User;
  clubId: string;
  club?: Club;
  jerseyNumber?: number;
  position: PlayerPosition;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  height?: number; // cm
  weight?: number; // kg
  marketValue?: number;
  
  // Player status
  status: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'LOANED_OUT' | 'RETIRED';
  joinedDate: string;
  contractExpiry?: string;
  
  // Statistics
  stats?: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  playerId: string;
  season: number;
  totalMatches: number;
  matches: number;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minPlayed: number;
  averageRating: number;
}

// ============================================================================
// MATCH/FIXTURE TYPES
// ============================================================================

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';

export interface Fixture {
  id: string;
  leagueId: string;
  league?: League;
  homeClubId: string;
  homeClub?: Club;
  awayClubId: string;
  awayClub?: Club;
  round: number;
  scheduledDate: string;
  kickoffTime?: string;
  status: MatchStatus;
  
  // Venue
  venue?: string;
  attendance?: number;
  referee?: string;
  refereeId?: string;

  // Result
  result?: MatchResult;
  
  // Events
  events?: MatchEvent[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  homeXG?: number; // Expected Goals
  awayXG?: number;
  possession?: { home: number; away: number }; // Percentage
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  cornerKicks?: { home: number; away: number };
  fouls?: { home: number; away: number };
  completedAt?: string;
}

export type MatchEventType = 'GOAL' | 'OWN_GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'INJURY_TIME' | 'PENALTY' | 'MISSED_PENALTY';

export interface MatchEvent {
  id: string;
  fixtureId: string;
  type: MatchEventType;
  minute: number;
  team: 'HOME' | 'AWAY';
  playerId?: string;
  player?: Player;
  assistPlayerId?: string;
  assistPlayer?: Player;
  description?: string;
  createdAt: string;
}

// ============================================================================
// SUBSCRIPTION & BILLING TYPES
// ============================================================================

export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'CANCELED' | 'EXPIRED' | 'SUSPENDED';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

export interface Subscription {
  id: string;
  userId: string;
  user?: User;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  amount: number;
  currency: string;
  
  // Dates
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  renewalDate?: string;
  cancelledAt?: string;
  
  // Features
  maxTeams: number;
  maxPlayers: number;
  maxLeagues: number;
  analyticsAccess: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  
  // Billing
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  subscription?: Subscription;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER';
  transactionId?: string;
  invoice?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DOCUMENT & RECORD TYPES
// ============================================================================

export type DocumentType = 'CONTRACT' | 'AGREEMENT' | 'INVOICE' | 'RECEIPT' | 'CERTIFICATE' | 'OTHER';

export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  
  // Ownership & relationships
  createdByUserId: string;
  createdByUser?: User;
  clubId?: string;
  club?: Club;
  playerId?: string;
  player?: Player;
  
  // Status
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  expiryDate?: string;
  
  // Metadata
  uploadedAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  user?: User;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'MATCH_REMINDER' | 'RESULT_UPDATE' | 'TEAM_INVITE' | 'SYSTEM' | 'PROMOTION' | 'ACCOUNT';

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================================================
// ROLE UPGRADE REQUEST TYPES
// ============================================================================

export interface RoleUpgradeRequest {
  id: string;
  userId: string;
  user?: User;
  currentRole: UserRole;
  requestedRole: UserRole;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedByUser?: User;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================

export interface TeamStats {
  teamId: string;
  season: number;
  totalMatches: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  possession: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
}

export interface AnalyticsData {
  period: string;
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  possession: number;
  shotsOnTarget: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface TrainingAnalytics {
  teamId: string;
  sessionCount: number;
  averageAttendance: number;
  totalHours: number;
  drillsCompleted: number;
  playerFeedback: number;
  period: string;
}

export interface MatchEventStats {
  eventType: MatchEventType;
  totalCount: number;
  byPlayer: Record<string, number>;
  timeline: { minute: number; count: number }[];
}

export interface PlayerPerformance {
  playerId: string;
  matches: number;
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
  shots: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  rating: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { id: string; error: string }[];
  startTime: string;
  endTime: string;
  duration: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalClubs: number;
  totalLeagues: number;
  totalMatches: number;
  revenueThisMonth: number;
  subscriptionMetrics: {
    activeSubscriptions: number;
    trialUsers: number;
    churnRate: number;
  };
  systemHealth: {
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  period: {
    start: string;
    end: string;
  };
  generated: string;
}

export interface StandingsResponse {
  leagueId: string;
  leagueName: string;
  standings: Standing[];
  lastUpdated: string;
}

export interface LeagueStatistics {
  leagueId: string;
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  totalAttendance: number;
  averageAttendance: number;
  topScorer?: {
    playerId: string;
    name: string;
    goals: number;
  };
  mostAssists?: {
    playerId: string;
    name: string;
    assists: number;
  };
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchQuery {
  q: string;
  type: 'CLUB' | 'PLAYER' | 'LEAGUE' | 'USER' | 'ALL';
  limit?: number;
}

// ============================================================================
// EXPORT TYPES FOR RE-EXPORTING COMMON TYPES
// ============================================================================

// Union types for easier use
export type UserOrPlayer = User | Player;
export type LeagueOrClub = League | Club;
export type FixtureOrMatch = Fixture;

// Status types
export type EntityStatus = UserStatus | LeagueStatus | MatchStatus | SubscriptionStatus;
