// ============================================================================
// 🏋️ TRAINING VALIDATION SCHEMAS - PitchConnect v7.3.0
// ============================================================================
// Zod schemas for training session validation
// Aligned with Schema v7.3.0 Hybrid Training Architecture
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const TrainingIntensitySchema = z.enum([
  'RECOVERY',
  'LOW',
  'MEDIUM',
  'HIGH',
  'MAXIMUM',
  'COMPETITIVE',
]);

export const TrainingCategorySchema = z.enum([
  'PASSING',
  'SHOOTING',
  'DEFENDING',
  'POSSESSION',
  'SET_PIECES',
  'DRIBBLING',
  'CONDITIONING',
  'STRENGTH_POWER',
  'SPEED_AGILITY',
  'FLEXIBILITY',
  'BALANCE_COORDINATION',
  'ENDURANCE',
  'TACTICAL',
  'FORMATION_WORK',
  'GAME_STRATEGY',
  'TRANSITIONS',
  'RECOVERY',
  'MENTAL_PREPARATION',
  'VIDEO_ANALYSIS',
  'TEAM_BUILDING',
  'GOALKEEPER_SPECIFIC',
  'POSITION_SPECIFIC',
  'SPORT_SPECIFIC',
  'WARM_UP',
  'COOL_DOWN',
  'SCRIMMAGE',
  'MATCH_SIMULATION',
  'INDIVIDUAL_TRAINING',
  'GROUP_TRAINING',
]);

export const TrainingStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED',
]);

export const AttendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'EXCUSED',
  'LATE',
  'LEFT_EARLY',
  'PARTIAL',
  'INJURED',
  'SICK',
  'SUSPENDED',
]);

// ============================================================================
// DRILL SCHEMA
// ============================================================================

export const TrainingDrillSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Drill name is required').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(1).max(120), // 1-120 minutes
  intensity: TrainingIntensitySchema,
  equipment: z.array(z.string()).optional(),
  diagram: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  order: z.number().int().min(0),
});

export type TrainingDrill = z.infer<typeof TrainingDrillSchema>;

// ============================================================================
// CREATE TRAINING SESSION SCHEMA
// ============================================================================

export const CreateTrainingSessionSchema = z.object({
  clubId: z.string().cuid('Invalid club ID'),
  teamId: z.string().cuid('Invalid team ID').nullish(), // Optional for team-specific
  coachId: z.string().cuid('Invalid coach ID'),
  
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(100, 'Session name must be 100 characters or less'),
  
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullish(),
  
  startTime: z.coerce.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Invalid start time',
  }),
  
  endTime: z.coerce.date({
    required_error: 'End time is required',
    invalid_type_error: 'Invalid end time',
  }),
  
  intensity: TrainingIntensitySchema.default('MEDIUM'),
  
  category: TrainingCategorySchema,
  
  customCategory: z
    .string()
    .max(50, 'Custom category must be 50 characters or less')
    .nullish(),
  
  location: z
    .string()
    .max(200, 'Location must be 200 characters or less')
    .nullish(),
  
  facilityId: z.string().cuid('Invalid facility ID').nullish(),
  
  maxParticipants: z
    .number()
    .int()
    .min(1, 'Must have at least 1 participant')
    .max(100, 'Maximum 100 participants')
    .nullish(),
  
  drills: z.array(TrainingDrillSchema).nullish(),
  
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullish(),
  
  equipment: z.array(z.string().max(50)).max(20).default([]),
  
  focusAreas: z.array(z.string().max(50)).max(10).default([]),
  
  status: TrainingStatusSchema.default('SCHEDULED'),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    const durationMs = data.endTime.getTime() - data.startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    return durationMinutes >= 15 && durationMinutes <= 480; // 15 min to 8 hours
  },
  {
    message: 'Session duration must be between 15 minutes and 8 hours',
    path: ['endTime'],
  }
);

export type CreateTrainingSessionInput = z.infer<typeof CreateTrainingSessionSchema>;

// ============================================================================
// UPDATE TRAINING SESSION SCHEMA
// ============================================================================

