/**
 * 🌟 PITCHCONNECT - Root Layout
 * Path: src/app/layout.tsx
 *
 * ============================================================================
 * ROOT SERVER LAYOUT
 * ============================================================================
 * ✅ Fetches server session (NextAuth v4)
 * ✅ Error handling and logging
 * ✅ Type-safe session management
 * ✅ Comprehensive metadata configuration
 * ✅ SEO optimizations
 * ✅ Mobile support
 *
 * ARCHITECTURE:
 * - Server Component (async)
 * - Calls getServerSession(auth) on server
 * - Passes decrypted session to client Providers
 * - Wraps entire application
 */

import type { Metadata, Viewport } from 'next'
import { getServerSession } from 'next-auth'
import { auth } from '@/auth'
import { Providers } from '@/app/providers'
import '@/styles/globals.css'


// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

/**
 * Root metadata for the entire application
 * Used by search engines, social media, and browsers
 * 
 * SEO & Social Media optimization for PitchConnect brand
 */
export const metadata: Metadata = {
  // Basic metadata
  title: "PitchConnect - World's Best Sports Management Platform",
  description:
    'Professional sports team management, player analytics, performance tracking, and tactical analysis. All-in-one platform for football, netball, rugby, cricket, American football, and basketball teams.',
  
  // Keywords for SEO
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
    'team coordination',
  ],
  
  // Author & Creator
  authors: [{ name: 'PitchConnect Team' }],
  creator: 'PitchConnect',
  publisher: 'PitchConnect',
  
  // SEO Robots
  robots: 'index, follow',
  
  // Open Graph (Facebook, LinkedIn, Twitter)
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://pitchconnect.com',
    title: "PitchConnect - World's Best Sports Management Platform",
    description:
      'Professional sports team management and analytics platform for coaches, managers, and teams worldwide',
    siteName: 'PitchConnect',
    images: [
      {
        url: 'https://pitchconnect.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PitchConnect - Sports Management Platform',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'PitchConnect - Sports Management Platform',
    description: 'Manage your sports team like never before',
    creator: '@pitchconnect',
    images: ['https://pitchconnect.com/twitter-image.png'],
  },
  
  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PitchConnect',
  },
  
  // Format detection (disable auto-detection for certain formats)
  formatDetection: {
    telephone: false,
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
  
  // App category
  category: 'sports',
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
  },
}


// ============================================================================
// VIEWPORT CONFIGURATION
// ============================================================================

