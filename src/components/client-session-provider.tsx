/**
 * 🌟 PITCHCONNECT - Client Session Provider
 * Path: /src/components/client-session-provider.tsx
 *
 * ============================================================================
 * SESSION PROVIDER WRAPPER - React 19 Compatible
 * ============================================================================
 * ✅ Client component wrapper for NextAuth SessionProvider
 * ✅ React 19 RC compatible
 * ✅ Minimal overhead
 * ✅ Proper type safety
 *
 * ============================================================================
 * STATUS: PRODUCTION READY ⚽🏆
 * ============================================================================
 */

'use client';

import { type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';

interface ClientSessionProviderProps {
  children: ReactNode;
  session: Session | null;
}

/**
 * Client-side Session Provider wrapper
 * Must be wrapped in 'use client' directive for NextAuth v5 with React 19
 */
export function ClientSessionProvider({
  children,
  session,
}: ClientSessionProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={60 * 5} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}

export default ClientSessionProvider;
