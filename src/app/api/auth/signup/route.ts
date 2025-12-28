/**
 * ============================================================================
 * 🏆 PITCHCONNECT - User Signup API
 * Path: src/app/api/auth/signup/route.ts
 * ============================================================================
 * 
 * POST /api/auth/signup
 * 
 * Enterprise Features:
 * - Email validation & uniqueness check
 * - Password hashing (PBKDF2, zero dependencies)
 * - Multi-role support (PLAYER always included)
 * - Email verification token generation
 * - Rate limiting (5 attempts/hour)
 * - Profile creation (Player, Coach, etc.)
 * - Comprehensive audit logging
 * - Prisma database integration
 * 
 * Schema Alignment:
 * - UserRole enum: PLAYER, COACH, MANAGER, TREASURER, CLUB_OWNER, LEAGUE_ADMIN, etc.
 * - UserStatus enum: PENDING_EMAIL_VERIFICATION → ACTIVE
 * - User.roles is String[] array, not relation
 * - Creates associated profile records (Player, Coach, etc.)
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging';
import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const PASSWORD_MIN_LENGTH = 8;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const TOKEN_EXPIRY_HOURS = 24;
const MAX_SIGNUP_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Rate limiter (use Redis in production)
const signupAttempts = new Map<string, { count: number; resetAt: number }>();

// ============================================================================
// VALIDATION SCHEMA - Aligned with Prisma UserRole enum
// ============================================================================

const SignupSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name is required').max(50).trim(),
  lastName: z.string().min(2, 'Last name is required').max(50).trim(),
  country: z.string().min(2, 'Country is required').max(100).trim().optional(),
  city: z.string().max(100).trim().optional(),
  // Aligned with UserRole enum from schema
  requestedRole: z.enum([
    'PLAYER',
    'COACH',
    'MANAGER',
    'TREASURER',
    'CLUB_OWNER',
    'LEAGUE_ADMIN',
    'REFEREE',
    'SCOUT',
    'ANALYST',
    'PARENT',
  ]).default('PLAYER'),
  acceptMarketing: z.boolean().optional().default(false),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type SignupInput = z.infer<typeof SignupSchema>;

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================================================

function generateSalt(): string {
  const array = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${salt}:${hashHex}`;
}

function generateVerificationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// RATE LIMITING
// ============================================================================

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = signupAttempts.get(email);

  if (!record || record.resetAt < now) {
    signupAttempts.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_SIGNUP_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// EMAIL SERVICE (Stub - implement with your provider)
// ============================================================================

async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

  if (process.env.NODE_ENV === 'development') {
    logger.info('Verification email (dev)', {
      email,
      firstName,
      verificationUrl,
    });
  }

  // Production: Use SendGrid, Resend, etc.
  // await resend.emails.send({
  //   from: 'PitchConnect <noreply@pitchconnect.com>',
  //   to: email,
  //   subject: 'Verify Your Email - PitchConnect',
  //   html: `<p>Hi ${firstName},</p><p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
  // });
}

// ============================================================================
// PROFILE CREATION HELPERS
// ============================================================================

/**
 * Get roles array - PLAYER is always included
 */
function getRolesArray(requestedRole: string): string[] {
  const roles = ['PLAYER'];
  if (requestedRole !== 'PLAYER' && !roles.includes(requestedRole)) {
    roles.push(requestedRole);
  }
  return roles;
}

/**
 * Create role-specific profile after user creation
 */
