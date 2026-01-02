// ============================================================================
// 🏋️ TRAINING TYPES - PitchConnect v7.5.0
// Path: src/types/training.types.ts
// ============================================================================
//
// Aligned with Schema v7.5.0 Hybrid Training Architecture
// Supports both Club-wide and Team-specific training sessions
// Multi-sport training categories and drills
//
// ============================================================================

import type { Sport, Position } from './player';

// ============================================================================
// TRAINING ENUMS
// ============================================================================

export type TrainingIntensity =
  | 'RECOVERY'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'MAXIMUM'
  | 'COMPETITIVE';

export type TrainingStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'EXCUSED'
  | 'LATE'
  | 'LEFT_EARLY'
  | 'PARTIAL'
  | 'INJURED'
  | 'SICK'
  | 'SUSPENDED';

// ============================================================================
// SPORT-SPECIFIC TRAINING CATEGORIES
// ============================================================================

export type TrainingCategory =
  // Universal Categories
  | 'WARM_UP'
  | 'COOL_DOWN'
  | 'CONDITIONING'
  | 'STRENGTH_POWER'
  | 'SPEED_AGILITY'
  | 'FLEXIBILITY'
  | 'ENDURANCE'
  | 'RECOVERY'
  | 'VIDEO_ANALYSIS'
  | 'TEAM_BUILDING'
  | 'SCRIMMAGE'
  | 'MATCH_SIMULATION'
  | 'POSITION_SPECIFIC'
  
  // Football/Futsal/Beach
  | 'PASSING'
  | 'SHOOTING'
  | 'DEFENDING'
  | 'POSSESSION'
  | 'SET_PIECES'
  | 'TACTICAL'
  | 'GOALKEEPER_SPECIFIC'
  | 'PRESSING'
  
  // Rugby
  | 'SCRUM_PRACTICE'
  | 'LINEOUT_WORK'
  | 'RUCKING'
  | 'TACKLING'
  | 'CONTACT_SKILLS'
  
  // Cricket
  | 'NET_PRACTICE'
  | 'BATTING_DRILLS'
  | 'BOWLING_PRACTICE'
  | 'FIELDING_DRILLS'
  | 'WICKET_KEEPING'
  
  // Basketball
  | 'SHOOTING_DRILLS'
  | 'BALL_HANDLING'
  | 'PICK_AND_ROLL'
  | 'ZONE_DEFENSE'
  | 'FREE_THROWS'
  
  // American Football
  | 'ROUTE_RUNNING'
  | 'BLOCKING'
  | 'PASS_RUSH'
  | 'SPECIAL_TEAMS'
  
  // Hockey
  | 'SKATING'
  | 'STICKHANDLING'
  | 'POWER_PLAY'
  | 'PENALTY_KILL'
  
  // Netball
  | 'SHOOTING_NETBALL'
  | 'MOVEMENT_PATTERNS'
  | 'CENTER_PASSES'
  
  // Lacrosse
  | 'STICK_SKILLS'
  | 'GROUND_BALLS'
  | 'FACE_OFF_LAX'
  
  // Australian Rules
  | 'KICKING_AFL'
  | 'MARKING'
  | 'RUCK_WORK'
  
  // Gaelic Football
  | 'KICKING_GAA'
  | 'HAND_PASSING'
  
  // Custom
  | 'OTHER';

// ============================================================================
// SPORT-SPECIFIC CATEGORY MAPPINGS
// ============================================================================

