/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Loading Page
 * Path: src/app/loading.tsx
 * ============================================================================
 * 
 * Next.js loading page shown during page transitions.
 * Uses skeleton loading pattern for better perceived performance.
 * 
 * ============================================================================
 */

import { Trophy } from 'lucide-react';

// ============================================================================
// LOADING PAGE
// ============================================================================

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mx-auto mb-6">
          {/* Pulsing ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gold-500/20 animate-ping" />
          </div>
          
          {/* Logo */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold mx-auto">
            <Trophy className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Loading...
        </h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we prepare your content
        </p>

        {/* Loading Bar */}
        <div className="mt-6 mx-auto w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-gold rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON COMPONENTS (Export for use in other pages)
// ============================================================================

/**
 * Skeleton Line
 * For text placeholders
 */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`h-4 bg-muted rounded animate-pulse ${className}`} />
  );
}

/**
 * Skeleton Avatar
 * For user avatar placeholders
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-muted animate-pulse`} />
  );
}

/**
 * Skeleton Card
 * For card placeholders
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/2" />
          </div>
        </div>
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-2/3" />
      </div>
    </div>
  );
}

/**
 * Skeleton Table
 * For table placeholders
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-6 py-4">
        <div className="flex gap-4">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-20" />
          <SkeletonLine className="w-16" />
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border last:border-0 px-6 py-4">
          <div className="flex items-center gap-4">
            <SkeletonAvatar size="sm" />
            <SkeletonLine className="w-32" />
            <SkeletonLine className="w-24" />
            <SkeletonLine className="w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Stats
 * For stat card placeholders
 */
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <SkeletonLine className="w-12 h-3 mb-2" />
          <SkeletonLine className="w-16 h-8" />
        </div>
      ))}
    </div>
  );
}