import { z } from 'zod';
import { UserRole, Position, PreferredFoot, Sport } from '@prisma/client';

// User Validators
export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
});

// Player Validators
export const PlayerCreateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string().datetime(),
  nationality: z.string().min(2),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  position: z.nativeEnum(Position),
  preferredFoot: z.nativeEnum(PreferredFoot),
  secondaryPosition: z.nativeEnum(Position).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
});

export const PlayerUpdateSchema = PlayerCreateSchema.partial();

// Team Validators
export const TeamCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(10),
  clubId: z.string().cuid(),
  sport: z.nativeEnum(Sport).default(Sport.FOOTBALL),
  ageGroup: z.string().optional(),
  category: z.string().optional(),
  maxPlayersOnCourt: z.number().int().positive().optional(),
  totalSquadSize: z.number().int().positive().optional(),
});

export const TeamUpdateSchema = TeamCreateSchema.partial().omit({ clubId: true });

// Match Validators
export const MatchCreateSchema = z.object({
  homeTeamId: z.string().cuid(),
  awayTeamId: z.string().cuid(),
  fixtureId: z.string().cuid().optional(),
  refereeId: z.string().cuid().optional(),
  date: z.string().datetime(),
  kickOffTime: z.string().datetime().optional(),
  venue: z.string().optional(),
  venueCity: z.string().optional(),
});

export const MatchEventSchema = z.object({
  type: z.string(),
  playerId: z.string().cuid().optional(),
  assistedBy: z.string().cuid().optional(),
  minute: z.number().int().min(0).max(150),
  isExtraTime: z.boolean().optional(),
  additionalInfo: z.string().optional(),
});
