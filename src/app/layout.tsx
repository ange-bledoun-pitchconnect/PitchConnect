import type { Metadata } from 'next'
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
    'football',
    'netball',
    'rugby',
    'cricket',
    'basketball'
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
      'Professional sports team management and analytics platform',
    siteName: 'PitchConnect'
  }
}

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}