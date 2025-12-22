/**
 * 🌟 PITCHCONNECT - Global Providers
 * Path: /app/providers.tsx
 * 
 * ============================================================================
 * Architecture Notes
 * ============================================================================
 * This is the centralized provider wrapper for all global context.
 * 
 * ✓ SessionProvider wraps ClientSessionProvider from next-auth/react
 * ✓ SessionProvider is wrapped ONCE here (no duplication)
 * ✓ ThemeProvider, QueryClient, Toast all nested inside
 * ✓ Root layout imports and uses this component
 * ✓ No duplicate provider chains
 * 
 * ============================================================================
 * Provider Order (Important - Don't Change)
 * ============================================================================
 * 1. SessionProvider (outermost - for auth context)
 * 2. ThemeProvider (for dark/light mode)
 * 3. QueryClientProvider (for data fetching)
 * 4. Toaster (for toast notifications)
 * 
 * This order ensures:
 * - Auth context available everywhere
 * - Theme applies to all children
 * - Queries work with auth headers
 * - Toasts render on top
 * ============================================================================
 */

'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

/**
 * React Query configuration
 * Optimized for SaaS dashboard use cases
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Global Providers Component
 * Wraps entire application with all required context providers
 * 
 * Usage in root layout:
 * <Providers>
 *   {children}
 * </Providers>
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider basePath="/api/auth">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        enableColorScheme={true}
        storageKey="pitchconnect-theme"
        themes={['light', 'dark']}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName="text-sm"
            toastOptions={{
              // Default options
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2121',
                borderRadius: '8px',
                boxShadow:
                  '0 8px 32px 0 rgba(31, 33, 33, 0.2)',
              },
              // Default options for specific types
              success: {
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #86efac',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
              loading: {
                style: {
                  background: '#f0f9ff',
                  color: '#0c4a6e',
                  border: '1px solid #bfdbfe',
                },
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
