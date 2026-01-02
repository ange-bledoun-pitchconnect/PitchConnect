/**
 * ============================================================================
 * AVATAR COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade custom avatar (no Radix dependency) with:
 * - Multiple sizes (xs, sm, md, lg, xl, 2xl)
 * - Status indicators (online, offline, busy, away)
 * - Fallback initials
 * - Sport-specific badges (captain, pro, etc.)
 * - Group/stack display
 * - Image loading states
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/ui/avatar.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Crown, Star, Shield, Verified } from 'lucide-react';

// =============================================================================
// VARIANTS
// =============================================================================

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-semibold select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
        '3xl': 'h-24 w-24 text-3xl',
      },
      variant: {
        default: 'bg-neutral-100 dark:bg-charcoal-700',
        primary: 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400',
        gradient: 'bg-gradient-to-br from-gold-400 to-gold-600 text-white',
        sport: '', // Color set via sportColor prop
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      shape: 'circle',
    },
  }
);

const statusVariants = cva(
  'absolute block rounded-full ring-2 ring-white dark:ring-charcoal-800',
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        busy: 'bg-red-500',
        away: 'bg-amber-500',
      },
      size: {
        xs: 'h-1.5 w-1.5 -bottom-0 -right-0',
        sm: 'h-2 w-2 bottom-0 right-0',
        md: 'h-2.5 w-2.5 bottom-0 right-0',
        lg: 'h-3 w-3 bottom-0.5 right-0.5',
        xl: 'h-4 w-4 bottom-1 right-1',
        '2xl': 'h-5 w-5 bottom-1 right-1',
        '3xl': 'h-6 w-6 bottom-1.5 right-1.5',
      },
    },
    defaultVariants: {
      status: 'offline',
      size: 'md',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
export type AvatarBadge = 'captain' | 'vice-captain' | 'pro' | 'verified' | 'coach' | 'staff';

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** Image source */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Fallback text (usually initials) */
  fallback?: string;
  /** First name (for auto-generating initials) */
  firstName?: string;
  /** Last name (for auto-generating initials) */
  lastName?: string;
  /** Status indicator */
  status?: AvatarStatus;
  /** Badge type */
  badge?: AvatarBadge;
  /** Sport-specific color */
  sportColor?: string;
  /** Jersey number (for player avatars) */
  jerseyNumber?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Image load error handler */
  onImageError?: () => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const AvatarBadgeIcon = ({ badge, size }: { badge: AvatarBadge; size: string }) => {
  const iconSizes: Record<string, string> = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
    '2xl': 'h-7 w-7',
    '3xl': 'h-8 w-8',
  };

  const badgePositions: Record<string, string> = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1 -right-1',
    xl: '-bottom-1.5 -right-1.5',
    '2xl': '-bottom-2 -right-2',
    '3xl': '-bottom-2 -right-2',
  };

  const iconSize = iconSizes[size] || iconSizes.md;
  const position = badgePositions[size] || badgePositions.md;

  const badges: Record<AvatarBadge, { icon: React.ReactNode; bg: string }> = {
    captain: {
      icon: <Crown className={cn(iconSize, 'text-white')} />,
      bg: 'bg-amber-500',
    },
    'vice-captain': {
      icon: <Star className={cn(iconSize, 'text-white')} />,
      bg: 'bg-blue-500',
    },
    pro: {
      icon: <Shield className={cn(iconSize, 'text-white')} />,
      bg: 'bg-purple-500',
    },
    verified: {
      icon: <Verified className={cn(iconSize, 'text-white')} />,
      bg: 'bg-green-500',
    },
    coach: {
      icon: <span className={cn('text-white font-bold', size === 'xs' ? 'text-[8px]' : 'text-[10px]')}>C</span>,
      bg: 'bg-blue-600',
    },
    staff: {
      icon: <span className={cn('text-white font-bold', size === 'xs' ? 'text-[8px]' : 'text-[10px]')}>S</span>,
      bg: 'bg-gray-600',
    },
  };

  const { icon, bg } = badges[badge];

  return (
    <span
      className={cn(
        'absolute flex items-center justify-center rounded-full ring-2 ring-white dark:ring-charcoal-800 p-0.5',
        bg,
        position
      )}
    >
      {icon}
    </span>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      variant,
      shape,
      src,
      alt = '',
      fallback,
      firstName,
      lastName,
      status,
      badge,
      sportColor,
      jerseyNumber,
      isLoading = false,
      onImageError,
      style,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Generate initials from name or fallback
    const initials = React.useMemo(() => {
      if (fallback) return fallback;
      if (firstName || lastName) {
        const f = firstName?.[0] || '';
        const l = lastName?.[0] || '';
        return `${f}${l}`.toUpperCase();
      }
      return '?';
    }, [fallback, firstName, lastName]);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [src]);

    const handleImageError = () => {
      setImageError(true);
      onImageError?.();
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    // Sport color style
    const sportStyle = sportColor && variant === 'sport'
      ? { backgroundColor: sportColor }
      : {};

    const showImage = src && !imageError;
    const showFallback = !showImage || !imageLoaded;

    return (
      <div
        ref={ref}
        className={cn(
          avatarVariants({ size, variant, shape }),
          className
        )}
        style={{ ...sportStyle, ...style }}
        {...props}
      >
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-200 dark:bg-charcoal-600 animate-pulse rounded-full" />
        )}

        {/* Image */}
        {showImage && !isLoading && (
          <img
            src={src}
            alt={alt}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              !imageLoaded && 'opacity-0'
            )}
          />
        )}

        {/* Fallback (initials or jersey number) */}
        {showFallback && !isLoading && (
          <span className="select-none">
            {jerseyNumber !== undefined ? jerseyNumber : initials}
          </span>
        )}

        {/* Status indicator */}
        {status && (
          <span className={cn(statusVariants({ status, size }))} />
        )}

        {/* Badge */}
        {badge && !status && (
          <AvatarBadgeIcon badge={badge} size={size || 'md'} />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// =============================================================================
// AVATAR IMAGE (for composition pattern)
// =============================================================================

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = '', onLoadingStatusChange, ...props }, ref) => {
    const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');

    React.useEffect(() => {
      if (!src) {
        setStatus('error');
        return;
      }
      setStatus('loading');
    }, [src]);

    const handleLoad = () => {
      setStatus('loaded');
      onLoadingStatusChange?.('loaded');
    };

    const handleError = () => {
      setStatus('error');
      onLoadingStatusChange?.('error');
    };

    if (status === 'error') return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'absolute inset-0 h-full w-full object-cover',
          status === 'loading' && 'opacity-0',
          className
        )}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

