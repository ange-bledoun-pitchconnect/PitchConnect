/**
 * ============================================================================
 * SWITCH COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade toggle switch (no Radix dependency) with:
 * - Multiple variants (primary/gold, success, danger, warning)
 * - Multiple sizes (sm, md, lg)
 * - Smooth animations
 * - Label support with description
 * - Controlled and uncontrolled modes
 * - Charcoal/gold design system
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/switch.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-900 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        /** Primary/Gold - Main toggle (brand color) */
        primary:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gold-500 data-[state=checked]:to-gold-600 dark:data-[state=checked]:from-gold-600 dark:data-[state=checked]:to-gold-700 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-gold-500',

        /** Success - Positive toggle */
        success:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-green-600 dark:data-[state=checked]:from-green-600 dark:data-[state=checked]:to-green-700 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-green-500',

        /** Danger - Warning/destructive toggle */
        danger:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-500 data-[state=checked]:to-red-600 dark:data-[state=checked]:from-red-600 dark:data-[state=checked]:to-red-700 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-red-500',

        /** Warning - Caution toggle */
        warning:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-amber-600 dark:data-[state=checked]:from-amber-600 dark:data-[state=checked]:to-amber-700 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-amber-500',

        /** Info - Informational toggle */
        info:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 dark:data-[state=checked]:from-blue-600 dark:data-[state=checked]:to-blue-700 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-blue-500',

        /** Charcoal - Neutral toggle */
        charcoal:
          'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-charcoal-700 data-[state=checked]:to-charcoal-800 dark:data-[state=checked]:from-charcoal-500 dark:data-[state=checked]:to-charcoal-600 data-[state=unchecked]:bg-neutral-300 dark:data-[state=unchecked]:bg-charcoal-600 focus-visible:ring-charcoal-500',
      },

      size: {
        /** Small - Compact switch */
        sm: 'h-5 w-9',
        /** Medium - Standard switch */
        md: 'h-6 w-11',
        /** Large - Prominent switch */
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof switchVariants> {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked (uncontrolled) */
  defaultChecked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Show label on the left */
  labelPosition?: 'left' | 'right';
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      variant,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      label,
      description,
      labelPosition = 'right',
      error = false,
      errorMessage,
      id,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isChecked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;
    const switchId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setUncontrolledChecked(newChecked);
      onCheckedChange?.(newChecked);
      props.onChange?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newChecked = !isChecked;
        setUncontrolledChecked(newChecked);
        onCheckedChange?.(newChecked);
      }
    };

    const state = isChecked ? 'checked' : 'unchecked';

    const switchElement = (
      <div className="relative inline-flex">
        {/* Hidden input for accessibility */}
        <input
          ref={ref}
          id={switchId}
          type="checkbox"
          role="switch"
          checked={isChecked}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="sr-only peer"
          aria-checked={isChecked}
          aria-disabled={disabled}
          {...props}
        />

        {/* Visual switch track */}
        <label
          htmlFor={switchId}
          data-state={state}
          className={cn(
            switchVariants({ variant, size }),
            error && 'ring-2 ring-red-500 dark:ring-red-400',
            className
          )}
        >
          {/* Thumb */}
          <span
            data-state={state}
            className={cn(switchThumbVariants({ size }))}
          />
        </label>
      </div>
    );

    // Without label
    if (!label && !description) {
      return (
        <div className="space-y-1">
          {switchElement}
          {error && errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>
      );
    }

    // With label
    return (
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-start gap-3',
            labelPosition === 'left' && 'flex-row-reverse justify-end'
          )}
        >
          {switchElement}

          <div className="flex-1">
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium cursor-pointer',
                'text-charcoal-900 dark:text-white',
                disabled && 'opacity-50 cursor-not-allowed',
                error && 'text-red-600 dark:text-red-400'
              )}
            >
              {label}
            </label>
            {description && (
              <p
                className={cn(
                  'text-sm text-charcoal-600 dark:text-charcoal-400 mt-0.5',
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {error && errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-14">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';

// =============================================================================
// SWITCH GROUP
// =============================================================================

interface SwitchGroupProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  /** Group legend */
  legend?: string;
  /** Description */
  description?: string;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

const SwitchGroup = React.forwardRef<HTMLFieldSetElement, SwitchGroupProps>(
  ({ className, children, legend, description, orientation = 'vertical', ...props }, ref) => (
    <fieldset ref={ref} className={cn('space-y-4', className)} {...props}>
      {legend && (
        <div>
          <legend className="text-base font-semibold text-charcoal-900 dark:text-white">
            {legend}
          </legend>
          {description && (
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-4'
        )}
      >
        {children}
      </div>
    </fieldset>
  )
);
SwitchGroup.displayName = 'SwitchGroup';

// =============================================================================
// SWITCH CARD
// =============================================================================

interface SwitchCardProps extends SwitchProps {
  /** Card title */
  title: string;
  /** Card description */
  cardDescription?: string;
  /** Icon */
  icon?: React.ReactNode;
}

const SwitchCard = React.forwardRef<HTMLInputElement, SwitchCardProps>(
  (
    {
      className,
      title,
      cardDescription,
      icon,
      checked,
      onCheckedChange,
      disabled,
      variant = 'primary',
      ...props
    },
    ref
  ) => {
    const cardId = React.useId();

    return (
      <div
        className={cn(
          'relative rounded-xl border-2 transition-all duration-200',
          checked
            ? 'border-gold-500 dark:border-gold-400 bg-gold-50 dark:bg-gold-900/20'
            : 'border-neutral-200 dark:border-charcoal-700 hover:border-neutral-300 dark:hover:border-charcoal-600',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <label htmlFor={cardId} className="block p-4 cursor-pointer">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={cn(
                  'p-2 rounded-lg',
                  checked
                    ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400'
                    : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400'
                )}
              >
                {icon}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {title}
                </span>
                <Switch
                  ref={ref}
                  id={cardId}
                  checked={checked}
                  onCheckedChange={onCheckedChange}
                  disabled={disabled}
                  variant={variant}
                  size="sm"
                  {...props}
                />
              </div>
              {cardDescription && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1 pr-12">
                  {cardDescription}
                </p>
              )}
            </div>
          </div>
        </label>
      </div>
    );
  }
);
SwitchCard.displayName = 'SwitchCard';

// =============================================================================
// EXPORTS
// =============================================================================

export { Switch, SwitchGroup, SwitchCard, switchVariants, switchThumbVariants };