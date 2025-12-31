// =============================================================================
// ⚙️ SETTINGS PROFILE API - Enterprise-Grade Implementation
// =============================================================================
// GET   /api/settings/profile - Get editable profile settings
// PATCH /api/settings/profile - Update profile settings
// =============================================================================
// Schema: v7.8.0 | Access: Authenticated users (own profile only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface ProfileSettingsResponse {
  // Basic info
  id: string;
  email: string;
  emailVerified: boolean;
  
  // Personal info
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  
  // Contact
  phoneNumber: string | null;
  phoneVerified: boolean;
  
  // Demographics
  dateOfBirth: string | null;
  nationality: string | null;
  gender: string | null;
  
  // Location
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  
  // Preferences
  timezone: string;
  language: string;
  currency: string;
  
  // Account
  status: string;
  roles: string[];
  isSuperAdmin: boolean;
  
  // Security
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Related profiles
  hasPlayerProfile: boolean;
  hasCoachProfile: boolean;
  hasParentProfile: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateProfileSchema = z.object({
  // Personal info
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  
  // Contact
  phoneNumber: z.string().max(20).optional().nullable(),
  
  // Demographics
  dateOfBirth: z.string().datetime().optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  
  // Location
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  
  // Preferences
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

// =============================================================================
// GET HANDLER - Get Profile Settings
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Fetch user with related profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        phoneNumber: true,
        phoneVerified: true,
        dateOfBirth: true,
        nationality: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        timezone: true,
        language: true,
        currency: true,
        status: true,
        roles: true,
        isSuperAdmin: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        player: { select: { id: true } },
        coach: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not found',
        },
        requestId,
        status: 401,
      });
    }

    // 3. Build response
    const response: ProfileSettingsResponse = {
      id: user.id,
      email: user.email,
      emailVerified: !!user.emailVerified,
      
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatar: user.avatar,
      
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified || false,
      
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      nationality: user.nationality,
      gender: user.gender,
      
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      
      timezone: user.timezone || 'UTC',
      language: user.language || 'en',
      currency: user.currency || 'GBP',
      
      status: user.status,
      roles: user.roles,
      isSuperAdmin: user.isSuperAdmin,
      
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      
      hasPlayerProfile: !!user.player,
      hasCoachProfile: !!user.coach,
      hasParentProfile: !!user.parent,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Profile settings fetched`, {
      userId,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/settings/profile error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch profile settings',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Profile Settings
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
          details: JSON.stringify(validation.error.errors),
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Get current user for comparison
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not found',
        },
        requestId,
        status: 401,
      });
    }

    // 4. Build update data
    const updateData: Prisma.UserUpdateInput = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    // Personal info
    if (data.firstName !== undefined && data.firstName !== currentUser.firstName) {
      updateData.firstName = data.firstName;
      changes.firstName = { from: currentUser.firstName, to: data.firstName };
    }
    if (data.lastName !== undefined && data.lastName !== currentUser.lastName) {
      updateData.lastName = data.lastName;
      changes.lastName = { from: currentUser.lastName, to: data.lastName };
    }
    if (data.displayName !== undefined && data.displayName !== currentUser.displayName) {
      updateData.displayName = data.displayName;
      changes.displayName = { from: currentUser.displayName, to: data.displayName };
    }
    if (data.avatar !== undefined && data.avatar !== currentUser.avatar) {
      updateData.avatar = data.avatar;
      changes.avatar = { from: '[redacted]', to: '[redacted]' };
    }

    // Contact
    if (data.phoneNumber !== undefined && data.phoneNumber !== currentUser.phoneNumber) {
      updateData.phoneNumber = data.phoneNumber;
      updateData.phoneVerified = false; // Reset verification on change
      changes.phoneNumber = { from: '[redacted]', to: '[redacted]' };
    }

    // Demographics
    if (data.dateOfBirth !== undefined) {
      const newDob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      if (newDob?.getTime() !== currentUser.dateOfBirth?.getTime()) {
        updateData.dateOfBirth = newDob;
        changes.dateOfBirth = { from: currentUser.dateOfBirth?.toISOString(), to: data.dateOfBirth };
      }
    }
    if (data.nationality !== undefined && data.nationality !== currentUser.nationality) {
      updateData.nationality = data.nationality;
      changes.nationality = { from: currentUser.nationality, to: data.nationality };
    }
    if (data.gender !== undefined && data.gender !== currentUser.gender) {
      updateData.gender = data.gender;
      changes.gender = { from: currentUser.gender, to: data.gender };
    }

    // Location
    if (data.address !== undefined && data.address !== currentUser.address) {
      updateData.address = data.address;
      changes.address = { from: '[redacted]', to: '[redacted]' };
    }
    if (data.city !== undefined && data.city !== currentUser.city) {
      updateData.city = data.city;
      changes.city = { from: currentUser.city, to: data.city };
    }
    if (data.state !== undefined && data.state !== currentUser.state) {
      updateData.state = data.state;
      changes.state = { from: currentUser.state, to: data.state };
    }
    if (data.country !== undefined && data.country !== currentUser.country) {
      updateData.country = data.country;
      changes.country = { from: currentUser.country, to: data.country };
    }
    if (data.postalCode !== undefined && data.postalCode !== currentUser.postalCode) {
      updateData.postalCode = data.postalCode;
      changes.postalCode = { from: '[redacted]', to: '[redacted]' };
    }

    // Preferences
    if (data.timezone !== undefined && data.timezone !== currentUser.timezone) {
      updateData.timezone = data.timezone;
      changes.timezone = { from: currentUser.timezone, to: data.timezone };
    }
    if (data.language !== undefined && data.language !== currentUser.language) {
      updateData.language = data.language;
      changes.language = { from: currentUser.language, to: data.language };
    }
    if (data.currency !== undefined && data.currency !== currentUser.currency) {
      updateData.currency = data.currency;
      changes.currency = { from: currentUser.currency, to: data.currency };
    }

    // 5. Check if anything changed
    if (Object.keys(updateData).length === 0) {
      return createResponse({
        updated: false,
        message: 'No changes detected',
        timestamp: new Date().toISOString(),
      }, {
        success: true,
        requestId,
      });
    }

    // 6. Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        updatedAt: true,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_UPDATED',
        resourceType: 'USER',
        resourceId: userId,
        changes: Object.keys(changes),
        afterState: changes as unknown as Prisma.JsonObject,
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Profile settings updated`, {
      userId,
      fieldsUpdated: Object.keys(changes).length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      updated: true,
      fieldsUpdated: Object.keys(changes),
      profile: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
      },
      timestamp: updatedUser.updatedAt.toISOString(),
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/settings/profile error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update profile settings',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';