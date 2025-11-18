/**
 * Authentication Signup Route
 * POST /api/auth/signup - Handle user registration with role selection
 * Creates user as Player by default, optionally creates additional role profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

// ========================================
// TYPES & INTERFACES
// ========================================

type RequestedRole =
  | 'PLAYER'
  | 'COACH'
  | 'CLUB_MANAGER'
  | 'LEAGUE_ADMIN'
  | 'PARENT';

interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  requestedRole?: RequestedRole;
  leagueCode?: string;
}

// ========================================
// VALIDATION HELPERS
// ========================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// ========================================
// MAIN SIGNUP HANDLER
// ========================================

export async function POST(req: NextRequest) {
  try {
    const body: SignupRequest = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      requestedRole,
      leagueCode,
    } = body;

    // ========================================
    // VALIDATION
    // ========================================

    // Check required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: email, password, firstName, lastName',
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters with 1 uppercase letter and 1 number',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Validate league code if LeagueAdmin requested
    if (requestedRole === 'LEAGUE_ADMIN') {
      if (!leagueCode) {
        return NextResponse.json(
          { error: 'League code is required for League Organizers' },
          { status: 400 }
        );
      }

      // Optional: Uncomment to verify league code exists
      // const league = await db.league.findUnique({ where: { code: leagueCode } });
      // if (!league) {
      //   return NextResponse.json(
      //     { error: 'Invalid league code' },
      //     { status: 400 }
      //   );
      // }
    }

    // ========================================
    // CREATE USER ACCOUNT
    // ========================================

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roles: ['PLAYER'],
        status: 'PENDING_VERIFICATION',
        emailVerified: null,
      },
    });

    // ========================================
    // CREATE PLAYER PROFILE
    // ========================================

    await db.player.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: new Date('2000-01-01'),
        nationality: 'Not Specified',
        position: 'MIDFIELDER',
        preferredFoot: 'RIGHT',
        status: 'ACTIVE',
      },
    });

    // ========================================
    // CREATE ADDITIONAL ROLE PROFILES
    // ========================================

    const rolesToAdd: RequestedRole[] = [];

    if (requestedRole && requestedRole !== 'PLAYER') {
      try {
        switch (requestedRole) {
          case 'COACH':
            await db.coach.create({
              data: {
                userId: user.id,
                bio: null,
                yearsExperience: null,
                qualifications: [],
                specializations: [],
              },
            });
            rolesToAdd.push('COACH');
            break;

          case 'CLUB_MANAGER':
            await db.clubManager.create({
              data: {
                userId: user.id,
              },
            });
            rolesToAdd.push('CLUB_MANAGER');
            break;

          case 'LEAGUE_ADMIN':
            await db.leagueAdmin.create({
              data: {
                userId: user.id,
              },
            });
            rolesToAdd.push('LEAGUE_ADMIN');
            break;

          case 'PARENT':
            await db.parent.create({
              data: {
                userId: user.id,
              },
            });
            rolesToAdd.push('PARENT');
            break;

          default:
            // PLAYER role is already created, do nothing
            break;
        }

        // Add the additional role to user
        if (rolesToAdd.length > 0) {
          await db.user.update({
            where: { id: user.id },
            data: {
              roles: [...user.roles, ...rolesToAdd],
            },
          });
        }
      } catch (roleError) {
        console.error('[Signup] Error creating role profile:', roleError);
        // Continue with signup even if role creation fails
      }
    }

    // ========================================
    // SEND VERIFICATION EMAIL
    // ========================================

    try {
      const verificationToken = generateVerificationToken();

      // Store verification token
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send email
      await sendVerificationEmail(
        email,
        user.firstName,
        verificationToken,
        user.id
      );
    } catch (emailError) {
      console.error('[Signup] Failed to send verification email:', emailError);
      // Don't fail signup if email fails
    }

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return NextResponse.json(
      {
        message:
          'Account created successfully. Please check your email to verify.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: [...user.roles, ...rolesToAdd],
          status: user.status,
          profileCreated: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER: Generate secure token
// ========================================

function generateVerificationToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
