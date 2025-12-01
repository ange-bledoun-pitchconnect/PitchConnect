// ============================================================================
// NEXTAUTH API ROUTE HANDLER
// ============================================================================
// This file configures the NextAuth.js API routes for authentication
// Route: /api/auth/*
// Handles: signin, callback, signout, session, providers, csrf, etc.
// ============================================================================

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================================================
// Create NextAuth Handler
// ============================================================================
// Initialize NextAuth with our configuration from lib/auth.ts
const handler = NextAuth(authOptions);

// ============================================================================
// Export Handler for Next.js App Router
// ============================================================================
// Next.js 13+ App Router requires explicit GET and POST exports
// These handle all NextAuth.js routes under /api/auth/*
export { handler as GET, handler as POST };
