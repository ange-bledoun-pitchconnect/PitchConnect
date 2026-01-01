/**
 * ============================================================================
 * StatCard Component
 * ============================================================================
 * 
 * Enterprise-grade statistics card for dashboards with sport context support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users with dashboard access
 * - PLAYER: Personal stats
 * - COACH: Team/player stats
 * - MANAGER: Club stats
 * - ANALYST: Performance metrics
 * 
 * FEATURES:
 * - Multiple variants (default, primary, success, warning, danger, sport-themed)
 * - Trend indicators with percentage
 * - Loading skeleton
 * - Dark mode support
 * - Hover lift effect
 * - Sport-specific theming
 * - Sparkline chart option
 * - Clickable with focus states
 * - Comparison mode
 * - Accessible
 * 
 * ============================================================================
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type StatCardVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger'
  | 'football'
  | 'basketball'
  | 'rugby'
  | 'cricket'
  | 'hockey';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Change text (e.g., "+12%") */
  change?: string;
  /** Trend direction */
  trend?: TrendDirection;
  /** Is the change positive (deprecated, use trend instead) */
  isPositive?: boolean;
  /** Icon component */
  icon?: LucideIcon;
  /** Description or subtitle */
  description?: string;
  /** Comparison value */
  comparisonValue?: string | number;
  /** Comparison label */
  comparisonLabel?: string;
  /** Click handler */
  onClick?: () => void;
  /** Link URL */
  href?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Custom class name */
  className?: string;
  /** Card variant */
  variant?: StatCardVariant;
  /** Sparkline data points */
  sparklineData?: number[];
  /** Show border */
  showBorder?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface VariantConfig {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  sparklineColor: string;
}

const VARIANT_CONFIG: Record<StatCardVariant, VariantConfig> = {
  default: {
    bg: 'bg-white dark:bg-charcoal-800',
    border: 'border-gray-200 dark:border-charcoal-700',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-700 dark:text-gray-300',
    valueColor: 'text-gray-900 dark:text-white',
    sparklineColor: '#6b7280',
  },
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-800/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    valueColor: 'text-blue-900 dark:text-blue-100',
    sparklineColor: '#3b82f6',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-800/50',
    iconColor: 'text-green-600 dark:text-green-400',
    valueColor: 'text-green-900 dark:text-green-100',
    sparklineColor: '#10b981',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-900 dark:text-amber-100',
    sparklineColor: '#f59e0b',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-800/50',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-900 dark:text-red-100',
    sparklineColor: '#ef4444',
  },
  // Sport-themed variants
  football: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    iconBg: 'bg-green-100 dark:bg-green-800/50',
    iconColor: 'text-green-700 dark:text-green-400',
    valueColor: 'text-green-900 dark:text-green-100',
    sparklineColor: '#16a34a',
  },
  basketball: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    iconColor: 'text-orange-700 dark:text-orange-400',
    valueColor: 'text-orange-900 dark:text-orange-100',
    sparklineColor: '#ea580c',
  },
  rugby: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    iconBg: 'bg-red-100 dark:bg-red-800/50',
    iconColor: 'text-red-700 dark:text-red-400',
    valueColor: 'text-red-900 dark:text-red-100',
    sparklineColor: '#dc2626',
  },
  cricket: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    iconColor: 'text-amber-700 dark:text-amber-400',
    valueColor: 'text-amber-900 dark:text-amber-100',
    sparklineColor: '#d97706',
  },
  hockey: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-800/50',
    iconColor: 'text-blue-700 dark:text-blue-400',
    valueColor: 'text-blue-900 dark:text-blue-100',
    sparklineColor: '#2563eb',
  },
};

// =============================================================================
// SPARKLINE COMPONENT
// =============================================================================

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
}

function Sparkline({ data, color, height = 40 }: SparklineProps) {
  const points = useMemo(() => {
    if (!data.length) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 100;
    const stepX = width / (data.length - 1);
    
    return data
      .map((value, index) => {
        const x = index * stepX;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, height]);

  if (!data.length) return null;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function StatCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className={cn('mb-4', compact ? 'space-y-1' : 'space-y-2')}>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StatCard({
  title,
  value,
  change,
  trend,
  isPositive,
  icon: Icon,
  description,
  comparisonValue,
  comparisonLabel,
  onClick,
  href,
  isLoading = false,
  className,
  variant = 'default',
  sparklineData,
  showBorder = true,
  compact = false,
  testId,
}: StatCardProps) {
  const config = VARIANT_CONFIG[variant];

  // Determine trend from isPositive if trend not provided
  const effectiveTrend: TrendDirection = trend || (isPositive === undefined ? 'neutral' : isPositive ? 'up' : 'down');

  // Trend icon and color
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
    down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
    neutral: { icon: Minus, color: 'text-gray-500 dark:text-gray-400' },
  };

  const TrendIcon = trendConfig[effectiveTrend].icon;

  // Wrapper component (link or div)
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      onClick={onClick}
      className={cn(
        // Base styles
        'relative rounded-lg',
        compact ? 'p-4' : 'p-6',
        // Border
        showBorder && 'border',
        // Colors
        config.bg,
        config.border,
        // Hover effects - FIXED
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        // Cursor
        (onClick || href) && 'cursor-pointer',
        // Custom
        className
      )}
      data-testid={testId}
      role={onClick || href ? 'button' : 'article'}
      tabIndex={onClick || href ? 0 : undefined}
    >
      {/* Loading State */}
      {isLoading ? (
        <StatCardSkeleton compact={compact} />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {Icon && (
              <div className={cn('rounded-lg p-2', config.iconBg)}>
                <Icon className={cn('h-5 w-5', config.iconColor)} />
              </div>
            )}
          </div>

          {/* Value */}
          <div className={cn('mt-4', compact && 'mt-2')}>
            <p className={cn('font-bold', config.valueColor, compact ? 'text-2xl' : 'text-3xl')}>
              {value}
            </p>
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 1 && (
            <div className="mt-3 h-10">
              <Sparkline data={sparklineData} color={config.sparklineColor} />
            </div>
          )}

          {/* Change & Description */}
          {(change || description || comparisonValue) && (
            <div className={cn('mt-4', compact && 'mt-2')}>
              {/* Change indicator */}
              {change && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn('h-4 w-4', trendConfig[effectiveTrend].color)} />
                  <span className={cn('text-sm font-medium', trendConfig[effectiveTrend].color)}>
                    {change}
                  </span>
                </div>
              )}

              {/* Comparison */}
              {comparisonValue && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {comparisonLabel || 'vs'}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {comparisonValue}
                  </span>
                </div>
              )}

              {/* Description */}
              {description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Link indicator */}
          {(onClick || href) && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </>
      )}
    </Wrapper>
  );
}

StatCard.displayName = 'StatCard';

export default StatCard;
