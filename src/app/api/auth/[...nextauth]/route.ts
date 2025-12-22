/**
 * NextAuth.js v5 Route Handler
 * Handles all authentication flows
 * Path: /api/auth/[...nextauth]/route.ts
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
