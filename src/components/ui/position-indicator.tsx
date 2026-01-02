/**
 * ============================================================================
 * POSITION INDICATOR COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Sport-specific position indicator/badge with:
 * - Multi-sport support (12 sports)
 * - Position categories (Goalkeeper, Defense, Midfield, Attack, etc.)
 * - Category-based colors
 * - Multiple variants (badge, chip, inline, field)
 * - Position abbreviations
 * - Tooltips with full position names
 * - Dark mode support
 * 
 * @version 1.0.0
 * @path src/components/ui/position-indicator.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

export type Sport = 
  | 'FOOTBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'BASKETBALL'
  | 'NETBALL'
  | 'AMERICAN_FOOTBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

export type PositionCategory =
  | 'GOALKEEPER'
  | 'DEFENSE'
  | 'MIDFIELD'
  | 'ATTACK'
  | 'FORWARD'
  | 'GUARD'
  | 'CENTER'
  | 'UTILITY'
  | 'SPECIALIST'
  | 'BATTING'
  | 'BOWLING'
  | 'ALL_ROUNDER'
  | 'WICKETKEEPER';

export interface PositionConfig {
  code: string;
  name: string;
  abbreviation: string;
  category: PositionCategory;
  color: string;
  sport: Sport;
}

// =============================================================================
// POSITION DATABASE
// =============================================================================

const CATEGORY_COLORS: Record<PositionCategory, { bg: string; text: string; border: string }> = {
  GOALKEEPER: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' },
  DEFENSE: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' },
  MIDFIELD: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500' },
  ATTACK: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' },
  FORWARD: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' },
  GUARD: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-500' },
  CENTER: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-500' },
  UTILITY: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' },
  SPECIALIST: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-500' },
  BATTING: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500' },
  BOWLING: { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-500' },
  ALL_ROUNDER: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-500' },
  WICKETKEEPER: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
};

// Football positions
const FOOTBALL_POSITIONS: PositionConfig[] = [
  { code: 'GK', name: 'Goalkeeper', abbreviation: 'GK', category: 'GOALKEEPER', color: '#F59E0B', sport: 'FOOTBALL' },
  { code: 'CB', name: 'Center Back', abbreviation: 'CB', category: 'DEFENSE', color: '#3B82F6', sport: 'FOOTBALL' },
  { code: 'LB', name: 'Left Back', abbreviation: 'LB', category: 'DEFENSE', color: '#3B82F6', sport: 'FOOTBALL' },
  { code: 'RB', name: 'Right Back', abbreviation: 'RB', category: 'DEFENSE', color: '#3B82F6', sport: 'FOOTBALL' },
  { code: 'LWB', name: 'Left Wing Back', abbreviation: 'LWB', category: 'DEFENSE', color: '#3B82F6', sport: 'FOOTBALL' },
  { code: 'RWB', name: 'Right Wing Back', abbreviation: 'RWB', category: 'DEFENSE', color: '#3B82F6', sport: 'FOOTBALL' },
  { code: 'CDM', name: 'Defensive Midfielder', abbreviation: 'CDM', category: 'MIDFIELD', color: '#22C55E', sport: 'FOOTBALL' },
  { code: 'CM', name: 'Central Midfielder', abbreviation: 'CM', category: 'MIDFIELD', color: '#22C55E', sport: 'FOOTBALL' },
  { code: 'CAM', name: 'Attacking Midfielder', abbreviation: 'CAM', category: 'MIDFIELD', color: '#22C55E', sport: 'FOOTBALL' },
  { code: 'LM', name: 'Left Midfielder', abbreviation: 'LM', category: 'MIDFIELD', color: '#22C55E', sport: 'FOOTBALL' },
  { code: 'RM', name: 'Right Midfielder', abbreviation: 'RM', category: 'MIDFIELD', color: '#22C55E', sport: 'FOOTBALL' },
  { code: 'LW', name: 'Left Winger', abbreviation: 'LW', category: 'ATTACK', color: '#EF4444', sport: 'FOOTBALL' },
  { code: 'RW', name: 'Right Winger', abbreviation: 'RW', category: 'ATTACK', color: '#EF4444', sport: 'FOOTBALL' },
  { code: 'CF', name: 'Center Forward', abbreviation: 'CF', category: 'ATTACK', color: '#EF4444', sport: 'FOOTBALL' },
  { code: 'ST', name: 'Striker', abbreviation: 'ST', category: 'ATTACK', color: '#EF4444', sport: 'FOOTBALL' },
];

// Basketball positions
const BASKETBALL_POSITIONS: PositionConfig[] = [
  { code: 'PG', name: 'Point Guard', abbreviation: 'PG', category: 'GUARD', color: '#A855F7', sport: 'BASKETBALL' },
  { code: 'SG', name: 'Shooting Guard', abbreviation: 'SG', category: 'GUARD', color: '#A855F7', sport: 'BASKETBALL' },
  { code: 'SF', name: 'Small Forward', abbreviation: 'SF', category: 'FORWARD', color: '#EF4444', sport: 'BASKETBALL' },
  { code: 'PF', name: 'Power Forward', abbreviation: 'PF', category: 'FORWARD', color: '#EF4444', sport: 'BASKETBALL' },
  { code: 'C', name: 'Center', abbreviation: 'C', category: 'CENTER', color: '#6366F1', sport: 'BASKETBALL' },
];

// Cricket positions
const CRICKET_POSITIONS: PositionConfig[] = [
  { code: 'WK', name: 'Wicketkeeper', abbreviation: 'WK', category: 'WICKETKEEPER', color: '#F97316', sport: 'CRICKET' },
  { code: 'BAT', name: 'Batsman', abbreviation: 'BAT', category: 'BATTING', color: '#10B981', sport: 'CRICKET' },
  { code: 'BOWL', name: 'Bowler', abbreviation: 'BOWL', category: 'BOWLING', color: '#06B6D4', sport: 'CRICKET' },
  { code: 'AR', name: 'All-Rounder', abbreviation: 'AR', category: 'ALL_ROUNDER', color: '#8B5CF6', sport: 'CRICKET' },
  { code: 'OPEN', name: 'Opening Batsman', abbreviation: 'OPEN', category: 'BATTING', color: '#10B981', sport: 'CRICKET' },
  { code: 'FAST', name: 'Fast Bowler', abbreviation: 'FAST', category: 'BOWLING', color: '#06B6D4', sport: 'CRICKET' },
  { code: 'SPIN', name: 'Spin Bowler', abbreviation: 'SPIN', category: 'BOWLING', color: '#06B6D4', sport: 'CRICKET' },
];

// Rugby positions
const RUGBY_POSITIONS: PositionConfig[] = [
  { code: 'LHP', name: 'Loosehead Prop', abbreviation: 'LHP', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'HK', name: 'Hooker', abbreviation: 'HK', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'THP', name: 'Tighthead Prop', abbreviation: 'THP', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'LK', name: 'Lock', abbreviation: 'LK', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'FL', name: 'Flanker', abbreviation: 'FL', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'N8', name: 'Number 8', abbreviation: 'N8', category: 'FORWARD', color: '#EF4444', sport: 'RUGBY' },
  { code: 'SH', name: 'Scrum Half', abbreviation: 'SH', category: 'MIDFIELD', color: '#22C55E', sport: 'RUGBY' },
  { code: 'FH', name: 'Fly Half', abbreviation: 'FH', category: 'MIDFIELD', color: '#22C55E', sport: 'RUGBY' },
  { code: 'WG', name: 'Wing', abbreviation: 'WG', category: 'ATTACK', color: '#3B82F6', sport: 'RUGBY' },
  { code: 'CTR', name: 'Centre', abbreviation: 'CTR', category: 'ATTACK', color: '#3B82F6', sport: 'RUGBY' },
  { code: 'FB', name: 'Full Back', abbreviation: 'FB', category: 'DEFENSE', color: '#F59E0B', sport: 'RUGBY' },
];

// Netball positions
const NETBALL_POSITIONS: PositionConfig[] = [
  { code: 'GK', name: 'Goal Keeper', abbreviation: 'GK', category: 'DEFENSE', color: '#3B82F6', sport: 'NETBALL' },
  { code: 'GD', name: 'Goal Defence', abbreviation: 'GD', category: 'DEFENSE', color: '#3B82F6', sport: 'NETBALL' },
  { code: 'WD', name: 'Wing Defence', abbreviation: 'WD', category: 'DEFENSE', color: '#3B82F6', sport: 'NETBALL' },
  { code: 'C', name: 'Centre', abbreviation: 'C', category: 'CENTER', color: '#22C55E', sport: 'NETBALL' },
  { code: 'WA', name: 'Wing Attack', abbreviation: 'WA', category: 'ATTACK', color: '#EF4444', sport: 'NETBALL' },
  { code: 'GA', name: 'Goal Attack', abbreviation: 'GA', category: 'ATTACK', color: '#EF4444', sport: 'NETBALL' },
  { code: 'GS', name: 'Goal Shooter', abbreviation: 'GS', category: 'ATTACK', color: '#EF4444', sport: 'NETBALL' },
];

// Combine all positions
const ALL_POSITIONS: PositionConfig[] = [
  ...FOOTBALL_POSITIONS,
  ...BASKETBALL_POSITIONS,
  ...CRICKET_POSITIONS,
  ...RUGBY_POSITIONS,
  ...NETBALL_POSITIONS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getPosition(code: string, sport?: Sport): PositionConfig | undefined {
  return ALL_POSITIONS.find(p => 
    p.code === code && (!sport || p.sport === sport)
  );
}

export function getPositionsBySport(sport: Sport): PositionConfig[] {
  return ALL_POSITIONS.filter(p => p.sport === sport);
}

export function getPositionsByCategory(sport: Sport, category: PositionCategory): PositionConfig[] {
  return ALL_POSITIONS.filter(p => p.sport === sport && p.category === category);
}

export function getCategoryColor(category: PositionCategory) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.UTILITY;
}

// =============================================================================
// VARIANTS
// =============================================================================

const positionIndicatorVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-colors',
  {
    variants: {
      variant: {
        /** Badge style - rounded pill */
        badge: 'rounded-full px-2.5 py-0.5 text-xs',
        /** Chip style - smaller, minimal */
        chip: 'rounded px-1.5 py-0.5 text-[10px]',
        /** Inline style - just colored text */
        inline: 'text-sm',
        /** Field style - for pitch/court display */
        field: 'rounded-lg px-2 py-1 text-xs shadow-md',
        /** Large badge for profile display */
        large: 'rounded-xl px-4 py-2 text-sm',
      },
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'badge',
      size: 'sm',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface PositionIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof positionIndicatorVariants> {
  /** Position code (e.g., 'GK', 'CB', 'ST') */
  position: string;
  /** Sport for context */
  sport?: Sport;
  /** Show full name instead of abbreviation */
  showFullName?: boolean;
  /** Show tooltip with full position name */
  showTooltip?: boolean;
  /** Custom color override */
  color?: string;
  /** Outline style instead of filled */
  outline?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const PositionIndicator = React.forwardRef<HTMLSpanElement, PositionIndicatorProps>(
  (
    {
      className,
      variant,
      size,
      position,
      sport,
      showFullName = false,
      showTooltip = true,
      color: customColor,
      outline = false,
      ...props
    },
    ref
  ) => {
    const positionConfig = getPosition(position, sport);
    
    if (!positionConfig) {
      // Fallback for unknown positions
      return (
        <span
          ref={ref}
          className={cn(
            positionIndicatorVariants({ variant, size }),
            'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            className
          )}
          {...props}
        >
          {position}
        </span>
      );
    }

    const categoryColors = getCategoryColor(positionConfig.category);
    const displayText = showFullName ? positionConfig.name : positionConfig.abbreviation;
    
    const colorStyle = customColor
      ? { backgroundColor: outline ? 'transparent' : customColor, color: outline ? customColor : 'white', borderColor: customColor }
      : {};

    const content = (
      <span
        ref={ref}
        className={cn(
          positionIndicatorVariants({ variant, size }),
          outline
            ? cn('border-2 bg-transparent', categoryColors.border, categoryColors.border.replace('border-', 'text-'))
            : cn(categoryColors.bg, categoryColors.text),
          className
        )}
        style={colorStyle}
        {...props}
      >
        {displayText}
      </span>
    );

    if (showTooltip && !showFullName) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{positionConfig.name}</p>
              <p className="text-xs text-gray-500">{positionConfig.category.replace('_', ' ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }
);
PositionIndicator.displayName = 'PositionIndicator';

// =============================================================================
// POSITION GROUP
// =============================================================================

interface PositionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of position codes */
  positions: string[];
  /** Sport for context */
  sport?: Sport;
  /** Max positions to show */
  max?: number;
  /** Variant for indicators */
  variant?: 'badge' | 'chip' | 'inline' | 'field' | 'large';
}

const PositionGroup = React.forwardRef<HTMLDivElement, PositionGroupProps>(
  ({ className, positions, sport, max = 3, variant = 'chip', ...props }, ref) => {
    const visiblePositions = positions.slice(0, max);
    const remainingCount = positions.length - max;

    return (
      <div ref={ref} className={cn('flex flex-wrap gap-1', className)} {...props}>
        {visiblePositions.map((pos, index) => (
          <PositionIndicator
            key={`${pos}-${index}`}
            position={pos}
            sport={sport}
            variant={variant}
          />
        ))}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            +{remainingCount}
          </span>
        )}
      </div>
    );
  }
);
PositionGroup.displayName = 'PositionGroup';

// =============================================================================
// POSITION SELECT DISPLAY
// =============================================================================

interface PositionSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Selected position code */
  value?: string;
  /** Sport for context */
  sport: Sport;
  /** Placeholder text */
  placeholder?: string;
}

const PositionSelectDisplay = React.forwardRef<HTMLDivElement, PositionSelectDisplayProps>(
  ({ className, value, sport, placeholder = 'Select position', ...props }, ref) => {
    const positionConfig = value ? getPosition(value, sport) : null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-charcoal-600 bg-white dark:bg-charcoal-800',
          className
        )}
        {...props}
      >
        {positionConfig ? (
          <>
            <PositionIndicator position={value!} sport={sport} variant="chip" showTooltip={false} />
            <span className="text-sm text-charcoal-900 dark:text-white">{positionConfig.name}</span>
          </>
        ) : (
          <span className="text-sm text-charcoal-500 dark:text-charcoal-400">{placeholder}</span>
        )}
      </div>
    );
  }
);
PositionSelectDisplay.displayName = 'PositionSelectDisplay';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PositionIndicator,
  PositionGroup,
  PositionSelectDisplay,
  positionIndicatorVariants,
  // Data exports
  ALL_POSITIONS,
  FOOTBALL_POSITIONS,
  BASKETBALL_POSITIONS,
  CRICKET_POSITIONS,
  RUGBY_POSITIONS,
  NETBALL_POSITIONS,
  CATEGORY_COLORS,
};