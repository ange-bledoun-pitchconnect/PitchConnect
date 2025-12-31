// =============================================================================
// 🔔 NOTIFICATION SETTINGS API - Enterprise-Grade Implementation
// =============================================================================
// GET   /api/settings/notifications - Get user's notification preferences
// PATCH /api/settings/notifications - Update notification preferences
// =============================================================================
// Schema: v7.8.0 | Model: NotificationPreference
// Access: Authenticated users (own settings only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { NotificationType, NotificationChannel, Prisma } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface NotificationPreferenceItem {
  type: NotificationType;
  label: string;
  description: string;
  category: string;
  
  // Channel settings
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
}

interface NotificationSettingsResponse {
  userId: string;
  
  // Global settings
  globalSettings: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    smsEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    timezone: string;
    digestFrequency: 'NONE' | 'DAILY' | 'WEEKLY';
  };
  
  // Per-type preferences
  preferences: NotificationPreferenceItem[];
  
  // Grouped by category
  categorized: Record<string, NotificationPreferenceItem[]>;
  
  updatedAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Notification type metadata
const NOTIFICATION_TYPE_META: Record<NotificationType, { label: string; description: string; category: string }> = {
  // Match related
  MATCH_REMINDER: {
    label: 'Match Reminders',
    description: 'Reminders before upcoming matches',
    category: 'Matches',
  },
  MATCH_CANCELLED: {
    label: 'Match Cancellations',
    description: 'When a match is cancelled or postponed',
    category: 'Matches',
  },
  MATCH_RESULT: {
    label: 'Match Results',
    description: 'Results after matches are completed',
    category: 'Matches',
  },
  MATCH_LINEUP: {
    label: 'Lineup Announcements',
    description: 'When match lineups are published',
    category: 'Matches',
  },
  
  // Training related
  TRAINING_REMINDER: {
    label: 'Training Reminders',
    description: 'Reminders before training sessions',
    category: 'Training',
  },
  TRAINING_CANCELLED: {
    label: 'Training Cancellations',
    description: 'When training is cancelled',
    category: 'Training',
  },
  TRAINING_SCHEDULED: {
    label: 'New Training Sessions',
    description: 'When new training is scheduled',
    category: 'Training',
  },
  
  // Team related
  TEAM_ANNOUNCEMENT: {
    label: 'Team Announcements',
    description: 'Important team news and updates',
    category: 'Team',
  },
  TEAM_INVITATION: {
    label: 'Team Invitations',
    description: 'Invitations to join teams',
    category: 'Team',
  },
  JOIN_REQUEST_RECEIVED: {
    label: 'Join Requests',
    description: 'When someone requests to join your team',
    category: 'Team',
  },
  JOIN_REQUEST_APPROVED: {
    label: 'Request Approved',
    description: 'When your join request is approved',
    category: 'Team',
  },
  JOIN_REQUEST_REJECTED: {
    label: 'Request Rejected',
    description: 'When your join request is declined',
    category: 'Team',
  },
  
  // Payment related
  PAYMENT_DUE: {
    label: 'Payment Due',
    description: 'Reminders for upcoming payments',
    category: 'Payments',
  },
  PAYMENT_RECEIVED: {
    label: 'Payment Received',
    description: 'Confirmations when payments are processed',
    category: 'Payments',
  },
  PAYMENT_FAILED: {
    label: 'Payment Failed',
    description: 'When a payment fails to process',
    category: 'Payments',
  },
  SUBSCRIPTION_EXPIRING: {
    label: 'Subscription Expiring',
    description: 'Reminders before subscription expires',
    category: 'Payments',
  },
  
  // Communication
  MESSAGE_RECEIVED: {
    label: 'Messages',
    description: 'When you receive a new message',
    category: 'Communication',
  },
  MENTION: {
    label: 'Mentions',
    description: 'When someone mentions you',
    category: 'Communication',
  },
  
  // Performance
  PERFORMANCE_UPDATE: {
    label: 'Performance Updates',
    description: 'Updates to your stats and ratings',
    category: 'Performance',
  },
  ACHIEVEMENT_UNLOCKED: {
    label: 'Achievement Unlocked',
    description: 'When you earn a new achievement',
    category: 'Performance',
  },
  
  // Administrative
  ACCOUNT_UPDATE: {
    label: 'Account Updates',
    description: 'Important account-related notifications',
    category: 'Account',
  },
  SECURITY_ALERT: {
    label: 'Security Alerts',
    description: 'Security-related notifications (always enabled)',
    category: 'Account',
  },
  APPROVAL_REQUIRED: {
    label: 'Approval Required',
    description: 'When something needs your approval',
    category: 'Account',
  },
  
  // System
  SYSTEM_NOTIFICATION: {
    label: 'System Notifications',
    description: 'Platform updates and maintenance',
    category: 'System',
  },
};