export const UpdateTrainingSessionSchema = z.object({
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(100, 'Session name must be 100 characters or less')
    .optional(),
  
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullish(),
  
  startTime: z.coerce.date().optional(),
  
  endTime: z.coerce.date().optional(),
  
  intensity: TrainingIntensitySchema.optional(),
  
  category: TrainingCategorySchema.optional(),
  
  customCategory: z
    .string()
    .max(50, 'Custom category must be 50 characters or less')
    .nullish(),
  
  location: z
    .string()
    .max(200, 'Location must be 200 characters or less')
    .nullish(),
  
  facilityId: z.string().cuid('Invalid facility ID').nullish(),
  
  maxParticipants: z
    .number()
    .int()
    .min(1, 'Must have at least 1 participant')
    .max(100, 'Maximum 100 participants')
    .nullish(),
  
  drills: z.array(TrainingDrillSchema).nullish(),
  
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullish(),
  
  equipment: z.array(z.string().max(50)).max(20).optional(),
  
  focusAreas: z.array(z.string().max(50)).max(10).optional(),
  
  status: TrainingStatusSchema.optional(),
  
  teamId: z.string().cuid('Invalid team ID').nullish(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type UpdateTrainingSessionInput = z.infer<typeof UpdateTrainingSessionSchema>;

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

export const RecordAttendanceSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID'),
  playerId: z.string().cuid('Invalid player ID'),
  status: AttendanceStatusSchema,
  arrivalTime: z.coerce.date().nullish(),
  departTime: z.coerce.date().nullish(),
  notes: z.string().max(500).nullish(),
  injuryId: z.string().cuid('Invalid injury ID').nullish(),
  performanceRating: z.number().min(1).max(10).nullish(),
  effortRating: z.number().min(1).max(10).nullish(),
  coachNotes: z.string().max(1000).nullish(),
  customMetrics: z.record(z.unknown()).nullish(),
}).refine(
  (data) => {
    // If status is INJURED, injuryId should ideally be provided
    if (data.status === 'INJURED' && !data.injuryId) {
      // This is a warning, not an error - injury can be recorded later
      return true;
    }
    return true;
  }
).refine(
  (data) => {
    // Validate arrival/depart times make sense
    if (data.arrivalTime && data.departTime) {
      return data.departTime > data.arrivalTime;
    }
    return true;
  },
  {
    message: 'Departure time must be after arrival time',
    path: ['departTime'],
  }
);

export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>;

export const BulkAttendanceSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID'),
  attendance: z.array(
    z.object({
      playerId: z.string().cuid('Invalid player ID'),
      status: AttendanceStatusSchema,
      notes: z.string().max(500).nullish(),
    })
  ).min(1, 'At least one attendance record is required'),
});

export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const TrainingSessionFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().nullish(),
  coachId: z.string().cuid().optional(),
  status: z.union([
    TrainingStatusSchema,
    z.array(TrainingStatusSchema),
  ]).optional(),
  category: z.union([
    TrainingCategorySchema,
    z.array(TrainingCategorySchema),
  ]).optional(),
  intensity: z.union([
    TrainingIntensitySchema,
    z.array(TrainingIntensitySchema),
  ]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
  facilityId: z.string().cuid().optional(),
});

export type TrainingSessionFilters = z.infer<typeof TrainingSessionFiltersSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationOptions = z.infer<typeof PaginationSchema>;

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

export const CreateTrainingTemplateSchema = z.object({
  clubId: z.string().cuid('Invalid club ID'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: TrainingCategorySchema,
  customCategory: z.string().max(50).optional(),
  intensity: TrainingIntensitySchema,
  durationMinutes: z.number().int().min(15).max(480),
  drills: z.array(TrainingDrillSchema).default([]),
  equipment: z.array(z.string().max(50)).max(20).default([]),
  focusAreas: z.array(z.string().max(50)).max(10).default([]),
  notes: z.string().max(2000).optional(),
  isPublic: z.boolean().default(false),
});

export type CreateTrainingTemplateInput = z.infer<typeof CreateTrainingTemplateSchema>;

export const CreateFromTemplateSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  clubId: z.string().cuid('Invalid club ID'),
  teamId: z.string().cuid('Invalid team ID').nullish(),
  coachId: z.string().cuid('Invalid coach ID'),
  startTime: z.coerce.date(),
  location: z.string().max(200).optional(),
  facilityId: z.string().cuid().optional(),
  overrides: UpdateTrainingSessionSchema.partial().optional(),
});

