/**
 * ============================================================================
 * CARD COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade card system with:
 * - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 * - Multiple variants (default, elevated, outlined, interactive, sport)
 * - Sport-specific color schemes
 * - Loading states
 * - Gradient options
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/ui/card.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// =============================================================================
// CARD VARIANTS
// =============================================================================

const cardVariants = cva(
  'rounded-xl border bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white transition-all duration-200',
  {
    variants: {
      variant: {
        /** Default card - Standard bordered card */
        default: 'border-neutral-200 dark:border-charcoal-700',
        
        /** Elevated card - With shadow */
        elevated: 'border-neutral-100 dark:border-charcoal-700 shadow-lg dark:shadow-xl',
        
        /** Outlined card - Stronger border */
        outlined: 'border-2 border-neutral-200 dark:border-charcoal-600',
        
        /** Interactive card - Hover effects */
        interactive: 'border-neutral-200 dark:border-charcoal-700 cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-xl hover:border-gold-300 dark:hover:border-gold-700',
        
        /** Ghost card - Minimal styling */
        ghost: 'border-transparent bg-transparent',
        
        /** Gradient card - Gold gradient border */
        gradient: 'border-2 border-transparent bg-gradient-to-br from-gold-50 to-orange-50 dark:from-charcoal-800 dark:to-charcoal-900 shadow-lg',
        
        /** Sport card - Team/sport themed */
        sport: 'border-neutral-200 dark:border-charcoal-700 overflow-hidden',
        
        /** Stat card - For statistics display */
        stat: 'border-neutral-200 dark:border-charcoal-700 bg-gradient-to-br from-white to-neutral-50 dark:from-charcoal-800 dark:to-charcoal-900',
      },
      
      size: {
        sm: 'p-3',
        default: 'p-0',
        lg: 'p-0',
      },
      
      padding: {
        none: '',
        sm: '[&>*:not(.card-media)]:px-3 [&>*:not(.card-media)]:py-2',
        default: '[&>*:not(.card-media)]:px-4 [&>*:not(.card-media)]:py-3',
        lg: '[&>*:not(.card-media)]:px-6 [&>*:not(.card-media)]:py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      padding: 'default',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Loading state */
  isLoading?: boolean;
  /** Sport-specific color (for sport variant) */
  sportColor?: string;
  /** Whether card is disabled */
  disabled?: boolean;
  /** As child - render as different element */
  asChild?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Compact header (less padding) */
  compact?: boolean;
  /** With bottom border */
  bordered?: boolean;
  /** With gradient background */
  gradient?: boolean;
  /** Sport color for gradient */
  sportColor?: string;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Title size */
  size?: 'sm' | 'default' | 'lg' | 'xl';
  /** As different heading level */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Truncate text */
  truncate?: boolean;
  /** Max lines before truncate */
  lines?: number;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove padding */
  noPadding?: boolean;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Compact footer */
  compact?: boolean;
  /** With top border */
  bordered?: boolean;
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source */
  src?: string;
  /** Alt text */
  alt?: string;
  /** Aspect ratio */
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9';
  /** Position */
  position?: 'top' | 'bottom';
  /** Overlay gradient */
  overlay?: boolean;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Card Component
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      padding,
      isLoading = false,
      sportColor,
      disabled = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const sportStyle = sportColor
      ? { '--sport-color': sportColor, borderLeftColor: sportColor, borderLeftWidth: '4px' } as React.CSSProperties
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, padding }),
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        style={{ ...sportStyle, ...style }}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);
Card.displayName = 'Card';

/**
 * Card Header Component
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      className,
      compact = false,
      bordered = false,
      gradient = false,
      sportColor,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const gradientStyle = gradient && sportColor
      ? { background: `linear-gradient(135deg, ${sportColor}15, ${sportColor}05)` } as React.CSSProperties
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1.5',
          compact ? 'px-4 py-3' : 'px-6 py-4',
          bordered && 'border-b border-neutral-200 dark:border-charcoal-700',
          gradient && 'bg-gradient-to-r from-neutral-50 to-white dark:from-charcoal-800 dark:to-charcoal-900',
          className
        )}
        style={{ ...gradientStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

/**
 * Card Title Component
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = 'default', as: Comp = 'h3', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-base font-semibold',
      default: 'text-lg font-bold',
      lg: 'text-xl font-bold',
      xl: 'text-2xl font-bold',
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          'leading-tight tracking-tight text-charcoal-900 dark:text-white',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
CardTitle.displayName = 'CardTitle';

/**
 * Card Description Component
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, truncate = false, lines, children, style, ...props }, ref) => {
    const truncateStyle = truncate && lines
      ? {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : {};

    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-charcoal-600 dark:text-charcoal-400',
          truncate && !lines && 'truncate',
          className
        )}
        style={{ ...truncateStyle, ...style }}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

/**
 * Card Content Component
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        noPadding ? '' : 'px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

/**
 * Card Footer Component
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      className,
      compact = false,
      bordered = false,
      justify = 'end',
      children,
      ...props
    },
    ref
  ) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3',
          compact ? 'px-4 py-3' : 'px-6 py-4',
          bordered && 'border-t border-neutral-200 dark:border-charcoal-700',
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

/**
 * Card Media Component
 */
