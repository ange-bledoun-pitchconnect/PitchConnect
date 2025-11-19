/**
 * SuperAdmin Subscriptions Management API
 * Manage user subscriptions and payments
 * @route GET   /api/superadmin/subscriptions - List all subscriptions
 * @route POST  /api/superadmin/subscriptions - Grant subscription
 * @route PATCH /api/superadmin/subscriptions - Update subscription
 * @route DELETE /api/superadmin/subscriptions - Revoke subscription
 * @access SuperAdmin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth';

// ============================================================================
// GET - List All Subscriptions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {};

    if (tier) {
      where.tier = tier;
    }

    if (status) {
      where.status = status;
    }

    // Fetch subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get total count
    const total = await prisma.subscription.count({ where });

    // Format response
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      user: {
        id: sub.user.id,
        name: `${sub.user.firstName} ${sub.user.lastName}`,
        email: sub.user.email,
      },
      tier: sub.tier,
      status: sub.status,
      price: sub.price,
      currency: sub.currency,
      interval: sub.interval,
      isCustomPrice: sub.isCustomPrice,
      isAdminGranted: sub.isAdminGranted,
      isTrial: sub.isTrial,
      trialEndsAt: sub.trialEndsAt?.toISOString() || null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toISOString() || null,
      createdAt: sub.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        subscriptions: formattedSubscriptions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscriptions GET Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Grant Subscription
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { userId, tier, duration, price, reason } = body;

    // Validation
    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier' },
        { status: 400 }
      );
    }

    // Valid tiers
    const validTiers = ['FREE', 'PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date();

    // Duration in months (default 1 month, or custom)
    const durationMonths = duration || 1;
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing subscription if any
      if (user.subscription) {
        await tx.subscription.delete({
          where: { userId: userId },
        });
      }

      // Create new subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: userId,
          tier: tier,
          status: 'ACTIVE',
          price: price || 0, // Custom price or 0 for free grants
          currency: 'GBP',
          interval: 'MONTHLY',
          isCustomPrice: price ? true : false,
          isAdminGranted: true, // Mark as admin-granted
          isTrial: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // Update user role if needed
      const roleMap: Record<string, string> = {
        PLAYER_PRO: 'PLAYER_PRO',
        COACH: 'COACH',
        CLUB_MANAGER: 'CLUB_MANAGER',
        LEAGUE_ADMIN: 'LEAGUE_ADMIN',
      };

      if (roleMap[tier]) {
        const newRoles = [...new Set([...user.roles, roleMap[tier]])];
        await tx.user.update({
          where: { id: userId },
          data: { roles: newRoles },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          performedBy: adminUser.id,
          affectedUser: userId,
          action: 'SUBSCRIPTION_GRANTED',
          entityType: 'Subscription',
          entityId: subscription.id,
          newValue: {
            tier: tier,
            duration: durationMonths,
            price: price || 0,
          },
          reason: reason || `${tier} subscription granted by SuperAdmin for ${durationMonths} month(s)`,
        },
      });

      // Create notification for user
      await tx.notification.create({
        data: {
          userId: userId,
          type: 'SUBSCRIPTION_CHANGED',
          title: 'Premium Access Granted! 🎉',
          message: `You have been granted ${tier} access for ${durationMonths} month(s). Enjoy your premium features!`,
          link: '/dashboard',
        },
      });

      return subscription;
    });

    return NextResponse.json(
      {
        message: 'Subscription granted successfully',
        subscription: {
          id: result.id,
          tier: result.tier,
          status: result.status,
          validUntil: result.currentPeriodEnd?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscriptions POST Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Subscription
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { subscriptionId, action, data } = body;

    // Validation
    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, action' },
        { status: 400 }
      );
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    let updatedSubscription;
    let auditAction;
    let auditReason;
    let notificationMessage;

    switch (action) {
      case 'EXTEND':
        const extensionMonths = data?.months || 1;
        const newEndDate = new Date(subscription.currentPeriodEnd || new Date());
        newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { currentPeriodEnd: newEndDate },
        });

        auditAction = 'SUBSCRIPTION_EXTENDED';
        auditReason = `Subscription extended by ${extensionMonths} month(s)`;
        notificationMessage = `Your ${subscription.tier} subscription has been extended by ${extensionMonths} month(s)!`;
        break;

      case 'PAUSE':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'PAUSED' },
        });

        auditAction = 'SUBSCRIPTION_PAUSED';
        auditReason = data?.reason || 'Subscription paused by SuperAdmin';
        notificationMessage = 'Your subscription has been paused.';
        break;

      case 'RESUME':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE' },
        });

        auditAction = 'SUBSCRIPTION_RESUMED';
        auditReason = 'Subscription resumed by SuperAdmin';
        notificationMessage = 'Your subscription has been resumed!';
        break;

      case 'CHANGE_TIER':
        if (!data?.tier) {
          return NextResponse.json({ error: 'Missing tier' }, { status: 400 });
        }

        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { tier: data.tier },
        });

        auditAction = 'SUBSCRIPTION_CHANGED';
        auditReason = `Tier changed from ${subscription.tier} to ${data.tier}`;
        notificationMessage = `Your subscription has been upgraded to ${data.tier}!`;
        break;

      case 'UPDATE_PRICE':
        if (data?.price === undefined) {
          return NextResponse.json({ error: 'Missing price' }, { status: 400 });
        }

        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            price: data.price,
            isCustomPrice: true,
          },
        });

        auditAction = 'SUBSCRIPTION_CHANGED';
        auditReason = `Price updated to £${data.price}`;
        notificationMessage = `Your subscription price has been updated to £${data.price}/month.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        affectedUser: subscription.userId,
        action: auditAction,
        entityType: 'Subscription',
        entityId: subscriptionId,
        previousValue: {
          tier: subscription.tier,
          status: subscription.status,
          price: subscription.price,
        },
        newValue: {
          tier: updatedSubscription.tier,
          status: updatedSubscription.status,
          price: updatedSubscription.price,
        },
        reason: auditReason,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        type: 'SUBSCRIPTION_CHANGED',
        title: 'Subscription Updated',
        message: notificationMessage,
        link: '/dashboard/settings',
      },
    });

    return NextResponse.json(
      {
        message: `Subscription ${action.toLowerCase()}d successfully`,
        subscription: {
          id: updatedSubscription.id,
          tier: updatedSubscription.tier,
          status: updatedSubscription.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscriptions PATCH Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Revoke Subscription
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // SuperAdmin check
    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get SuperAdmin user
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const reason = searchParams.get('reason');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: subscriptionId' },
        { status: 400 }
      );
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Use transaction
    await prisma.$transaction(async (tx) => {
      // Update to cancelled status instead of deleting
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          performedBy: adminUser.id,
          affectedUser: subscription.userId,
          action: 'SUBSCRIPTION_REVOKED',
          entityType: 'Subscription',
          entityId: subscriptionId,
          reason: reason || 'Subscription revoked by SuperAdmin',
        },
      });

      // Send notification
      await tx.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_CHANGED',
          title: 'Subscription Cancelled',
          message: reason || 'Your subscription has been cancelled by an administrator.',
          link: '/dashboard/settings',
        },
      });
    });

    return NextResponse.json(
      { message: 'Subscription revoked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscriptions DELETE Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export route segment config
// ============================================================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
