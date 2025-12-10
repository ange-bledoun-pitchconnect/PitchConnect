// ============================================================================
// src/lib/api/middleware.ts - Authentication & Authorization Middleware
// ============================================================================

import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from './errors';

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
  status: string;
  firstName: string;
  lastName: string;
};

/**
 * Verify session and return authenticated user
 * Throws UnauthorizedError if not authenticated or inactive
 */
export async function requireAuth(
  request: NextRequest
): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new UnauthorizedError('No active session');
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
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
    throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
  }

  return user;
}

/**
 * Check if user has required roles
 * Throws ForbiddenError if insufficient permissions
 */
export function requireRole(
  user: SessionUser,
  allowedRoles: string[]
): void {
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    throw new ForbiddenError(
      `Requires one of: ${allowedRoles.join(', ')}`
    );
  }
}

/**
 * Check if user has ALL required roles (strict)
 */
export function requireAllRoles(
  user: SessionUser,
  requiredRoles: string[]
): void {
  const hasAllRoles = requiredRoles.every((role) =>
    user.roles.includes(role)
  );
  if (!hasAllRoles) {
    throw new ForbiddenError(
      `Requires all of: ${requiredRoles.join(', ')}`
    );
  }
}

/**
 * Check if user is club owner with access to club
 */
export async function requireClubAccess(
  user: SessionUser,
  clubId: string
): Promise<void> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId: user.id,
      status: 'ACTIVE',
    },
  });

  if (!membership) {
    // Check if user is club owner
    const isOwner = await prisma.club.findFirst({
      where: {
        id: clubId,
        ownerId: user.id,
      },
    });

    if (!isOwner) {
      throw new ForbiddenError('No access to this club');
    }
  }
}

/**
 * Check if user is team member
 */
export async function requireTeamMembership(
  user: SessionUser,
  teamId: string
): Promise<void> {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      status: 'ACTIVE',
    },
  });

  if (!membership) {
    throw new ForbiddenError('Not a member of this team');
  }
}

/**
 * Verify resource exists and return it
 */
export async function requireResource<T>(
  resource: T | null,
  resourceName: string
): Promise<T> {
  if (!resource) {
    throw new NotFoundError(`${resourceName} not found`);
  }
  return resource;
}

/**
 * Check if user is a coach
 */
export async function getCoachProfile(user: SessionUser) {
  const coach = await prisma.coach.findUnique({
    where: { userId: user.id },
  });

  if (!coach) {
    throw new NotFoundError('Coach profile not found');
  }

  return coach;
}

/**
 * Check if user is a player
 */
export async function getPlayerProfile(user: SessionUser) {
  const player = await prisma.player.findUnique({
    where: { userId: user.id },
  });

  if (!player) {
    throw new NotFoundError('Player profile not found');
  }

  return player;
}

/**
 * Check if user is club owner
 */
export async function getClubOwnerProfile(user: SessionUser) {
  const owner = await prisma.clubOwner.findUnique({
    where: { userId: user.id },
  });

  if (!owner) {
    throw new NotFoundError('Club owner profile not found');
  }

  return owner;
}

/**
 * Check if user is club manager
 */
export async function getClubManagerProfile(user: SessionUser) {
  const manager = await prisma.clubManager.findUnique({
    where: { userId: user.id },
  });

  if (!manager) {
    throw new NotFoundError('Club manager profile not found');
  }

  return manager;
}
