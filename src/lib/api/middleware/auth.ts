/**
 * ============================================================================
 * 🔐 PITCHCONNECT - Authentication & Authorization Middleware v7.10.1
 * Path: src/lib/api/middleware/auth.ts
 * ============================================================================
 * 
 * Complete RBAC for all 18 UserRoles
 * Resource-level access control
 * Club/Team membership verification
 * Tier-based feature access
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/auth';
import { logger } from './logger';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InsufficientPermissionsError,
  AccountSuspendedError,
  AccountBannedError,
  TierRequiredError,
  RoleRequiredError,
} from '../errors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * All 18 UserRoles from Prisma schema
 */
export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'CLUB_OWNER'
  | 'CLUB_MANAGER'
  | 'MANAGER'
  | 'COACH'
  | 'COACH_PRO'
  | 'PLAYER'
  | 'PLAYER_PRO'
  | 'PARENT'
  | 'GUARDIAN'
  | 'FAN'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST'
  | 'MEDICAL_STAFF'
  | 'TREASURER'
  | 'LEAGUE_ADMIN';

/**
 * Account tiers for feature gating
 */
export type AccountTier = 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';

/**
 * User status
 */
export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';

/**
 * Session user type
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  status: UserStatus;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  accountTier?: AccountTier;
}

/**
 * Extended user profile
 */
export interface UserProfile extends SessionUser {
  avatar?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  dateOfBirth?: Date | null;
  playerProfile?: {
    id: string;
    position: string;
    status: string;
  } | null;
  coachProfile?: {
    id: string;
    coachType: string;
  } | null;
  clubOwner?: {
    id: string;
    clubs: { id: string; name: string }[];
  } | null;
  clubManager?: {
    id: string;
    clubId: string;
  } | null;
}

/**
 * Club member role
 */
export type ClubMemberRole =
  | 'OWNER'
  | 'PRESIDENT'
  | 'VICE_PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'COACH'
  | 'ASSISTANT_COACH'
  | 'TEAM_MANAGER'
  | 'PLAYER'
  | 'PARENT'
  | 'GUARDIAN'
  | 'VOLUNTEER'
  | 'COMMITTEE_MEMBER'
  | 'MEDICAL_STAFF'
  | 'GROUNDS_KEEPER'
  | 'EQUIPMENT_MANAGER'
  | 'SOCIAL_MEDIA_MANAGER'
  | 'MEMBER';

// =============================================================================
// ROLE HIERARCHY & PERMISSIONS
// =============================================================================

/**
 * Role hierarchy - higher number = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPERADMIN: 100,
  ADMIN: 90,
  LEAGUE_ADMIN: 80,
  CLUB_OWNER: 70,
  CLUB_MANAGER: 60,
  MANAGER: 55,
  TREASURER: 50,
  COACH_PRO: 45,
  COACH: 40,
  ANALYST: 35,
  SCOUT: 35,
  MEDICAL_STAFF: 35,
  REFEREE: 30,
  PLAYER_PRO: 25,
  PLAYER: 20,
  PARENT: 15,
  GUARDIAN: 15,
  FAN: 10,
};

/**
 * Admin-level roles
 */
const ADMIN_ROLES: UserRole[] = ['SUPERADMIN', 'ADMIN'];

/**
 * Staff-level roles (club operations)
 */
const STAFF_ROLES: UserRole[] = [
  'SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 
  'MANAGER', 'COACH', 'COACH_PRO', 'TREASURER'
];

/**
 * Management roles (team/squad management)
 */
const MANAGEMENT_ROLES: UserRole[] = [
  'SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER',
  'MANAGER', 'COACH', 'COACH_PRO'
];

/**
 * Analytics access roles
 */
const ANALYTICS_ROLES: UserRole[] = [
  'SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER',
  'MANAGER', 'COACH', 'COACH_PRO', 'ANALYST', 'SCOUT'
];

/**
 * Financial access roles
 */
const FINANCIAL_ROLES: UserRole[] = [
  'SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'TREASURER'
];

// =============================================================================
// TIER HIERARCHY
// =============================================================================

const TIER_HIERARCHY: Record<AccountTier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Get authenticated user from session
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if account is suspended/banned/inactive
 */
