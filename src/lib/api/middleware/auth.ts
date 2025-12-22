// ============================================================================
// ENHANCED: src/lib/api/middleware/auth.ts - Authentication & Authorization
// Complete authentication, role-based access, and resource permissions
// ============================================================================

import { auth } from '@/auth';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '../logger';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InsufficientPermissionsError,
} from '../errors';

// ============================================================================
// TYPES
// ============================================================================

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
};

export type UserProfile = SessionUser & {
  avatar?: string;
  phoneNumber?: string;
  player?: any;
  coach?: any;
  clubOwner?: any;
  clubManager?: any;
  leagueAdmin?: any;
  parent?: any;
  treasurer?: any;
  referee?: any;
  scout?: any;
  analyst?: any;
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Verify session and return authenticated user
 * Throws UnauthorizedError if not authenticated or inactive
 */
export async function requireAuth(
  request?: NextRequest,
  options?: { throwIfMissing?: boolean }
): Promise<SessionUser> {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      throw new UnauthorizedError('No active session found');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        status: true,
        twoFactorEnabled: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found in database');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Account has been suspended');
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenError('Account has been banned');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is inactive');
    }

    logger.info(`User authenticated: ${user.id} (${user.email})`);

    return user;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Get full user profile with all associations
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phoneNumber: true,
      roles: true,
      status: true,
      twoFactorEnabled: true,
      emailVerified: true,
      playerProfile: {
        select: {
          id: true,
          position: true,
          preferredFoot: true,
          height: true,
          weight: true,
          shirtNumber: true,
          status: true,
        },
      },
      coachProfile: {
        select: {
          id: true,
          coachType: true,
          specializations: true,
          yearsExperience: true,
        },
      },
      clubOwner: {
        select: {
          id: true,
        },
      },
      clubManager: {
        select: {
          id: true,
        },
      },
      leagueAdmin: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return user as unknown as UserProfile;
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

/**
 * Check if user has ANY of the required roles
 */
export function hasAnyRole(
  user: SessionUser,
  requiredRoles: string[]
): boolean {
  return user.roles.some(role => requiredRoles.includes(role));
}

/**
 * Require user to have ANY of the specified roles
 */
export function requireAnyRole(
  user: SessionUser,
  allowedRoles: string[]
): void {
  if (!hasAnyRole(user, allowedRoles)) {
    throw new InsufficientPermissionsError(
      'access this resource',
      allowedRoles.join(', '),
      user.roles.join(', ')
    );
  }
}

/**
 * Check if user has ALL of the required roles
 */
export function hasAllRoles(
  user: SessionUser,
  requiredRoles: string[]
): boolean {
  return requiredRoles.every(role => user.roles.includes(role));
}

/**
 * Require user to have ALL of the specified roles
 */
export function requireAllRoles(
  user: SessionUser,
  requiredRoles: string[]
): void {
  if (!hasAllRoles(user, requiredRoles)) {
    throw new InsufficientPermissionsError(
      'access this resource',
      `all of: ${requiredRoles.join(', ')}`,
      user.roles.join(', ')
    );
  }
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(user: SessionUser): boolean {
  return user.roles.includes('SUPERADMIN');
}

/**
 * Require user to be superadmin
 */
export function requireSuperAdmin(user: SessionUser): void {
  if (!isSuperAdmin(user)) {
    throw new ForbiddenError('Superadmin access required');
  }
}

// ============================================================================
// RESOURCE-LEVEL ACCESS CONTROL
// ============================================================================

/**
 * Check if user is club owner
 */
export async function isClubOwner(
  userId: string,
  clubId: string
): Promise<boolean> {
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId: userId },
  });
  return !!club;
}

/**
 * Check if user is club member
 */
export async function isClubMember(
  userId: string,
  clubId: string
): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId,
      status: 'ACTIVE',
    },
  });
  return !!membership;
}

/**
 * Require user to have access to club
 */