// =============================================================================
// AVATAR FALLBACK (for composition pattern)
// =============================================================================

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  delayMs?: number;
}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, delayMs = 600, ...props }, ref) => {
    const [canRender, setCanRender] = React.useState(delayMs === 0);

    React.useEffect(() => {
      if (delayMs > 0) {
        const timeout = setTimeout(() => setCanRender(true), delayMs);
        return () => clearTimeout(timeout);
      }
    }, [delayMs]);

    if (!canRender) return null;

    return (
      <span
        ref={ref}
        className={cn('flex h-full w-full items-center justify-center', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';

// =============================================================================
// AVATAR GROUP
// =============================================================================

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum avatars to show */
  max?: number;
  /** Size of avatars */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Spacing between avatars (negative for overlap) */
  spacing?: 'tight' | 'normal' | 'loose';
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 5, size = 'md', spacing = 'normal', ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    const spacingClasses = {
      tight: '-space-x-3',
      normal: '-space-x-2',
      loose: '-space-x-1',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="ring-2 ring-white dark:ring-charcoal-800 rounded-full"
            style={{ zIndex: visibleChildren.length - index }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
              : child}
          </div>
        ))}

        {remainingCount > 0 && (
          <Avatar
            size={size}
            variant="default"
            fallback={`+${remainingCount}`}
            className="ring-2 ring-white dark:ring-charcoal-800"
          />
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

// =============================================================================
// AVATAR WITH NAME
// =============================================================================

interface AvatarWithNameProps extends AvatarProps {
  /** Name to display */
  name: string;
  /** Secondary text (role, position, etc.) */
  subtitle?: string;
  /** Reverse layout (name on left) */
  reverse?: boolean;
}

const AvatarWithName = React.forwardRef<HTMLDivElement, AvatarWithNameProps>(
  ({ name, subtitle, reverse = false, size = 'md', className, ...avatarProps }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3',
          reverse && 'flex-row-reverse',
          className
        )}
      >
        <Avatar size={size} {...avatarProps} />
        <div className={cn(reverse && 'text-right')}>
          <p className="font-medium text-charcoal-900 dark:text-white">{name}</p>
          {subtitle && (
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }
);
AvatarWithName.displayName = 'AvatarWithName';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarWithName,
  avatarVariants,
  statusVariants,
};