// Default preferences for new users
const DEFAULT_PREFERENCES: Record<NotificationType, { email: boolean; push: boolean; inApp: boolean; sms: boolean }> = {
  MATCH_REMINDER: { email: true, push: true, inApp: true, sms: false },
  MATCH_CANCELLED: { email: true, push: true, inApp: true, sms: true },
  MATCH_RESULT: { email: false, push: true, inApp: true, sms: false },
  MATCH_LINEUP: { email: false, push: true, inApp: true, sms: false },
  TRAINING_REMINDER: { email: true, push: true, inApp: true, sms: false },
  TRAINING_CANCELLED: { email: true, push: true, inApp: true, sms: true },
  TRAINING_SCHEDULED: { email: true, push: true, inApp: true, sms: false },
  TEAM_ANNOUNCEMENT: { email: true, push: true, inApp: true, sms: false },
  TEAM_INVITATION: { email: true, push: true, inApp: true, sms: false },
  JOIN_REQUEST_RECEIVED: { email: true, push: true, inApp: true, sms: false },
  JOIN_REQUEST_APPROVED: { email: true, push: true, inApp: true, sms: false },
  JOIN_REQUEST_REJECTED: { email: true, push: true, inApp: true, sms: false },
  PAYMENT_DUE: { email: true, push: true, inApp: true, sms: true },
  PAYMENT_RECEIVED: { email: true, push: false, inApp: true, sms: false },
  PAYMENT_FAILED: { email: true, push: true, inApp: true, sms: true },
  SUBSCRIPTION_EXPIRING: { email: true, push: true, inApp: true, sms: false },
  MESSAGE_RECEIVED: { email: false, push: true, inApp: true, sms: false },
  MENTION: { email: false, push: true, inApp: true, sms: false },
  PERFORMANCE_UPDATE: { email: false, push: false, inApp: true, sms: false },
  ACHIEVEMENT_UNLOCKED: { email: false, push: true, inApp: true, sms: false },
  ACCOUNT_UPDATE: { email: true, push: false, inApp: true, sms: false },
  SECURITY_ALERT: { email: true, push: true, inApp: true, sms: true },
  APPROVAL_REQUIRED: { email: true, push: true, inApp: true, sms: false },
  SYSTEM_NOTIFICATION: { email: true, push: false, inApp: true, sms: false },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateGlobalSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  timezone: z.string().optional(),
  digestFrequency: z.enum(['NONE', 'DAILY', 'WEEKLY']).optional(),
});

const UpdatePreferenceSchema = z.object({
  type: z.nativeEnum(NotificationType),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  sms: z.boolean().optional(),
});