/**
 * Viewport metadata for mobile responsiveness
 * Ensures proper scaling and rendering on mobile devices
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}


// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode
}


// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

/**
 * Root Layout Component
 * 
 * Server Component that wraps the entire application.
 * 
 * Flow:
 * 1. ✅ Fetch session from server using getServerSession(auth)
 * 2. ✅ Session is decrypted on server using NEXTAUTH_SECRET
 * 3. ✅ Pass session to client Providers component
 * 4. ✅ SessionProvider makes session available to all client components
 * 
 * IMPORTANT: 
 * - This MUST be an async component (async function)
 * - NEXTAUTH_SECRET must be set in .env.local
 * - If JWT_SESSION_ERROR occurs, check NEXTAUTH_SECRET
 * - Session is type-safe and includes user role/permissions
 * 
 * @param props - Component props
 * @param props.children - Child components (entire app)
 * @returns Root HTML layout with providers
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  // ============================================================================
  // FETCH SERVER SESSION
  // ============================================================================
  
  let session = null
  let sessionError: Error | null = null

  try {
    /**
     * 🔐 GET SERVER SESSION
     * 
     * This call:
     * 1. Reads JWT from cookies (if present)
     * 2. Decrypts using NEXTAUTH_SECRET
     * 3. Validates JWT signature
     * 4. Returns session object or null
     * 
     * Errors indicate:
     * - JWT_SESSION_ERROR: Missing NEXTAUTH_SECRET
     * - Invalid signature: Token tampered with
     * - Expired token: User needs to re-login
     */
    session = await getServerSession(auth)
    
    // Log successful session fetch in development
    if (process.env.NODE_ENV === 'development' && session) {
      console.log('[Layout] ✅ Server session loaded:', {
        user: session.user?.email,
        role: session.user?.role,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    // Capture session fetch errors
    sessionError = error instanceof Error ? error : new Error(String(error))
    
    // Log error details for debugging
    console.error('[Layout] ❌ Session fetch error:', {
      message: sessionError.message,
      name: sessionError.name,
      timestamp: new Date().toISOString(),
    })
    
    // In production, log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry/monitoring service
      // logErrorToMonitoring(sessionError)
    }
    
    // Continue rendering with null session (graceful degradation)
    session = null
  }


  // ============================================================================
  // RENDER ROOT LAYOUT
  // ============================================================================

  return (
    <html lang="en" suppressHydrationWarning>
      {/* 
        ============================================================================
        HTML HEAD
        ============================================================================
      */}
      <head>
        {/* 
          VIEWPORT META TAG
          Already handled by viewport export above, but including here for clarity
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5, user-scalable=yes"
        />
        
        {/* 
          APPLE WEB APP META TAGS
          Enables home screen installation on iOS devices
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PitchConnect" />
        
        {/* 
          THEME COLOR (for browser UI)
          Used by Android Chrome to color the address bar
        */}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        
        {/* 
          SECURITY HEADERS
          Can also be set via next.config.js or middleware
        */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* 
          PRECONNECT TO EXTERNAL RESOURCES
          Improves performance by establishing early connections
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 
          DNS PREFETCH (for faster external API calls)
        */}
        <link rel="dns-prefetch" href="//cdn.example.com" />
      </head>

      {/* 
        ============================================================================
        HTML BODY
        ============================================================================
      */}
      <body>
        {/* 
          PROVIDERS WRAPPER
          
          Session flow:
          1. Server (this file) fetches session via getServerSession()
          2. Session passed to Providers component (Client Component)
          3. SessionProvider wraps all children with session context
          4. All client components can now use useSession() hook
          
          If sessionError occurred:
          - Session will be null
          - Client components must handle null session gracefully
          - User can still use app but without authentication
        */}
        <Providers session={session}>
          {/* 
            APPLICATION CONTENT
            All app pages, components, and content render here
            
            Available to all client components:
            - useSession() hook
            - Session context (if authenticated)
            - Role-based access control
            - User permissions
          */}
          {children}
          
          {/* 
            DEBUG: Session Error Display (Development Only)
            Shows session fetch errors for debugging
          */}
          {process.env.NODE_ENV === 'development' && sessionError && (
            <div className="fixed bottom-4 right-4 max-w-md rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200">
              <p className="font-semibold">🚨 Session Error (Dev Only)</p>
              <p className="mt-1 text-xs font-mono">{sessionError.message}</p>
            </div>
          )}
        </Providers>
      </body>
    </html>
  )
}


// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * USING SESSION IN CLIENT COMPONENTS
 * 
 * Example client component with authentication:
 * 
 * ```
 * 'use client'
 * 
 * import { useSession } from 'next-auth/react'
 * import { useRouter } from 'next/navigation'
 * 
 * export default function Dashboard() {
 *   const { data: session, status } = useSession({ required: true })
 *   const router = useRouter()
 *   
 *   if (status === 'loading') return <div>Loading...</div>
 *   if (status === 'unauthenticated') {
 *     router.push('/auth/login')
 *     return null
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user?.name}</h1>
 *       <p>Role: {session.user?.role}</p>
 *       {session.user?.permissions.includes('manage_players') && (
 *         <div>Player management panel</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * TROUBLESHOOTING SESSION ERRORS
 * 
 * Error: "JWT_SESSION_ERROR"
 * ├─ Cause: NEXTAUTH_SECRET not set or incorrect
 * └─ Fix: Verify NEXTAUTH_SECRET in .env.local and restart server
 * 
 * Error: "Invalid token signature"
 * ├─ Cause: Different NEXTAUTH_SECRET values in dev/prod
 * └─ Fix: Ensure consistent SECRET across all environments
 * 
 * Error: "Session is null in client component"
 * ├─ Cause: User not authenticated or session expired
 * └─ Fix: Use useSession({ required: true }) to redirect to login
 * 
 * Error: "Cannot read property 'user' of null"
 * ├─ Cause: Accessing session.user without null check
 * └─ Fix: Always check if (session?.user) before accessing
 */

/**
 * ENVIRONMENT VARIABLES REQUIRED
 * 
 * .env.local (Development):
 * - NEXTAUTH_SECRET=your-super-secret-key-here (generate with: openssl rand -base64 32)
 * - NEXTAUTH_URL=http://localhost:3000
 * - DATABASE_URL=postgresql://...
 * 
 * .env.production (Production):
 * - NEXTAUTH_SECRET=your-production-secret (generate fresh)
 * - NEXTAUTH_URL=https://pitchconnect.com
 * - DATABASE_URL=postgresql://production-db
 */
