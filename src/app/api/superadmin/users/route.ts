// src/app/api/superadmin/users/route.ts
/**
 * SuperAdmin Users API
 * GET  - List all users with advanced filtering
 * POST - Create new user (admin function)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  checkSuperAdminSession,
  getFilteredUsers,
  createAuditLog,
} from '@/lib/superadmin-helpers';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/users
 * List all users with filtering, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const searchParams = request.nextUrl.searchParams;
    const query = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      tier: searchParams.get('tier') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    if (query.page < 1) query.page = 1;
    if (query.limit < 1) query.limit = 1;
    if (query.limit > 100) query.limit = 100;

    const result = await getFilteredUsers(query);

    await createAuditLog(
      admin.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'users_list_accessed',
        filters: query,
        resultCount: result.users.length,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: result.users,
        pagination: result.pagination,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Users GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/users
 * Create a new user manually (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { email, firstName, lastName, password, roles = ['PLAYER'], status = 'ACTIVE' } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Email, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 12)
      : await bcrypt.hash(Math.random().toString(36).slice(2), 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        status,
        emailVerified: new Date(),
      },
    });

    for (const role of roles) {
      await prisma.userRole_User.create({
        data: {
          userId: newUser.id,
          roleName: role,
        },
      });
    }

    if (roles.includes('PLAYER')) {
      await prisma.player.create({
        data: {
          userId: newUser.id,
          firstName,
          lastName,
          dateOfBirth: new Date('2000-01-01'),
          nationality: 'Not Specified',
          position: 'MIDFIELDER',
          preferredFoot: 'RIGHT',
          status: 'ACTIVE',
        },
      });
    }

    await createAuditLog(
      admin.id,
      newUser.id,
      'USER_CREATED',
      {
        email,
        firstName,
        lastName,
        roles,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          roles,
          status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Users POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}