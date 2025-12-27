/**
 * ============================================================================
 * 🗄️ PITCHCONNECT - PRISMA CLIENT SINGLETON (Prisma 6)
 * ============================================================================
 * Path: /src/lib/prisma.ts
 *
 * Centralized Prisma client instance with:
 * - Singleton pattern for connection pooling
 * - Environment-aware logging
 * - Soft delete middleware
 * - Connection management helpers
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// 🔧 ENVIRONMENT CONFIGURATION
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// ============================================================================
// 📊 LOGGING CONFIGURATION
// ============================================================================

type LogLevel = 'query' | 'info' | 'warn' | 'error';
type LogDefinition = {
  level: LogLevel;
  emit: 'stdout' | 'event';
};

/**
 * Configure Prisma logging based on environment
 */
function getLogConfig(): LogDefinition[] {
  if (isProduction) {
    return [
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ];
  }

  if (isTest) {
    return [{ level: 'error', emit: 'stdout' }];
  }

  // Development - verbose logging
  return [
    { level: 'query', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ];
}

// ============================================================================
// 🏗️ PRISMA CLIENT SINGLETON
// ============================================================================

/**
 * Global cache for Prisma client to prevent multiple instances
 * in development due to hot reloading
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create and configure Prisma Client instance
 * 
 * Prisma 6: Reads database URL from schema.prisma datasource block
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: getLogConfig(),
  });

  return client;
}

/**
 * Singleton Prisma client instance
 * 
 * In development: Uses global cache to survive hot reloads
 * In production: Creates single instance
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache instance in development to prevent multiple connections
if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// 🔌 CONNECTION MANAGEMENT
// ============================================================================

/**
 * Gracefully disconnect from database
 * Call this before application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma:', error);
    throw error;
  }
}

/**
 * Explicitly connect to database
 * Useful for warming up connections
 */
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
  } catch (error) {
    console.error('❌ Error connecting Prisma:', error);
    throw error;
  }
}

/**
 * Check database health/connectivity
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// 🔄 TRANSACTION HELPERS
// ============================================================================

/**
 * Execute operations in a transaction
 */
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  }
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel,
  });
}

// ============================================================================
// 📊 QUERY METRICS (Development Only)
// ============================================================================

let queryCount = 0;
let totalQueryTime = 0;

export function getQueryMetrics() {
  return {
    queryCount,
    totalQueryTime,
    averageQueryTime: queryCount > 0 ? totalQueryTime / queryCount : 0,
  };
}

export function resetQueryMetrics(): void {
  queryCount = 0;
  totalQueryTime = 0;
}

// ============================================================================
// 🛡️ SOFT DELETE MIDDLEWARE
// ============================================================================

export function enableSoftDeleteMiddleware(): void {
  prisma.$use(async (params, next) => {
    const softDeleteModels = [
      'User',
      'Club',
      'Team',
      'Player',
      'Match',
      'League',
      'Organisation',
    ];

    if (softDeleteModels.includes(params.model ?? '')) {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }

      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
    }

    return next(params);
  });

  console.log('✅ Soft delete middleware enabled');
}

// ============================================================================
// 🔐 AUTH HELPERS
// ============================================================================

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
      deletedAt: null,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      sessions: true,
    },
  });
}

export async function updateUserLastLogin(userId: string, ip?: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });
}

export async function recordFailedLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const attempts = (user?.failedLoginAttempts ?? 0) + 1;
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? '5', 10);
  const lockoutMinutes = parseInt(process.env.LOCKOUT_DURATION_MINUTES ?? '15', 10);

  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: attempts,
      lastFailedLoginAt: new Date(),
      lockoutUntil:
        attempts >= maxAttempts
          ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
          : null,
    },
  });
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export default prisma;
export { PrismaClient };