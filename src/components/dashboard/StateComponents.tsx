/**
 * ============================================================================
 * Dashboard State Components
 * EmptyState, ErrorState, LoadingState
 * ============================================================================
 * 
 * Enterprise-grade state display components for dashboard views.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All dashboard users
 * 
 * FEATURES:
 * - Multiple variants
 * - Custom icons and colors
 * - Action buttons
 * - Dark mode support
 * - Accessible
 * - Animated transitions
 * 
 * ============================================================================
 */

'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  InboxIcon,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Search,
  FileX,
  Users,
  Calendar,
  BarChart,
  RefreshCw,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// EMPTY STATE
// =============================================================================

export type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'players'
  | 'matches'
  | 'teams'
  | 'analytics'
  | 'documents';

interface EmptyStateProps {
  /** Display variant */
  variant?: EmptyStateVariant;
  /** Title text */
  title?: string;
  /** Description message */
  message?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

const EMPTY_VARIANTS: Record<EmptyStateVariant, { icon: ReactNode; title: string; message: string }> = {
  default: {
    icon: <InboxIcon className="w-12 h-12" />,
    title: 'No data available',
    message: 'There is no data to display at the moment.',
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    title: 'No results found',
    message: 'Try adjusting your search or filter criteria.',
  },
  players: {
    icon: <Users className="w-12 h-12" />,
    title: 'No players found',
    message: 'Add players to your team to get started.',
  },
  matches: {
    icon: <Calendar className="w-12 h-12" />,
    title: 'No matches scheduled',
    message: 'Schedule a match to see it here.',
  },
  teams: {
    icon: <Users className="w-12 h-12" />,
    title: 'No teams found',
    message: 'Create a team to begin managing your squad.',
  },
  analytics: {
    icon: <BarChart className="w-12 h-12" />,
    title: 'No analytics data',
    message: 'Analytics will appear once matches are played.',
  },
  documents: {
    icon: <FileX className="w-12 h-12" />,
    title: 'No documents',
    message: 'Upload documents to store them here.',
  },
};

export function EmptyState({
  variant = 'default',
  title,
  message,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const variantConfig = EMPTY_VARIANTS[variant];

  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  };

  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={title || variantConfig.title}
    >
      <div
        className={cn(
          'text-gray-300 dark:text-gray-600 mb-4',
          iconSizeClasses[size]
        )}
      >
        {icon || variantConfig.icon}
      </div>

      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl'
        )}
      >
        {title || variantConfig.title}
      </h3>

      <p
        className={cn(
          'text-gray-600 dark:text-gray-400 max-w-md',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}
      >
        {message || variantConfig.message}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              <Plus className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ERROR STATE
// =============================================================================

export type ErrorStateVariant = 'default' | 'network' | 'permission' | 'notfound' | 'server';

interface ErrorStateProps {
  /** Display variant */
  variant?: ErrorStateVariant;
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Retry callback */
  onRetry?: () => void;
  /** Go back callback */
  onGoBack?: () => void;
  /** Error code for debugging */
  errorCode?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

const ERROR_VARIANTS: Record<ErrorStateVariant, { icon: ReactNode; title: string; message: string }> = {
  default: {
    icon: <AlertCircle className="w-12 h-12 text-red-500" />,
    title: 'Error loading data',
    message: 'Something went wrong. Please try again.',
  },
  network: {
    icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
    title: 'Connection error',
    message: 'Unable to connect to the server. Please check your internet connection.',
  },
  permission: {
    icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
    title: 'Access denied',
    message: 'You do not have permission to view this content.',
  },
  notfound: {
    icon: <FileX className="w-12 h-12 text-gray-500" />,
    title: 'Not found',
    message: 'The requested resource could not be found.',
  },
  server: {
    icon: <AlertCircle className="w-12 h-12 text-red-500" />,
    title: 'Server error',
    message: 'An unexpected error occurred on the server.',
  },
};

export function ErrorState({
  variant = 'default',
  title,
  message,
  icon,
  onRetry,
  onGoBack,
  errorCode,
  size = 'md',
  className,
}: ErrorStateProps) {
  const variantConfig = ERROR_VARIANTS[variant];

  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30',
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-label={title || variantConfig.title}
    >
      <div className="mb-4">{icon || variantConfig.icon}</div>

      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl'
        )}
      >
        {title || variantConfig.title}
      </h3>

      <p
        className={cn(
          'text-gray-600 dark:text-gray-400 max-w-md mb-6',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}
      >
        {message || variantConfig.message}
      </p>

      {errorCode && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 font-mono">
          Error Code: {errorCode}
        </p>
      )}

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            size={size === 'sm' ? 'sm' : 'default'}
            className="bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button
            onClick={onGoBack}
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LOADING STATE
// =============================================================================

export type LoadingStateVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';

interface LoadingStateProps {
  /** Display variant */
  variant?: LoadingStateVariant;
  /** Loading message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

export function LoadingState({
  variant = 'spinner',
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-16',
  };

  const spinnerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  // Spinner variant
  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-4',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={message}
      >
        <div className={cn('relative', spinnerSizes[size])}>
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          {message}
        </p>
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-4',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={message}
      >
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-primary animate-bounce',
                size === 'sm' && 'w-2 h-2',
                size === 'md' && 'w-3 h-3',
                size === 'lg' && 'w-4 h-4'
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          {message}
        </p>
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-4',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label={message}
      >
        <div
          className={cn(
            'rounded-full bg-primary/30 animate-pulse',
            spinnerSizes[size]
          )}
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          {message}
        </p>
      </div>
    );
  }

  // Skeleton variant (no message)
  return (
    <div
      className={cn('space-y-4', sizeClasses[size], className)}
      role="status"
      aria-label="Loading content"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
    </div>
  );
}

// =============================================================================
// SKELETON HELPERS
// =============================================================================

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

export function SkeletonLoader({ count = 5, className }: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700',
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1 animate-pulse"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={`${i}-${j}`}
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SUCCESS STATE
// =============================================================================

interface SuccessStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SuccessState({
  title = 'Success!',
  message = 'The operation completed successfully.',
  action,
  size = 'md',
  className,
}: SuccessStateProps) {
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={title}
    >
      <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {message}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Display names
EmptyState.displayName = 'EmptyState';
ErrorState.displayName = 'ErrorState';
LoadingState.displayName = 'LoadingState';
SkeletonLoader.displayName = 'SkeletonLoader';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonTable.displayName = 'SkeletonTable';
SuccessState.displayName = 'SuccessState';

export default { EmptyState, ErrorState, LoadingState, SuccessState };