export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  try {
    const session = await getServerSession(authOptions);

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
        accountTier: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found in database');
    }

    // Check account status
    switch (user.status) {
      case 'SUSPENDED':
        throw new AccountSuspendedError();
      case 'BANNED':
        throw new ForbiddenError('Your account has been banned');
      case 'INACTIVE':
        throw new ForbiddenError('Your account is inactive. Please contact support.');
    }

    logger.info('User authenticated', { 
      userId: user.id, 
      email: user.email,
      roles: user.roles 
    });

    return user as SessionUser;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error('Authentication failed', { error });
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Get user profile with associations
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatar: true,
      phoneNumber: true,
      dateOfBirth: true,
      roles: true,
      status: true,
      twoFactorEnabled: true,
      emailVerified: true,
      accountTier: true,
      playerProfile: {
        select: {
          id: true,
          position: true,
          status: true,
        },
      },
      coachProfile: {
        select: {
          id: true,
          coachType: true,
        },
      },
      clubOwner: {
        select: {
          id: true,
          ownedClubs: {
            select: { id: true, name: true },
          },
        },
      },
      clubManager: {
        select: {
          id: true,
          clubId: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return {
    ...user,
    clubOwner: user.clubOwner ? {
      id: user.clubOwner.id,
      clubs: user.clubOwner.ownedClubs,
    } : null,
  } as UserProfile;
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL
// =============================================================================

/**
 * Check if user has ANY of the required roles
 */
export function hasAnyRole(user: SessionUser, requiredRoles: UserRole[]): boolean {
  // SUPERADMIN has all permissions
  if (user.roles.includes('SUPERADMIN')) return true;
  
  return user.roles.some(role => requiredRoles.includes(role as UserRole));
}

/**
 * Check if user has ALL required roles
 */
export function hasAllRoles(user: SessionUser, requiredRoles: UserRole[]): boolean {
  if (user.roles.includes('SUPERADMIN')) return true;
  return requiredRoles.every(role => user.roles.includes(role));
}

/**
 * Require user to have ANY of the specified roles
 * @throws InsufficientPermissionsError if no matching role
 */
export function requireAnyRole(user: SessionUser, allowedRoles: UserRole[]): void {
  if (!hasAnyRole(user, allowedRoles)) {
    throw new RoleRequiredError(allowedRoles);
  }
}

/**
 * Require user to have ALL specified roles
 * @throws InsufficientPermissionsError if missing roles
 */
export function requireAllRoles(user: SessionUser, requiredRoles: UserRole[]): void {
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
 * Check if user is admin (SUPERADMIN or ADMIN)
 */
export function isAdmin(user: SessionUser): boolean {
  return hasAnyRole(user, ADMIN_ROLES);
}

/**
 * Check if user is staff member
 */
export function isStaff(user: SessionUser): boolean {
  return hasAnyRole(user, STAFF_ROLES);
}

/**
 * Check if user has management permissions
 */
export function isManagement(user: SessionUser): boolean {
  return hasAnyRole(user, MANAGEMENT_ROLES);
}

/**
 * Check if user has analytics access
 */
export function hasAnalyticsAccess(user: SessionUser): boolean {
  return hasAnyRole(user, ANALYTICS_ROLES);
}

/**
 * Check if user has financial access
 */
export function hasFinancialAccess(user: SessionUser): boolean {
  return hasAnyRole(user, FINANCIAL_ROLES);
}

/**
 * Require superadmin access
 */
export function requireSuperAdmin(user: SessionUser): void {
  if (!isSuperAdmin(user)) {
    throw new ForbiddenError('Superadmin access required');
  }
}

/**
 * Require admin access
 */
export function requireAdmin(user: SessionUser): void {
  if (!isAdmin(user)) {
    throw new ForbiddenError('Admin access required');
  }
}

/**
 * Get user's highest role level
 */
export function getRoleLevel(user: SessionUser): number {
  return Math.max(...user.roles.map(role => ROLE_HIERARCHY[role as UserRole] || 0));
}

/**
 * Check if user's role level meets minimum
 */
export function hasMinimumRoleLevel(user: SessionUser, minLevel: number): boolean {
  return getRoleLevel(user) >= minLevel;
}

// =============================================================================
// TIER-BASED ACCESS CONTROL
// =============================================================================

/**
 * Check if user's tier meets requirement
 */
export function hasTierAccess(user: SessionUser, requiredTier: AccountTier): boolean {
  const userTier = user.accountTier || 'FREE';
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Require minimum tier
 */
export function requireTier(
  user: SessionUser, 
  requiredTier: AccountTier,
  feature: string
): void {
  if (!hasTierAccess(user, requiredTier)) {
    throw new TierRequiredError(requiredTier, user.accountTier || 'FREE', feature);
  }
}

// =============================================================================
// RESOURCE-LEVEL ACCESS CONTROL
// =============================================================================

/**
 * Check if user is club owner
 */
export async function isClubOwner(userId: string, clubId: string): Promise<boolean> {
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
  clubId: string,
  roles?: ClubMemberRole[]
): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId,
      status: 'ACTIVE',
      ...(roles && { role: { in: roles } }),
    },
  });
  return !!membership;
}

