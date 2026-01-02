/**
 * ============================================================================
 * SKELETON COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade skeleton loading states with:
 * - Multiple variants (text, avatar, card, table, etc.)
 * - Shimmer animation
 * - Customizable shapes and sizes
 * - Sport-specific skeletons
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/ui/skeleton.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animation = 'pulse', rounded = 'md', ...props }, ref) => {
    const animationClasses = {
      pulse: 'animate-pulse',
      shimmer: 'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-charcoal-700 dark:via-charcoal-600 dark:to-charcoal-700 bg-[length:200%_100%]',
      none: '',
    };

    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-neutral-200 dark:bg-charcoal-700',
          animationClasses[animation],
          roundedClasses[rounded],
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// =============================================================================
// TEXT SKELETON
// =============================================================================

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Width of last line (percentage) */
  lastLineWidth?: number;
  /** Line height */
  lineHeight?: 'sm' | 'md' | 'lg';
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg';
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      className,
      lines = 3,
      lastLineWidth = 60,
      lineHeight = 'md',
      gap = 'md',
      ...props
    },
    ref
  ) => {
    const heightClasses = {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-5',
    };

    const gapClasses = {
      sm: 'space-y-1',
      md: 'space-y-2',
      lg: 'space-y-3',
    };

    return (
      <div ref={ref} className={cn(gapClasses[gap], className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              heightClasses[lineHeight],
              index === lines - 1 ? `w-[${lastLineWidth}%]` : 'w-full'
            )}
            style={index === lines - 1 ? { width: `${lastLineWidth}%` } : undefined}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

// =============================================================================
// AVATAR SKELETON
// =============================================================================

interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** With status indicator */
  withStatus?: boolean;
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = 'md', withStatus = false, ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      '2xl': 'w-20 h-20',
    };

    const statusSizes = {
      xs: 'w-2 h-2',
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    };

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <Skeleton className={cn(sizeClasses[size])} rounded="full" />
        {withStatus && (
          <Skeleton
            className={cn(
              statusSizes[size],
              'absolute bottom-0 right-0 ring-2 ring-white dark:ring-charcoal-800'
            )}
            rounded="full"
          />
        )}
      </div>
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

// =============================================================================
// BUTTON SKELETON
// =============================================================================

interface SkeletonButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
}

const SkeletonButton = React.forwardRef<HTMLDivElement, SkeletonButtonProps>(
  ({ className, size = 'md', fullWidth = false, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-20',
      md: 'h-10 w-28',
      lg: 'h-12 w-36',
    };

    return (
      <Skeleton
        ref={ref}
        className={cn(sizeClasses[size], fullWidth && 'w-full', className)}
        rounded="lg"
        {...props}
      />
    );
  }
);
SkeletonButton.displayName = 'SkeletonButton';

// =============================================================================
// INPUT SKELETON
// =============================================================================

interface SkeletonInputProps extends React.HTMLAttributes<HTMLDivElement> {
  /** With label */
  withLabel?: boolean;
  /** With helper text */
  withHelper?: boolean;
}

const SkeletonInput = React.forwardRef<HTMLDivElement, SkeletonInputProps>(
  ({ className, withLabel = false, withHelper = false, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {withLabel && <Skeleton className="h-4 w-24" />}
      <Skeleton className="h-10 w-full" rounded="lg" />
      {withHelper && <Skeleton className="h-3 w-48" />}
    </div>
  )
);
SkeletonInput.displayName = 'SkeletonInput';

// =============================================================================
// CARD SKELETON
// =============================================================================

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** With image */
  withImage?: boolean;
  /** Image aspect ratio */
  imageAspect?: '16/9' | '4/3' | '1/1';
  /** Number of text lines */
  lines?: number;
  /** With footer */
  withFooter?: boolean;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      withImage = true,
      imageAspect = '16/9',
      lines = 2,
      withFooter = false,
      ...props
    },
    ref
  ) => {
    const aspectClasses = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-neutral-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 overflow-hidden',
          className
        )}
        {...props}
      >
        {withImage && (
          <Skeleton className={cn('w-full', aspectClasses[imageAspect])} rounded="none" />
        )}
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <SkeletonText lines={lines} />
        </div>
        {withFooter && (
          <div className="px-4 pb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <SkeletonAvatar size="sm" />
              <Skeleton className="h-4 w-20" />
            </div>
            <SkeletonButton size="sm" />
          </div>
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = 'SkeletonCard';

// =============================================================================
// TABLE SKELETON
// =============================================================================

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** With header */
  withHeader?: boolean;
  /** With checkbox column */
  withCheckbox?: boolean;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  (
    {
      className,
      rows = 5,
      columns = 4,
      withHeader = true,
      withCheckbox = false,
      ...props
    },
    ref
  ) => {
    const totalCols = withCheckbox ? columns + 1 : columns;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-neutral-200 dark:border-charcoal-700 overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Header */}
        {withHeader && (
          <div className="bg-neutral-50 dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 px-4 py-3">
            <div className="flex items-center gap-4">
              {withCheckbox && <Skeleton className="w-4 h-4" rounded="sm" />}
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: '120px' }} />
              ))}
            </div>
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-neutral-200 dark:divide-charcoal-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-4 py-3">
              <div className="flex items-center gap-4">
                {withCheckbox && <Skeleton className="w-4 h-4" rounded="sm" />}
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className="h-4 flex-1"
                    style={{ maxWidth: colIndex === 0 ? '200px' : '100px' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
SkeletonTable.displayName = 'SkeletonTable';

// =============================================================================
// LIST SKELETON
// =============================================================================

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of items */
  items?: number;
  /** With avatar */
  withAvatar?: boolean;
  /** With action */
  withAction?: boolean;
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ className, items = 5, withAvatar = true, withAction = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('divide-y divide-neutral-200 dark:divide-charcoal-700', className)}
      {...props}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="py-3 flex items-center gap-3">
          {withAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {withAction && <Skeleton className="w-8 h-8" rounded="lg" />}
        </div>
      ))}
    </div>
  )
);
SkeletonList.displayName = 'SkeletonList';

// =============================================================================
// SPORT-SPECIFIC SKELETONS
// =============================================================================

/**
 * Player Card Skeleton
 */
interface SkeletonPlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** With stats */
  withStats?: boolean;
}

const SkeletonPlayerCard = React.forwardRef<HTMLDivElement, SkeletonPlayerCardProps>(
  ({ className, withStats = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-neutral-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Header with avatar */}
      <div className="p-4 flex items-center gap-4">
        <SkeletonAvatar size="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" rounded="full" />
            <Skeleton className="h-6 w-12" rounded="full" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {withStats && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
);
SkeletonPlayerCard.displayName = 'SkeletonPlayerCard';

/**
 * Match Card Skeleton
 */
const SkeletonMatchCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-neutral-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-4',
        className
      )}
      {...props}
    >
      {/* Match header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-3">
          <Skeleton className="w-12 h-12" rounded="lg" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10" rounded="lg" />
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-10 h-10" rounded="lg" />
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="w-12 h-12" rounded="lg" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700 flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
);
SkeletonMatchCard.displayName = 'SkeletonMatchCard';

/**
 * Training Session Skeleton
 */
const SkeletonTrainingSession = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-neutral-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-4',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" rounded="full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
);
SkeletonTrainingSession.displayName = 'SkeletonTrainingSession';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  // Sport-specific
  SkeletonPlayerCard,
  SkeletonMatchCard,
  SkeletonTrainingSession,
};