export async function requireClubAccess(
  userId: string,
  clubId: string
): Promise<void> {
  const isOwner = await isClubOwner(userId, clubId);
  if (isOwner) return;

  const isMember = await isClubMember(userId, clubId);
  if (isMember) return;

  throw new ForbiddenError('You do not have access to this club');
}

/**
 * Check if user is team member
 */
export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<boolean> {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      status: 'ACTIVE',
    },
  });
  return !!membership;
}

/**
 * Require user to be team member
 */
export async function requireTeamMembership(
  userId: string,
  teamId: string
): Promise<void> {
  const isMember = await isTeamMember(userId, teamId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this team');
  }
}

/**
 * Check if user is team captain
 */
export async function isTeamCaptain(
  userId: string,
  teamId: string
): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      isCaptain: true,
      status: 'ACTIVE',
    },
  });
  return !!member;
}

/**
 * Require user to be team captain
 */
export async function requireTeamCaptain(
  userId: string,
  teamId: string
): Promise<void> {
  const isCaptain = await isTeamCaptain(userId, teamId);
  if (!isCaptain) {
    throw new ForbiddenError('Only team captain can perform this action');
  }
}

// ============================================================================
// PROFILE LOADERS
// ============================================================================

/**
 * Get or throw if player profile doesn't exist
 */
export async function requirePlayerProfile(user: SessionUser) {
  const player = await prisma.player.findUnique({
    where: { userId: user.id },
    include: {
      stats: { orderBy: { season: 'desc' }, take: 1 },
      contracts: { where: { status: 'ACTIVE' } },
      injuries: { where: { status: 'ACTIVE' } },
    },
  });

  if (!player) {
    throw new NotFoundError('Player profile', user.id);
  }

  return player;
}

/**
 * Get or throw if coach profile doesn't exist
 */
export async function requireCoachProfile(user: SessionUser) {
  const coach = await prisma.coach.findUnique({
    where: { userId: user.id },
  });

  if (!coach) {
    throw new NotFoundError('Coach profile', user.id);
  }

  return coach;
}

/**
 * Get or throw if club owner profile doesn't exist
 */
export async function requireClubOwnerProfile(user: SessionUser) {
  const owner = await prisma.clubOwner.findUnique({
    where: { userId: user.id },
    include: {
      ownedClubs: true,
    },
  });

  if (!owner) {
    throw new NotFoundError('Club owner profile', user.id);
  }

  return owner;
}

/**
 * Get or throw if club manager profile doesn't exist
 */
export async function requireClubManagerProfile(user: SessionUser) {
  const manager = await prisma.clubManager.findUnique({
    where: { userId: user.id },
  });

  if (!manager) {
    throw new NotFoundError('Club manager profile', user.id);
  }

  return manager;
}

/**
 * Get or throw if referee profile doesn't exist
 */
export async function requireRefereeProfile(user: SessionUser) {
  const referee = await prisma.referee.findUnique({
    where: { userId: user.id },
  });

  if (!referee) {
    throw new NotFoundError('Referee profile', user.id);
  }

  return referee;
}

// ============================================================================
// RESOURCE VERIFICATION
// ============================================================================

/**
 * Verify resource exists and return it, or throw NotFoundError
 */
export async function requireResource<T>(
  resource: T | null,
  resourceType: string,
  resourceId?: string
): Promise<T> {
  if (!resource) {
    throw new NotFoundError(resourceType, resourceId);
  }
  return resource;
}

/**
 * Verify player exists and is active
 */
export async function requireActivePlayer(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new NotFoundError('Player', playerId);
  }

  if (player.status !== 'ACTIVE') {
    throw new ForbiddenError(`Player is ${player.status.toLowerCase()}`);
  }

  return player;
}

/**
 * Verify team exists and is active
 */
export async function requireActiveTeam(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { club: true },
  });

  if (!team) {
    throw new NotFoundError('Team', teamId);
  }

  if (team.status !== 'ACTIVE') {
    throw new ForbiddenError(`Team is ${team.status.toLowerCase()}`);
  }

  return team;
}

/**
 * Verify match exists
 */
export async function requireMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      referee: true,
    },
  });

  return await requireResource(match, 'Match', matchId);
}
