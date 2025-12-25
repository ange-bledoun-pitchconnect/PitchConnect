/**
 * 🔐 PITCHCONNECT - NextAuth v4 API Route Handler
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 *
 * ============================================================================
 * NEXTAUTH API HANDLER
 * ============================================================================
 * ✅ Handles all authentication requests
 * ✅ OAuth provider callbacks
 * ✅ Session management endpoints
 * ✅ Sign in/out flows
 */

import { handlers } from '@/auth';

// 🔐 EXPORT HANDLERS
// NextAuth v4 provides GET and POST handlers
// These handle all OAuth flows and authentication requests
export const { GET, POST } = handlers;

// ⚠️ CRITICAL: Tell Next.js this is a dynamic route
// Don't cache this route since it handles real-time authentication
export const dynamic = 'force-dynamic';
