/**
 * 🌟 PITCHCONNECT - Client Session Provider
 * Path: /src/components/client-session-provider.tsx
 * 
 * ⚠️  DEPRECATED - This wrapper is no longer needed!
 * 
 * NextAuth v5 doesn't require wrapping SessionProvider in another component.
 * The Providers component (src/app/providers.tsx) handles SessionProvider directly.
 * 
 * This file is kept for reference but should NOT be used.
 * Use Providers component instead.
 */

'use client';

import React from 'react';

/**
 * @deprecated Use Providers component from src/app/providers.tsx instead
 * 
 * NextAuth v5 handles session injection directly without needing this wrapper.
 */
export function ClientSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just pass through - SessionProvider is in Providers component now
  return <>{children}</>;
}
