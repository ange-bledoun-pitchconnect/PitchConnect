// src/app/api/superadmin/subscriptions/route.ts
/**
 * SuperAdmin Subscriptions API
 * GET  - List all subscriptions with filters
 * POST - Bulk change subscription tiers or grant subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  checkSuperAdminSession,
  grantSubscription,
  cancelSubscription,
  createAuditLog,
} from '@/lib/superadmin-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (tier) filter.tier = tier;
    if (status) filter.status = status;

    const [subscriptions, totalCount] = await Promise.all([
      prisma.subscription.findMany({
        where: filter,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { currentPeriodEnd: 'desc' },
        take: limit,
        skip,
      }),
      prisma.subscription.count({ where: filter }),
    ]);

    await createAuditLog(
      admin.id,
      null,
      'DATA_EXPORTED',
      {
        action: 'subscriptions_list_accessed',
        filters: { tier, status },
        resultCount: subscriptions.length,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: subscriptions.map((sub) => ({
          id: sub.id,
          userId: sub.userId,
          user: sub.user,
          tier: sub.tier,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelledAt: sub.cancelledAt,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Subscriptions GET error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdminSession();

    const body = await request.json();
    const { action, userId, userIds, tier, durationDays = 30, reason = '' } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    let results: any = {};
    const validTiers = ['FREE', 'PLAYER_PRO', 'COACH', 'MANAGER', 'LEAGUE_ADMIN'];

    // ACTION: GRANT
    if (action === 'grant') {
      if (!userId || !tier) {
        return NextResponse.json(
          { success: false, error: 'userId and tier are required' },
          { status: 400 }
        );
      }

      if (!validTiers.includes(tier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tier' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const subscription = await grantSubscription(userId, tier, durationDays);

      await createAuditLog(
        admin.id,
        userId,
        'SUBSCRIPTION_GRANTED',
        {
          tier,
          durationDays,
          method: 'manual_grant',
        }
      );

      results = {
        action: 'grant',
        success: true,
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      };
    }

    // ACTION: CHANGE_TIER
    else if (action === 'change_tier') {
      if (!userIds || !Array.isArray(userIds) || !tier) {
        return NextResponse.json(
          { success: false, error: 'userIds (array) and tier are required' },
          { status: 400 }
        );
      }

      if (!validTiers.includes(tier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tier' },
          { status: 400 }
        );
      }

      if (userIds.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 users per operation' },
          { status: 400 }
        );
      }

      const updated: any[] = [];
      const failed: any[] = [];

      for (const uid of userIds) {
        try {
          const user = await prisma.user.findUnique({ where: { id: uid } });
          if (!user) {
            failed.push({ userId: uid, error: 'User not found' });
            continue;
          }

          const subscription = await grantSubscription(uid, tier, 365);

          await createAuditLog(
            admin.id,
            uid,
            'SUBSCRIPTION_GRANTED',
            {
              tier,
              method: 'bulk_change_tier',
              bulkId: userIds.join(','),
            }
          );

          updated.push({
            userId: uid,
            tier: subscription.tier,
            status: subscription.status,
          });
        } catch (err) {
          failed.push({
            userId: uid,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      results = {
        action: 'change_tier',
        tier,
        updated: updated.length,
        failed: failed.length,
        details: { updated, failed },
      };
    }

    // ACTION: CANCEL
    else if (action === 'cancel') {
      if (!userIds || !Array.isArray(userIds)) {
        return NextResponse.json(
          { success: false, error: 'userIds (array) is required' },
          { status: 400 }
        );
      }

      if (userIds.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 users per operation' },
          { status: 400 }
        );
      }

      const cancelled: any[] = [];
      const failed: any[] = [];

      for (const uid of userIds) {
        try {
          const user = await prisma.user.findUnique({ where: { id: uid } });
          if (!user) {
            failed.push({ userId: uid, error: 'User not found' });
            continue;
          }

          const subscription = await cancelSubscription(uid, reason);

          await createAuditLog(
            admin.id,
            uid,
            'SUBSCRIPTION_CANCELLED',
            {
              reason,
              method: 'admin_cancel',
            }
          );

          cancelled.push({
            userId: uid,
            tier: subscription.tier,
            cancelledAt: subscription.cancelledAt,
          });
        } catch (err) {
          failed.push({
            userId: uid,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      results = {
        action: 'cancel',
        cancelled: cancelled.length,
        failed: failed.length,
        details: { cancelled, failed },
      };
    }

    // ACTION: BULK_GRANT
    else if (action === 'bulk_grant') {
      if (!userIds || !Array.isArray(userIds) || !tier) {
        return NextResponse.json(
          { success: false, error: 'userIds (array) and tier are required' },
          { status: 400 }
        );
      }

      if (!validTiers.includes(tier)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tier' },
          { status: 400 }
        );
      }

      if (userIds.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 users per operation' },
          { status: 400 }
        );
      }

      const granted: any[] = [];
      const failed: any[] = [];

      for (const uid of userIds) {
        try {
          const user = await prisma.user.findUnique({ where: { id: uid } });
          if (!user) {
            failed.push({ userId: uid, error: 'User not found' });
            continue;
          }

          const subscription = await grantSubscription(uid, tier, durationDays);

          await createAuditLog(
            admin.id,
            uid,
            'SUBSCRIPTION_GRANTED',
            {
              tier,
              durationDays,
              method: 'bulk_grant',
            }
          );

          granted.push({
            userId: uid,
            tier: subscription.tier,
            status: subscription.status,
            expiresAt: subscription.currentPeriodEnd,
          });
        } catch (err) {
          failed.push({
            userId: uid,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      results = {
        action: 'bulk_grant',
        tier,
        durationDays,
        granted: granted.length,
        failed: failed.length,
        details: { granted, failed },
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SuperAdmin] Subscriptions POST error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}