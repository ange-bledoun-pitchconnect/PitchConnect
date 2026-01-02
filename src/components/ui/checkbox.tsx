/**
 * ============================================================================
 * CHECKBOX COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade custom checkbox (no Radix dependency) with:
 * - Multiple variants (default, primary, success, warning, danger)
 * - Multiple sizes (sm, md, lg)
 * - Indeterminate state
 * - Label support
 * - Description text
 * - Controlled and uncontrolled modes
 * - Keyboard navigation
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/checkbox.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const checkboxVariants = cva(
  'peer shrink-0 border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-800 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:bg-charcoal-900 data-[state=checked]:border-charcoal-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white data-[state=checked]:text-white dark:data-[state=checked]:text-charcoal-900 focus-visible:ring-charcoal-500',
        primary:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:bg-gold-600 data-[state=checked]:border-gold-600 dark:data-[state=checked]:bg-gold-500 dark:data-[state=checked]:border-gold-500 data-[state=checked]:text-white focus-visible:ring-gold-500',
        success:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 dark:data-[state=checked]:bg-green-500 dark:data-[state=checked]:border-green-500 data-[state=checked]:text-white focus-visible:ring-green-500',
        warning:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 dark:data-[state=checked]:bg-amber-500 dark:data-[state=checked]:border-amber-500 data-[state=checked]:text-white focus-visible:ring-amber-500',
        danger:
          'border-neutral-300 dark:border-charcoal-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 dark:data-[state=checked]:bg-red-500 dark:data-[state=checked]:border-red-500 data-[state=checked]:text-white focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-4 w-4 rounded',
        md: 'h-5 w-5 rounded-md',
        lg: 'h-6 w-6 rounded-md',
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

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof checkboxVariants> {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      variant,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      indeterminate = false,
      disabled = false,
      label,
      description,
      error = false,
      errorMessage,
      id,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const isChecked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;
    const checkboxId = id || `checkbox-${React.useId()}`;

    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setUncontrolledChecked(newChecked);
      onCheckedChange?.(indeterminate ? 'indeterminate' : newChecked);
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

    // Determine state for styling
    const state = indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked';

    // Icon sizes
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    };

    const iconSize = iconSizes[size || 'md'];

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          {/* Hidden native checkbox */}
          <div className="relative">
            <input
              ref={inputRef}
              type="checkbox"
              id={checkboxId}
              checked={isChecked}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="sr-only peer"
              aria-checked={indeterminate ? 'mixed' : isChecked}
              aria-invalid={error}
              aria-describedby={description ? `${checkboxId}-description` : undefined}
              {...props}
            />

            {/* Custom checkbox visual */}
            <label
              htmlFor={checkboxId}
              data-state={state}
              className={cn(
                checkboxVariants({ variant, size }),
                'flex items-center justify-center cursor-pointer',
                error && 'border-red-500 dark:border-red-400',
                disabled && 'cursor-not-allowed',
                className
              )}
            >
              {/* Check icon */}
              {(isChecked || indeterminate) && (
                <span className="animate-in zoom-in duration-150">
                  {indeterminate ? (
                    <Minus className={cn(iconSize, 'stroke-[3]')} />
                  ) : (
                    <Check className={cn(iconSize, 'stroke-[3]')} />
                  )}
                </span>
              )}
            </label>
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex-1 pt-0.5">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className={cn(
                    'text-sm font-medium leading-none cursor-pointer',
                    'text-charcoal-900 dark:text-white',
                    disabled && 'opacity-50 cursor-not-allowed',
                    error && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {label}
                </label>
              )}
              {description && (
                <p
                  id={`${checkboxId}-description`}
                  className={cn(
                    'text-sm text-charcoal-600 dark:text-charcoal-400 mt-1',
                    disabled && 'opacity-50'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-8">{errorMessage}</p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// =============================================================================
// CHECKBOX GROUP
// =============================================================================

interface CheckboxGroupProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  /** Group label */
  legend?: string;
  /** Description */
  description?: string;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  (
    {
      className,
      children,
      legend,
      description,
      orientation = 'vertical',
      error = false,
      errorMessage,
      ...props
    },
    ref
  ) => (
    <fieldset ref={ref} className={cn('space-y-3', className)} {...props}>
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
          orientation === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3'
        )}
      >
        {children}
      </div>
      {error && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </fieldset>
  )
);
CheckboxGroup.displayName = 'CheckboxGroup';

// =============================================================================
// CHECKBOX CARD
// =============================================================================

interface CheckboxCardProps extends CheckboxProps {
  /** Card title */
  title: string;
  /** Card description */
  cardDescription?: string;
  /** Icon */
  icon?: React.ReactNode;
}

const CheckboxCard = React.forwardRef<HTMLInputElement, CheckboxCardProps>(
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
          'relative rounded-xl border-2 transition-all duration-200 cursor-pointer',
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
                <Checkbox
                  ref={ref}
                  id={cardId}
                  checked={checked}
                  onCheckedChange={onCheckedChange}
                  disabled={disabled}
                  variant={variant}
                  {...props}
                />
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
CheckboxCard.displayName = 'CheckboxCard';

// =============================================================================
// EXPORTS
// =============================================================================

export { Checkbox, CheckboxGroup, CheckboxCard, checkboxVariants };