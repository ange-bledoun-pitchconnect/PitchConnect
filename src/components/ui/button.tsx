/**
 * ============================================================================
 * BUTTON COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade button with charcoal/gold design system:
 * - Multiple variants (primary, secondary, outline, ghost, danger, success, gold)
 * - Multiple sizes (xs, sm, md, lg, xl, icon)
 * - Loading states
 * - Icon support (left/right)
 * - Full width option
 * - Proper event handling
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/button.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-charcoal-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] whitespace-nowrap',
  {
    variants: {
      variant: {
        /** Primary - Gold gradient, main CTA */
        primary:
          'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-md hover:shadow-lg focus:ring-gold-500',
        
        /** Secondary - Charcoal, secondary actions */
        secondary:
          'bg-charcoal-800 hover:bg-charcoal-900 dark:bg-charcoal-700 dark:hover:bg-charcoal-600 text-white focus:ring-charcoal-500',
        
        /** Outline - Bordered, tertiary actions */
        outline:
          'border-2 border-neutral-300 dark:border-charcoal-600 bg-transparent text-charcoal-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-charcoal-800 focus:ring-neutral-500',
        
        /** Ghost - Minimal, icon buttons */
        ghost:
          'bg-transparent text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-800 focus:ring-neutral-500',
        
        /** Danger - Red, destructive actions */
        danger:
          'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white focus:ring-red-500',
        
        /** Success - Green, positive actions */
        success:
          'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white focus:ring-green-500',
        
        /** Warning - Amber, caution actions */
        warning:
          'bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white focus:ring-amber-500',
        
        /** Gold outline - Premium feel */
        goldOutline:
          'border-2 border-gold-500 dark:border-gold-400 bg-transparent text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 focus:ring-gold-500',
        
        /** Link - Text only, looks like link */
        link:
          'bg-transparent text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 underline-offset-4 hover:underline focus:ring-gold-500 p-0 h-auto',
      },
      
      size: {
        xs: 'h-7 px-2.5 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Loading state */
  isLoading?: boolean;
  /** Loading text (optional) */
  loadingText?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** As child (for composition) */
  asChild?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {/* Left icon (hidden when loading) */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {/* Button text */}
        {isLoading && loadingText ? loadingText : children}
        
        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// =============================================================================
// BUTTON GROUP
// =============================================================================

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Attached buttons (connected borders) */
  attached?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', attached = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          'inline-flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          attached && orientation === 'horizontal' && '[&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:not(:first-child)]:-ml-px',
          attached && orientation === 'vertical' && '[&>button]:rounded-none [&>button:first-child]:rounded-t-lg [&>button:last-child]:rounded-b-lg [&>button:not(:first-child)]:-mt-px',
          !attached && 'gap-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = 'ButtonGroup';

// =============================================================================
// ICON BUTTON
// =============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label */
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', variant = 'ghost', className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';

// =============================================================================
// CLOSE BUTTON
// =============================================================================

interface CloseButtonProps extends Omit<ButtonProps, 'children'> {
  /** Size of the X */
  iconSize?: 'sm' | 'md' | 'lg';
}

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ iconSize = 'md', size = 'icon-sm', variant = 'ghost', className, ...props }, ref) => {
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn('text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200', className)}
        aria-label="Close"
        {...props}
      >
        <svg
          className={iconSizes[iconSize]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>
    );
  }
);
CloseButton.displayName = 'CloseButton';

// =============================================================================
// EXPORTS
// =============================================================================

export { Button, ButtonGroup, IconButton, CloseButton, buttonVariants };