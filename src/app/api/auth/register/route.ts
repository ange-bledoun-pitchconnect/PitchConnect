// ============================================================================
// FILE: src/app/api/auth/register/route.ts
// ============================================================================
// User Registration Endpoint

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, validatePassword, isValidEmail, sanitizeEmail } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Sanitize email
    const email = sanitizeEmail(validatedData.email);

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(validatedData.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password is not strong enough',
          details: passwordValidation.errors,
          suggestions: passwordValidation.suggestions,
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        roles: ['PLAYER'],
        status: 'PENDING_VERIFICATION',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        performedById: newUser.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        details: `User registered: ${email}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}