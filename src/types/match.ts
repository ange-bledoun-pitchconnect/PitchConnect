// ============================================================================
// 🏆 PITCHCONNECT MATCH SYSTEM TYPES v7.5.0
// Path: src/types/match.ts
// ============================================================================
// 
// Comprehensive match types aligned with Prisma schema v7.5.0
// Supports all 12 sports with sport-specific scoring and events
//
// ============================================================================

import type { Sport, Position } from './player';

// ============================================================================
// ENUMS (Re-export from Prisma or define locally)
// ============================================================================

export type MatchStatus =
  | 'SCHEDULED'
  | 'WARMUP'
  | 'LIVE'
  | 'HALFTIME'
  | 'SECOND_HALF'
  | 'EXTRA_TIME_FIRST'
  | 'EXTRA_TIME_SECOND'
  | 'PENALTIES'
  | 'FINISHED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'ABANDONED'
  | 'REPLAY_SCHEDULED'
  | 'VOIDED'
  | 'DELAYED'
  | 'SUSPENDED';

export type MatchType =
  | 'LEAGUE'
  | 'CUP'
  | 'FRIENDLY'
  | 'PLAYOFF'
  | 'TOURNAMENT'
  | 'QUALIFIER'
  | 'FINAL'
  | 'SEMI_FINAL'
  | 'QUARTER_FINAL'
  | 'GROUP_STAGE'
  | 'TRAINING_MATCH'
  | 'PRACTICE'
  | 'EXHIBITION';

export type MatchEventType =
  // Universal Events
  | 'GOAL'
  | 'OWN_GOAL'
  | 'ASSIST'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SECOND_YELLOW'
  | 'SUBSTITUTION_ON'
  | 'SUBSTITUTION_OFF'
  | 'INJURY'
  | 'INJURY_TIME'
  
  // Football/Futsal/Beach
  | 'PENALTY_SCORED'
  | 'PENALTY_MISSED'
  | 'PENALTY_SAVED'
  | 'CORNER'
  | 'FREE_KICK'
  | 'OFFSIDE'
  | 'VAR_REVIEW'
  | 'SHOT'
  | 'SHOT_ON_TARGET'
  | 'SAVE'
  | 'FOUL'
  
  // Rugby
  | 'TRY'
  | 'CONVERSION'
  | 'PENALTY_GOAL'
  | 'DROP_GOAL'
  | 'PENALTY_TRY'
  | 'SIN_BIN'
  | 'SCRUM'
  | 'LINEOUT'
  | 'KNOCK_ON'
  | 'FORWARD_PASS'
  
  // Cricket
  | 'WICKET'
  | 'BOUNDARY'
  | 'SIX'
  | 'WIDE'
  | 'NO_BALL'
  | 'RUN_OUT'
  | 'CAUGHT'
  | 'BOWLED'
  | 'LBW'
  | 'STUMPED'
  
  // American Football
  | 'TOUCHDOWN'
  | 'EXTRA_POINT'
  | 'TWO_POINT_CONVERSION'
  | 'FIELD_GOAL'
  | 'SAFETY'
  | 'INTERCEPTION'
  | 'FUMBLE'
  | 'SACK'
  
  // Basketball
  | 'THREE_POINTER'
  | 'FREE_THROW'
  | 'DUNK'
  | 'REBOUND'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'TECHNICAL_FOUL'
  
  // Hockey
  | 'POWER_PLAY_GOAL'
  | 'SHORTHANDED_GOAL'
  | 'EMPTY_NET_GOAL'
  | 'PENALTY_MINOR'
  | 'PENALTY_MAJOR'
  | 'FACEOFF_WIN'
  
  // Generic
  | 'PERIOD_START'
  | 'PERIOD_END'
  | 'TIMEOUT'
  | 'CHALLENGE'
  | 'OTHER';

export type MatchAttendanceStatus =
  | 'CONFIRMED'
  | 'DECLINED'
  | 'MAYBE'
  | 'NOT_RESPONDED'
  | 'STARTING'
  | 'SUBSTITUTE'
  | 'NOT_IN_SQUAD'
  | 'INJURED'
  | 'SUSPENDED'
  | 'UNAVAILABLE';

export type CompetitionStage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL'
  | 'PLAYOFF'
  | 'RELEGATION'
  | 'PROMOTION';

export type ResultApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DISPUTED'
  | 'REJECTED'
  | 'AUTO_APPROVED';

