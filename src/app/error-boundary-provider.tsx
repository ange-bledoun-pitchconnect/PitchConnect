'use client'

import { ErrorBoundary } from '@/components/states/ErrorBoundary'

interface ErrorBoundaryProviderProps {
  children: React.ReactNode
}

export function ErrorBoundaryProvider({
  children
}: ErrorBoundaryProviderProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
