// ============================================================================
// 🔧 PRISMA 7 CONFIGURATION FILE
// ============================================================================
// This file configures database connections for Prisma CLI commands
// (migrate, db push, studio, etc.)
//
// For Prisma 7+, database URLs are no longer in schema.prisma
// See: https://pris.ly/d/config-datasource
// ============================================================================

import { defineConfig } from 'prisma/config'

// Type-safe environment variable access
interface Env {
  DATABASE_URL: string
  DIRECT_URL?: string
}

export default defineConfig<Env>({
  // Path to your Prisma schema file
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
  },

  // Database connection for CLI commands (migrate, db push, studio)
  datasource: {
    // Primary connection URL (can be pooled connection like PgBouncer/Supabase)
    url: process.env.DATABASE_URL!,
  },

  // Studio configuration (optional)
  studio: {
    // Uncomment to change default port
    // port: 5555,
  },
})

// ============================================================================
// 📝 USAGE NOTES
// ============================================================================
//
// 1. For POOLED connections (Supabase, PgBouncer, Prisma Accelerate):
//    - Use DATABASE_URL for the pooled connection
//    - Migrations will use the pooled connection
//
// 2. For DIRECT connections (bypassing pooler for migrations):
//    If you need direct connection for migrations, update the config:
//
//    datasource: {
//      url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
//    },
//
// 3. For Prisma Accelerate:
//    - Pass accelerateUrl to PrismaClient in your application code
//    - See: https://pris.ly/d/prisma7-client-config
//
// 4. Environment variables should be in your .env file:
//    DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
//    DIRECT_URL="postgresql://user:password@direct-host:5432/database?schema=public"
//
// ============================================================================