'use client';

import { SessionProvider } from 'next-auth/react';
import type React from 'react';

/**
 * Client Session Provider Wrapper
 * Wraps the app with SessionProvider for NextAuth v5
 *
 * NextAuth v5 Changes:
 * - SessionProvider no longer accepts 'session' prop
 * - Session is auto-injected from server context
 * - Simpler API that just works with React 19
 */

interface ClientSessionProviderProps {
  children: React.ReactNode;
}

export function ClientSessionProvider({
  children,
}: ClientSessionProviderProps) {
  return (
    <SessionProvider basePath="/api/auth" refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
