// src/app/providers.tsx
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem
        enableColorScheme={false}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2121',
                borderRadius: '8px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                },
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
