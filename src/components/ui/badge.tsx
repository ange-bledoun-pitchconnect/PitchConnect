/**
 * ============================================================================
 * BADGE COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade badge with charcoal/gold design system:
 * - Multiple variants (default, primary, success, warning, danger, info, sport)
 * - Multiple sizes (xs, sm, md, lg)
 * - Dot indicator option
 * - Removable badges
 * - Icon support
 * - Sport-specific color schemes
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/ui/badge.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border border-neutral-200 dark:border-charcoal-600 bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300',
        primary:
          'border border-gold-200 dark:border-gold-800 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400',
        secondary:
          'border border-charcoal-200 dark:border-charcoal-600 bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300',
        success:
          'border border-green-200 dark:border-green-800 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        warning:
          'border border-amber-200 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        danger:
          'border border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        info:
          'border border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        purple:
          'border border-purple-200 dark:border-purple-800 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        outline:
          'border-2 border-current bg-transparent',
        solidPrimary:
          'border-transparent bg-gold-500 dark:bg-gold-600 text-white',
        solidSuccess:
          'border-transparent bg-green-500 dark:bg-green-600 text-white',
        solidDanger:
          'border-transparent bg-red-500 dark:bg-red-600 text-white',
        live:
          'border border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] rounded',
        sm: 'px-2 py-0.5 text-xs rounded-md',
        md: 'px-2.5 py-1 text-xs rounded-md',
        lg: 'px-3 py-1.5 text-sm rounded-lg',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      shape: 'default',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
  color?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      icon,
      dot = false,
      dotColor,
      removable = false,
      onRemove,
      color,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const customStyle = color
      ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color: color, ...style }
      : style;

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        style={customStyle}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', dotColor || 'bg-current')}
            style={dotColor && !dotColor.startsWith('bg-') ? { backgroundColor: dotColor } : undefined}
          />
        )}
        {!dot && icon && <span className="flex-shrink-0 -ml-0.5">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            className="flex-shrink-0 -mr-1 ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// =============================================================================
// STATUS BADGE
// =============================================================================

type StatusType =
  | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  | 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED'
  | 'LIVE' | 'UPCOMING' | 'FINISHED'
  | 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY'
  | 'CONFIRMED' | 'DECLINED' | 'MAYBE' | 'NO_RESPONSE'
  | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot' | 'dotColor'> {
  status: StatusType | string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<string, { variant: BadgeProps['variant']; dotColor?: string }> = {
  ACTIVE: { variant: 'success', dotColor: 'bg-green-500' },
  INACTIVE: { variant: 'default', dotColor: 'bg-gray-400' },
  PENDING: { variant: 'warning', dotColor: 'bg-amber-500' },
  APPROVED: { variant: 'success', dotColor: 'bg-green-500' },
  REJECTED: { variant: 'danger', dotColor: 'bg-red-500' },
  DRAFT: { variant: 'default', dotColor: 'bg-gray-400' },
  SCHEDULED: { variant: 'info', dotColor: 'bg-blue-500' },
  IN_PROGRESS: { variant: 'success', dotColor: 'bg-green-500' },
  COMPLETED: { variant: 'secondary', dotColor: 'bg-charcoal-500' },
  CANCELLED: { variant: 'danger', dotColor: 'bg-red-500' },
  POSTPONED: { variant: 'warning', dotColor: 'bg-amber-500' },
  LIVE: { variant: 'live', dotColor: 'bg-red-500' },
  UPCOMING: { variant: 'info', dotColor: 'bg-blue-500' },
  FINISHED: { variant: 'default', dotColor: 'bg-gray-500' },
  ONLINE: { variant: 'success', dotColor: 'bg-green-500' },
  OFFLINE: { variant: 'default', dotColor: 'bg-gray-400' },
  AWAY: { variant: 'warning', dotColor: 'bg-amber-500' },
  BUSY: { variant: 'danger', dotColor: 'bg-red-500' },
  CONFIRMED: { variant: 'success', dotColor: 'bg-green-500' },
  DECLINED: { variant: 'danger', dotColor: 'bg-red-500' },
  MAYBE: { variant: 'warning', dotColor: 'bg-amber-500' },
  NO_RESPONSE: { variant: 'default', dotColor: 'bg-gray-400' },
  PRESENT: { variant: 'success', dotColor: 'bg-green-500' },
  ABSENT: { variant: 'danger', dotColor: 'bg-red-500' },
  LATE: { variant: 'warning', dotColor: 'bg-amber-500' },
  EXCUSED: { variant: 'info', dotColor: 'bg-blue-500' },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, size = 'sm', shape = 'pill', ...props }, ref) => {
    const config = STATUS_CONFIG[status.toUpperCase()] || { variant: 'default', dotColor: 'bg-gray-400' };
    return (
      <Badge ref={ref} variant={config.variant} size={size} shape={shape} dot={showDot} dotColor={config.dotColor} {...props}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

// =============================================================================
// ROLE BADGE
// =============================================================================

interface RoleBadgeProps extends Omit<BadgeProps, 'variant'> {
  role: string;
}

const ROLE_CONFIG: Record<string, { variant: BadgeProps['variant']; icon?: string }> = {
  SUPERADMIN: { variant: 'solidDanger', icon: '👑' },
  ADMIN: { variant: 'danger', icon: '🔐' },
  CLUB_OWNER: { variant: 'primary', icon: '🏆' },
  OWNER: { variant: 'primary', icon: '🏆' },
  CLUB_MANAGER: { variant: 'purple', icon: '📋' },
  MANAGER: { variant: 'purple', icon: '📋' },
  HEAD_COACH: { variant: 'info', icon: '🎯' },
  COACH: { variant: 'info', icon: '🎯' },
  COACH_PRO: { variant: 'solidPrimary', icon: '⭐' },
  ASSISTANT_COACH: { variant: 'info', icon: '🤝' },
  PLAYER: { variant: 'success', icon: '⚽' },
  PLAYER_PRO: { variant: 'solidSuccess', icon: '🌟' },
  GOALKEEPER_COACH: { variant: 'warning', icon: '🧤' },
  PERFORMANCE_COACH: { variant: 'purple', icon: '💪' },
  ANALYST: { variant: 'secondary', icon: '📊' },
  VIDEO_ANALYST: { variant: 'secondary', icon: '🎬' },
  SCOUT: { variant: 'info', icon: '🔍' },
  MEDICAL_STAFF: { variant: 'danger', icon: '🏥' },
  PHYSIOTHERAPIST: { variant: 'danger', icon: '💆' },
  NUTRITIONIST: { variant: 'success', icon: '🥗' },
  PSYCHOLOGIST: { variant: 'purple', icon: '🧠' },
  TREASURER: { variant: 'primary', icon: '💰' },
  REFEREE: { variant: 'warning', icon: '🏁' },
  PARENT: { variant: 'default', icon: '👨‍👩‍👧' },
  GUARDIAN: { variant: 'default', icon: '🛡️' },
  LEAGUE_ADMIN: { variant: 'info', icon: '🏛️' },
  MEDIA_MANAGER: { variant: 'purple', icon: '📸' },
  KIT_MANAGER: { variant: 'default', icon: '👕' },
  STAFF: { variant: 'default', icon: '👤' },
  FAN: { variant: 'default', icon: '📣' },
};

const RoleBadge = React.forwardRef<HTMLSpanElement, RoleBadgeProps>(
  ({ role, size = 'sm', ...props }, ref) => {
    const config = ROLE_CONFIG[role.toUpperCase()] || { variant: 'default', icon: '👤' };
    return (
      <Badge ref={ref} variant={config.variant} size={size} icon={<span className="text-xs">{config.icon}</span>} {...props}>
        {role.replace(/_/g, ' ')}
      </Badge>
    );
  }
);
RoleBadge.displayName = 'RoleBadge';

// =============================================================================
// SPORT BADGE
// =============================================================================

interface SportBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  sport: string;
}

const SPORT_CONFIG: Record<string, { color: string; icon: string }> = {
  FOOTBALL: { color: '#22C55E', icon: '⚽' },
  RUGBY: { color: '#8B5CF6', icon: '🏉' },
  CRICKET: { color: '#F59E0B', icon: '🏏' },
  BASKETBALL: { color: '#EF4444', icon: '🏀' },
  NETBALL: { color: '#EC4899', icon: '🏐' },
  AMERICAN_FOOTBALL: { color: '#6366F1', icon: '🏈' },
  HOCKEY: { color: '#06B6D4', icon: '🏑' },
  LACROSSE: { color: '#14B8A6', icon: '🥍' },
  AUSTRALIAN_RULES: { color: '#F97316', icon: '🏉' },
  GAELIC_FOOTBALL: { color: '#84CC16', icon: '⚽' },
  FUTSAL: { color: '#10B981', icon: '⚽' },
  BEACH_FOOTBALL: { color: '#FBBF24', icon: '🏖️' },
};

const SportBadge = React.forwardRef<HTMLSpanElement, SportBadgeProps>(
  ({ sport, size = 'sm', ...props }, ref) => {
    const config = SPORT_CONFIG[sport.toUpperCase()] || { color: '#6B7280', icon: '🎯' };
    return (
      <Badge ref={ref} size={size} color={config.color} icon={<span>{config.icon}</span>} {...props}>
        {sport.replace(/_/g, ' ')}
      </Badge>
    );
  }
);
SportBadge.displayName = 'SportBadge';

// =============================================================================
// BADGE GROUP
// =============================================================================

interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  gap?: 'sm' | 'md' | 'lg';
}

const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ className, children, max, gap = 'sm', ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleChildren = max ? childArray.slice(0, max) : childArray;
    const remainingCount = max ? childArray.length - max : 0;
    const gapClasses = { sm: 'gap-1', md: 'gap-2', lg: 'gap-3' };

    return (
      <div ref={ref} className={cn('flex flex-wrap items-center', gapClasses[gap], className)} {...props}>
        {visibleChildren}
        {remainingCount > 0 && <Badge variant="default" size="sm">+{remainingCount}</Badge>}
      </div>
    );
  }
);
BadgeGroup.displayName = 'BadgeGroup';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Badge,
  StatusBadge,
  RoleBadge,
  SportBadge,
  BadgeGroup,
  badgeVariants,
  STATUS_CONFIG,
  ROLE_CONFIG,
  SPORT_CONFIG,
};