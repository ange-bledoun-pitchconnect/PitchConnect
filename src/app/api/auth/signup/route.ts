/**
 * Signup API Endpoint
 * POST /api/auth/signup
 * Creates new user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isValidEmail, isValidPassword } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, roles = ['PLAYER'] } = body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email' },
        { status: 400 }
      );
    }

    if (!password || !isValidPassword(password)) {
      return NextResponse.json(
        { message: 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { message: 'First and last name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roles,
        status: 'PENDING_VERIFICATION',
        preferences: {
          create: {},
        },
      },
    });

    // Create player profile
    if (roles.includes('PLAYER')) {
      await db.player.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          dateOfBirth: new Date(),
          nationality: 'Unknown',
          position: 'MIDFIELDER',
          preferredFoot: 'RIGHT',
        },
      });
    }

    // Log signup
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
