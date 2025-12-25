import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient is created
 * Prevents connection pooling issues in development
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Prisma Event Listeners
 */
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database Query', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});

prisma.$on('error', (e) => {
  logger.error('Database Error', {
    message: e.message,
  });
});

/**
 * Graceful Shutdown
 */
if (typeof window === 'undefined') {
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing database connection');
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing database connection');
    await prisma.$disconnect();
  });
}

export default prisma;
