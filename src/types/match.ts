// ============================================================================
// 🏆 PITCHCONNECT MATCH SYSTEM TYPES v7.4.0
// ============================================================================
// Aligned with Prisma schema v7.4.0
// ============================================================================

import type {
  MatchStatus,
  MatchType,
  Sport,
  Position,
  FormationType,
  MatchEventType,
  MatchAttendanceStatus,
  CompetitionStage,
  ResultApprovalStatus,
  ClubMemberRole,
} from '@prisma/client';

// ============================================================================
// CORE MATCH TYPES
// ============================================================================

export interface Match {
  id: string;
  
  // Competition (optional for standalone friendlies)
  competitionId: string | null;
  competition?: Competition | null;
  
  // Teams (required)
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  
  // Clubs (derived from teams)
  homeClubId: string;
  awayClubId: string;
  homeClub: Club;
  awayClub: Club;
  
  // Match classification
  matchType: MatchType;
  stage: CompetitionStage | null;
  groupName: string | null;
  round: number | null;
  matchday: number | null;
  leg: number | null;
  
  // Basic info
  title: string | null;
  description: string | null;
  
  // Schedule
  kickOffTime: string; // ISO date string
  endTime: string | null;
  status: MatchStatus;
  
  // Venue
  venueId: string | null;
  facilityId: string | null;
  venue: string | null;
  venueRelation?: Venue | null;
  facilityRelation?: Facility | null;
  pitch: string | null;
  
  // Weather
  weather: string | null;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  
  // Scores
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  
  // Multi-sport score breakdown
  homeScoreBreakdown: ScoreBreakdown | null;
  awayScoreBreakdown: ScoreBreakdown | null;
  
  // Formations
  homeFormation: FormationType | null;
  awayFormation: FormationType | null;
  
  // Attendance
  attendance: number | null;
  capacity: number | null;
  
  // Match timing
  actualDuration: number | null;
  injuryTimeFirst: number | null;
  injuryTimeSecond: number | null;
  
  // Result approval
  resultApprovalStatus: ResultApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  disputeReason: string | null;
  
  // Flags
  isHighlighted: boolean;
  isFeatured: boolean;
  isNeutralVenue: boolean;
  isBroadcasted: boolean;
  broadcastUrl: string | null;
  
  // Creator tracking
  createdById: string;
  createdByCoachId: string | null;
  creator?: User;
  createdByCoach?: Coach | null;
  
  // Content
  matchReport: string | null;
  notes: string | null;
  
  // Related data
  events?: MatchEvent[];
  squads?: MatchSquad[];
  playerAttendance?: MatchAttendance[];
  playerPerformances?: PlayerMatchPerformance[];
  officials?: MatchOfficial[];
  
  // Soft delete
  deletedAt: string | null;
  deletedBy: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SCORE BREAKDOWN (MULTI-SPORT)
// ============================================================================

export type ScoreBreakdown = 
  | FootballScoreBreakdown
  | RugbyScoreBreakdown
  | BasketballScoreBreakdown
  | CricketScoreBreakdown
  | AmericanFootballScoreBreakdown
  | HockeyScoreBreakdown
  | NetballScoreBreakdown
  | GenericScoreBreakdown;

export interface FootballScoreBreakdown {
  goals: number;
  penalties?: number;
  ownGoals?: number;
}

export interface RugbyScoreBreakdown {
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
}

export interface BasketballScoreBreakdown {
  twoPointers: number;
  threePointers: number;
  freeThrows: number;
}

export interface CricketScoreBreakdown {
  runs: number;
  wickets: number;
  overs: number;
  extras?: number;
}

export interface AmericanFootballScoreBreakdown {
  touchdowns: number;
  fieldGoals: number;
  safeties: number;
  extraPoints: number;
  twoPointConversions: number;
}

export interface HockeyScoreBreakdown {
  goals: number;
  powerPlayGoals?: number;
  shorthandedGoals?: number;
  emptyNetGoals?: number;
}

export interface NetballScoreBreakdown {
  goals: number;
  superShots?: number;
}

export interface GenericScoreBreakdown {
  [key: string]: number;
}

// ============================================================================
// MATCH EVENTS
// ============================================================================

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string | null;
  player?: Player | null;
  
  eventType: MatchEventType;
  minute: number;
  secondaryMinute: number | null;
  period: string | null;
  
