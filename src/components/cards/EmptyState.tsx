/**
 * ============================================================================
 * EmptyState Component
 * ============================================================================
 * 
 * Enterprise-grade empty state component for when no data is available.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users - Generic UI component
 * 
 * USE CASES:
 * - No players found
 * - No matches scheduled
 * - No training sessions
 * - Empty search results
 * - No notifications
 * - First-time user onboarding
 * 
 * FEATURES:
 * - Multiple size variants (sm, md, lg, xl)
 * - Context variants (default, search, error, success, create)
 * - Dark mode support
 * - Custom illustrations support
 * - Multiple action buttons
 * - Animated entrance
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Inbox,
  FolderOpen,
  Users,
  Calendar,
  Trophy,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type EmptyStateSize = 'sm' | 'md' | 'lg' | 'xl';

export type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'error' 
  | 'success' 
  | 'create' 
  | 'inbox'
  | 'players'
  | 'matches'
  | 'training'
  | 'documents';

export interface EmptyStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button icon */
  icon?: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface EmptyStateProps {
  /** Custom icon or illustration */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button (legacy support) */
  actionLabel?: string;
  /** Primary action icon (legacy support) */
  actionIcon?: ReactNode;
  /** Primary action handler (legacy support) */
  onAction?: () => void;
  /** Multiple action buttons */
  actions?: EmptyStateAction[];
  /** Size variant */
  size?: EmptyStateSize;
  /** Context variant */
  variant?: EmptyStateVariant;
  /** Custom class name */
  className?: string;
  /** Show animated entrance */
  animated?: boolean;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface SizeConfig {
  iconSize: string;
  iconContainerSize: string;
  padding: string;
  titleSize: string;
  descSize: string;
  gap: string;
}

const SIZE_CONFIG: Record<EmptyStateSize, SizeConfig> = {
  sm: {
    iconSize: 'w-8 h-8',
    iconContainerSize: 'w-12 h-12',
    padding: 'p-6',
    titleSize: 'text-base',
    descSize: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    iconSize: 'w-10 h-10',
    iconContainerSize: 'w-16 h-16',
    padding: 'p-8',
    titleSize: 'text-lg',
    descSize: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    iconSize: 'w-12 h-12',
    iconContainerSize: 'w-20 h-20',
    padding: 'p-12',
    titleSize: 'text-xl',
    descSize: 'text-base',
    gap: 'gap-4',
  },
  xl: {
    iconSize: 'w-16 h-16',
    iconContainerSize: 'w-24 h-24',
    padding: 'p-16',
    titleSize: 'text-2xl',
    descSize: 'text-lg',
    gap: 'gap-5',
  },
};

interface VariantConfig {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  default: {
    icon: <Inbox className="w-full h-full" />,
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-400 dark:text-gray-500',
  },
  search: {
    icon: <Search className="w-full h-full" />,
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-400 dark:text-blue-500',
  },
  error: {
    icon: <AlertCircle className="w-full h-full" />,
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-400 dark:text-red-500',
  },
  success: {
    icon: <CheckCircle className="w-full h-full" />,
    iconBg: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-400 dark:text-green-500',
  },
  create: {
    icon: <Plus className="w-full h-full" />,
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-400 dark:text-purple-500',
  },
  inbox: {
    icon: <FolderOpen className="w-full h-full" />,
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-400 dark:text-amber-500',
  },
  players: {
    icon: <Users className="w-full h-full" />,
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-400 dark:text-indigo-500',
  },
  matches: {
    icon: <Trophy className="w-full h-full" />,
    iconBg: 'bg-gold-50 dark:bg-gold-900/20',
    iconColor: 'text-gold-500 dark:text-gold-400',
  },
  training: {
    icon: <Calendar className="w-full h-full" />,
    iconBg: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-400 dark:text-teal-500',
  },
  documents: {
    icon: <FileText className="w-full h-full" />,
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-400 dark:text-cyan-500',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actions,
  size = 'md',
  variant = 'default',
  className,
  animated = true,
  testId,
}: EmptyStateProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];

  // Combine legacy action with new actions array
  const allActions: EmptyStateAction[] = [
    ...(actions || []),
    ...(actionLabel && onAction
      ? [{ label: actionLabel, icon: actionIcon, onClick: onAction, variant: 'primary' as const }]
      : []),
  ];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeConfig.padding,
        animated && 'animate-in fade-in-0 zoom-in-95 duration-300',
        className
      )}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      {/* Icon Container */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full mb-4',
          sizeConfig.iconContainerSize,
          variantConfig.iconBg
        )}
      >
        <div className={cn(sizeConfig.iconSize, variantConfig.iconColor)}>
          {icon || variantConfig.icon}
        </div>
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-bold text-gray-900 dark:text-white mb-2',
          sizeConfig.titleSize
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-400 max-w-md mb-6',
            sizeConfig.descSize
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {allActions.length > 0 && (
        <div className={cn('flex flex-wrap justify-center', sizeConfig.gap)}>
          {allActions.map((action, index) => {
            const isPrimary = action.variant === 'primary' || index === 0;
            
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={isPrimary ? 'default' : 'outline'}
                className={cn(
                  isPrimary && 'bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md',
                  'inline-flex items-center gap-2'
                )}
              >
                {action.icon}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export default EmptyState;
