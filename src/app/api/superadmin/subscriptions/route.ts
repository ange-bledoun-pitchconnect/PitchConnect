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
// PRICING STRUCTURE - All 6 Tiers
// ============================================================================

const PRICING = {
  FREE: {
    monthly: 0,
    annual: 0,
    features: ['Basic access', 'Limited stats', 'Community support']
  },
  PLAYER: {
    monthly: 4.99,
    annual: 49.99,
    features: ['Player dashboard', 'Basic stats', 'Match history']
  },
  PLAYER_PRO: {
    monthly: 9.99,
    annual: 99.99,
    features: ['Advanced stats', 'Performance tracking', 'Video analysis']
  },
  COACH: {
    monthly: 19.99,
    annual: 199.99,
    features: ['Team management', 'Training plans', 'Player analytics']
  },
  CLUB_MANAGER: {
    monthly: 29.99,
    annual: 299.99,
    features: ['Full club access', 'Financial management', 'Staff coordination']
  },
  LEAGUE_ADMIN: {
    monthly: 49.99,
    annual: 499.99,
    features: ['League management', 'Multi-club access', 'Competition tools']
  },
};

// ============================================================================
// GET - List ALL Users with Subscriptions (Including FREE)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('\n💳 ===== FETCHING ALL USERS & SUBSCRIPTIONS =====');
    console.log('📊 Tab:', tab);

    // ENHANCED: Fetch ALL users (with or without subscriptions)
    const users = await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
        userRoles: {
          select: { roleName: true }
        },
      },
    });

    console.log(`✅ Found ${users.length} total users`);

    // Map ALL users to subscription format
    const allSubscriptions = users.map((user) => {
      const sub = user.subscription;
      
      // Build user name with fallback
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const userName = `${firstName} ${lastName}`.trim() || 
                       user.email?.split('@')[0] || 
                       'User';

      // Determine tier (default to FREE if no subscription)
      const tier = sub?.tier || 'FREE';
      const isFree = !sub || tier === 'FREE';
      
      // Get pricing for tier
      const tierPricing = PRICING[tier as keyof typeof PRICING] || PRICING.FREE;
      const billingCycle = sub?.interval || 'MONTHLY';
      const price = sub?.price !== undefined ? sub.price : 
                    (billingCycle === 'MONTHLY' ? tierPricing.monthly : tierPricing.annual);

      console.log(`💳 ${user.email}: Tier=${tier}, Price=£${price}, Free=${isFree}`);

      return {
        id: sub?.id || user.id,
        userId: user.id,
        userName: userName,
        userEmail: user.email,
        plan: tier,
        status: sub?.status || 'ACTIVE',
        price: price,
        currency: 'GBP',
        billingCycle: billingCycle,
        isFree: isFree,
        isCustomPrice: sub?.isCustomPrice || false,
        isTrial: sub?.isTrial || false,
        isAdminGranted: sub?.isAdminGranted || false,
        startDate: sub?.startDate?.toISOString() || user.createdAt.toISOString(),
        renewalDate: sub?.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        expiresAt: sub?.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        trialEndsAt: sub?.trialEndsAt?.toISOString() || null,
        paymentMethod: sub ? 'Card' : null,
        lastPaymentDate: sub?.updatedAt?.toISOString() || null,
        nextBillingDate: sub?.currentPeriodEnd?.toISOString() || null,
        features: tierPricing.features,
      };
    });

    // Calculate comprehensive stats
    const stats = {
      total: allSubscriptions.length,
      free: allSubscriptions.filter(s => s.isFree).length,
      paid: allSubscriptions.filter(s => !s.isFree).length,
      active: allSubscriptions.filter(s => s.status === 'ACTIVE' && !s.isFree).length,
      trial: allSubscriptions.filter(s => s.isTrial).length,
      cancelled: allSubscriptions.filter(s => s.status === 'CANCELLED').length,
      byTier: {
        FREE: allSubscriptions.filter(s => s.plan === 'FREE').length,
        PLAYER: allSubscriptions.filter(s => s.plan === 'PLAYER').length,
        PLAYER_PRO: allSubscriptions.filter(s => s.plan === 'PLAYER_PRO').length,
        COACH: allSubscriptions.filter(s => s.plan === 'COACH').length,
        CLUB_MANAGER: allSubscriptions.filter(s => s.plan === 'CLUB_MANAGER').length,
        LEAGUE_ADMIN: allSubscriptions.filter(s => s.plan === 'LEAGUE_ADMIN').length,
      },
      revenue: {
        monthly: allSubscriptions
          .filter(s => !s.isFree && s.status === 'ACTIVE' && s.billingCycle === 'MONTHLY')
          .reduce((sum, s) => sum + s.price, 0),
        annual: allSubscriptions
          .filter(s => !s.isFree && s.status === 'ACTIVE' && s.billingCycle === 'ANNUAL')
          .reduce((sum, s) => sum + s.price, 0),
      },
    };

    console.log('📊 Subscription Stats:', stats);
    console.log('===== SUBSCRIPTIONS COMPLETE =====\n');

    return NextResponse.json(
      {
        subscriptions: allSubscriptions,
        stats,
        pricing: PRICING,
        pagination: {
          total: allSubscriptions.length,
          limit,
          offset,
          hasMore: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Subscriptions GET Error:', error);
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
// POST - Grant Subscription (All 6 Tiers)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, tier, duration, customPrice, reason } = body;

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier' },
        { status: 400 }
      );
    }

    // ENHANCED: All 6 valid tiers
    const validTiers = ['FREE', 'PLAYER', 'PLAYER_PRO', 'COACH', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get pricing for tier
    const tierPricing = PRICING[tier as keyof typeof PRICING];
    const price = customPrice !== undefined ? customPrice : tierPricing.monthly;

    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date();
    const durationMonths = duration || 1;
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    const result = await prisma.$transaction(async (tx) => {
      // Delete existing subscription if any
      if (user.subscription) {
        await tx.subscription.delete({
          where: { userId: userId },
        });
      }

      // Create new subscription (even for FREE tier)
      const subscription = await tx.subscription.create({
        data: {
          userId: userId,
          tier: tier,
          status: 'ACTIVE',
          price: price,
          currency: 'GBP',
          interval: 'MONTHLY',
          isCustomPrice: customPrice !== undefined,
          isAdminGranted: true,
          isTrial: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // Update user roles based on tier
      const roleMap: Record<string, string> = {
        PLAYER: 'PLAYER',
        PLAYER_PRO: 'PLAYER',
        COACH: 'COACH',
        CLUB_MANAGER: 'CLUB_MANAGER',
        LEAGUE_ADMIN: 'LEAGUE_ADMIN',
      };

      if (roleMap[tier]) {
        await tx.userRoleUser.create({
          data: {
            userId: userId,
            roleName: roleMap[tier],
          },
        }).catch(() => {
          // Role might already exist
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          performedBy: adminUser.id,
          affectedUser: userId,
          action: 'SUBSCRIPTIONGRANTED',
          entityType: 'Subscription',
          entityId: subscription.id,
          newValue: JSON.stringify({
            tier: tier,
            duration: durationMonths,
            price: price,
          }),
          reason: reason || `${tier} subscription granted for ${durationMonths} month(s)`,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: userId,
          type: 'SYSTEM_ALERT',
          title: tier === 'FREE' ? 'Free Access Confirmed' : 'Premium Access Granted! 🎉',
          message: tier === 'FREE' 
            ? 'You have free access to basic features.'
            : `You have been granted ${tier.replace('_', ' ')} access for ${durationMonths} month(s).`,
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
          price: result.price,
          validUntil: result.currentPeriodEnd?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Subscriptions POST Error:', error);
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const body = await request.json();
    const { subscriptionId, action, data } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, action' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

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

        auditAction = 'SUBSCRIPTIONCHANGED';
        auditReason = `Extended by ${extensionMonths} month(s)`;
        notificationMessage = `Your ${subscription.tier} subscription extended by ${extensionMonths} month(s)!`;
        break;

      case 'PAUSE':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'PAUSED' },
        });

        auditAction = 'SUBSCRIPTIONCHANGED';
        auditReason = data?.reason || 'Paused by SuperAdmin';
        notificationMessage = 'Your subscription has been paused.';
        break;

      case 'RESUME':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE' },
        });

        auditAction = 'SUBSCRIPTIONCHANGED';
        auditReason = 'Resumed by SuperAdmin';
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

        auditAction = 'SUBSCRIPTIONCHANGED';
        auditReason = `Tier changed from ${subscription.tier} to ${data.tier}`;
        notificationMessage = `Subscription upgraded to ${data.tier.replace('_', ' ')}!`;
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

        auditAction = 'SUBSCRIPTIONCHANGED';
        auditReason = `Price updated to £${data.price}`;
        notificationMessage = `Subscription price updated to £${data.price}/month.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        affectedUser: subscription.userId,
        action: auditAction,
        entityType: 'Subscription',
        entityId: subscriptionId,
        previousValue: JSON.stringify({
          tier: subscription.tier,
          status: subscription.status,
          price: subscription.price,
        }),
        newValue: JSON.stringify({
          tier: updatedSubscription.tier,
          status: updatedSubscription.status,
          price: updatedSubscription.price,
        }),
        reason: auditReason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        type: 'SYSTEM_ALERT',
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
    console.error('❌ Subscriptions PATCH Error:', error);
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const reason = searchParams.get('reason');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: subscriptionId' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });

      await tx.auditLog.create({
        data: {
          performedBy: adminUser.id,
          affectedUser: subscription.userId,
          action: 'SUBSCRIPTIONCANCELLED',
          entityType: 'Subscription',
          entityId: subscriptionId,
          reason: reason || 'Revoked by SuperAdmin',
        },
      });

      await tx.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SYSTEM_ALERT',
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
    console.error('❌ Subscriptions DELETE Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;