export type FormationType = string; // Sport-specific formations

// ============================================================================
// CORE MATCH TYPE
// ============================================================================

export interface Match {
  id: string;
  
  // Sport Context
  sport: Sport;
  
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
  
  // Multi-sport score breakdown (JSON)
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
// SCORE BREAKDOWN TYPES (MULTI-SPORT)
// ============================================================================

export type ScoreBreakdown = 
  | FootballScoreBreakdown
  | RugbyScoreBreakdown
  | BasketballScoreBreakdown
  | CricketScoreBreakdown
  | AmericanFootballScoreBreakdown
  | HockeyScoreBreakdown
  | NetballScoreBreakdown
  | AustralianRulesScoreBreakdown
  | GaelicFootballScoreBreakdown
  | LacrosseScoreBreakdown
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
  penaltyTries?: number;
}

export interface BasketballScoreBreakdown {
  fieldGoals: number;      // 2-pointers
  threePointers: number;
  freeThrows: number;
}

export interface CricketScoreBreakdown {
  runs: number;
  wickets: number;
  overs: number;
  balls?: number;
  extras?: number;
  boundaries?: number;
  sixes?: number;
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

export interface AustralianRulesScoreBreakdown {
  goals: number;       // 6 points each
  behinds: number;     // 1 point each
}

export interface GaelicFootballScoreBreakdown {
  goals: number;       // 3 points each
  points: number;      // 1 point each
}

export interface LacrosseScoreBreakdown {
  goals: number;
  twoPointGoals?: number;
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
  secondaryMinute: number | null;    // For added time (e.g., 45+2)
  period: string | null;             // "1st Half", "2nd Quarter", etc.
  
  teamSide: 'home' | 'away' | null;
  
  // Related players
  relatedPlayerId: string | null;    // Fouled player, etc.
  assistPlayerId: string | null;
  relatedPlayer?: Player | null;
  assistPlayer?: Player | null;
  
  // Event details
  goalType: string | null;           // "Open Play", "Penalty", "Free Kick", etc.
  cardReason: string | null;
  injuryType: string | null;
  
  // Position on field
  xPosition: number | null;          // 0-100 percentage
  yPosition: number | null;          // 0-100 percentage
  
  // Additional data
  details: Record<string, unknown> | null;
  videoTimestamp: number | null;     // Seconds into video
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
  
  lineupPosition: number | null;     // 1-11 for starting, null for subs
  jerseyNumber: number | null;       // ✅ FIXED: was shirtNumber
  position: Position | null;
  
  status: MatchAttendanceStatus;
  isCaptain: boolean;
  substituteOrder: number | null;    // Order on bench
  
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
// PLAYER MATCH PERFORMANCE
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
  
  // Basic stats (universal)
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
  
  // Ratings
  rating: number | null;           // 1-10
  coachRating: number | null;
  manOfTheMatch: boolean;
  
  // Sport-specific stats (JSON)
  sportSpecificStats: Record<string, unknown> | null;
  
  // Notes
  coachNotes: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MATCH OFFICIALS
// ============================================================================

export interface MatchOfficial {
  id: string;
  matchId: string;
  userId: string | null;
  user?: User | null;
  
  role: OfficialRole;
  name: string;
  
