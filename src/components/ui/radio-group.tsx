/**
 * ============================================================================
 * RADIO GROUP COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade custom radio group (no Radix dependency) with:
 * - Multiple variants (default, primary, success, warning, danger)
 * - Multiple sizes (sm, md, lg)
 * - Card-style radio options
 * - Horizontal and vertical layouts
 * - Icon support
 * - Description text
 * - Keyboard navigation
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/radio-group.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// CONTEXT
// =============================================================================

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size: 'sm' | 'md' | 'lg';
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

const useRadioGroup = () => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup');
  }
  return context;
};

// =============================================================================
// VARIANTS
// =============================================================================

const radioVariants = cva(
  'peer shrink-0 rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:border-charcoal-900 dark:data-[state=checked]:border-white focus-visible:ring-charcoal-500',
        primary:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:border-gold-600 dark:data-[state=checked]:border-gold-500 focus-visible:ring-gold-500',
        success:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:border-green-600 dark:data-[state=checked]:border-green-500 focus-visible:ring-green-500',
        warning:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:border-amber-600 dark:data-[state=checked]:border-amber-500 focus-visible:ring-amber-500',
        danger:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:border-red-600 dark:data-[state=checked]:border-red-500 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const radioIndicatorVariants = cva(
  'rounded-full transition-transform duration-200 scale-0 data-[state=checked]:scale-100',
  {
    variants: {
      variant: {
        default: 'bg-charcoal-900 dark:bg-white',
        primary: 'bg-gold-600 dark:bg-gold-500',
        success: 'bg-green-600 dark:bg-green-500',
        warning: 'bg-amber-600 dark:bg-amber-500',
        danger: 'bg-red-600 dark:bg-red-500',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
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

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof radioVariants> {
  /** Unique name for the radio group */
  name?: string;
  /** Controlled value */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Error state */
  error?: boolean;
  /** Legend text */
  legend?: string;
  /** Description */
  description?: string;
}

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Radio value */
  value: string;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Custom className for the container */
  containerClassName?: string;
}

// =============================================================================
// RADIO GROUP
// =============================================================================

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      name: propName,
      value: controlledValue,
      defaultValue = '',
      onValueChange,
      disabled = false,
      orientation = 'vertical',
      error = false,
      legend,
      description,
      children,
      ...props
    },
    ref
  ) => {
    const generatedName = React.useId();
    const name = propName || generatedName;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const handleChange = (newValue: string) => {
      setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider
        value={{ name, value, onChange: handleChange, disabled, variant, size }}
      >
        <div
          ref={ref}
          role="radiogroup"
          aria-orientation={orientation}
          className={cn('space-y-3', className)}
          {...props}
        >
          {legend && (
            <div>
              <legend
                className={cn(
                  'text-base font-semibold text-charcoal-900 dark:text-white',
                  error && 'text-red-600 dark:text-red-400'
                )}
              >
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
              orientation === 'horizontal'
                ? 'flex flex-wrap gap-6'
                : 'space-y-3'
            )}
          >
            {children}
          </div>
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

// =============================================================================
// RADIO GROUP ITEM
// =============================================================================

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  (
    {
      className,
      containerClassName,
      value,
      label,
      description,
      disabled: itemDisabled,
      id,
      ...props
    },
    ref
  ) => {
    const {
      name,
      value: groupValue,
      onChange,
      disabled: groupDisabled,
      variant,
      size,
    } = useRadioGroup();

    const radioId = id || `${name}-${value}`;
    const isChecked = groupValue === value;
    const isDisabled = groupDisabled || itemDisabled;

    const handleChange = () => {
      if (!isDisabled) {
        onChange(value);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleChange();
      }
    };

    return (
      <div className={cn('flex items-start gap-3', containerClassName)}>
        {/* Hidden native radio */}
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={isChecked}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            className="sr-only peer"
            {...props}
          />

          {/* Custom radio visual */}
          <label
            htmlFor={radioId}
            data-state={isChecked ? 'checked' : 'unchecked'}
            className={cn(
              radioVariants({ variant, size }),
              'flex items-center justify-center cursor-pointer',
              isDisabled && 'cursor-not-allowed',
              className
            )}
          >
            {/* Inner dot */}
            <span
              data-state={isChecked ? 'checked' : 'unchecked'}
              className={cn(radioIndicatorVariants({ variant, size }))}
            />
          </label>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="flex-1 pt-0.5">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  'text-charcoal-900 dark:text-white',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-sm text-charcoal-600 dark:text-charcoal-400 mt-1',
                  isDisabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

// =============================================================================
// RADIO CARD
// =============================================================================

interface RadioCardProps extends Omit<RadioGroupItemProps, 'label' | 'description'> {
  /** Card title */
  title: string;
  /** Card description */
  cardDescription?: string;
  /** Icon */
  icon?: React.ReactNode;
}

const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  (
    {
      className,
      containerClassName,
      value,
      title,
      cardDescription,
      icon,
      disabled: itemDisabled,
      ...props
    },
    ref
  ) => {
    const {
      name,
      value: groupValue,
      onChange,
      disabled: groupDisabled,
      variant,
    } = useRadioGroup();

    const radioId = `${name}-${value}`;
    const isChecked = groupValue === value;
    const isDisabled = groupDisabled || itemDisabled;

    const handleClick = () => {
      if (!isDisabled) {
        onChange(value);
      }
    };

    const variantColors = {
      default: 'border-charcoal-900 dark:border-white',
      primary: 'border-gold-500 dark:border-gold-400',
      success: 'border-green-500 dark:border-green-400',
      warning: 'border-amber-500 dark:border-amber-400',
      danger: 'border-red-500 dark:border-red-400',
    };

    const variantBgs = {
      default: 'bg-charcoal-50 dark:bg-charcoal-900/50',
      primary: 'bg-gold-50 dark:bg-gold-900/20',
      success: 'bg-green-50 dark:bg-green-900/20',
      warning: 'bg-amber-50 dark:bg-amber-900/20',
      danger: 'bg-red-50 dark:bg-red-900/20',
    };

    return (
      <div
        className={cn(
          'relative rounded-xl border-2 transition-all duration-200 cursor-pointer',
          isChecked
            ? cn(variantColors[variant], variantBgs[variant])
            : 'border-neutral-200 dark:border-charcoal-700 hover:border-neutral-300 dark:hover:border-charcoal-600',
          isDisabled && 'opacity-50 cursor-not-allowed',
          containerClassName
        )}
        onClick={handleClick}
      >
        <input
          ref={ref}
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => {}}
          disabled={isDisabled}
          className="sr-only"
          {...props}
        />

        <label htmlFor={radioId} className="block p-4 cursor-pointer">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isChecked
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
                {/* Radio indicator */}
                <div
                  className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                    isChecked
                      ? variantColors[variant]
                      : 'border-neutral-300 dark:border-charcoal-600'
                  )}
                >
                  {isChecked && (
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        {
                          default: 'bg-charcoal-900 dark:bg-white',
                          primary: 'bg-gold-600 dark:bg-gold-500',
                          success: 'bg-green-600 dark:bg-green-500',
                          warning: 'bg-amber-600 dark:bg-amber-500',
                          danger: 'bg-red-600 dark:bg-red-500',
                        }[variant]
                      )}
                    />
                  )}
                </div>
              </div>
              {cardDescription && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
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
RadioCard.displayName = 'RadioCard';

// =============================================================================
// EXPORTS
// =============================================================================

export { RadioGroup, RadioGroupItem, RadioCard, radioVariants, radioIndicatorVariants };