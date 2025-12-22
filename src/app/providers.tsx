/**
 * 🌟 PITCHCONNECT - Root Application Providers
 * src/app/providers.tsx
 *
 * Client-side provider wrapper that initializes:
 * - NextAuth SessionProvider
 * - React Query (data fetching)
 * - Additional client-side providers
 */

'use client'

import React, { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

interface ProvidersProps {
  children: ReactNode
  session: Session | null
}

/**
 * Root Providers Component
 * Wraps the entire application with necessary providers
 *
 * @param props - Component props
 * @param props.children - Child components
 * @param props.session - NextAuth session from server
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      {/* 
        SessionProvider: Provides authentication context to all client components
        refetchInterval={0}: Disable automatic refetch (we'll handle manually)
      */}
      {children}
    </SessionProvider>
  )
}

export default Providers