  createdAt: string;
  updatedAt: string;
}

export type OfficialRole =
  | 'REFEREE'
  | 'ASSISTANT_REFEREE_1'
  | 'ASSISTANT_REFEREE_2'
  | 'FOURTH_OFFICIAL'
  | 'VAR'
  | 'AVAR'
  | 'GOAL_LINE_OFFICIAL'
  | 'TMO'                    // Television Match Official (Rugby)
  | 'MATCH_COMMISSIONER'
  | 'TIMEKEEPER'
  | 'SCORER';

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface MatchFilters {
  sport?: Sport | Sport[];
  competitionId?: string;
  clubId?: string;
  teamId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  status?: MatchStatus | MatchStatus[];
  matchType?: MatchType | MatchType[];
  stage?: CompetitionStage | CompetitionStage[];
  venueId?: string;
  refereeId?: string;
  
  // Date filters
  startDate?: string | Date;
  endDate?: string | Date;
  
  // Feature flags
  isHighlighted?: boolean;
  isFeatured?: boolean;
  
  // Search
  search?: string;
}

// ============================================================================
// LIVE MATCH TYPES
// ============================================================================

export interface LiveMatchUpdate {
  matchId: string;
  timestamp: string;
  type: 'status' | 'score' | 'event' | 'minute' | 'lineup';
  data: {
    status?: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    event?: MatchEvent;
    minute?: number;
    injuryTime?: number;
    period?: string;
  };
}

export interface LiveMatchTimeline {
  matchId: string;
  events: TimelineEntry[];
}

export interface TimelineEntry {
  id: string;
  type: 'event' | 'comment' | 'period';
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
  role: string | null;
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
    hasMore: boolean;
  };
  filters: MatchFilters;
}

export interface MatchDetailResponse {
  match: Match;
  permissions: MatchPermissions;
  relatedMatches?: Match[];
}

// ============================================================================
// REFERENCE TYPES (Minimal for relationships)
// ============================================================================

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface Team {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  clubId: string;
}

interface Club {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  sport: Sport;
}

interface Player {
  id: string;
  userId: string;
  user?: User;
  primaryPosition?: string | null;
  jerseyNumber?: number | null;  // ✅ FIXED
}

interface Coach {
  id: string;
  userId: string;
  user?: User;
}

interface Competition {
  id: string;
  name: string;
  slug?: string;
  type: string;
}

interface Venue {
  id: string;
  name: string;
  address?: string | null;
  capacity?: number | null;
}

interface Facility {
  id: string;
  name: string;
}

// ============================================================================
// STATUS CONFIGURATIONS
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

// ============================================================================
// STATUS GROUPINGS
// ============================================================================

export const LIVE_STATUSES: MatchStatus[] = [
  'WARMUP',
  'LIVE',
  'HALFTIME',
  'SECOND_HALF',
  'EXTRA_TIME_FIRST',
  'EXTRA_TIME_SECOND',
  'PENALTIES',
];

export const FINISHED_STATUSES: MatchStatus[] = [
  'FINISHED',
];

export const PENDING_STATUSES: MatchStatus[] = [
  'SCHEDULED',
  'POSTPONED',
  'DELAYED',
  'REPLAY_SCHEDULED',
];

export const CANCELLED_STATUSES: MatchStatus[] = [
  'CANCELLED',
  'ABANDONED',
  'VOIDED',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if match is currently live
 */
export function isMatchLive(status: MatchStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

/**
 * Check if match is finished
 */
export function isMatchFinished(status: MatchStatus): boolean {
  return FINISHED_STATUSES.includes(status);
}

/**
 * Check if match is pending (not started)
 */
export function isMatchPending(status: MatchStatus): boolean {
  return PENDING_STATUSES.includes(status);
}

/**
 * Get score display string based on sport
 */
export function formatMatchScore(
  sport: Sport,
  homeScore: number | null,
  awayScore: number | null,
  homeBreakdown?: ScoreBreakdown | null,
  awayBreakdown?: ScoreBreakdown | null
): string {
  if (homeScore === null || awayScore === null) {
    return 'vs';
  }
  
  // For Gaelic Football: show as "1-5" format (goals-points)
  if (sport === 'GAELIC_FOOTBALL' && homeBreakdown && awayBreakdown) {
    const hb = homeBreakdown as GaelicFootballScoreBreakdown;
    const ab = awayBreakdown as GaelicFootballScoreBreakdown;
    return `${hb.goals || 0}-${hb.points || 0} : ${ab.goals || 0}-${ab.points || 0}`;
  }
  
  // For Australian Rules: show as "2.5" format (goals.behinds)
  if (sport === 'AUSTRALIAN_RULES' && homeBreakdown && awayBreakdown) {
    const hb = homeBreakdown as AustralianRulesScoreBreakdown;
    const ab = awayBreakdown as AustralianRulesScoreBreakdown;
    return `${hb.goals || 0}.${hb.behinds || 0} : ${ab.goals || 0}.${ab.behinds || 0}`;
  }
  
  // Standard format
  return `${homeScore} - ${awayScore}`;
}

/**
 * Get match result for a team
 */
export function getMatchResult(
  teamSide: 'home' | 'away',
  homeScore: number | null,
  awayScore: number | null
): 'win' | 'draw' | 'loss' | null {
  if (homeScore === null || awayScore === null) return null;
  
  if (homeScore === awayScore) return 'draw';
  
  if (teamSide === 'home') {
    return homeScore > awayScore ? 'win' : 'loss';
  } else {
    return awayScore > homeScore ? 'win' : 'loss';
  }
}