/**
 * Payments API Endpoints
 * Handles Stripe payment processing and subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

// ========================================
// TYPES & INTERFACES
// ========================================

interface PaymentRequestBody {
  planId: string;
  amount: number;
  currency?: string;
}

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}

// ========================================
// STRIPE INITIALIZATION
// ========================================

let stripe: Stripe | null = null;

if (process.env['STRIPE_SECRET_KEY']) {
  stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
    apiVersion: '2025-02-24.acacia',
  });
}

// ========================================
// POST /api/payments
// Create payment intent for subscription
// ========================================

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body: PaymentRequestBody = await req.json();
    const { planId, amount, currency = 'GBP' } = body;

    // Validate required fields
    if (!planId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, amount' },
        { status: 400 }
      );
    }

    const sessionUser = session.user as SessionUser;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: sessionUser.id,
        planId,
      },
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// ========================================
// GET /api/payments
// Get user subscription status
// ========================================

export async function GET() {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = session.user as SessionUser;

    // Fetch user subscription
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        subscription: true,
      },
    });

    return NextResponse.json(user?.subscription || null, { status: 200 });
  } catch (error) {
    console.error('[API] Subscription GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
