/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Application Providers v2.0
 * Path: src/app/providers.tsx
 * ============================================================================
 * 
 * CLIENT-SIDE PROVIDER WRAPPER
 * 
 * Provides:
 * ✅ NextAuth SessionProvider
 * ✅ Theme Provider (next-themes)
 * ✅ Toast Notifications (Sonner)
 * ✅ React Query (TanStack Query) - ready to enable
 * ✅ Type-safe session handling
 * 
 * ============================================================================
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { Session } from 'next-auth';

// Uncomment when ready to use React Query
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ============================================================================
// TYPES
// ============================================================================

interface ProvidersProps {
  children: ReactNode;
  session: Session | null;
}

// ============================================================================
// REACT QUERY CLIENT (Ready to enable)
// ============================================================================

// Uncomment when ready to use React Query
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 60 * 1000, // 1 minute
//       gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//     mutations: {
//       retry: 1,
//     },
//   },
// });

// ============================================================================
// PROVIDERS COMPONENT
// ============================================================================

/**
 * Root Providers Component
 * 
 * Wraps the application with all necessary providers.
 * Order matters - innermost providers should be most specific.
 * 
 * Provider Order (outer to inner):
 * 1. SessionProvider - Authentication context
 * 2. QueryClientProvider - Data fetching (when enabled)
 * 3. ThemeProvider - Dark/light mode
 * 4. Children (app content)
 * 5. Toaster - Toast notifications (outside children for overlay)
 */
export function Providers({ children, session }: ProvidersProps) {
  // Prevent hydration mismatch by mounting theme provider on client only
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider
      session={session}
      basePath="/api/auth"
      // Session refresh configuration
      refetchInterval={5 * 60} // Refresh every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {/* Uncomment when ready to use React Query */}
      {/* <QueryClientProvider client={queryClient}> */}
      
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="pitchconnect-theme"
        themes={['light', 'dark', 'system']}
      >
        {/* Render children only after mount to prevent hydration issues */}
        {mounted ? children : <ThemeLoadingFallback />}
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
            className: 'shadow-lg',
          }}
        />
      </NextThemesProvider>

      {/* React Query Devtools (development only) */}
      {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> */}
      {/* </QueryClientProvider> */}
    </SessionProvider>
  );
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================

/**
 * Theme Loading Fallback
 * 
 * Shown briefly during initial hydration to prevent flash
 * Matches the background color to prevent visible flash
 */
function ThemeLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      {/* Invisible loading state - prevents layout shift */}
      <div className="sr-only">Loading...</div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Providers;

// ============================================================================
// HOOK: useTheme (re-exported for convenience)
// ============================================================================

export { useTheme } from 'next-themes';

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * USING SESSION IN CLIENT COMPONENTS
 * 
 * ```tsx
 * 'use client';
 * 
 * import { useSession, signIn, signOut } from 'next-auth/react';
 * 
 * export default function ProfileButton() {
 *   const { data: session, status } = useSession();
 *   
 *   if (status === 'loading') return <Skeleton />;
 *   
 *   if (status === 'unauthenticated') {
 *     return <button onClick={() => signIn()}>Sign In</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {session?.user?.name}</p>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * USING THEME IN CLIENT COMPONENTS
 * 
 * ```tsx
 * 'use client';
 * 
 * import { useTheme } from '@/app/providers';
 * 
 * export default function ThemeToggle() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       {resolvedTheme === 'dark' ? '☀️' : '🌙'}
 *     </button>
 *   );
 * }
 * ```
 */

/**
 * USING TOAST NOTIFICATIONS
 * 
 * ```tsx
 * import { toast } from 'sonner';
 * 
 * // Success toast
 * toast.success('Profile updated successfully!');
 * 
 * // Error toast
 * toast.error('Failed to save changes');
 * 
 * // Custom toast
 * toast('Hello world', {
 *   description: 'This is a description',
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo clicked'),
 *   },
 * });
 * 
 * // Promise toast
 * toast.promise(saveData(), {
 *   loading: 'Saving...',
 *   success: 'Saved successfully!',
 *   error: 'Failed to save',
 * });
 * ```
 */

/**
 * ADDING REACT QUERY
 * 
 * 1. Install: npm install @tanstack/react-query @tanstack/react-query-devtools
 * 2. Uncomment the QueryClientProvider in this file
 * 3. Use queries in components:
 * 
 * ```tsx
 * import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 * 
 * function Teams() {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['teams'],
 *     queryFn: () => fetch('/api/teams').then(res => res.json()),
 *   });
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <TeamList teams={data} />;
 * }
 * ```
 */