/**
 * NextAuth Route Handler
 * Imports configuration from @/lib/auth
 */

import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Export NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Export helper for server-side session access
export const getServerSessionWithAuth = () => getServerSession(authOptions);
