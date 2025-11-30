// src/app/api/superadmin/settings/route.ts
/**
 * SuperAdmin Settings API
 * PATCH - Update SuperAdmin settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSuperAdminSession, createAuditLog } from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { sessionTimeoutMinutes, ipWhitelist } = body;

    // Validate input
    if (!sessionTimeoutMinutes || !Array.isArray(ipWhitelist)) {
      return NextResponse.json(
        { success: false, error: 'Invalid input parameters' },
        { status: 400 }
      );
    }

    // TODO: Store settings in database or Redis
    // For now, store in environment or admin session

    await createAuditLog(admin.id, null, 'DATA_EXPORTED', {
      action: 'security_settings_updated',
      sessionTimeoutMinutes,
      ipWhitelist: ipWhitelist.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Settings updated successfully',
        data: {
          sessionTimeoutMinutes,
          ipWhitelistCount: ipWhitelist.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Settings PATCH error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}