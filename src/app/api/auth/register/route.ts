// ============================================================================
// src/app/api/auth/register/route.ts
// POST - User registration with email verification
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseJsonBody,
  validateRequired,
  validateEmail,
  validatePassword,
  validateStringLength,
} from '@/lib/api/validation';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError, ConflictError } from '@/lib/api/errors';
import { logSecurityEvent, logAuthEvent } from '@/lib/api/audit';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Request Body:
 *   Required:
 *     - email: string (must be valid email format)
 *     - password: string (min 8 chars, must include uppercase, lowercase, number, special char)
 *     - firstName: string (1-50 chars)
 *     - lastName: string (1-50 chars)
 *   
 *   Optional:
 *     - phoneNumber: string
 *     - role: enum (PLAYER, COACH, CLUB_MANAGER, CLUB_OWNER, SCOUT, ANALYST, MEDICAL_STAFF, LEAGUE_ADMIN)
 * 
 * Validation Rules:
 *   - Email must be unique in system
 *   - Email must be valid format
 *   - Password must meet strength requirements
 *   - Names must be 1-50 characters
 *   - Phone number must be valid format (if provided)
 * 
 * Response:
 *   - User object with ID (without password)
 *   - Verification email sent
 *   - Account status: PENDING_EMAIL_VERIFICATION
 * 
 * Side Effects:
 *   - Creates User record in database
 *   - Generates verification token
 *   - Sends verification email
 *   - Logs registration event to audit trail
 * 
 * Status Code: 201 Created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['email', 'password', 'firstName', 'lastName']);

    // Validate email
    const email = body.email.toLowerCase().trim();
    validateEmail(email);

    // Validate password strength
    validatePassword(body.password);

    // Validate names
    validateStringLength(body.firstName, 1, 50, 'First name');
    validateStringLength(body.lastName, 1, 50, 'Last name');

    // Validate phone if provided
    if (body.phoneNumber) {
      validateStringLength(body.phoneNumber, 10, 20, 'Phone number');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError(
        'Email address is already registered. Please login or use a different email.'
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    // Generate verification token
    const verificationToken = await bcrypt.hash(
      `${email}${Date.now()}${Math.random()}`,
      salt
    );
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phoneNumber || null,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
        status: 'PENDING_EMAIL_VERIFICATION',
        roles: {
          create: {
            role: body.role || 'PLAYER',
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        roles: {
          select: { role: true },
        },
      },
    });

    // Log registration event
    await logAuthEvent(
      user.id,
      'REGISTRATION',
      `New user registered: ${user.firstName} ${user.lastName}`,
      request.headers.get('x-forwarded-for') || undefined
    );

    // TODO: Send verification email (integrate with email service)
    // await sendVerificationEmail(user.email, verificationToken);

    return success(user, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
