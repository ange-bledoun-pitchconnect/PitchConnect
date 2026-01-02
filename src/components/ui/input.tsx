/**
 * ============================================================================
 * INPUT COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade input with charcoal/gold design system:
 * - Multiple variants (default, filled, flushed)
 * - Multiple sizes (sm, md, lg)
 * - Prefix/suffix support
 * - Icon support
 * - Error/success states
 * - Character count
 * - Loading state
 * - Clear button
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/input.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const inputVariants = cva(
  'w-full transition-all duration-200 text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        /** Default - Bordered input */
        default:
          'border border-neutral-300 dark:border-charcoal-600 bg-white dark:bg-charcoal-800 rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 focus:border-transparent',
        
        /** Filled - Background filled */
        filled:
          'border-0 bg-neutral-100 dark:bg-charcoal-700 rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600',
        
        /** Flushed - Bottom border only */
        flushed:
          'border-0 border-b-2 border-neutral-300 dark:border-charcoal-600 bg-transparent rounded-none focus:border-gold-500 dark:focus:border-gold-400',
        
        /** Ghost - Minimal styling */
        ghost:
          'border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600',
      },
      
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      
      state: {
        default: '',
        error: 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
        success: 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label text */
  label?: string;
  /** Helper text */
  helper?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Prefix element */
  prefix?: React.ReactNode;
  /** Suffix element */
  suffix?: React.ReactNode;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Show character count */
  showCount?: boolean;
  /** Max character count */
  maxLength?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Clearable */
  clearable?: boolean;
  /** Clear handler */
  onClear?: () => void;
  /** Full width */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      state: stateProp,
      type = 'text',
      label,
      helper,
      error,
      success,
      prefix,
      suffix,
      leftIcon,
      rightIcon,
      showCount = false,
      maxLength,
      isLoading = false,
      clearable = false,
      onClear,
      fullWidth = true,
      disabled,
      required,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState('');
    
    const currentValue = value !== undefined ? String(value) : internalValue;
    const charCount = currentValue.length;
    
    // Determine state
    const state = error ? 'error' : success ? 'success' : stateProp || 'default';
    
    // Password visibility toggle
    const isPasswordType = type === 'password';
    const inputType = isPasswordType && showPassword ? 'text' : type;
    
    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };
    
    // Handle clear
    const handleClear = () => {
      setInternalValue('');
      onClear?.();
      // Trigger onChange with empty value
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };
    
    // Determine if we should show clear button
    const showClearButton = clearable && currentValue && !disabled && !isLoading;
    
    // Determine right side content
    const hasRightContent = rightIcon || suffix || isLoading || showClearButton || isPasswordType;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-charcoal-900 dark:text-white">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Input wrapper */}
        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <div className="absolute left-0 inset-y-0 flex items-center pl-3 pointer-events-none text-charcoal-500 dark:text-charcoal-400 border-r border-neutral-200 dark:border-charcoal-600 pr-3 mr-3">
              {prefix}
            </div>
          )}
          
          {/* Left icon */}
          {leftIcon && !prefix && (
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-charcoal-400 dark:text-charcoal-500">
              {leftIcon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled || isLoading}
            required={required}
            maxLength={maxLength}
            value={currentValue}
            onChange={handleChange}
            className={cn(
              inputVariants({ variant, size, state }),
              prefix && 'pl-16',
              leftIcon && !prefix && 'pl-10',
              hasRightContent && 'pr-10',
              suffix && 'pr-16',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
            {...props}
          />
          
          {/* Right side content */}
          <div className="absolute right-3 inset-y-0 flex items-center gap-1.5">
            {/* Loading */}
            {isLoading && (
              <Loader2 className="h-4 w-4 text-charcoal-400 animate-spin" />
            )}
            
            {/* Clear button */}
            {showClearButton && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-charcoal-700 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors"
                aria-label="Clear input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            
            {/* Password toggle */}
            {isPasswordType && !isLoading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-charcoal-700 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Right icon */}
            {rightIcon && !isLoading && !showClearButton && !isPasswordType && (
              <span className="text-charcoal-400 dark:text-charcoal-500">{rightIcon}</span>
            )}
            
            {/* State icons */}
            {state === 'error' && !isLoading && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {state === 'success' && !isLoading && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
          
          {/* Suffix */}
          {suffix && (
            <div className="absolute right-0 inset-y-0 flex items-center pr-3 pointer-events-none text-charcoal-500 dark:text-charcoal-400 border-l border-neutral-200 dark:border-charcoal-600 pl-3 ml-3">
              {suffix}
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
Input.displayName = 'Input';

// =============================================================================
// SEARCH INPUT
// =============================================================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  /** Search handler */
  onSearch?: (value: string) => void;
  /** Debounce delay in ms */
  debounceMs?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 300, placeholder = 'Search...', ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState('');
    const debounceRef = React.useRef<NodeJS.Timeout>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        onSearch?.(value);
      }, debounceMs);
      
      props.onChange?.(e);
    };

    const handleClear = () => {
      setSearchValue('');
      onSearch?.('');
      props.onClear?.();
    };

    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onClear={handleClear}
        clearable
        leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

// =============================================================================
// NUMBER INPUT
// =============================================================================

interface NumberInputProps extends Omit<InputProps, 'type'> {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step value */
  step?: number;
  /** Show stepper buttons */
  showStepper?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, showStepper = false, className, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!);

    const increment = () => {
      if (inputRef.current) {
        inputRef.current.stepUp();
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    const decrement = () => {
      if (inputRef.current) {
        inputRef.current.stepDown();
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    if (showStepper) {
      return (
        <div className="flex items-center">
          <button
            type="button"
            onClick={decrement}
            className="h-10 px-3 border border-neutral-300 dark:border-charcoal-600 rounded-l-lg bg-neutral-50 dark:bg-charcoal-700 hover:bg-neutral-100 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300 transition-colors"
          >
            −
          </button>
          <Input
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            step={step}
            className={cn('rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none', className)}
            {...props}
          />
          <button
            type="button"
            onClick={increment}
            className="h-10 px-3 border border-neutral-300 dark:border-charcoal-600 rounded-r-lg bg-neutral-50 dark:bg-charcoal-700 hover:bg-neutral-100 dark:hover:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300 transition-colors"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <Input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        step={step}
        className={className}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

// =============================================================================
// EXPORTS
// =============================================================================

export { Input, SearchInput, NumberInput, inputVariants };