async function createRoleProfile(
  userId: string,
  role: string
): Promise<void> {
  try {
    switch (role) {
      case 'PLAYER':
        // Player profile is always created
        await prisma.player.upsert({
          where: { userId },
          create: {
            userId,
            isActive: true,
            isVerified: false,
            availabilityStatus: 'AVAILABLE',
          },
          update: {},
        });
        break;

      case 'COACH':
        await prisma.coach.create({
          data: {
            userId,
            isVerified: false,
            isAvailable: true,
          },
        });
        break;

      case 'REFEREE':
        await prisma.referee.create({
          data: {
            userId,
            isVerified: false,
            isActive: true,
          },
        });
        break;

      case 'SCOUT':
        await prisma.scout.create({
          data: {
            userId,
            isVerified: false,
            isActive: true,
          },
        });
        break;

      case 'ANALYST':
        await prisma.analyst.create({
          data: {
            userId,
            isVerified: false,
            isActive: true,
          },
        });
        break;

      case 'MANAGER':
      case 'CLUB_MANAGER':
        await prisma.clubManager.create({
          data: { userId },
        });
        break;

      case 'CLUB_OWNER':
        await prisma.clubOwner.create({
          data: { userId },
        });
        break;

      case 'PARENT':
        await prisma.parent.create({
          data: { userId },
        });
        break;

      case 'TREASURER':
        await prisma.treasurer.create({
          data: { userId },
        });
        break;

      default:
        // No additional profile needed
        break;
    }
  } catch (error) {
    logger.error('Failed to create role profile', error as Error, { userId, role });
    // Don't throw - user is created, profile can be created later
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // ========================================================================
    // PARSE & VALIDATE
    // ========================================================================

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    const validation = SignupSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join('; ');
      return NextResponse.json(
        { success: false, message: 'Validation failed', error: errors },
        { status: 400 }
      );
    }

    const data: SignupInput = validation.data;

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    if (!checkRateLimit(data.email)) {
      logger.warn('Signup rate limit exceeded', { email: data.email, ip: clientIp });
      return NextResponse.json(
        { success: false, message: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // ========================================================================
    // CHECK EMAIL UNIQUENESS
    // ========================================================================

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      logger.info('Signup with existing email', { email: data.email });
      return NextResponse.json(
        { 
          success: false, 
          message: 'An account with this email already exists',
          error: 'Please sign in or use a different email address.',
        },
        { status: 409 }
      );
    }

    // ========================================================================
    // GENERATE CREDENTIALS
    // ========================================================================

    const hashedPassword = await hashPassword(data.password);
    const verificationToken = generateVerificationToken();
    const hashedVerificationToken = await hashToken(verificationToken);
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    const roles = getRolesArray(data.requestedRole);

    // ========================================================================
    // CREATE USER
    // ========================================================================

    const user = await prisma.user.create({
      data: {
        // Core fields
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`,
        
        // Location (optional)
        nationality: data.country,
        
        // Roles & Status (aligned with schema)
        roles: roles as any, // UserRole[] enum array
        status: 'PENDING_EMAIL_VERIFICATION',
        userType: 'INDIVIDUAL',
        accountTier: 'FREE',
        
        // Email verification
        emailVerified: null,
        // Note: emailVerificationToken field needs to be added to schema
        // For now, we'll use the VerificationToken model
        
        // Consent & Marketing
        marketingEmailsEnabled: data.acceptMarketing || false,
        termsAcceptedAt: new Date(),
        gdprConsent: true,
        gdprConsentDate: new Date(),
        
        // Defaults
        emailNotificationsEnabled: true,
        pushNotificationsEnabled: true,
        language: 'en-GB',
        timezone: 'Europe/London',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        status: true,
        createdAt: true,
      },
    });

    // ========================================================================
    // CREATE VERIFICATION TOKEN
    // ========================================================================

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedVerificationToken,
        type: 'EMAIL',
        expires: tokenExpiry,
      },
    });

    // ========================================================================
    // CREATE PLAYER PROFILE (Always)
    // ========================================================================

    await createRoleProfile(user.id, 'PLAYER');

    // ========================================================================
    // CREATE ADDITIONAL ROLE PROFILE (If requested)
    // ========================================================================

    if (data.requestedRole !== 'PLAYER') {
      await createRoleProfile(user.id, data.requestedRole);
    }

    // ========================================================================
    // SEND VERIFICATION EMAIL
    // ========================================================================

    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError as Error, {
        userId: user.id,
        email: user.email,
      });
      // Don't fail signup - email can be resent
    }

    // ========================================================================
    // AUDIT LOG
    // ========================================================================

    logger.info('User signup successful', {
      userId: user.id,
      email: user.email,
      roles: roles,
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          userId: user.id,
          email: user.email,
          roles: user.roles,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('Signup error', error as Error, {
      ip: clientIp,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });

    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// ============================================================================
// METHOD NOT ALLOWED HANDLERS
// ============================================================================

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}