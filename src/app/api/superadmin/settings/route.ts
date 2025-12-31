// =============================================================================
// ⚙️ SUPERADMIN SETTINGS API - Enterprise-Grade with SystemSetting Model
// =============================================================================
// GET   /api/superadmin/settings - Get all system settings
// PATCH /api/superadmin/settings - Update system settings
// =============================================================================
// Schema: v7.8.0 | Access: SUPERADMIN only
// Features: Categorized settings, validation, audit logging
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

type SettingCategory = 
  | 'GENERAL'
  | 'SECURITY'
  | 'NOTIFICATIONS'
  | 'PAYMENTS'
  | 'FEATURES'
  | 'INTEGRATIONS'
  | 'LIMITS'
  | 'MAINTENANCE';

type SettingValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'ENCRYPTED';

interface SystemSettingRecord {
  key: string;
  value: unknown;
  valueType: SettingValueType;
  category: SettingCategory;
  description: string | null;
  isEditable: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

interface SettingsResponse {
  settings: Record<string, SystemSettingRecord>;
  categories: Record<SettingCategory, SystemSettingRecord[]>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_EDITABLE: 'NOT_EDITABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Default settings with their configurations
const DEFAULT_SETTINGS: Array<{
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  defaultValue: unknown;
  description: string;
  isEditable: boolean;
  isPublic: boolean;
}> = [
  // Security Settings
  {
    key: 'security.session_timeout_minutes',
    category: 'SECURITY',
    valueType: 'NUMBER',
    defaultValue: 60,
    description: 'Session timeout in minutes',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'security.max_login_attempts',
    category: 'SECURITY',
    valueType: 'NUMBER',
    defaultValue: 5,
    description: 'Maximum login attempts before lockout',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'security.lockout_duration_minutes',
    category: 'SECURITY',
    valueType: 'NUMBER',
    defaultValue: 15,
    description: 'Account lockout duration in minutes',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'security.ip_whitelist',
    category: 'SECURITY',
    valueType: 'ARRAY',
    defaultValue: [],
    description: 'Whitelisted IP addresses for admin access',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'security.require_2fa_for_superadmin',
    category: 'SECURITY',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Require 2FA for SuperAdmin users',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'security.password_min_length',
    category: 'SECURITY',
    valueType: 'NUMBER',
    defaultValue: 8,
    description: 'Minimum password length',
    isEditable: true,
    isPublic: true,
  },

  // Notification Settings
  {
    key: 'notifications.email_enabled',
    category: 'NOTIFICATIONS',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable email notifications',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'notifications.push_enabled',
    category: 'NOTIFICATIONS',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable push notifications',
    isEditable: true,
    isPublic: false,
  },
  {
    key: 'notifications.digest_frequency',
    category: 'NOTIFICATIONS',
    valueType: 'STRING',
    defaultValue: 'daily',
    description: 'Notification digest frequency (immediate, hourly, daily, weekly)',
    isEditable: true,
    isPublic: true,
  },

  // Payment Settings
  {
    key: 'payments.currency',
    category: 'PAYMENTS',
    valueType: 'STRING',
    defaultValue: 'GBP',
    description: 'Default currency',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'payments.trial_days',
    category: 'PAYMENTS',
    valueType: 'NUMBER',
    defaultValue: 14,
    description: 'Free trial duration in days',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'payments.stripe_enabled',
    category: 'PAYMENTS',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable Stripe payments',
    isEditable: true,
    isPublic: false,
  },

  // Feature Flags
  {
    key: 'features.registration_enabled',
    category: 'FEATURES',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Allow new user registrations',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'features.multi_sport_enabled',
    category: 'FEATURES',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable multi-sport support',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'features.live_scores_enabled',
    category: 'FEATURES',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable live score updates',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'features.analytics_enabled',
    category: 'FEATURES',
    valueType: 'BOOLEAN',
    defaultValue: true,
    description: 'Enable analytics features',
    isEditable: true,
    isPublic: true,
  },

  // Limits
  {
    key: 'limits.max_teams_per_club',
    category: 'LIMITS',
    valueType: 'NUMBER',
    defaultValue: 50,
    description: 'Maximum teams per club',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'limits.max_players_per_team',
    category: 'LIMITS',
    valueType: 'NUMBER',
    defaultValue: 30,
    description: 'Maximum players per team',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'limits.max_file_upload_mb',
    category: 'LIMITS',
    valueType: 'NUMBER',
    defaultValue: 10,
    description: 'Maximum file upload size in MB',
    isEditable: true,
    isPublic: true,
  },

  // Maintenance
  {
    key: 'maintenance.enabled',
    category: 'MAINTENANCE',
    valueType: 'BOOLEAN',
    defaultValue: false,
    description: 'Enable maintenance mode',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'maintenance.message',
    category: 'MAINTENANCE',
    valueType: 'STRING',
    defaultValue: 'System is under maintenance. Please try again later.',
    description: 'Maintenance mode message',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'maintenance.allowed_ips',
    category: 'MAINTENANCE',
    valueType: 'ARRAY',
    defaultValue: [],
    description: 'IPs allowed during maintenance',
    isEditable: true,
    isPublic: false,
  },

  // General
  {
    key: 'general.app_name',
    category: 'GENERAL',
    valueType: 'STRING',
    defaultValue: 'PitchConnect',
    description: 'Application name',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'general.support_email',
    category: 'GENERAL',
    valueType: 'STRING',
    defaultValue: 'support@pitchconnect.com',
    description: 'Support email address',
    isEditable: true,
    isPublic: true,
  },
  {
    key: 'general.default_timezone',
    category: 'GENERAL',
    valueType: 'STRING',
    defaultValue: 'Europe/London',
    description: 'Default timezone',
    isEditable: true,
    isPublic: true,
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

const UpdateSettingsSchema = z.object({
  settings: z.array(UpdateSettingSchema).min(1).max(50),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `settings_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
    error?: { code: string; message: string };
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

  if (options.message) {
    response.message = options.message;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: { 'X-Request-ID': options.requestId },
  });
}

/**
 * Verify SuperAdmin access
 */
async function verifySuperAdmin(userId: string): Promise<{ isValid: boolean; user?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSuperAdmin: true,
      roles: true,
    },
  });

  if (!user) return { isValid: false };
  const isValid = user.isSuperAdmin || user.roles.includes('SUPERADMIN');
  return { isValid, user };
}

/**
 * Initialize default settings
 */
async function initializeDefaultSettings(): Promise<void> {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't update existing
      create: {
        key: setting.key,
        category: setting.category,
        valueType: setting.valueType,
        value: setting.defaultValue as any,
        description: setting.description,
        isEditable: setting.isEditable,
        isPublic: setting.isPublic,
      },
    });
  }
}

/**
 * Validate setting value type
 */
function validateValueType(value: unknown, valueType: SettingValueType): boolean {
  switch (valueType) {
    case 'STRING':
      return typeof value === 'string';
    case 'NUMBER':
      return typeof value === 'number' && !isNaN(value);
    case 'BOOLEAN':
      return typeof value === 'boolean';
    case 'ARRAY':
      return Array.isArray(value);
    case 'JSON':
      return typeof value === 'object' && value !== null;
    case 'ENCRYPTED':
      return typeof value === 'string';
    default:
      return true;
  }
}

// =============================================================================
// GET HANDLER - Get All Settings
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid } = await verifySuperAdmin(session.user.id);
    if (!isValid) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Initialize defaults if needed
    await initializeDefaultSettings();

    // 4. Fetch all settings
    const settings = await prisma.systemSetting.findMany({
      include: {
        updatedByUser: {
          select: { email: true },
        },
      },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // 5. Transform to response format
    const settingsMap: Record<string, SystemSettingRecord> = {};
    const categoriesMap: Record<SettingCategory, SystemSettingRecord[]> = {
      GENERAL: [],
      SECURITY: [],
      NOTIFICATIONS: [],
      PAYMENTS: [],
      FEATURES: [],
      INTEGRATIONS: [],
      LIMITS: [],
      MAINTENANCE: [],
    };

    settings.forEach(s => {
      const record: SystemSettingRecord = {
        key: s.key,
        value: s.value,
        valueType: s.valueType as SettingValueType,
        category: s.category as SettingCategory,
        description: s.description,
        isEditable: s.isEditable,
        updatedAt: s.updatedAt.toISOString(),
        updatedBy: s.updatedByUser?.email || null,
      };

      settingsMap[s.key] = record;
      
      if (categoriesMap[s.category as SettingCategory]) {
        categoriesMap[s.category as SettingCategory].push(record);
      }
    });

    const response: SettingsResponse = {
      settings: settingsMap,
      categories: categoriesMap,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/superadmin/settings error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch settings' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Settings
// =============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
        requestId,
        status: 401,
      });
    }

    // 2. Verify SuperAdmin access
    const { isValid, user: adminUser } = await verifySuperAdmin(session.user.id);
    if (!isValid || !adminUser) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'SuperAdmin access required' },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid JSON in request body' },
        requestId,
        status: 400,
      });
    }

    const validation = UpdateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: validation.error.errors[0]?.message || 'Validation failed' },
        requestId,
        status: 400,
      });
    }

    const { settings: updates } = validation.data;

    // 4. Process updates
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    const changes: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];

    for (const update of updates) {
      // Get existing setting
      const existing = await prisma.systemSetting.findUnique({
        where: { key: update.key },
      });

      if (!existing) {
        results.push({ key: update.key, success: false, error: 'Setting not found' });
        continue;
      }

      if (!existing.isEditable) {
        results.push({ key: update.key, success: false, error: 'Setting is not editable' });
        continue;
      }

      // Validate value type
      if (!validateValueType(update.value, existing.valueType as SettingValueType)) {
        results.push({ 
          key: update.key, 
          success: false, 
          error: `Invalid value type. Expected ${existing.valueType}` 
        });
        continue;
      }

      // Track change
      changes.push({
        key: update.key,
        oldValue: existing.value,
        newValue: update.value,
      });

      // Update setting
      await prisma.systemSetting.update({
        where: { key: update.key },
        data: {
          value: update.value as any,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      results.push({ key: update.key, success: true });
    }

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SETTINGS_UPDATED',
        resourceType: 'SYSTEM_SETTING',
        resourceId: 'batch_update',
        details: JSON.stringify({
          updatedCount: results.filter(r => r.success).length,
          failedCount: results.filter(r => !r.success).length,
          changes,
        }),
        severity: 'WARNING',
      },
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`[${requestId}] Settings updated`, {
      adminId: session.user.id,
      successCount,
      failedCount,
    });

    return createResponse({ results, successCount, failedCount }, {
      success: true,
      message: `Updated ${successCount} settings${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/superadmin/settings error:`, error);
    return createResponse(null, {
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to update settings' },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';