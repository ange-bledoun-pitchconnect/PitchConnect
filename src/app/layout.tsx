/**
 * 🌟 PITCHCONNECT - Root Layout
 * src/app/layout.tsx
 *
 * Server-side root layout that:
 * - Fetches server session
 * - Configures metadata
 * - Wraps with providers
 */

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Providers } from '@/app/providers'
import '@/styles/globals.css'

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

export const metadata: Metadata = {
  title: "PitchConnect - World's Best Sports Management Platform",
  description:
    'Professional sports team management, player analytics, performance tracking, and tactical analysis. All-in-one platform for football, netball, rugby, cricket, American football, and basketball teams.',
  keywords: [
    'sports management',
    'team management',
    'player analytics',
    'performance tracking',
    'tactical analysis',
    'football management',
    'netball platform',
    'rugby statistics',
    'cricket analytics',
    'basketball management',
    'sports software',
    'team coordination'
  ],
  authors: [{ name: 'PitchConnect Team' }],
  creator: 'PitchConnect',
  publisher: 'PitchConnect',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://pitchconnect.com',
    title: "PitchConnect - World's Best Sports Management Platform",
    description:
      'Professional sports team management and analytics platform for coaches, managers, and teams worldwide',
    siteName: 'PitchConnect'
  },
  twitter: {
    card: 'summary_large_image',
    title: "PitchConnect - Sports Management Platform",
    description: 'Manage your sports team like never before'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PitchConnect'
  }
}

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * Root Layout Component
 *
 * This is a SERVER COMPONENT that:
 * 1. Fetches the server session using getServerSession()
 * 2. Passes the session to the client-side Providers
 * 3. Wraps the entire application
 *
 * The session is decrypted on the server using NEXTAUTH_SECRET
 * then passed to the client for use in client components
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  // Fetch server session - THIS REQUIRES NEXTAUTH_SECRET to be set!
  // If you get JWT_SESSION_ERROR, verify NEXTAUTH_SECRET in .env.local
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body>
        {/* Pass session from server to client Providers */}
        {/* Session is decrypted here, passed to SessionProvider on client */}
        <Providers session={session}>
          {/* All app content renders here */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
