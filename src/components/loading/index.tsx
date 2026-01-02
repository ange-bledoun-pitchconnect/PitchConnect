/**
 * ============================================================================
 * Loading Components Bundle
 * ============================================================================
 * 
 * Enterprise-grade loading indicators with multiple variants and states.
 * 
 * @version 2.0.0
 * @path src/components/loading/index.tsx
 * 
 * COMPONENTS:
 * - Spinner, SpinnerOverlay, SpinnerInline
 * - Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonTable, SkeletonForm
 * - LoadingState wrapper
 * 
 * ============================================================================
 */

'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'gold' | 'blue' | 'purple' | 'green' | 'red' | 'white' | 'charcoal' | 'primary';
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonAnimation = 'pulse' | 'wave' | 'shimmer' | 'none';

// =============================================================================
// SPINNER
// =============================================================================

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  label?: string;
}

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
  xl: 'w-16 h-16 border-4',
};

const SPINNER_COLORS: Record<SpinnerColor, string> = {
  gold: 'border-gold-200 border-t-gold-600 dark:border-gold-800 dark:border-t-gold-400',
  blue: 'border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400',
  purple: 'border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400',
  green: 'border-green-200 border-t-green-600 dark:border-green-800 dark:border-t-green-400',
  red: 'border-red-200 border-t-red-600 dark:border-red-800 dark:border-t-red-400',
  white: 'border-white/30 border-t-white',
  charcoal: 'border-charcoal-200 border-t-charcoal-600 dark:border-charcoal-700 dark:border-t-charcoal-400',
  primary: 'border-primary/30 border-t-primary',
};

export function Spinner({ size = 'md', color = 'gold', className, label = 'Loading' }: SpinnerProps) {
  return (
    <div
      className={cn('rounded-full animate-spin', SPINNER_SIZES[size], SPINNER_COLORS[color], className)}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
    </div>
  );
}

// =============================================================================
// SPINNER OVERLAY
// =============================================================================

export interface SpinnerOverlayProps {
  show?: boolean;
  message?: string;
  blur?: boolean;
  color?: SpinnerColor;
  zIndex?: number;
}

export function SpinnerOverlay({ show = true, message, blur = true, color = 'gold', zIndex = 50 }: SpinnerOverlayProps) {
  if (!show) return null;
  return (
    <div
      className={cn('fixed inset-0 flex items-center justify-center bg-black/50', blur && 'backdrop-blur-sm')}
      style={{ zIndex }}
      role="alert"
      aria-busy="true"
    >
      <div className="bg-white dark:bg-charcoal-800 rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <Spinner size="xl" color={color} />
        {message && <p className="text-charcoal-700 dark:text-charcoal-300 font-medium">{message}</p>}
      </div>
    </div>
  );
}

// =============================================================================
// SPINNER INLINE
// =============================================================================

