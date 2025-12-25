import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Signup API Route Handler
 * POST /api/auth/signup
 *
 * Handles user registration with:
 * - Email validation and uniqueness check
 * - Password hashing (bcryptjs)
 * - User profile creation (Player/Coach/Manager)
 * - Email verification token generation
 * - Verification email sending
 * - Comprehensive error handling
 */

/**
 * Request Validation Schema
 * Matches frontend SignupApiRequest interface
 */
const signupRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  firstName: z.string().min(2, 'First name is required').max(50).trim(),
  lastName: z.string().min(2, 'Last name is required').max(50).trim(),
  country: z.string().min(2, 'Country is required').max(100).trim(),
  city: z.string().max(50).trim().optional(),
  requestedRole: z.enum(['PLAYER', 'COACH', 'MANAGER', 'LEAGUE_ADMIN']),
  leagueCode: z.string().optional().nullable(),
});

type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * Response Types
 */
interface SuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    requestedRole: string;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * Rate Limiting (Basic in-memory store)
 * For production, use Redis
 */
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const attempt = signupAttempts.get(email);

  if (!attempt || now > attempt.resetTime) {
    signupAttempts.set(email, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return false;
  }

  if (attempt.count >= 5) {
    return true;
  }

  attempt.count++;
  return false;
}

/**
 * Hash password with bcryptjs
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong hashing
  return bcryptjs.hash(password, saltRounds);
}

/**
 * Generate email verification token
 */
function generateVerificationToken(): string {
  return uuidv4();
}

/**
 * Main POST Handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      logger.error('Invalid JSON in signup request');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request format',
          error: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate request schema
    const validationResult = signupRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join('; ');
      logger.warn('Signup validation failed', { errors });
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: errors,
        },
        { status: 400 }
      );
    }

    const data: SignupRequest = validationResult.data;

    // Rate limiting
    if (isRateLimited(data.email)) {
      logger.warn('Rate limit exceeded for signup', { email: data.email });
      return NextResponse.json(
        {
          success: false,
          message: 'Too many signup attempts',
          error: 'Please try again in 1 hour',
        },
        { status: 429 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      logger.info('Signup attempt with existing email', { email: data.email });
      return NextResponse.json(
        {
          success: false,
          message: 'Email already registered',
          error: 'This email is already associated with an account. Please sign in or use a different email.',
        },
        { status: 409 } // Conflict
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine initial roles
    const initialRoles: string[] = ['PLAYER'];
    if (data.requestedRole !== 'PLAYER') {
      initialRoles.push(data.requestedRole);
    }

    // Create user with transaction
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        city: data.city || null,
        roles: initialRoles,
        status: 'PENDING_EMAIL_VERIFICATION',
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationTokenExpires,

        // Create Player profile (always created)
        player: {
          create: {
            status: 'ACTIVE',
          },
        },

        // Create role-specific profiles if requested
        ...(data.requestedRole === 'COACH' && {
          coach: {
            create: {
              status: 'PENDING_VERIFICATION',
            },
          },
        }),
        ...(data.requestedRole === 'MANAGER' && {
          manager: {
            create: {
              status: 'PENDING_VERIFICATION',
            },
          },
        }),
        ...(data.requestedRole === 'LEAGUE_ADMIN' && {
          leagueAdmin: {
            create: {
              leagueCode: data.leagueCode || '',
              status: 'PENDING_VERIFICATION',
            },
          },
        }),
      },
    });

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;

      await sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        verificationUrl,
      });
    } catch (emailError) {
      // Log error but don't fail the signup
      logger.error('Failed to send verification email', {
        userId: user.id,
        email: user.email,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });

      // Consider: Send alert to admin, implement email retry queue
    }

    // Log successful signup
    logger.info('User signup successful', {
      userId: user.id,
      email: user.email,
      requestedRole: data.requestedRole,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please verify your email.',
        data: {
          userId: user.id,
          email: user.email,
          requestedRole: data.requestedRole,
        },
      },
      { status: 201 } // Created
    );
  } catch (error) {
    // Log unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Signup error', { error: errorMessage });

    // Don't expose internal error details to client
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
        error: 'Please try again later. If the problem persists, contact support.',
      },
      { status: 500 }
    );
  }
}

/**
 * Method Not Allowed
 */
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: 'This endpoint only accepts POST requests',
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: 'This endpoint only accepts POST requests',
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed',
      error: 'This endpoint only accepts POST requests',
    },
    { status: 405 }
  );
}
