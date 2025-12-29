// ============================================================================
// 🏋️ TRAINING TYPES - PitchConnect v7.3.0
// ============================================================================
// Aligned with Schema v7.3.0 Hybrid Training Architecture
// Supports both Club-wide and Team-specific training sessions
// ============================================================================

import type {
  TrainingSession,
  TrainingAttendance,
  TrainingIntensity,
  TrainingCategory,
  TrainingStatus,
  AttendanceStatus,
  Player,
  Coach,
  Club,
  Team,
  User,
} from '@prisma/client';

// ============================================================================
// BASE TYPES
// ============================================================================

export type { TrainingIntensity, TrainingCategory, TrainingStatus, AttendanceStatus };

// ============================================================================
// TRAINING SESSION TYPES
// ============================================================================

/**
 * Training session with all relations
 */
export interface TrainingSessionWithRelations extends TrainingSession {
  club: Club;
  team?: Team | null;
  coach: CoachWithUser;
  attendance: TrainingAttendanceWithPlayer[];
  media?: TrainingMedia[];
}

/**
 * Training session for list views (minimal relations)
 */
export interface TrainingSessionListItem extends TrainingSession {
  coach: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
  team?: {
    id: string;
    name: string;
  } | null;
  _count: {
    attendance: number;
  };
}

/**
 * Coach with user info
 */
export interface CoachWithUser extends Coach {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'email'>;
}

/**
 * Training attendance with player details
 */
export interface TrainingAttendanceWithPlayer extends TrainingAttendance {
  player: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    primaryPosition: string | null;
    jerseyNumber: number | null;
  };
}

/**
 * Media attached to training
 */
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

/**
 * Data for creating a new training session
 */
export interface CreateTrainingSessionInput {
  clubId: string;
  teamId?: string | null; // Optional for team-specific training
  coachId: string;
  name: string;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  intensity?: TrainingIntensity;
  category: TrainingCategory;
  customCategory?: string | null; // For sport-specific categories
  location?: string | null;
  facilityId?: string | null;
  maxParticipants?: number | null;
  drills?: TrainingDrill[] | null;
  notes?: string | null;
  equipment?: string[];
  focusAreas?: string[];
  status?: TrainingStatus;
}

/**
 * Data for updating an existing training session
 */
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
  teamId?: string | null; // Can change from club-wide to team-specific
}

/**
 * Training drill structure
 */
export interface TrainingDrill {
  id: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  intensity: TrainingIntensity;
  equipment?: string[];
  diagram?: string; // URL to diagram image
  videoUrl?: string;
  order: number;
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

/**
 * Record attendance for a player
 */
export interface RecordAttendanceInput {
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  arrivalTime?: Date | string | null;
  departTime?: Date | string | null;
  notes?: string | null;
  injuryId?: string | null; // Reference to injury if status is INJURED
  performanceRating?: number | null;
  effortRating?: number | null;
  coachNotes?: string | null;
  customMetrics?: Record<string, unknown> | null;
}

/**
 * Bulk attendance update
 */
export interface BulkAttendanceInput {
  sessionId: string;
  attendance: Array<{
    playerId: string;
    status: AttendanceStatus;
    notes?: string | null;
  }>;
}

/**
 * Attendance summary for a session
 */
export interface AttendanceSummary {
  sessionId: string;
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  injured: number;
  sick: number;
  suspended: number;
  attendanceRate: number;
}

/**
 * Player attendance record with history
 */
export interface PlayerAttendanceRecord {
  playerId: string;
  playerName: string;
  totalSessions: number;
  attended: number;
  missed: number;
  excused: number;
  injured: number;
  attendanceRate: number;
  lastAttended: Date | null;
  streak: number; // consecutive sessions attended
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filters for querying training sessions
 */
export interface TrainingSessionFilters {
  clubId?: string;
  teamId?: string | null; // null = club-wide only, undefined = all
  coachId?: string;
  status?: TrainingStatus | TrainingStatus[];
  category?: TrainingCategory | TrainingCategory[];
  intensity?: TrainingIntensity | TrainingIntensity[];
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  facilityId?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Training session analytics
 */
export interface TrainingAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalAttendees: number;
  averageAttendance: number;
  averageAttendanceRate: number;
  byCategory: CategoryBreakdown[];
  byIntensity: IntensityBreakdown[];
  byCoach: CoachBreakdown[];
  byTeam: TeamBreakdown[];
  trends: {
    attendanceOverTime: TimeSeriesData[];
    sessionsOverTime: TimeSeriesData[];
  };
}

export interface CategoryBreakdown {
  category: TrainingCategory;
  customCategory?: string;
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
  averageRating: number | null;
}

export interface TeamBreakdown {
  teamId: string | null;
  teamName: string | null; // null = club-wide
  sessionCount: number;
  averageAttendance: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

/**
 * Training calendar event
 */
export interface TrainingCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: TrainingStatus;
  category: TrainingCategory;
  customCategory?: string | null;
  intensity: TrainingIntensity;
  location?: string | null;
  coach: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  } | null;
  attendeeCount: number;
  maxParticipants?: number | null;
  color?: string; // For calendar display
}

/**
 * Calendar view options
 */
export interface CalendarViewOptions {
  view: 'day' | 'week' | 'month';
  date: Date;
  clubId: string;
  teamId?: string | null;
  coachId?: string;
  showCancelled?: boolean;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Training session template
 */
export interface TrainingTemplate {
  id: string;
  clubId: string;
  name: string;
  description?: string;
  category: TrainingCategory;
  customCategory?: string;
  intensity: TrainingIntensity;
  durationMinutes: number;
  drills: TrainingDrill[];
  equipment: string[];
  focusAreas: string[];
  notes?: string;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create training from template
 */
export interface CreateFromTemplateInput {
  templateId: string;
  clubId: string;
  teamId?: string | null;
  coachId: string;
  startTime: Date | string;
  location?: string;
  facilityId?: string;
  overrides?: Partial<CreateTrainingSessionInput>;
}

// ============================================================================
// RECURRING TRAINING TYPES
// ============================================================================

/**
 * Recurring training schedule
 */
export interface RecurringTrainingSchedule {
  id: string;
  clubId: string;
  teamId?: string | null;
  coachId: string;
  templateId?: string;
  name: string;
  category: TrainingCategory;
  customCategory?: string;
  intensity: TrainingIntensity;
  durationMinutes: number;
  location?: string;
  facilityId?: string;
  recurrence: RecurrenceRule;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  exceptions: Date[]; // Dates to skip
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recurrence rule
 */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  count?: number; // Max occurrences
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Training session creation response
 */
export interface CreateTrainingSessionResponse {
  session: TrainingSessionWithRelations;
  conflictWarnings?: ConflictWarning[];
}

/**
 * Conflict warning
 */
export interface ConflictWarning {
  type: 'facility' | 'coach' | 'team' | 'player';
  message: string;
  conflictingSessionId?: string;
  severity: 'info' | 'warning' | 'error';
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Training notification payload
 */
export interface TrainingNotificationPayload {
  type:
    | 'training_scheduled'
    | 'training_updated'
    | 'training_cancelled'
    | 'training_reminder'
    | 'attendance_required';
  sessionId: string;
  sessionName: string;
  startTime: Date;
  changes?: string[];
  recipientIds: string[];
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  TrainingSession,
  TrainingAttendance,
  Coach,
  Club,
  Team,
  Player,
  User,
};