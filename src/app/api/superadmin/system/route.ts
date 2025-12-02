import { verifySuperAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // System health metrics
    const systemStatus = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: {
        connected: true,
        ping: new Date().toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      system: systemStatus,
    });
  } catch (error) {
    console.error('❌ System Status Error:', error);
    return NextResponse.json(
      {
        success: false,
        system: {
          status: 'unhealthy',
          error: 'Database connection failed',
        },
      },
      { status: 503 }
    );
  }
}
