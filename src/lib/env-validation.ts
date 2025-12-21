/**
 * Environment Variables Validation
 * Validates all environment variables on application startup
 * Using Zod for runtime type safety
 * 
 * This ensures:
 * 1. All required variables are present
 * 2. Variables have correct types
 * 3. Values are within acceptable ranges
 * 4. Application fails fast with clear error messages
 */

import { z } from 'zod';

// ============================================================================
// Environment Variables Schemas
// ============================================================================

/**
 * Schema for required environment variables (BLOCKING if missing)
 */
const RequiredEnvSchema = z.object({
  // Database (CRITICAL)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').min(10),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL').min(10),

  // Supabase (CRITICAL)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Supabase URL must be valid'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(50, 'Supabase anon key invalid'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(50, 'Supabase service role key invalid'),

  // Authentication (CRITICAL)
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Application URLs (CRITICAL)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be valid URL'),
  AUTH_URL: z.string().url('AUTH_URL must be valid'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be valid'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']),
});

/**
 * Schema for optional but recommended environment variables
 */
const RecommendedEnvSchema = z.object({
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Stripe Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Email Service
  RESEND_API_KEY: z.string().optional(),

  // Redis Cache
  REDIS_URL: z.string().optional(),

  // ML Service
  PYTHON_ML_SERVICE_URL: z.string().url().optional(),
}).partial();

/**
 * Schema for optional development-only variables
 */
const DevelopmentEnvSchema = z.object({
  // Debug & Logging
  NEXT_PUBLIC_DEBUG_MODE: z.string().transform(v => v === 'true').optional(),
  NEXT_PUBLIC_ENABLE_DEVTOOLS: z.string().transform(v => v === 'true').optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // Mock Services
  MOCK_STRIPE: z.string().transform(v => v === 'true').optional(),
  MOCK_EMAIL: z.string().transform(v => v === 'true').optional(),
  MOCK_SMS: z.string().transform(v => v === 'true').optional(),
}).partial();

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: string[];
  timestamp: string;
}

export interface ValidationError {
  variable: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate required environment variables
 * Throws error if validation fails
 */
export function validateRequiredEnv(): void {
  const result = RequiredEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.join('.');
      return `❌ ${path}: ${err.message}`;
    });

    const errorMessage = [
      '🚨 CRITICAL: Missing or invalid required environment variables',
      ...errors,
      '',
      '📋 Please check your .env.local file and ensure all required variables are set.',
      '💡 Use .env.example as a template.',
    ].join('\n');

    console.error(errorMessage);
    throw new Error('Environment validation failed');
  }
}

/**
 * Validate recommended environment variables
 * Logs warnings if missing
 */