export const TRAINING_CATEGORIES_BY_SPORT: Record<Sport, TrainingCategory[]> = {
  FOOTBALL: [
    'WARM_UP', 'COOL_DOWN', 'PASSING', 'SHOOTING', 'DEFENDING', 'POSSESSION',
    'SET_PIECES', 'TACTICAL', 'GOALKEEPER_SPECIFIC', 'PRESSING', 'CONDITIONING',
    'STRENGTH_POWER', 'SPEED_AGILITY', 'RECOVERY', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  NETBALL: [
    'WARM_UP', 'COOL_DOWN', 'SHOOTING_NETBALL', 'MOVEMENT_PATTERNS', 'CENTER_PASSES',
    'CONDITIONING', 'SPEED_AGILITY', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  RUGBY: [
    'WARM_UP', 'COOL_DOWN', 'SCRUM_PRACTICE', 'LINEOUT_WORK', 'RUCKING', 'TACKLING',
    'CONTACT_SKILLS', 'CONDITIONING', 'STRENGTH_POWER', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  CRICKET: [
    'WARM_UP', 'COOL_DOWN', 'NET_PRACTICE', 'BATTING_DRILLS', 'BOWLING_PRACTICE',
    'FIELDING_DRILLS', 'WICKET_KEEPING', 'CONDITIONING', 'VIDEO_ANALYSIS',
  ],
  AMERICAN_FOOTBALL: [
    'WARM_UP', 'COOL_DOWN', 'ROUTE_RUNNING', 'BLOCKING', 'PASS_RUSH', 'TACKLING',
    'SPECIAL_TEAMS', 'CONDITIONING', 'STRENGTH_POWER', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  BASKETBALL: [
    'WARM_UP', 'COOL_DOWN', 'SHOOTING_DRILLS', 'BALL_HANDLING', 'PICK_AND_ROLL',
    'ZONE_DEFENSE', 'FREE_THROWS', 'CONDITIONING', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  HOCKEY: [
    'WARM_UP', 'COOL_DOWN', 'SKATING', 'STICKHANDLING', 'POWER_PLAY', 'PENALTY_KILL',
    'SHOOTING', 'CONDITIONING', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  LACROSSE: [
    'WARM_UP', 'COOL_DOWN', 'STICK_SKILLS', 'GROUND_BALLS', 'FACE_OFF_LAX',
    'SHOOTING', 'DEFENDING', 'CONDITIONING', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  AUSTRALIAN_RULES: [
    'WARM_UP', 'COOL_DOWN', 'KICKING_AFL', 'MARKING', 'RUCK_WORK', 'TACKLING',
    'CONDITIONING', 'ENDURANCE', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  GAELIC_FOOTBALL: [
    'WARM_UP', 'COOL_DOWN', 'KICKING_GAA', 'HAND_PASSING', 'TACKLING',
    'CONDITIONING', 'ENDURANCE', 'SCRIMMAGE', 'VIDEO_ANALYSIS',
  ],
  FUTSAL: [
    'WARM_UP', 'COOL_DOWN', 'PASSING', 'SHOOTING', 'DEFENDING', 'POSSESSION',
    'SET_PIECES', 'TACTICAL', 'GOALKEEPER_SPECIFIC', 'PRESSING', 'SCRIMMAGE',
  ],
  BEACH_FOOTBALL: [
    'WARM_UP', 'COOL_DOWN', 'PASSING', 'SHOOTING', 'DEFENDING',
    'GOALKEEPER_SPECIFIC', 'CONDITIONING', 'SCRIMMAGE',
  ],
};

// ============================================================================
// TRAINING SESSION TYPES
// ============================================================================

export interface TrainingSessionWithRelations {
  id: string;
  sport: Sport;
  clubId: string;
  club: { id: string; name: string; slug: string; logo?: string | null; sport: Sport };
  teamId: string | null;
  team: { id: string; name: string; slug?: string; logo?: string | null } | null;
  coachId: string;
  coach: CoachWithUser;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  intensity: TrainingIntensity;
  category: TrainingCategory;
  customCategory: string | null;
  location: string | null;
  facilityId: string | null;
  maxParticipants: number | null;
  drills: TrainingDrill[] | null;
  notes: string | null;
  equipment: string[];
  focusAreas: string[];
  status: TrainingStatus;
  attendance: TrainingAttendanceWithPlayer[];
  media?: TrainingMedia[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSessionListItem {
  id: string;
  sport: Sport;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  intensity: TrainingIntensity;
  category: TrainingCategory;
  customCategory: string | null;
  location: string | null;
  status: TrainingStatus;
  coach: { id: string; user: { firstName: string; lastName: string; avatar: string | null } };
  team: { id: string; name: string } | null;
  _count: { attendance: number };
}

export interface CoachWithUser {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; avatar: string | null; email: string };
}

export interface TrainingAttendanceWithPlayer {
  id: string;
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  arrivalTime: Date | null;
  departTime: Date | null;
  notes: string | null;
  performanceRating: number | null;
  effortRating: number | null;
  coachNotes: string | null;
  player: {
    id: string;
    user: { id: string; firstName: string; lastName: string; avatar: string | null };
    primaryPosition: string | null;
    jerseyNumber: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingMedia {
  id: string;
  title: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
}

// ============================================================================
// CREATE/UPDATE TYPES
// ============================================================================

export interface CreateTrainingSessionInput {
  clubId: string;
  sport: Sport;
  coachId: string;
  teamId?: string | null;
  name: string;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  intensity?: TrainingIntensity;
  category: TrainingCategory;
  customCategory?: string | null;
  location?: string | null;
  facilityId?: string | null;
  maxParticipants?: number | null;
  drills?: TrainingDrill[] | null;
  notes?: string | null;
  equipment?: string[];
  focusAreas?: string[];
  status?: TrainingStatus;
}

export interface UpdateTrainingSessionInput {
  name?: string;
  description?: string | null;
  startTime?: Date | string;
  endTime?: Date | string;
  intensity?: TrainingIntensity;
  category?: TrainingCategory;
  customCategory?: string | null;
  location?: string | null;
  facilityId?: string | null;
  maxParticipants?: number | null;
  drills?: TrainingDrill[] | null;
  notes?: string | null;
  equipment?: string[];
  focusAreas?: string[];
  status?: TrainingStatus;
  teamId?: string | null;
}

export interface TrainingDrill {
  id: string;
  name: string;
  description?: string;
  duration: number;
  intensity: TrainingIntensity;
  category?: TrainingCategory;
  equipment?: string[];
  diagram?: string;
  videoUrl?: string;
  order: number;
  sport?: Sport;
  positions?: Position[];
  playerCount?: number;
  setup?: string;
  execution?: string[];
  coachingPoints?: string[];
  progressions?: string[];
  variations?: string[];
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

export interface RecordAttendanceInput {
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  arrivalTime?: Date | string | null;
  departTime?: Date | string | null;
  notes?: string | null;
  performanceRating?: number | null;
  effortRating?: number | null;
  coachNotes?: string | null;
}

export interface BulkAttendanceInput {
  sessionId: string;
  attendance: Array<{ playerId: string; status: AttendanceStatus; notes?: string | null }>;
}

export interface AttendanceSummary {
  sessionId: string;
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  injured: number;
  attendanceRate: number;
}

export interface PlayerAttendanceRecord {
  playerId: string;
  playerName: string;
  totalSessions: number;
  attended: number;
  missed: number;
  attendanceRate: number;
  lastAttended: Date | null;
}

// ============================================================================
// FILTER & ANALYTICS TYPES
// ============================================================================

export interface TrainingSessionFilters {
  clubId?: string;
  teamId?: string | null;
  coachId?: string;
  sport?: Sport | Sport[];
  status?: TrainingStatus | TrainingStatus[];
  category?: TrainingCategory | TrainingCategory[];
  intensity?: TrainingIntensity | TrainingIntensity[];
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrainingAnalytics {
  period: { start: Date; end: Date };
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageAttendanceRate: number;
  byCategory: CategoryBreakdown[];
  byIntensity: IntensityBreakdown[];
  byCoach: CoachBreakdown[];
  byTeam: TeamBreakdown[];
  trends: { attendanceOverTime: TimeSeriesData[]; sessionsOverTime: TimeSeriesData[] };
}

export interface CategoryBreakdown {
  category: TrainingCategory;
  count: number;
  percentage: number;
  averageAttendance: number;
}

export interface IntensityBreakdown {
  intensity: TrainingIntensity;
  count: number;
  percentage: number;
}

export interface CoachBreakdown {
  coachId: string;
  coachName: string;
  sessionsLed: number;
  averageAttendance: number;
}

export interface TeamBreakdown {
  teamId: string | null;
  teamName: string | null;
  sessionCount: number;
  averageAttendance: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

// ============================================================================
// CALENDAR & TEMPLATE TYPES
// ============================================================================

export interface TrainingCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  sport: Sport;
  status: TrainingStatus;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  location?: string | null;
  coach: { id: string; name: string };
  team?: { id: string; name: string } | null;
  attendeeCount: number;
  color?: string;
}

export interface CalendarViewOptions {
  view: 'day' | 'week' | 'month';
  date: Date;
  clubId: string;
  teamId?: string | null;
  sport?: Sport;
}

export interface TrainingTemplate {
  id: string;
  clubId: string;
  sport: Sport;
  name: string;
  description?: string;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  durationMinutes: number;
  drills: TrainingDrill[];
  equipment: string[];
  focusAreas: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface CreateFromTemplateInput {
  templateId: string;
  clubId: string;
  teamId?: string | null;
  coachId: string;
  startTime: Date | string;
  location?: string;
  facilityId?: string;
}

// ============================================================================
// RECURRING TRAINING TYPES
// ============================================================================

export interface RecurringTrainingSchedule {
  id: string;
  clubId: string;
  teamId?: string | null;
  coachId: string;
  sport: Sport;
  name: string;
  category: TrainingCategory;
  intensity: TrainingIntensity;
  durationMinutes: number;
  location?: string;
  recurrence: RecurrenceRule;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  exceptions: Date[];
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  time: string;
  count?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CreateTrainingSessionResponse {
  session: TrainingSessionWithRelations;
  conflictWarnings?: ConflictWarning[];
}

export interface ConflictWarning {
  type: 'facility' | 'coach' | 'team' | 'player';
  message: string;
  conflictingSessionId?: string;
  severity: 'info' | 'warning' | 'error';
}

export interface TrainingNotificationPayload {
  type: 'training_scheduled' | 'training_updated' | 'training_cancelled' | 'training_reminder';
  sessionId: string;
  sessionName: string;
  sport: Sport;
  startTime: Date;
  changes?: string[];
  recipientIds: string[];
}

// ============================================================================
// INTENSITY CONFIGURATION
// ============================================================================

export const TRAINING_INTENSITY_CONFIG: Record<TrainingIntensity, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  RECOVERY: { label: 'Recovery', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '💆', description: 'Light activity for recovery' },
  LOW: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-100', icon: '🚶', description: 'Easy pace' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: '🏃', description: 'Moderate effort' },
  HIGH: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '🏃‍♂️', description: 'High effort' },
  MAXIMUM: { label: 'Maximum', color: 'text-red-700', bgColor: 'bg-red-100', icon: '🔥', description: 'All-out effort' },
  COMPETITIVE: { label: 'Competitive', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '🏆', description: 'Match-like intensity' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCategoriesForSport(sport: Sport): TrainingCategory[] {
  return TRAINING_CATEGORIES_BY_SPORT[sport] || [];
}

export function isValidCategoryForSport(category: TrainingCategory, sport: Sport): boolean {
  return TRAINING_CATEGORIES_BY_SPORT[sport]?.includes(category) || false;
}

export function formatCategory(category: TrainingCategory): string {
  return category.replace(/_/g, ' ').replace(/NETBALL|RUGBY|AFL|GAA|LAX|CRICKET/g, '').trim()
    .split(' ').filter(Boolean).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

export function getSessionDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}