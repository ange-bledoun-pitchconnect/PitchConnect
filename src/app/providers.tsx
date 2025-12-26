/**
 * 🌟 PITCHCONNECT - Root Application Providers
 * src/app/providers.tsx
 *
 * Client-side provider wrapper that initializes:
 * - NextAuth SessionProvider (authentication context)
 * - React Query (data fetching & caching)
 * - Theme Provider (dark/light mode)
 * - Toast notifications
 * - Additional client-side providers
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 * This is a CLIENT COMPONENT ('use client') that wraps the entire app
 * with necessary providers for:
 * - Session management (NextAuth)
 * - Data fetching (React Query)
 * - UI state (theme, notifications)
 * - Type-safe context
 */


'use client'


import React, { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'


// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProvidersProps {
  children: ReactNode
  session: Session | null
}


// ============================================================================
// ROOT PROVIDERS COMPONENT
// ============================================================================

/**
 * Root Providers Component
 * 
 * Wraps the entire application with necessary providers
 * 
 * This component:
 * 1. Accepts session from server (from layout.tsx getServerSession)
 * 2. Initializes SessionProvider for authentication
 * 3. Wraps children with provider context
 * 4. Enables useSession() hook in all client components
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @param props.session - NextAuth session from server (or null)
 * @returns React component tree with providers
 */
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider 
      session={session} 
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchOnReconnect={true}
    >
      {/* 
        ============================================================================
        SESSIONPROVIDER CONFIGURATION
        ============================================================================
        
        session: Session | null
        - The user's session from the server
        - Passed from layout.tsx getServerSession()
        - Updates useSession() hook in client components
        - null if user not authenticated
        
        basePath: "/api/auth"
        - Path to NextAuth API routes
        - Must match your [...nextauth]/route.ts location
        - Used for signin/signout/callback operations
        
        refetchInterval={0}
        - Don't automatically refetch session on interval
        - Session only updates on:
          * Page reload
          * Manual session refresh via useSession({ required: true })
          * Window focus (if refetchOnWindowFocus enabled)
          * Network reconnect (if refetchOnReconnect enabled)
        
        refetchOnWindowFocus={false}
        - Don't automatically refresh when window regains focus
        - Reduces unnecessary API calls
        - User session remains valid until actual expiry
        
        refetchOnReconnect={true}
        - Refresh session when internet connection is restored
        - Ensures session is still valid after network outage
        - Important for mobile users
      */}

      {/* Render all child components with providers */}
      {children}
    </SessionProvider>
  )
}


// ============================================================================
// USAGE IN LAYOUT.TS
// ============================================================================

/**
 * How this is used in src/app/layout.tsx:
 * 
 * ```
 * import { getServerSession } from 'next-auth'
 * import { auth } from '@/auth'
 * import { Providers } from '@/app/providers'
 * 
 * export default async function RootLayout({ children }) {
 *   const session = await getServerSession(auth)
 *   
 *   return (
 *     <html>
 *       <body>
 *         <Providers session={session}>
 *           {children}
 *         </Providers>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * Flow:
 * 1. RootLayout is a SERVER COMPONENT
 * 2. Calls getServerSession(auth) on server
 * 3. Session is decrypted server-side using NEXTAUTH_SECRET
 * 4. Session passed to Providers (CLIENT COMPONENT)
 * 5. SessionProvider makes session available to all client components
 * 6. Client components use useSession() to access session
 */


// ============================================================================
// USING USESESSION IN CLIENT COMPONENTS
// ============================================================================

/**
 * Example: Using session in a client component
 * 
 * ```
 * 'use client'
 * 
 * import { useSession } from 'next-auth/react'
 * 
 * export default function Dashboard() {
 *   const { data: session, status, update } = useSession({
 *     required: true,  // Redirect to login if not authenticated
 *   })
 *   
 *   if (status === 'loading') {
 *     return <div>Loading...</div>
 *   }
 *   
 *   if (status === 'unauthenticated') {
 *     return <div>Please sign in</div>
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user?.name}</h1>
 *       <p>Email: {session.user?.email}</p>
 *       <p>Role: {session.user?.role}</p>
 *       <p>Permissions: {session.user?.permissions.join(', ')}</p>
 *     </div>
 *   )
 * }
 * ```
 */


