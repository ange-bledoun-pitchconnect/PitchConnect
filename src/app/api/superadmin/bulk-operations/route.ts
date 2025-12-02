import { verifySuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySuperAdmin(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, targetIds, data } = body;

    if (!operation || !targetIds || targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, targetIds' },
        { status: 400 }
      );
    }

    console.log(`🔄 Bulk Operation: ${operation} on ${targetIds.length} items`);

    let result: any = {};

    switch (operation) {
      case 'SUSPEND_USERS':
        result = await prisma.user.updateMany({
          where: { id: { in: targetIds } },
          data: { status: 'SUSPENDED' },
        });
        break;

      case 'ACTIVATE_USERS':
        result = await prisma.user.updateMany({
          where: { id: { in: targetIds } },
          data: { status: 'ACTIVE' },
        });
        break;

      case 'DELETE_USERS':
        result = await prisma.user.deleteMany({
          where: { id: { in: targetIds } },
        });
        break;

      case 'GRANT_SUPERADMIN':
        result = await prisma.user.updateMany({
          where: { id: { in: targetIds } },
          data: { isSuperAdmin: true },
        });
        break;

      case 'REVOKE_SUPERADMIN':
        result = await prisma.user.updateMany({
          where: { id: { in: targetIds } },
          data: { isSuperAdmin: false },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      affectedRecords: result.count,
    });
  } catch (error) {
    console.error('❌ Bulk Operation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
