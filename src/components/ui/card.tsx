/**
 * 🌟 PITCHCONNECT - Card Component (Base - FIXED Hover Effects)
 * Path: /src/components/ui/card.tsx
 *
 * Reusable card component with proper hover effects.
 * Used as base for StatCard, PlayerCard, etc.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-lg border bg-white dark:bg-charcoal-800',

          // Variant styles
          variant === 'default' && 'border-gray-200 dark:border-charcoal-700',
          variant === 'elevated' &&
            'border-gray-100 shadow-md dark:border-charcoal-700 dark:shadow-xl',
          variant === 'outlined' &&
            'border-2 border-gray-200 dark:border-charcoal-600',

          // Hover effects if hoverable
          hoverable &&
            'transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-xl',

          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