const UpdateNotificationSettingsSchema = z.object({
  globalSettings: UpdateGlobalSettingsSchema.optional(),
  preferences: z.array(UpdatePreferenceSchema).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Get or create notification preferences for a user
 */
async function getOrCreatePreferences(userId: string): Promise<Map<NotificationType, any>> {
  // Get existing preferences
  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const prefMap = new Map<NotificationType, any>();

  // Add existing preferences
  for (const pref of existing) {
    prefMap.set(pref.type, pref);
  }

  // Create missing preferences with defaults
  const missingTypes = Object.values(NotificationType).filter(t => !prefMap.has(t));

  if (missingTypes.length > 0) {
    const newPrefs = await prisma.notificationPreference.createManyAndReturn({
      data: missingTypes.map(type => ({
        userId,
        type,
        email: DEFAULT_PREFERENCES[type]?.email ?? true,
        push: DEFAULT_PREFERENCES[type]?.push ?? true,
        inApp: DEFAULT_PREFERENCES[type]?.inApp ?? true,
        sms: DEFAULT_PREFERENCES[type]?.sms ?? false,
      })),
    });

    for (const pref of newPrefs) {
      prefMap.set(pref.type, pref);
    }
  }

  return prefMap;
}

// =============================================================================
// GET HANDLER - Get Notification Settings
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Get user with notification settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationSettings: true,
        timezone: true,
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'User not found',
        },
        requestId,
        status: 401,
      });
    }

    // 3. Get or create preferences
    const prefMap = await getOrCreatePreferences(userId);

    // 4. Build preferences list
    const preferences: NotificationPreferenceItem[] = [];
    
    for (const type of Object.values(NotificationType)) {
      const pref = prefMap.get(type);
      const meta = NOTIFICATION_TYPE_META[type];
      
      preferences.push({
        type,
        label: meta?.label || type,
        description: meta?.description || '',
        category: meta?.category || 'Other',
        email: pref?.email ?? DEFAULT_PREFERENCES[type]?.email ?? true,
        push: pref?.push ?? DEFAULT_PREFERENCES[type]?.push ?? true,
        inApp: pref?.inApp ?? DEFAULT_PREFERENCES[type]?.inApp ?? true,
        sms: pref?.sms ?? DEFAULT_PREFERENCES[type]?.sms ?? false,
      });
    }

    // 5. Group by category
    const categorized: Record<string, NotificationPreferenceItem[]> = {};
    for (const pref of preferences) {
      if (!categorized[pref.category]) {
        categorized[pref.category] = [];
      }
      categorized[pref.category].push(pref);
    }

    // 6. Build global settings from user
    const settings = (user.notificationSettings as Record<string, any>) || {};
    
    const globalSettings = {
      emailEnabled: settings.emailEnabled ?? true,
      pushEnabled: settings.pushEnabled ?? true,
      inAppEnabled: settings.inAppEnabled ?? true,
      smsEnabled: settings.smsEnabled ?? false,
      quietHoursEnabled: settings.quietHoursEnabled ?? false,
      quietHoursStart: settings.quietHoursStart ?? null,
      quietHoursEnd: settings.quietHoursEnd ?? null,
      timezone: user.timezone || 'UTC',
      digestFrequency: settings.digestFrequency ?? 'NONE',
    };

    // 7. Build response
    const response: NotificationSettingsResponse = {
      userId,
      globalSettings,
      preferences,
      categorized,
      updatedAt: new Date().toISOString(),
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notification settings fetched`, {
      userId,
      preferencesCount: preferences.length,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/settings/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch notification settings',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Notification Settings
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = UpdateNotificationSettingsSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 3. Update global settings if provided
    if (data.globalSettings) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationSettings: true },
      });

      const currentSettings = (currentUser?.notificationSettings as Record<string, any>) || {};
      const updatedSettings = {
        ...currentSettings,
        ...data.globalSettings,
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationSettings: updatedSettings,
          ...(data.globalSettings.timezone && { timezone: data.globalSettings.timezone }),
        },
      });
    }

    // 4. Update individual preferences if provided
    if (data.preferences && data.preferences.length > 0) {
      for (const pref of data.preferences) {
        // Security check: SECURITY_ALERT cannot be fully disabled
        if (pref.type === NotificationType.SECURITY_ALERT) {
          pref.email = true;
          pref.inApp = true;
        }

        await prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type: pref.type,
            },
          },
          update: {
            ...(pref.email !== undefined && { email: pref.email }),
            ...(pref.push !== undefined && { push: pref.push }),
            ...(pref.inApp !== undefined && { inApp: pref.inApp }),
            ...(pref.sms !== undefined && { sms: pref.sms }),
          },
          create: {
            userId,
            type: pref.type,
            email: pref.email ?? DEFAULT_PREFERENCES[pref.type]?.email ?? true,
            push: pref.push ?? DEFAULT_PREFERENCES[pref.type]?.push ?? true,
            inApp: pref.inApp ?? DEFAULT_PREFERENCES[pref.type]?.inApp ?? true,
            sms: pref.sms ?? DEFAULT_PREFERENCES[pref.type]?.sms ?? false,
          },
        });
      }
    }

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SETTINGS_UPDATED',
        resourceType: 'NOTIFICATION_PREFERENCE',
        resourceId: userId,
        changes: Object.keys(data),
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Notification settings updated`, {
      userId,
      globalUpdated: !!data.globalSettings,
      preferencesUpdated: data.preferences?.length || 0,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      updated: true,
      timestamp: new Date().toISOString(),
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/settings/notifications error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update notification settings',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';