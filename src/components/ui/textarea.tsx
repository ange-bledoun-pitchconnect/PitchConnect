/**
 * ============================================================================
 * TEXTAREA COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade textarea with charcoal/gold design system:
 * - Multiple variants (default, filled, flushed)
 * - Auto-resize option
 * - Character count
 * - Error/success states
 * - Max length enforcement
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/textarea.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const textareaVariants = cva(
  'w-full transition-all duration-200 text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none',
  {
    variants: {
      variant: {
        /** Default - Bordered textarea */
        default:
          'border border-neutral-300 dark:border-charcoal-600 bg-white dark:bg-charcoal-800 rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 focus:border-transparent',
        
        /** Filled - Background filled */
        filled:
          'border-0 bg-neutral-100 dark:bg-charcoal-700 rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600',
        
        /** Flushed - Bottom border only */
        flushed:
          'border-0 border-b-2 border-neutral-300 dark:border-charcoal-600 bg-transparent rounded-none focus:border-gold-500 dark:focus:border-gold-400',
      },
      
      size: {
        sm: 'min-h-[80px] px-3 py-2 text-sm',
        md: 'min-h-[120px] px-4 py-3 text-sm',
        lg: 'min-h-[160px] px-4 py-3 text-base',
      },
      
      state: {
        default: '',
        error: 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
        success: 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400',
      },
      
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      resize: 'none',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Label text */
  label?: string;
  /** Helper text */
  helper?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Show character count */
  showCount?: boolean;
  /** Max character count */
  maxLength?: number;
  /** Auto resize based on content */
  autoResize?: boolean;
  /** Min height for auto resize */
  minRows?: number;
  /** Max height for auto resize */
  maxRows?: number;
  /** Full width */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      state: stateProp,
      resize,
      label,
      helper,
      error,
      success,
      showCount = false,
      maxLength,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      fullWidth = true,
      disabled,
      required,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = React.useState('');
    
    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!);
    
    const currentValue = value !== undefined ? String(value) : internalValue;
    const charCount = currentValue.length;
    
    // Determine state
    const state = error ? 'error' : success ? 'success' : stateProp || 'default';
    
    // Auto resize logic
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;
      
      // Reset height to get accurate scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate line height and row heights
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight) || 20;
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      
      const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
      const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;
      
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minRows, maxRows]);
    
    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
      
      if (autoResize) {
        adjustHeight();
      }
    };
    
    // Adjust height on mount and value change
    React.useEffect(() => {
      if (autoResize) {
        adjustHeight();
      }
    }, [autoResize, currentValue, adjustHeight]);

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-charcoal-900 dark:text-white">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            value={currentValue}
            onChange={handleChange}
            className={cn(
              textareaVariants({ variant, size, state, resize: autoResize ? 'none' : resize }),
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
            {...props}
          />
          
          {/* State icons */}
          {(state === 'error' || state === 'success') && (
            <div className="absolute top-3 right-3">
              {state === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              {state === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>
        
        {/* Footer row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p
                id={`${props.id}-error`}
                className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
            
            {/* Success message */}
            {success && !error && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {success}
              </p>
            )}
            
            {/* Helper text */}
            {helper && !error && !success && (
              <p
                id={`${props.id}-helper`}
                className="text-sm text-charcoal-500 dark:text-charcoal-400"
              >
                {helper}
              </p>
            )}
          </div>
          
          {/* Character count */}
          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs flex-shrink-0',
                charCount > maxLength * 0.9
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-charcoal-500 dark:text-charcoal-400'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// =============================================================================
// RICH TEXTAREA (with toolbar placeholder)
// =============================================================================

interface RichTextareaProps extends TextareaProps {
  /** Show formatting toolbar */
  showToolbar?: boolean;
}

const RichTextarea = React.forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  ({ showToolbar = true, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-1 p-2 border border-neutral-300 dark:border-charcoal-600 rounded-t-lg bg-neutral-50 dark:bg-charcoal-700">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300"
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300"
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300"
              title="Underline"
            >
              <span className="underline text-sm">U</span>
            </button>
            <div className="w-px h-5 bg-neutral-300 dark:bg-charcoal-600 mx-1" />
            <button
              type="button"
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300"
              title="Bullet List"
            >
              <span className="text-sm">• List</span>
            </button>
          </div>
        )}
        
        <Textarea
          ref={ref}
          className={cn(showToolbar && 'rounded-t-none -mt-1.5', className)}
          containerClassName=""
          {...props}
        />
      </div>
    );
  }
);
RichTextarea.displayName = 'RichTextarea';

// =============================================================================
// EXPORTS
// =============================================================================

export { Textarea, RichTextarea, textareaVariants };