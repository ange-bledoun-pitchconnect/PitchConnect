/**
 * ============================================================================
 * FIXED: src/components/providers.tsx - NextAuth Provider Fix
 * Client component for wrapping the application with providers
 * Status: PRODUCTION READY | Quality: WORLD-CLASS
 * ============================================================================
 */

'use client';

import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// ============================================================================
// TYPES
// ============================================================================

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

// ============================================================================
// PROVIDERS COMPONENT
// ============================================================================

/**
 * Root providers wrapper component
 * Wraps application with all necessary providers:
 * - NextAuth SessionProvider (authentication)
 * - Additional providers as needed
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session} refetchInterval={4 * 60 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}

export default Providers;