/**
 * Get user's club membership
 */
export async function getClubMembership(
  userId: string, 
  clubId: string
): Promise<{ role: ClubMemberRole; status: string } | null> {
  const membership = await prisma.clubMember.findFirst({
    where: { clubId, userId },
    select: { role: true, status: true },
  });
  return membership as { role: ClubMemberRole; status: string } | null;
}

/**
 * Require club access (owner or member)
 */
export async function requireClubAccess(userId: string, clubId: string): Promise<void> {
  const isOwner = await isClubOwner(userId, clubId);
  if (isOwner) return;

  const isMember = await isClubMember(userId, clubId);
  if (isMember) return;

  throw new ForbiddenError('You do not have access to this club');
}

/**
 * Require club staff access
 */
export async function requireClubStaffAccess(
  userId: string, 
  clubId: string
): Promise<void> {
  const isOwner = await isClubOwner(userId, clubId);
  if (isOwner) return;

  const staffRoles: ClubMemberRole[] = [
    'OWNER', 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 
    'TREASURER', 'COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'
  ];
  
  const isStaffMember = await isClubMember(userId, clubId, staffRoles);
  if (!isStaffMember) {
    throw new ForbiddenError('Club staff access required');
  }
}

/**
 * Check if user is team member
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
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
 * Require team membership
 */
export async function requireTeamMembership(userId: string, teamId: string): Promise<void> {
  const isMember = await isTeamMember(userId, teamId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this team');
  }
}

/**
 * Check if user is team captain
 */
export async function isTeamCaptain(userId: string, teamId: string): Promise<boolean> {
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
 * Require team captain status
 */
export async function requireTeamCaptain(userId: string, teamId: string): Promise<void> {
  const isCaptain = await isTeamCaptain(userId, teamId);
  if (!isCaptain) {
    throw new ForbiddenError('Only team captain can perform this action');
  }
}

// =============================================================================
// PROFILE LOADERS
// =============================================================================

/**
 * Get player profile or throw
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
 * Get coach profile or throw
 */
export async function requireCoachProfile(user: SessionUser) {
  const coach = await prisma.coach.findUnique({
    where: { userId: user.id },
    include: {
      teams: true,
    },
  });

  if (!coach) {
    throw new NotFoundError('Coach profile', user.id);
  }

  return coach;
}

/**
 * Get club owner profile or throw
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

// =============================================================================
// RESOURCE VERIFICATION
// =============================================================================

/**
 * Verify resource exists
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
    },
  });

  return await requireResource(match, 'Match', matchId);
}

// =============================================================================
// OWNERSHIP CHECKS
// =============================================================================

/**
 * Check if user owns a resource
 */
export function isResourceOwner(
  user: SessionUser,
  resourceOwnerId: string
): boolean {
  return user.id === resourceOwnerId || isSuperAdmin(user);
}

/**
 * Require resource ownership
 */
export function requireResourceOwnership(
  user: SessionUser,
  resourceOwnerId: string,
  resourceType: string
): void {
  if (!isResourceOwner(user, resourceOwnerId)) {
    throw new ForbiddenError(`You do not own this ${resourceType}`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Types
  type UserRole,
  type AccountTier,
  type UserStatus,
  type ClubMemberRole,
  type SessionUser,
  type UserProfile,
  
  // Constants
  ROLE_HIERARCHY,
  ADMIN_ROLES,
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  ANALYTICS_ROLES,
  FINANCIAL_ROLES,
  TIER_HIERARCHY,
};
