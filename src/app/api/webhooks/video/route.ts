import { NextRequest, NextResponse } from 'next/server';
import { handleMuxWebhook } from '@/lib/video/mux-processor';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * POST /api/webhooks/video
 * Webhook receiver for Mux video processing events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('mux-signature');

    // Verify webhook signature (optional but recommended)
    if (signature && process.env.MUX_WEBHOOK_SIGNING_SECRET) {
      const secret = process.env.MUX_WEBHOOK_SIGNING_SECRET;
      const bodyString = JSON.stringify(body);

      const hash = crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');

      if (signature !== hash) {
        logger.warn('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    logger.info('Video webhook received', { event: body.type });

    // Handle different video providers
    if (body.data?.id) {
      // Mux webhook
      await handleMuxWebhook(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
