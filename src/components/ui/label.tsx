/**
 * ============================================================================
 * LABEL COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade form label with:
 * - Required/optional indicators
 * - Helper text support
 * - Error state styling
 * - Success state styling
 * - Info tooltip integration
 * - Character count display
 * - Multiple sizes
 * - Charcoal/gold design system
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/label.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { HelpCircle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const labelVariants = cva(
  'text-charcoal-900 dark:text-white font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      state: {
        default: '',
        error: 'text-red-600 dark:text-red-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /** Required field indicator */
  required?: boolean;
  /** Optional field indicator */
  optional?: boolean;
  /** Helper/description text */
  helper?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
  /** Info tooltip content */
  tooltip?: string;
  /** Show character count */
  characterCount?: {
    current: number;
    max: number;
  };
  /** Disabled state */
  disabled?: boolean;
}

// =============================================================================
// TOOLTIP COMPONENT (inline for this file)
// =============================================================================

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const InlineTooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs rounded-md bg-charcoal-900 dark:bg-charcoal-700 text-white whitespace-nowrap z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-charcoal-900 dark:border-t-charcoal-700" />
        </span>
      )}
    </span>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      size,
      state: stateProp,
      required = false,
      optional = false,
      helper,
      error,
      success,
      warning,
      tooltip,
      characterCount,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    // Determine state based on props
    const state = error ? 'error' : success ? 'success' : warning ? 'warning' : stateProp;
    const message = error || success || warning || helper;

    // Character count calculations
    const charCountColor = React.useMemo(() => {
      if (!characterCount) return '';
      const ratio = characterCount.current / characterCount.max;
      if (ratio >= 1) return 'text-red-600 dark:text-red-400';
      if (ratio >= 0.9) return 'text-amber-600 dark:text-amber-400';
      return 'text-charcoal-500 dark:text-charcoal-400';
    }, [characterCount]);

    return (
      <div className={cn('space-y-1.5', disabled && 'opacity-50')}>
        {/* Label row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <label
              ref={ref}
              className={cn(labelVariants({ size, state }), className)}
              {...props}
            >
              {children}
            </label>

            {/* Required indicator */}
            {required && (
              <span className="text-red-500 dark:text-red-400 font-medium" aria-hidden="true">
                *
              </span>
            )}

            {/* Optional indicator */}
            {optional && (
              <span className="text-xs text-charcoal-500 dark:text-charcoal-400 font-normal">
                (optional)
              </span>
            )}

            {/* Info tooltip */}
            {tooltip && (
              <InlineTooltip content={tooltip}>
                <button
                  type="button"
                  className="text-charcoal-400 hover:text-charcoal-600 dark:text-charcoal-500 dark:hover:text-charcoal-300 transition-colors"
                  aria-label="More information"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </InlineTooltip>
            )}
          </div>

          {/* Character count */}
          {characterCount && (
            <span className={cn('text-xs font-medium tabular-nums', charCountColor)}>
              {characterCount.current}/{characterCount.max}
            </span>
          )}
        </div>

        {/* Helper/error/success message */}
        {message && (
          <div
            className={cn(
              'flex items-start gap-1.5 text-xs',
              error && 'text-red-600 dark:text-red-400',
              success && 'text-green-600 dark:text-green-400',
              warning && 'text-amber-600 dark:text-amber-400',
              !error && !success && !warning && 'text-charcoal-600 dark:text-charcoal-400'
            )}
          >
            {error && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
            {success && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
            {warning && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
            {!error && !success && !warning && helper && (
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}
      </div>
    );
  }
);
Label.displayName = 'Label';

// =============================================================================
// FIELD LABEL - Simplified version for form fields
// =============================================================================

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Required indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-charcoal-900 dark:text-white leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 dark:text-red-400 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);
FieldLabel.displayName = 'FieldLabel';

// =============================================================================
// FORM LABEL GROUP - Label with input
// =============================================================================

interface FormLabelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text */
  label: string;
  /** Label htmlFor */
  htmlFor?: string;
  /** Required indicator */
  required?: boolean;
  /** Optional indicator */
  optional?: boolean;
  /** Helper text */
  helper?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Label width (for horizontal layout) */
  labelWidth?: string;
  /** Children (form input) */
  children: React.ReactNode;
}

const FormLabelGroup = React.forwardRef<HTMLDivElement, FormLabelGroupProps>(
  (
    {
      className,
      label,
      htmlFor,
      required,
      optional,
      helper,
      error,
      success,
      direction = 'vertical',
      labelWidth = '140px',
      children,
      ...props
    },
    ref
  ) => {
    const isHorizontal = direction === 'horizontal';

    return (
      <div
        ref={ref}
        className={cn(
          isHorizontal ? 'flex items-start gap-4' : 'space-y-2',
          className
        )}
        {...props}
      >
        <div
          className={cn(isHorizontal && 'flex-shrink-0 pt-2')}
          style={isHorizontal ? { width: labelWidth } : undefined}
        >
          <Label
            htmlFor={htmlFor}
            required={required}
            optional={optional}
            error={error}
            success={success}
            size="md"
          >
            {label}
          </Label>
        </div>

        <div className={cn(isHorizontal && 'flex-1', 'space-y-1.5')}>
          {children}

          {/* Message below input */}
          {(helper || error || success) && (
            <p
              className={cn(
                'text-xs',
                error && 'text-red-600 dark:text-red-400',
                success && !error && 'text-green-600 dark:text-green-400',
                !error && !success && 'text-charcoal-600 dark:text-charcoal-400'
              )}
            >
              {error || success || helper}
            </p>
          )}
        </div>
      </div>
    );
  }
);
FormLabelGroup.displayName = 'FormLabelGroup';

// =============================================================================
// SECTION LABEL - For form sections
// =============================================================================

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Divider below */
  divider?: boolean;
}

const SectionLabel = React.forwardRef<HTMLDivElement, SectionLabelProps>(
  ({ className, title, description, divider = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        divider && 'pb-4 border-b border-neutral-200 dark:border-charcoal-700',
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
          {description}
        </p>
      )}
    </div>
  )
);
SectionLabel.displayName = 'SectionLabel';

// =============================================================================
// INLINE LABEL - For inline form elements
// =============================================================================

interface InlineLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Position relative to input */
  position?: 'before' | 'after';
}

const InlineLabel = React.forwardRef<HTMLLabelElement, InlineLabelProps>(
  ({ className, position = 'after', children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-charcoal-900 dark:text-white cursor-pointer select-none',
        position === 'before' && 'flex-row-reverse',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
);
InlineLabel.displayName = 'InlineLabel';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Label,
  FieldLabel,
  FormLabelGroup,
  SectionLabel,
  InlineLabel,
  labelVariants,
};