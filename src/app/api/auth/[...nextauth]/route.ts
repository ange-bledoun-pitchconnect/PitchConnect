/**
 * 🔐 PITCHCONNECT - NextAuth v4 API Route Handler
 * Path: /src/app/api/auth/[...nextauth]/route.ts
 *
 * This file wires up NextAuth v4 to handle all auth endpoints:
 * - GET /api/auth/signin
 * - POST /api/auth/signin
 * - GET /api/auth/callback/:provider
 * - POST /api/auth/callback/:provider
 * - GET /api/auth/signout
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/providers
 * - POST /api/auth/_log
 * - GET /api/auth/_log
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
