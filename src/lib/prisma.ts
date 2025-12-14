// src/lib/prisma.ts
// ============================================================================
// PRISMA CLIENT SINGLETON - Production-Grade Implementation
// ============================================================================
// Prevents instantiation of multiple PrismaClient instances (important in development)
// Includes comprehensive logging, connection pooling, and error handling
// ============================================================================

import { PrismaClient } from '@prisma/client';

/**
 * Global reference to PrismaClient (prevents hot reload issues in development)
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Initialize Prisma Client with optimal settings
 * - Development: Logs all queries for debugging
 * - Production: Only logs errors and warnings
 */
const prismaClientSingleton = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return new PrismaClient({
    // ====================================================================
    // LOGGING CONFIGURATION
    // ====================================================================
    log: isDevelopment
      ? [
          // Development: verbose logging
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'stdout',
            level: 'error',
          },
          {
            emit: 'stdout',
            level: 'warn',
          },
        ]
      : [
          // Production: only errors
          {
            emit: 'stdout',
            level: 'error',
          },
        ],
    
    // ====================================================================
    // CONNECTION SETTINGS
    // ====================================================================
    // These are handled by DATABASE_URL but can be tuned if needed
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
    
    // ====================================================================
    // TRANSACTIONAL SETTINGS
    // ====================================================================
    // Default transaction timeout (in milliseconds)
    transactionIsolationLevel: 'ReadCommitted', // Most databases support this
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

// ============================================================================
// DEVELOPMENT ONLY: Enable query logging
// ============================================================================
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    // Only log slow queries or specific queries you want to monitor
    if (process.env.SLOW_QUERY_THRESHOLD && e.duration > parseInt(process.env.SLOW_QUERY_THRESHOLD)) {
      console.log(
        `\x1b[36m[SLOW QUERY ${e.duration}ms]\x1b[0m ${e.query}`
      );
    }
  });

  prisma.$on('error', (e) => {
    console.error(`\x1b[31m[PRISMA ERROR]\x1b[0m`, e.message);
  });

  prisma.$on('warn', (e) => {
    console.warn(`\x1b[33m[PRISMA WARN]\x1b[0m`, e.message);
  });
}

// ============================================================================
// PREVENT MULTIPLE INSTANCES IN DEVELOPMENT
// ============================================================================
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Execute a database transaction with automatic rollback on error
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: {...} });
 *   await tx.team.update({ where: { id: teamId }, data: {...} });
 *   return user;
 * });
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

/**
 * Execute multiple operations in a transaction
 * More suitable for simple sequential operations
 */
export async function batchTransaction<T>(
  queries: Array<Promise<any>>
): Promise<T[]> {
  return prisma.$transaction(queries);
}

export default prisma;