export function validateRecommendedEnv(): ValidationResult {
  const warnings: string[] = [];

  const requiredForProduction = {
    GOOGLE_CLIENT_ID: 'Google OAuth for social login',
    GITHUB_CLIENT_SECRET: 'GitHub OAuth for social login',
    STRIPE_SECRET_KEY: 'Stripe payments integration',
    RESEND_API_KEY: 'Email service for notifications',
    REDIS_URL: 'Redis cache for real-time features',
  };

  for (const [variable, description] of Object.entries(requiredForProduction)) {
    if (!process.env[variable]) {
      warnings.push(
        `⚠️  ${variable} not set - ${description} will not work`
      );
    }
  }

  return {
    success: warnings.length === 0,
    errors: [],
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate environment variable ranges and values
 */
export function validateEnvRanges(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Session timeout validation
  const sessionTimeout = parseInt(process.env.SESSION_MAX_AGE || '2592000', 10);
  if (sessionTimeout < 3600) {
    errors.push({
      variable: 'SESSION_MAX_AGE',
      message: 'Session timeout should be at least 1 hour (3600 seconds)',
      severity: 'WARNING',
    });
  }

  // Password policy validation
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '12', 10);
  if (minLength < 8) {
    errors.push({
      variable: 'PASSWORD_MIN_LENGTH',
      message: 'Password minimum length should be at least 8 characters',
      severity: 'WARNING',
    });
  }

  // Rate limiting validation
  const rateLimit = parseInt(process.env.RATE_LIMIT_REQUESTS || '1000', 10);
  if (rateLimit < 100) {
    errors.push({
      variable: 'RATE_LIMIT_REQUESTS',
      message: 'Rate limit seems too low, consider increasing to at least 100',
      severity: 'INFO',
    });
  }

  return errors;
}

/**
 * Validate security-critical variables
 */
export function validateSecurityVariables(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if using default secrets (DANGEROUS!)
  const dangerousDefaults = {
    AUTH_SECRET: '4114153d916bf6db0a6c1a2c82b72cb8ad9f8db8c6ce3db4459b92bd863b54492',
    JWT_SECRET: 'pitchconnect2024secretkeyforjwttokens1234567890abcdef',
    ENCRYPTION_KEY: 'pitchconnect_encryption_key_32ch',
  };

  const environment = process.env.NODE_ENV || 'development';

  for (const [variable, defaultValue] of Object.entries(dangerousDefaults)) {
    if (process.env[variable] === defaultValue) {
      const severity = environment === 'production' ? 'CRITICAL' : 'WARNING';
      errors.push({
        variable,
        message: `Using default value - MUST be changed${
          environment === 'production' ? ' BEFORE DEPLOYING TO PRODUCTION' : ''
        }. Generate new value with: openssl rand -hex 32`,
        severity,
      });
    }
  }

  // Check if HTTPS is disabled in production
  if (environment === 'production' && process.env.ENFORCE_HTTPS !== 'true') {
    errors.push({
      variable: 'ENFORCE_HTTPS',
      message: 'HTTPS should be enforced in production',
      severity: 'CRITICAL',
    });
  }

  // Check if secure cookies disabled in production
  if (environment === 'production' && process.env.SESSION_COOKIE_SECURE !== 'true') {
    errors.push({
      variable: 'SESSION_COOKIE_SECURE',
      message: 'Secure cookies should be enabled in production',
      severity: 'CRITICAL',
    });
  }

  return errors;
}

/**
 * Validate OAuth credentials
 */
export function validateOAuthConfig(): ValidationError[] {
  const errors: ValidationError[] = [];

  const oauthProviders = [
    { name: 'Google', clientId: 'GOOGLE_CLIENT_ID', secret: 'GOOGLE_CLIENT_SECRET' },
    { name: 'GitHub', clientId: 'GITHUB_CLIENT_ID', secret: 'GITHUB_CLIENT_SECRET' },
    { name: 'Facebook', clientId: 'FACEBOOK_CLIENT_ID', secret: 'FACEBOOK_CLIENT_SECRET' },
    { name: 'Apple', clientId: 'APPLE_CLIENT_ID', secret: 'APPLE_CLIENT_SECRET' },
  ];

  for (const provider of oauthProviders) {
    const hasClientId = Boolean(process.env[provider.clientId]);
    const hasSecret = Boolean(process.env[provider.secret]);

    if (hasClientId && !hasSecret) {
      errors.push({
        variable: provider.secret,
        message: `${provider.name} Client ID is set but Secret is missing`,
        severity: 'WARNING',
      });
    }

    if (!hasClientId && hasSecret) {
      errors.push({
        variable: provider.clientId,
        message: `${provider.name} Secret is set but Client ID is missing`,
        severity: 'WARNING',
      });
    }
  }

  return errors;
}

/**
 * Validate payment provider configuration
 */
export function validatePaymentConfig(): ValidationError[] {
  const errors: ValidationError[] = [];

  const paymentsEnabled = process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true';

  if (paymentsEnabled) {
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push({
        variable: 'STRIPE_SECRET_KEY',
        message: 'Stripe payments are enabled but STRIPE_SECRET_KEY is not configured',
        severity: 'CRITICAL',
      });
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      errors.push({
        variable: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        message: 'Stripe payments enabled but publishable key is not configured',
        severity: 'CRITICAL',
      });
    }

    // Check if using test keys in production
    const environment = process.env.NODE_ENV;
    if (environment === 'production') {
      const secretKey = process.env.STRIPE_SECRET_KEY || '';
      if (secretKey.includes('_test_')) {
        errors.push({
          variable: 'STRIPE_SECRET_KEY',
          message: 'Using Stripe TEST keys in PRODUCTION - replace with live keys',
          severity: 'CRITICAL',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): ValidationError[] {
  const errors: ValidationError[] = [];

  const emailEnabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';

  if (emailEnabled && !process.env.RESEND_API_KEY) {
    errors.push({
      variable: 'RESEND_API_KEY',
      message: 'Email notifications enabled but RESEND_API_KEY is not configured',
      severity: 'WARNING',
    });
  }

  return errors;
}

/**
 * Run complete environment validation
 */
export function validateEnvironment(): ValidationResult {
  const allErrors: ValidationError[] = [];

  try {
    // Validate required variables (throws if fails)
    validateRequiredEnv();

    // Validate ranges
    allErrors.push(...validateEnvRanges());

    // Validate security
    allErrors.push(...validateSecurityVariables());

    // Validate OAuth
    allErrors.push(...validateOAuthConfig());

    // Validate payments
    allErrors.push(...validatePaymentConfig());

    // Validate email
    allErrors.push(...validateEmailConfig());

    // Get recommended warnings
    const recommended = validateRecommendedEnv();

    // Separate critical errors from warnings
    const critical = allErrors.filter(e => e.severity === 'CRITICAL');
    const warnings = [
      ...allErrors
        .filter(e => e.severity === 'WARNING')
        .map(e => `⚠️  ${e.variable}: ${e.message}`),
      ...recommended.warnings,
    ];

    // Log results
    if (critical.length > 0) {
      console.error(
        '🚨 CRITICAL ENVIRONMENT ERRORS:\n',
        critical.map(e => `  ❌ ${e.variable}: ${e.message}`).join('\n')
      );
    }

    if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️  ENVIRONMENT WARNINGS:\n',
        warnings.join('\n')
      );
    }

    return {
      success: critical.length === 0,
      errors: critical,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          variable: 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'CRITICAL',
        },
      ],
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Print validation summary to console
 */
export function printValidationSummary(result: ValidationResult): void {
  if (result.success) {
    console.log('✅ Environment variables validated successfully\n');
  } else {
    console.error('❌ Environment validation failed\n');
    result.errors.forEach(error => {
      console.error(`  ${error.variable}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  ${warning}`);
    });
  }

  console.log(`\n📋 Validation timestamp: ${result.timestamp}\n`);
}

/**
 * Main export for integration in app initialization
 */
export function initializeEnvironment(): void {
  const result = validateEnvironment();

  if (!result.success) {
    printValidationSummary(result);
    throw new Error('Environment validation failed - check logs above');
  }

  if (process.env.NODE_ENV !== 'production') {
    printValidationSummary(result);
  }
}
