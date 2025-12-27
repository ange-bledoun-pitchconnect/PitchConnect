/**
 * ============================================================================
 * 🗄️ PITCHCONNECT - DATABASE CLIENT ALIAS (BACKWARD COMPATIBILITY)
 * ============================================================================
 * Path: /src/lib/db.ts
 *
 * This file re-exports from prisma.ts for backward compatibility.
 * All Prisma client functionality is centralized in prisma.ts
 *
 * MIGRATION NOTE:
 * ---------------
 * Old: import { db } from '@/lib/db'
 * New: import { prisma } from '@/lib/prisma'  ← Preferred
 *
 * Both work, but use '@/lib/prisma' for new code.
 * ============================================================================
 */

// ============================================================================
// 📤 RE-EXPORTS FROM CENTRALIZED PRISMA CLIENT
// ============================================================================

export {
  // Primary export
  prisma,
  
  // Alias for backward compatibility
  prisma as db,
  
  // Connection utilities
  disconnectPrisma,
  connectPrisma,
  
  // Health & metrics
  checkDatabaseHealth,
  getQueryMetrics,
  
  // Transaction helpers
  withTransaction,
  
  // Auth helpers
  findUserForAuth,
  updateLastLogin,
  recordFailedLogin,
  
  // Middleware
  enableSoftDelete,
} from './prisma';

// Types
export type { HealthCheckResult, TransactionOptions } from './prisma';

// Default export for backward compatibility
export { default } from './prisma';

/**
 * @deprecated Use `import { prisma } from '@/lib/prisma'` instead
 * This file exists only for backward compatibility with existing imports.
 */