  teamSide: 'home' | 'away' | null;
  
  relatedPlayerId: string | null;
  assistPlayerId: string | null;
  relatedPlayer?: Player | null;
  assistPlayer?: Player | null;
  
  goalType: string | null;
  cardReason: string | null;
  injuryType: string | null;
  
  xPosition: number | null;
  yPosition: number | null;
  
  details: Record<string, unknown> | null;
  videoTimestamp: number | null;
  videoUrl: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MATCH SQUAD & LINEUP
// ============================================================================

export interface MatchSquad {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  player?: Player | null;
  team?: Team;
  
  lineupPosition: number | null;
  shirtNumber: number | null;
  position: Position | null;
  
  status: MatchAttendanceStatus;
  isCaptain: boolean;
  substituteOrder: number | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface MatchAttendance {
  id: string;
  matchId: string;
  playerId: string;
  player?: Player;
  
  status: MatchAttendanceStatus;
  notesFromPlayer: string | null;
  responseDate: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PLAYER MATCH PERFORMANCE (NEW v7.4.0)
// ============================================================================

export interface PlayerMatchPerformance {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  player?: Player;
  
  // Time
  minutesPlayed: number;
  startedMatch: boolean;
  substituteOn: number | null;
  substituteOff: number | null;
  
  // Basic stats
  goals: number;
  assists: number;
  yellowCards: number;
  redCard: boolean;
  secondYellow: boolean;
  
  // Passing
  passes: number;
  passesComplete: number;
  passAccuracy: number | null;
  keyPasses: number;
  longBalls: number;
  throughBalls: number;
  crosses: number;
  crossesComplete: number;
  
  // Defending
  tackles: number;
  tacklesWon: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  
  // Attacking
  shots: number;
  shotsOnTarget: number;
  dribbles: number;
  dribblesWon: number;
  
  // Duels
  aerialsWon: number;
  aerialsLost: number;
  duelsWon: number;
  duelsLost: number;
  
  // Discipline
  fouls: number;
  fouled: number;
  
  // Goalkeeper
  saves: number;
  goalsConceded: number;
  cleanSheet: boolean;
  penaltySaves: number;
  
  // Possession
  touches: number;
  possession: number | null;
  
  // Ratings
  rating: number | null;
  coachRating: number | null;
  coachNotes: string | null;
  
  // Sport-specific
  sportSpecificStats: Record<string, unknown> | null;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MATCH OFFICIALS
// ============================================================================

export interface MatchOfficial {
  id: string;
  matchId: string;
  refereeId: string;
  referee?: Referee;
  
  role: MatchOfficialRole;
  performanceRating: number | null;
  notes: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export type MatchOfficialRole =
  | 'REFEREE'
  | 'ASSISTANT_REFEREE_1'
  | 'ASSISTANT_REFEREE_2'
  | 'FOURTH_OFFICIAL'
  | 'VAR_OFFICIAL'
  | 'AVAR_OFFICIAL'
  | 'RESERVE_ASSISTANT'
  | 'MATCH_COMMISSIONER'
  | 'REFEREE_ASSESSOR';

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface Team {
  id: string;
  clubId: string;
  club?: Club;
  name: string;
  description: string | null;
  logo: string | null;
  ageGroup: string | null;
  gender: string | null;
  status: string;
  defaultFormation: FormationType | null;
  players?: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  player?: Player;
  position: Position | null;
  jerseyNumber: number | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface Club {
  id: string;
  organisationId: string | null;
  name: string;
  slug: string;
  shortName: string | null;
  logo: string | null;
  banner: string | null;
  sport: Sport;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  country: string | null;
}

export interface Player {
  id: string;
  userId: string;
  user?: User;
  jerseyNumber: number | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  isActive: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  email: string;
}

export interface Coach {
  id: string;
  userId: string;
  user?: User;
  coachType: string;
}

export interface Referee {
  id: string;
  userId: string;
  user?: User;
  licenseNumber: string | null;
  licenseLevel: string | null;
}

export interface Venue {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  surface: string | null;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  capacity: number | null;
}

export interface Competition {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  sport: Sport;
  type: string;
  format: string;
  status: string;
  logo: string | null;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface MatchFormData {
  // Competition
  competitionId: string | null;
  matchType: MatchType;
  
  // Teams
  homeTeamId: string;
  awayTeamId: string;
  
  // Schedule
  kickOffTime: string;
  
  // Venue
  venueId: string | null;
  facilityId: string | null;
  venue: string;
  pitch: string;
  isNeutralVenue: boolean;
  
  // Competition details
  stage: CompetitionStage | null;
  groupName: string;
  round: number | null;
  matchday: number | null;
  leg: number | null;
  
  // Match info
  title: string;
  description: string;
  notes: string;
  
  // Formations
  homeFormation: FormationType | null;
  awayFormation: FormationType | null;
  
  // Broadcast
  isBroadcasted: boolean;
  broadcastUrl: string;
  
  // Flags
  isHighlighted: boolean;
  isFeatured: boolean;
}

export interface MatchResultFormData {
  homeScore: number;
  awayScore: number;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScoreBreakdown: ScoreBreakdown | null;
  awayScoreBreakdown: ScoreBreakdown | null;
  status: MatchStatus;
  attendance: number | null;
  matchReport: string;
  notes: string;
}

export interface LineupFormData {
  teamId: string;
  formation: FormationType;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
  captain: string | null;
}

export interface LineupPlayer {
  playerId: string;
  position: Position | null;
  shirtNumber: number | null;
  lineupPosition: number | null;
}

export interface MatchEventFormData {
  eventType: MatchEventType;
  minute: number;
  secondaryMinute: number | null;
  period: string;
  teamSide: 'home' | 'away';
  playerId: string | null;
  assistPlayerId: string | null;
  relatedPlayerId: string | null;
  goalType: string | null;
  cardReason: string | null;
  details: string;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface MatchFilters {
  status: MatchStatus[];
  matchType: MatchType[];
  sport: Sport[];
  teamId: string | null;
  clubId: string | null;
  competitionId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

export interface MatchSortOptions {
  field: 'kickOffTime' | 'createdAt' | 'updatedAt' | 'homeScore' | 'awayScore';
  direction: 'asc' | 'desc';
}

// ============================================================================
// REAL-TIME & LIVE MATCH TYPES
// ============================================================================

export interface LiveMatchState {
  matchId: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute: number;
  period: string;
  injuryTime: number;
  lastEvent: MatchEvent | null;
  recentEvents: MatchEvent[];
  stats: LiveMatchStats;
}

export interface LiveMatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface TeamStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  offsides: number;
  passes: number;
  passAccuracy: number;
}

export interface MatchTimelineEntry {
  id: string;
  type: 'event' | 'period' | 'status';
  minute: number;
  content: MatchEvent | string;
  teamSide: 'home' | 'away' | 'neutral';
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface MatchPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageLineup: boolean;
  canRecordEvents: boolean;
  canRecordResult: boolean;
  canApproveResult: boolean;
  canManageOfficials: boolean;
  isCreator: boolean;
  isHomeTeamStaff: boolean;
  isAwayTeamStaff: boolean;
  role: ClubMemberRole | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface MatchListResponse {
  matches: Match[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: MatchFilters;
}

export interface MatchDetailResponse {
  match: Match;
  permissions: MatchPermissions;
  relatedMatches?: Match[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MATCH_STATUS_CONFIG: Record<MatchStatus, {
  label: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  isLive: boolean;
  isFinished: boolean;
  isPending: boolean;
  icon: string;
}> = {
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/30',
    isLive: false,
    isFinished: false,
    isPending: true,
    icon: 'Calendar',
  },
  WARMUP: {
    label: 'Warm Up',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100',
    darkBgColor: 'dark:bg-amber-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Timer',
  },
  LIVE: {
    label: 'Live',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100',
    darkBgColor: 'dark:bg-red-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Radio',
  },
  HALFTIME: {
    label: 'Half Time',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Clock',
  },
  SECOND_HALF: {
    label: '2nd Half',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100',
    darkBgColor: 'dark:bg-red-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Radio',
  },
  EXTRA_TIME_FIRST: {
    label: 'Extra Time 1st',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Zap',
  },
  EXTRA_TIME_SECOND: {
    label: 'Extra Time 2nd',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Zap',
  },
  PENALTIES: {
    label: 'Penalties',
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100',
    darkBgColor: 'dark:bg-pink-900/30',
    isLive: true,
    isFinished: false,
    isPending: false,
    icon: 'Target',
  },
  FINISHED: {
    label: 'Full Time',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/30',
    isLive: false,
    isFinished: true,
    isPending: false,
    icon: 'CheckCircle',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100',
    darkBgColor: 'dark:bg-gray-800',
    isLive: false,
    isFinished: false,
    isPending: false,
    icon: 'XCircle',
  },
  POSTPONED: {
    label: 'Postponed',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100',
    darkBgColor: 'dark:bg-yellow-900/30',
    isLive: false,
    isFinished: false,
    isPending: true,
    icon: 'Clock',
  },
  ABANDONED: {
    label: 'Abandoned',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100',
    darkBgColor: 'dark:bg-red-900/30',
    isLive: false,
    isFinished: false,
    isPending: false,
    icon: 'AlertTriangle',
  },
  REPLAY_SCHEDULED: {
    label: 'Replay Scheduled',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100',
    darkBgColor: 'dark:bg-indigo-900/30',
    isLive: false,
    isFinished: false,
    isPending: true,
    icon: 'RefreshCw',
  },
  VOIDED: {
    label: 'Voided',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100',
    darkBgColor: 'dark:bg-gray-800',
    isLive: false,
    isFinished: false,
    isPending: false,
    icon: 'Slash',
  },
  DELAYED: {
    label: 'Delayed',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100',
    darkBgColor: 'dark:bg-amber-900/30',
    isLive: false,
    isFinished: false,
    isPending: true,
    icon: 'Clock',
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/30',
    isLive: false,
    isFinished: false,
    isPending: false,
    icon: 'Pause',
  },
};

export const MATCH_TYPE_CONFIG: Record<MatchType, {
  label: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  icon: string;
}> = {
  LEAGUE: {
    label: 'League',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/30',
    icon: 'Trophy',
  },
  CUP: {
    label: 'Cup',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/30',
    icon: 'Award',
  },
  FRIENDLY: {
    label: 'Friendly',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/30',
    icon: 'Users',
  },
  PLAYOFF: {
    label: 'Playoff',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/30',
    icon: 'Flame',
  },
  TOURNAMENT: {
    label: 'Tournament',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgColor: 'bg-indigo-100',
    darkBgColor: 'dark:bg-indigo-900/30',
    icon: 'Flag',
  },
  QUALIFIER: {
    label: 'Qualifier',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100',
    darkBgColor: 'dark:bg-teal-900/30',
    icon: 'Filter',
  },
  FINAL: {
    label: 'Final',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100',
    darkBgColor: 'dark:bg-yellow-900/30',
    icon: 'Crown',
  },
  SEMI_FINAL: {
    label: 'Semi-Final',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100',
    darkBgColor: 'dark:bg-amber-900/30',
    icon: 'Swords',
  },
  QUARTER_FINAL: {
    label: 'Quarter-Final',
    color: 'text-lime-700 dark:text-lime-300',
    bgColor: 'bg-lime-100',
    darkBgColor: 'dark:bg-lime-900/30',
    icon: 'Swords',
  },
  GROUP_STAGE: {
    label: 'Group Stage',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100',
    darkBgColor: 'dark:bg-cyan-900/30',
    icon: 'Grid',
  },
  TRAINING_MATCH: {
    label: 'Training Match',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100',
    darkBgColor: 'dark:bg-gray-800',
    icon: 'Dumbbell',
  },
  PRACTICE: {
    label: 'Practice',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100',
    darkBgColor: 'dark:bg-slate-800',
    icon: 'Target',
  },
  EXHIBITION: {
    label: 'Exhibition',
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100',
    darkBgColor: 'dark:bg-pink-900/30',
    icon: 'Star',
  },
};

export const LIVE_STATUSES: MatchStatus[] = [
  'WARMUP',
  'LIVE',
  'HALFTIME',
  'SECOND_HALF',
  'EXTRA_TIME_FIRST',
  'EXTRA_TIME_SECOND',
  'PENALTIES',
];

export const FINISHED_STATUSES: MatchStatus[] = ['FINISHED'];

export const PENDING_STATUSES: MatchStatus[] = [
  'SCHEDULED',
  'POSTPONED',
  'DELAYED',
  'REPLAY_SCHEDULED',
];