const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  (
    {
      className,
      src,
      alt = '',
      aspectRatio = '16/9',
      position = 'top',
      overlay = false,
      children,
      ...props
    },
    ref
  ) => {
    const aspectClasses = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
      '21/9': 'aspect-[21/9]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'card-media relative overflow-hidden bg-neutral-100 dark:bg-charcoal-700',
          aspectClasses[aspectRatio],
          position === 'top' ? 'rounded-t-xl' : 'rounded-b-xl',
          className
        )}
        {...props}
      >
        {src && (
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        )}
        {children && (
          <div className="absolute inset-0 flex items-end p-4">
            {children}
          </div>
        )}
      </div>
    );
  }
);
CardMedia.displayName = 'CardMedia';

/**
 * Card Action Area Component
 * Makes the entire card clickable
 */
interface CardActionAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  disabled?: boolean;
}

const CardActionArea = React.forwardRef<HTMLDivElement, CardActionAreaProps>(
  ({ className, href, disabled = false, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (href) {
        window.location.href = href;
      }
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'cursor-pointer transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:bg-neutral-50 dark:hover:bg-charcoal-700/50',
          className
        )}
        onClick={handleClick}
        role={href ? 'link' : 'button'}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardActionArea.displayName = 'CardActionArea';

// =============================================================================
// SPECIALTY CARDS
// =============================================================================

/**
 * Stat Card Component
 * For displaying statistics
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      change,
      changeLabel,
      icon,
      trend,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'border-neutral-200 dark:border-charcoal-700',
      success: 'border-l-4 border-l-green-500 border-neutral-200 dark:border-charcoal-700',
      warning: 'border-l-4 border-l-amber-500 border-neutral-200 dark:border-charcoal-700',
      danger: 'border-l-4 border-l-red-500 border-neutral-200 dark:border-charcoal-700',
      info: 'border-l-4 border-l-blue-500 border-neutral-200 dark:border-charcoal-700',
    };

    const trendColors = {
      up: 'text-green-600 dark:text-green-400',
      down: 'text-red-600 dark:text-red-400',
      neutral: 'text-charcoal-500 dark:text-charcoal-400',
    };

    return (
      <Card
        ref={ref}
        variant="stat"
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">
                {label}
              </p>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                {value}
              </p>
              {change !== undefined && (
                <p className={cn('text-xs font-medium', trend ? trendColors[trend] : trendColors.neutral)}>
                  {change > 0 ? '+' : ''}{change}%{' '}
                  {changeLabel && <span className="text-charcoal-500 dark:text-charcoal-400">{changeLabel}</span>}
                </p>
              )}
            </div>
            {icon && (
              <div className="p-3 rounded-xl bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';

/**
 * Sport Team Card Component
 * For displaying team information
 */
interface TeamCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  logo?: string;
  sport: string;
  primaryColor?: string;
  secondaryColor?: string;
  stats?: { label: string; value: string | number }[];
  onClick?: () => void;
}

const TeamCard = React.forwardRef<HTMLDivElement, TeamCardProps>(
  (
    {
      className,
      name,
      logo,
      sport,
      primaryColor = '#D4AF37',
      secondaryColor,
      stats,
      onClick,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      variant="interactive"
      className={className}
      onClick={onClick}
      style={{ '--sport-color': primaryColor } as React.CSSProperties}
      {...props}
    >
      {/* Color Banner */}
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor}90)` }}
      />
      
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-contain p-2" />
            ) : (
              name.charAt(0)
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-charcoal-900 dark:text-white truncate">
              {name}
            </h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              {sport}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700 grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-lg font-bold text-charcoal-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
);
TeamCard.displayName = 'TeamCard';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  CardActionArea,
  StatCard,
  TeamCard,
  cardVariants,
};