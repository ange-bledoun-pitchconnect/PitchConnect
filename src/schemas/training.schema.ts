// ============================================================================
// 🏋️ TRAINING SCHEMA - PitchConnect v7.5.0
// ============================================================================

import { z } from 'zod';

export const SportSchema = z.enum(['FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL', 'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL']);
export const TrainingIntensitySchema = z.enum(['RECOVERY', 'LOW', 'MEDIUM', 'HIGH', 'MAXIMUM', 'COMPETITIVE']);
export const TrainingStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED']);
export const AttendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'LEFT_EARLY', 'PARTIAL', 'INJURED', 'SICK', 'SUSPENDED']);
export const TrainingCategorySchema = z.enum(['WARM_UP', 'COOL_DOWN', 'CONDITIONING', 'STRENGTH_POWER', 'SPEED_AGILITY', 'FLEXIBILITY', 'ENDURANCE', 'RECOVERY', 'VIDEO_ANALYSIS', 'TEAM_BUILDING', 'SCRIMMAGE', 'MATCH_SIMULATION', 'POSITION_SPECIFIC', 'PASSING', 'SHOOTING', 'DEFENDING', 'POSSESSION', 'SET_PIECES', 'TACTICAL', 'GOALKEEPER_SPECIFIC', 'PRESSING', 'SCRUM_PRACTICE', 'LINEOUT_WORK', 'RUCKING', 'TACKLING', 'CONTACT_SKILLS', 'NET_PRACTICE', 'BATTING_DRILLS', 'BOWLING_PRACTICE', 'FIELDING_DRILLS', 'WICKET_KEEPING', 'SHOOTING_DRILLS', 'BALL_HANDLING', 'PICK_AND_ROLL', 'ZONE_DEFENSE', 'FREE_THROWS', 'ROUTE_RUNNING', 'BLOCKING', 'PASS_RUSH', 'SPECIAL_TEAMS', 'SKATING', 'STICKHANDLING', 'POWER_PLAY', 'PENALTY_KILL', 'SHOOTING_NETBALL', 'MOVEMENT_PATTERNS', 'CENTER_PASSES', 'STICK_SKILLS', 'GROUND_BALLS', 'FACE_OFF_LAX', 'KICKING_AFL', 'MARKING', 'RUCK_WORK', 'KICKING_GAA', 'HAND_PASSING', 'OTHER']);

export const TRAINING_LIMITS = { MIN_DURATION: 15, MAX_DURATION: 480, MAX_PARTICIPANTS: 100, MAX_NAME: 100, MAX_DESC: 2000, MAX_DRILLS: 30 } as const;

export const TrainingDrillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(1).max(120),
  intensity: TrainingIntensitySchema,
  category: TrainingCategorySchema.optional(),
  equipment: z.array(z.string().max(50)).max(10).optional(),
  order: z.number().int().min(0),
  sport: SportSchema.optional(),
});

export const CreateTrainingSessionSchema = z.object({
  clubId: z.string().cuid(),
  sport: SportSchema,
  coachId: z.string().cuid(),
  teamId: z.string().cuid().nullable().optional(),
  name: z.string().min(1).max(TRAINING_LIMITS.MAX_NAME),
  description: z.string().max(TRAINING_LIMITS.MAX_DESC).nullable().optional(),
  startTime: z.union([z.string().datetime(), z.date()]),
  endTime: z.union([z.string().datetime(), z.date()]),
  intensity: TrainingIntensitySchema.default('MEDIUM'),
  category: TrainingCategorySchema,
  customCategory: z.string().max(50).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  facilityId: z.string().cuid().nullable().optional(),
  maxParticipants: z.number().int().min(1).max(TRAINING_LIMITS.MAX_PARTICIPANTS).nullable().optional(),
  drills: z.array(TrainingDrillSchema).max(TRAINING_LIMITS.MAX_DRILLS).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  equipment: z.array(z.string().max(50)).max(20).optional().default([]),
  focusAreas: z.array(z.string().max(50)).max(10).optional().default([]),
  status: TrainingStatusSchema.default('SCHEDULED'),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), { message: 'End time must be after start time', path: ['endTime'] });

export const UpdateTrainingSessionSchema = CreateTrainingSessionSchema.partial().omit({ clubId: true, sport: true, coachId: true });

export const RecordAttendanceSchema = z.object({
  sessionId: z.string().cuid(),
  playerId: z.string().cuid(),
  status: AttendanceStatusSchema,
  arrivalTime: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  departTime: z.union([z.string().datetime(), z.date()]).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  performanceRating: z.number().min(1).max(10).nullable().optional(),
  effortRating: z.number().min(1).max(10).nullable().optional(),
  coachNotes: z.string().max(1000).nullable().optional(),
});

export const BulkAttendanceSchema = z.object({
  sessionId: z.string().cuid(),
  attendance: z.array(z.object({ playerId: z.string().cuid(), status: AttendanceStatusSchema, notes: z.string().max(500).nullable().optional() })).min(1).max(100),
});

export const TrainingFiltersSchema = z.object({
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().nullable().optional(),
  coachId: z.string().cuid().optional(),
  sport: z.union([SportSchema, z.array(SportSchema)]).optional(),
  status: z.union([TrainingStatusSchema, z.array(TrainingStatusSchema)]).optional(),
  category: z.union([TrainingCategorySchema, z.array(TrainingCategorySchema)]).optional(),
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
  search: z.string().max(100).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type Sport = z.infer<typeof SportSchema>;
export type TrainingIntensity = z.infer<typeof TrainingIntensitySchema>;
export type TrainingStatus = z.infer<typeof TrainingStatusSchema>;
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type TrainingCategory = z.infer<typeof TrainingCategorySchema>;
export type CreateTrainingSessionInput = z.infer<typeof CreateTrainingSessionSchema>;
export type UpdateTrainingSessionInput = z.infer<typeof UpdateTrainingSessionSchema>;
export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>;