export type CreateFromTemplateInput = z.infer<typeof CreateFromTemplateSchema>;

// ============================================================================
// RECURRING SCHEDULE SCHEMAS
// ============================================================================

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().min(1).max(12),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  count: z.number().int().min(1).max(100).optional(),
}).refine(
  (data) => {
    if (data.frequency === 'weekly' && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Days of week required for weekly recurrence',
    path: ['daysOfWeek'],
  }
);

export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>;

export const CreateRecurringScheduleSchema = z.object({
  clubId: z.string().cuid('Invalid club ID'),
  teamId: z.string().cuid('Invalid team ID').nullish(),
  coachId: z.string().cuid('Invalid coach ID'),
  templateId: z.string().cuid('Invalid template ID').optional(),
  name: z.string().min(1).max(100),
  category: TrainingCategorySchema,
  customCategory: z.string().max(50).optional(),
  intensity: TrainingIntensitySchema,
  durationMinutes: z.number().int().min(15).max(480),
  location: z.string().max(200).optional(),
  facilityId: z.string().cuid().optional(),
  recurrence: RecurrenceRuleSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export type CreateRecurringScheduleInput = z.infer<typeof CreateRecurringScheduleSchema>;

// ============================================================================
// CALENDAR SCHEMAS
// ============================================================================

export const CalendarViewOptionsSchema = z.object({
  view: z.enum(['day', 'week', 'month']).default('week'),
  date: z.coerce.date(),
  clubId: z.string().cuid('Invalid club ID'),
  teamId: z.string().cuid('Invalid team ID').nullish(),
  coachId: z.string().cuid('Invalid coach ID').optional(),
  showCancelled: z.boolean().default(false),
});

export type CalendarViewOptions = z.infer<typeof CalendarViewOptionsSchema>;

// ============================================================================
// QUERY PARAM SCHEMAS (for API routes)
// ============================================================================

export const GetTrainingSessionsQuerySchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().optional().transform(val => val === 'null' ? null : val),
  coachId: z.string().cuid().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  intensity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate session doesn't conflict with existing sessions
 */
export function validateNoConflict(
  newSession: { startTime: Date; endTime: Date; facilityId?: string | null; coachId: string },
  existingSessions: Array<{ id: string; startTime: Date; endTime: Date; facilityId?: string | null; coachId: string }>
): { hasConflict: boolean; conflicts: Array<{ sessionId: string; type: 'facility' | 'coach' }> } {
  const conflicts: Array<{ sessionId: string; type: 'facility' | 'coach' }> = [];

  for (const existing of existingSessions) {
    // Check time overlap
    const overlaps =
      newSession.startTime < existing.endTime &&
      newSession.endTime > existing.startTime;

    if (overlaps) {
      // Check facility conflict
      if (newSession.facilityId && newSession.facilityId === existing.facilityId) {
        conflicts.push({ sessionId: existing.id, type: 'facility' });
      }

      // Check coach conflict
      if (newSession.coachId === existing.coachId) {
        conflicts.push({ sessionId: existing.id, type: 'coach' });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Parse comma-separated enum values
 */
export function parseEnumArray<T extends z.ZodEnum<[string, ...string[]]>>(
  value: string | undefined,
  schema: T
): z.infer<T>[] | undefined {
  if (!value) return undefined;
  
  const values = value.split(',').map(v => v.trim());
  const parsed: z.infer<T>[] = [];
  
  for (const v of values) {
    const result = schema.safeParse(v);
    if (result.success) {
      parsed.push(result.data);
    }
  }
  
  return parsed.length > 0 ? parsed : undefined;
}