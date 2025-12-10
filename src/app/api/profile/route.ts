// ============================================================================
// src/app/api/profile/route.ts - GET (user profile), PATCH (update profile)
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware';
import {
  validateEmail,
  validateStringLength,
  parseJsonBody,
} from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { NotFoundError, BadRequestError, ConflictError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phoneNumber: true,
        dateOfBirth: true,
        nationality: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
        roles: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        // Include profile based on roles
        player: {
          select: {
            id: true,
            position: true,
            preferredFoot: true,
            height: true,
            weight: true,
            status: true,
          },
        },
        coach: {
          select: {
            id: true,
            specialization: true,
            experience: true,
            status: true,
          },
        },
        clubOwner: {
          select: {
            id: true,
            status: true,
          },
        },
        clubManager: {
          select: {
            id: true,
            clubId: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('User profile not found');
    }

    return success(profile);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);

    const updates: Record<string, any> = {};
    const trackedChanges: Record<string, any> = {};

    // Validate and collect updates
    if (body.email !== undefined) {
      if (body.email !== user.email) {
        validateEmail(body.email);
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email: body.email },
        });
        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictError('Email already in use');
        }
      }
      updates.email = body.email;
      trackedChanges.email = { from: user.email, to: body.email };
    }

    if (body.firstName !== undefined) {
      validateStringLength(body.firstName, 1, 50, 'First name');
      updates.firstName = body.firstName;
      trackedChanges.firstName = body.firstName;
    }

    if (body.lastName !== undefined) {
      validateStringLength(body.lastName, 1, 50, 'Last name');
      updates.lastName = body.lastName;
      trackedChanges.lastName = body.lastName;
    }

    if (body.phoneNumber !== undefined) {
      updates.phoneNumber = body.phoneNumber;
      trackedChanges.phoneNumber = body.phoneNumber;
    }

    if (body.avatar !== undefined) {
      updates.avatar = body.avatar;
      trackedChanges.avatar = body.avatar;
    }

    if (body.address !== undefined) {
      updates.address = body.address;
      trackedChanges.address = body.address;
    }

    if (body.city !== undefined) {
      updates.city = body.city;
      trackedChanges.city = body.city;
    }

    if (body.country !== undefined) {
      updates.country = body.country;
      trackedChanges.country = body.country;
    }

    if (body.postalCode !== undefined) {
      updates.postalCode = body.postalCode;
      trackedChanges.postalCode = body.postalCode;
    }

    if (body.dateOfBirth !== undefined) {
      updates.dateOfBirth = new Date(body.dateOfBirth);
      trackedChanges.dateOfBirth = body.dateOfBirth;
    }

    if (body.nationality !== undefined) {
      updates.nationality = body.nationality;
      trackedChanges.nationality = body.nationality;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No updates provided');
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phoneNumber: true,
        dateOfBirth: true,
        nationality: true,
        address: true,
        city: true,
        country: true,
        postalCode: true,
        updatedAt: true,
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'USER_PROFILE_UPDATED',
      changes: trackedChanges,
      entityType: 'User',
      entityId: user.id,
      details: `Updated profile fields: ${Object.keys(trackedChanges).join(', ')}`,
    });

    return success(updated);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