export interface SpinnerInlineProps {
  message?: string;
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

export function SpinnerInline({ message, size = 'sm', color = 'gold', className }: SpinnerInlineProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Spinner size={size} color={color} />
      {message && <span className="text-sm text-charcoal-600 dark:text-charcoal-400">{message}</span>}
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export interface SkeletonProps {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SKELETON_VARIANTS: Record<SkeletonVariant, string> = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
};

const SKELETON_ANIMATIONS: Record<SkeletonAnimation, string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-charcoal-700 dark:via-charcoal-600 dark:to-charcoal-700 bg-[length:200%_100%]',
  shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
  none: '',
};

export function Skeleton({ variant = 'rounded', animation = 'pulse', width, height, className }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn('bg-neutral-200 dark:bg-charcoal-700', SKELETON_VARIANTS[variant], SKELETON_ANIMATIONS[animation], className)}
      style={style}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// SKELETON TEXT
// =============================================================================

export interface SkeletonTextProps {
  lines?: number;
  animation?: SkeletonAnimation;
  className?: string;
}

export function SkeletonText({ lines = 3, animation = 'pulse', className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" animation={animation} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

// =============================================================================
// SKELETON AVATAR
// =============================================================================

export interface SkeletonAvatarProps {
  size?: number;
  animation?: SkeletonAnimation;
  className?: string;
}

export function SkeletonAvatar({ size = 40, animation = 'pulse', className }: SkeletonAvatarProps) {
  return <Skeleton variant="circular" animation={animation} width={size} height={size} className={className} />;
}

// =============================================================================
// SKELETON CARD
// =============================================================================

export interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: number;
  lines?: number;
  animation?: SkeletonAnimation;
  className?: string;
}

export function SkeletonCard({ hasImage = true, imageHeight = 200, lines = 3, animation = 'pulse', className }: SkeletonCardProps) {
  return (
    <div className={cn('bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg overflow-hidden', className)}>
      {hasImage && <Skeleton variant="rectangular" animation={animation} height={imageHeight} className="w-full" />}
      <div className="p-4 space-y-4">
        <Skeleton variant="text" animation={animation} width="70%" height={24} />
        <SkeletonText lines={lines} animation={animation} />
        <div className="flex gap-2">
          <Skeleton variant="rounded" animation={animation} width={80} height={32} />
          <Skeleton variant="rounded" animation={animation} width={80} height={32} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON TABLE
// =============================================================================

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  animation?: SkeletonAnimation;
  hasHeader?: boolean;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, animation = 'pulse', hasHeader = true, className }: SkeletonTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {hasHeader && (
        <div className="flex gap-4 p-4 bg-neutral-50 dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h-${i}`} variant="text" animation={animation} className="flex-1" height={20} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`r-${rowIndex}`} className="flex gap-4 p-4 border-b border-neutral-200 dark:border-charcoal-700 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`c-${rowIndex}-${colIndex}`} variant="text" animation={animation} className="flex-1" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SKELETON FORM
// =============================================================================

export interface SkeletonFormProps {
  fields?: number;
  animation?: SkeletonAnimation;
  hasButtons?: boolean;
  className?: string;
}

export function SkeletonForm({ fields = 4, animation = 'pulse', hasButtons = true, className }: SkeletonFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" animation={animation} width={100} height={16} />
          <Skeleton variant="rounded" animation={animation} height={40} />
        </div>
      ))}
      {hasButtons && (
        <div className="flex gap-3 pt-4">
          <Skeleton variant="rounded" animation={animation} width={100} height={40} />
          <Skeleton variant="rounded" animation={animation} width={100} height={40} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LOADING STATE WRAPPER
// =============================================================================

export interface LoadingStateProps {
  isLoading: boolean;
  children: ReactNode;
  type?: 'spinner' | 'skeleton' | 'card' | 'table' | 'form' | 'custom';
  loadingComponent?: ReactNode;
  spinnerColor?: SpinnerColor;
  overlay?: boolean;
  animation?: SkeletonAnimation;
  className?: string;
}

export function LoadingState({
  isLoading,
  children,
  type = 'spinner',
  loadingComponent,
  spinnerColor = 'gold',
  overlay = false,
  animation = 'pulse',
  className,
}: LoadingStateProps) {
  if (!isLoading) return <>{children}</>;
  if (loadingComponent) return <>{loadingComponent}</>;

  if (overlay) {
    return (
      <div className={cn('relative', className)}>
        {children}
        <div className="absolute inset-0 bg-white/80 dark:bg-charcoal-900/80 flex items-center justify-center rounded-lg">
          <Spinner size="lg" color={spinnerColor} />
        </div>
      </div>
    );
  }

  const placeholders: Record<string, ReactNode> = {
    spinner: <div className="flex items-center justify-center py-12"><Spinner size="lg" color={spinnerColor} /></div>,
    skeleton: <SkeletonText lines={5} animation={animation} />,
    card: <SkeletonCard animation={animation} />,
    table: <SkeletonTable animation={animation} />,
    form: <SkeletonForm animation={animation} />,
  };

  return <div className={className}>{placeholders[type] || placeholders.spinner}</div>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default { Spinner, SpinnerOverlay, SpinnerInline, Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable, SkeletonForm, LoadingState };
