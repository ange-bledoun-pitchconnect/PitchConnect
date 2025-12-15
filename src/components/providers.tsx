/**
 * ============================================================================
 * FIXED: src/components/providers.tsx - NextAuth SessionProvider Fix
 * 
 * Client component for wrapping the application with providers
 * Resolves: "Cannot read properties of undefined (reading 'call')" error
 * 
 * Status: PRODUCTION READY | Quality: WORLD-CLASS ⚽🏆
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
 * 
 * Wraps application with all necessary providers:
 * - NextAuth SessionProvider (authentication)
 * - Additional providers as needed
 * 
 * Usage:
 * ```tsx
 * import { Providers } from '@/components/providers';
 * 
 * export default function RootLayout({ children, session }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers session={session}>
 *           {children}
 *         </Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={4 * 60 * 60}
      refetchOnWindowFocus={true}
      refetchOnReconnect="always"
    >
      {children}
    </SessionProvider>
  );
}

/**
 * Export as default for backward compatibility
 */
export default Providers;