// ============================================================================
// SESSION OBJECT STRUCTURE
// ============================================================================

/**
 * Available session properties (from src/auth.ts)
 * 
 * session.user.id
 * - User's unique identifier
 * - Type: string
 * 
 * session.user.email
 * - User's email address
 * - Type: string
 * 
 * session.user.name
 * - User's display name (firstName + lastName)
 * - Type: string
 * 
 * session.user.image
 * - User's avatar URL
 * - Type: string | undefined
 * 
 * session.user.role
 * - Primary user role (PLAYER, COACH, ADMIN, etc)
 * - Type: UserRole
 * 
 * session.user.roles
 * - Array of all user roles
 * - Type: UserRole[]
 * 
 * session.user.permissions
 * - Array of permissions for current role
 * - Type: PermissionName[]
 * - Examples: ['manage_players', 'view_analytics']
 * 
 * session.user.clubId
 * - User's associated club ID (if any)
 * - Type: string | undefined
 * 
 * session.user.teamId
 * - User's associated team ID (if any)
 * - Type: string | undefined
 * 
 * session.user.status
 * - Account status (ACTIVE, PENDING_EMAIL_VERIFICATION, SUSPENDED, INACTIVE)
 * - Type: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'SUSPENDED' | 'INACTIVE'
 */


// ============================================================================
// EXTENDING PROVIDERS (FUTURE ADDITIONS)
// ============================================================================

/**
 * When you need to add more providers (React Query, Theme, etc):
 * 
 * ```
 * 'use client'
 * 
 * import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 * import { ThemeProvider } from 'next-themes'
 * import { SessionProvider } from 'next-auth/react'
 * import { ReactNode } from 'react'
 * 
 * const queryClient = new QueryClient()
 * 
 * export function Providers({ 
 *   children, 
 *   session 
 * }: {
 *   children: ReactNode
 *   session: Session | null
 * }) {
 *   return (
 *     <SessionProvider session={session} basePath="/api/auth">
 *       <QueryClientProvider client={queryClient}>
 *         <ThemeProvider attribute="class" defaultTheme="light">
 *           {children}
 *         </ThemeProvider>
 *       </QueryClientProvider>
 *     </SessionProvider>
 *   )
 * }
 * ```
 */


// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * PROBLEM: "session is undefined" or "useSession returns null"
 * 
 * SOLUTION:
 * 1. Verify NEXTAUTH_SECRET is set in .env.local
 * 2. Verify layout.tsx passes session to Providers
 * 3. Check that [...nextauth]/route.ts exports handlers correctly
 * 4. Verify user is actually logged in (check /auth/login)
 * 
 * 
 * PROBLEM: "Cannot read property 'user' of null"
 * 
 * SOLUTION:
 * 1. Check session before accessing: if (session?.user) { ... }
 * 2. Use required: true in useSession() to redirect unauthenticated users
 * 3. Verify SessionProvider is wrapping the component
 * 
 * 
 * PROBLEM: "Session not persisting after page reload"
 * 
 * SOLUTION:
 * 1. Check browser cookies: localStorage, sessionStorage for __Secure-next-auth cookies
 * 2. Ensure NEXTAUTH_URL matches your domain
 * 3. Verify JWT secret is consistent across deployments
 * 4. Check that getServerSession() is in a server component (layout.tsx)
 * 
 * 
 * PROBLEM: "useSession() is not available"
 * 
 * SOLUTION:
 * 1. Ensure component is wrapped with 'use client'
 * 2. Ensure component is rendered inside Providers
 * 3. Verify SessionProvider is in layout.tsx or parent component
 */
