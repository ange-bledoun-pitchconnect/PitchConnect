// ============================================================================
// FILE: src/types/auth.ts
// ============================================================================
// Authentication Type Definitions

import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roles: string[];
      teamId?: string;
      isSuperAdmin: boolean;
      subscriptionTier: string;
      status: string;
      avatar?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    role: string;
    roles: string[];
    teamId?: string;
    isSuperAdmin: boolean;
    subscriptionTier: string;
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    roles: string[];
    teamId?: string;
    isSuperAdmin: boolean;
    subscriptionTier: string;
    status: string;
  }
}
