/**
 * ============================================================================
 * Enhanced Form Components
 * ============================================================================
 * 
 * Enterprise-grade form components with consistent styling, validation,
 * accessibility, and dark mode support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/forms/index.tsx
 * 
 * COMPONENTS:
 * - FormInput: Text, email, number, password inputs
 * - FormSelect: Dropdown select with search
 * - FormCheckbox: Checkbox with label and description
 * - FormTextarea: Multi-line text input
 * - FormRadioGroup: Radio button groups
 * - FormSwitch: Toggle switch
 * - FormDatePicker: Date input
 * - FormFieldWrapper: Common field wrapper
 * 
 * FEATURES:
 * - Consistent styling across all inputs
 * - Validation states (error, success, warning)
 * - Helper text support
 * - Icon support (left and right)
 * - Loading states
 * - Disabled states
 * - Required field indicators
 * - Character count
 * - Dark mode support
 * - Full accessibility (ARIA)
 * - Keyboard navigation
 * 
 * ============================================================================
 */

'use client';

import {
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useState,
  useId,
} from 'react';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED TYPES
// =============================================================================

type ValidationState = 'default' | 'error' | 'success' | 'warning';

interface BaseFieldProps {
  /** Field label */
  label?: string;
  /** Helper text below field */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
  /** Required field indicator */
  required?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Hide label visually (still accessible) */
  hideLabel?: boolean;
  /** Additional info tooltip */
  tooltip?: string;
}

// =============================================================================
// VALIDATION STATE STYLES
// =============================================================================

function getValidationState(props: {
  error?: string;
  success?: string;
  warning?: string;
}): ValidationState {
  if (props.error) return 'error';
  if (props.success) return 'success';
  if (props.warning) return 'warning';
  return 'default';
}

const VALIDATION_STYLES: Record<ValidationState, {
  border: string;
  ring: string;
  icon: ReactNode;
  messageColor: string;
}> = {
  default: {
    border: 'border-neutral-300 dark:border-charcoal-600',
    ring: 'focus:ring-primary/30 focus:border-primary',
    icon: null,
    messageColor: 'text-charcoal-600 dark:text-charcoal-400',
  },
  error: {
    border: 'border-red-500 dark:border-red-500',
    ring: 'focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-500',
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    messageColor: 'text-red-600 dark:text-red-400',
  },
  success: {
    border: 'border-green-500 dark:border-green-500',
    ring: 'focus:ring-green-200 dark:focus:ring-green-900/50 focus:border-green-500',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    messageColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    border: 'border-amber-500 dark:border-amber-500',
    ring: 'focus:ring-amber-200 dark:focus:ring-amber-900/50 focus:border-amber-500',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    messageColor: 'text-amber-600 dark:text-amber-400',
  },
};

// =============================================================================
// FORM FIELD WRAPPER
// =============================================================================

interface FormFieldWrapperProps {
  id: string;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  fullWidth?: boolean;
  hideLabel?: boolean;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  id,
  label,
  helperText,
  error,
  success,
  warning,
  required,
  fullWidth = true,
  hideLabel,
  tooltip,
  children,
  className,
}: FormFieldWrapperProps) {
  const state = getValidationState({ error, success, warning });
  const styles = VALIDATION_STYLES[state];
  const message = error || success || warning || helperText;

  return (
    <div className={cn(fullWidth ? 'w-full' : '', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-semibold text-charcoal-900 dark:text-white mb-2',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-1 inline-flex" title={tooltip}>
              <Info className="w-3.5 h-3.5 text-charcoal-400 cursor-help" />
            </span>
          )}
        </label>
      )}

      {children}

      {message && (
        <p
          className={cn(
            'mt-2 text-xs font-medium flex items-center gap-1',
            styles.messageColor
          )}
          role={error ? 'alert' : undefined}
        >
          {(error || success || warning) && (
            <span className="flex-shrink-0">{styles.icon}</span>
          )}
          {message}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// FORM INPUT
// =============================================================================

export interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseFieldProps {
  /** Input size */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean;
  /** Character count (for text inputs) */
  showCharCount?: boolean;
  /** Max character count */
  maxLength?: number;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      warning,
      required,
      fullWidth = true,
      leftIcon,
      rightIcon,
      isLoading,
      hideLabel,
      tooltip,
      inputSize = 'md',
      showPasswordToggle,
      showCharCount,
      maxLength,
      type = 'text',
      className,
      id: providedId,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = providedId || autoId;
    const [showPassword, setShowPassword] = useState(false);

    const state = getValidationState({ error, success, warning });
    const styles = VALIDATION_STYLES[state];

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-4 py-4 text-lg',
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <FormFieldWrapper
        id={id}
        label={label}
        helperText={
          showCharCount && maxLength
            ? `${charCount}/${maxLength} characters`
            : helperText
        }
        error={error}
        success={success}
        warning={warning}
        required={required}
        fullWidth={fullWidth}
        hideLabel={hideLabel}
        tooltip={tooltip}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500 dark:text-charcoal-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={inputType}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              'w-full rounded-lg border-2 bg-white dark:bg-charcoal-800',
              'text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500',
              'font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-charcoal-900',
              sizeStyles[inputSize],
              styles.border,
              styles.ring,
              leftIcon && 'pl-12',
              (rightIcon || showPasswordToggle || isLoading || state !== 'default') &&
                'pr-12',
              className
            )}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && (
              <Loader2 className="w-5 h-5 text-charcoal-400 animate-spin" />
            )}

            {!isLoading && state !== 'default' && styles.icon}

            {!isLoading &&
              state === 'default' &&
              type === 'password' &&
              showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}

            {!isLoading && state === 'default' && rightIcon}
          </div>
        </div>
      </FormFieldWrapper>
    );
  }
);

FormInput.displayName = 'FormInput';

// =============================================================================
// FORM SELECT
// =============================================================================

export interface FormSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FormSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    BaseFieldProps {
  /** Select options */
  options: FormSelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Select size */
  selectSize?: 'sm' | 'md' | 'lg';
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      warning,
      required,
      fullWidth = true,
      leftIcon,
      isLoading,
      hideLabel,
      tooltip,
      options,
      placeholder = 'Select an option...',
      selectSize = 'md',
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = providedId || autoId;

    const state = getValidationState({ error, success, warning });
    const styles = VALIDATION_STYLES[state];

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-4 py-4 text-lg',
    };

    // Group options if any have group property
    const groupedOptions = options.reduce((acc, option) => {
      const group = option.group || '__default__';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, FormSelectOption[]>);

    const hasGroups = Object.keys(groupedOptions).some((g) => g !== '__default__');

    return (
      <FormFieldWrapper
        id={id}
        label={label}
        helperText={helperText}
        error={error}
        success={success}
        warning={warning}
        required={required}
        fullWidth={fullWidth}
        hideLabel={hideLabel}
        tooltip={tooltip}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500 dark:text-charcoal-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={id}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full rounded-lg border-2 bg-white dark:bg-charcoal-800',
              'text-charcoal-900 dark:text-white',
              'font-medium appearance-none cursor-pointer transition-all duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-charcoal-900',
              sizeStyles[selectSize],
              styles.border,
              styles.ring,
              leftIcon && 'pl-12',
              'pr-12',
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>

            {hasGroups
              ? Object.entries(groupedOptions).map(([group, groupOptions]) =>
                  group === '__default__' ? (
                    groupOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <optgroup key={group} label={group}>
                      {groupOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  )
                )
              : options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
          </select>

          {/* Dropdown icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-charcoal-400 animate-spin" />
            ) : state !== 'default' ? (
              styles.icon
            ) : (
              <ChevronDown className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
            )}
          </div>
        </div>
      </FormFieldWrapper>
    );
  }
);

FormSelect.displayName = 'FormSelect';

// =============================================================================
// FORM CHECKBOX
// =============================================================================

export interface FormCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>,
    Omit<BaseFieldProps, 'leftIcon' | 'rightIcon'> {
  /** Description text */
  description?: string;
  /** Checkbox size */
  checkboxSize?: 'sm' | 'md' | 'lg';
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      label,
      description,
      helperText,
      error,
      success,
      warning,
      required,
      fullWidth = true,
      checkboxSize = 'md',
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = providedId || autoId;

    const state = getValidationState({ error, success, warning });
    const styles = VALIDATION_STYLES[state];

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className={cn(fullWidth ? 'w-full' : '', className)}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'rounded border-2 cursor-pointer mt-0.5',
              'text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              sizeStyles[checkboxSize],
              state === 'error'
                ? 'border-red-500'
                : 'border-neutral-300 dark:border-charcoal-600'
            )}
            {...props}
          />

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <label
                  htmlFor={id}
                  className="block text-sm font-semibold text-charcoal-900 dark:text-white cursor-pointer"
                >
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {description && (
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {(error || success || warning || helperText) && (
          <p
            className={cn(
              'mt-2 text-xs font-medium flex items-center gap-1 ml-8',
              styles.messageColor
            )}
            role={error ? 'alert' : undefined}
          >
            {(error || success || warning) && (
              <span className="flex-shrink-0">{styles.icon}</span>
            )}
            {error || success || warning || helperText}
          </p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';

// =============================================================================
// FORM TEXTAREA
// =============================================================================

export interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<BaseFieldProps, 'leftIcon' | 'rightIcon'> {
  /** Show character count */
  showCharCount?: boolean;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      warning,
      required,
      fullWidth = true,
      isLoading,
      hideLabel,
      tooltip,
      showCharCount,
      autoResize,
      maxLength,
      rows = 3,
      className,
      id: providedId,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = providedId || autoId;

    const state = getValidationState({ error, success, warning });
    const styles = VALIDATION_STYLES[state];

    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <FormFieldWrapper
        id={id}
        label={label}
        helperText={
          showCharCount && maxLength
            ? `${charCount}/${maxLength} characters`
            : helperText
        }
        error={error}
        success={success}
        warning={warning}
        required={required}
        fullWidth={fullWidth}
        hideLabel={hideLabel}
        tooltip={tooltip}
      >
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-charcoal-800',
              'text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500',
              'font-medium transition-all duration-200 resize-y',
              'focus:outline-none focus:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-charcoal-900',
              styles.border,
              styles.ring,
              autoResize && 'resize-none overflow-hidden',
              className
            )}
            {...props}
          />

          {isLoading && (
            <div className="absolute right-4 top-4">
              <Loader2 className="w-5 h-5 text-charcoal-400 animate-spin" />
            </div>
          )}
        </div>
      </FormFieldWrapper>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

// =============================================================================
// FORM RADIO GROUP
// =============================================================================

export interface FormRadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface FormRadioGroupProps extends Omit<BaseFieldProps, 'leftIcon' | 'rightIcon'> {
  /** Radio options */
  options: FormRadioOption[];
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Radio group name */
  name: string;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function FormRadioGroup({
  label,
  helperText,
  error,
  success,
  warning,
  required,
  fullWidth = true,
  hideLabel,
  tooltip,
  options,
  value,
  onChange,
  name,
  direction = 'vertical',
  disabled,
  className,
}: FormRadioGroupProps) {
  const id = useId();

  const state = getValidationState({ error, success, warning });
  const styles = VALIDATION_STYLES[state];

  return (
    <FormFieldWrapper
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      success={success}
      warning={warning}
      required={required}
      fullWidth={fullWidth}
      hideLabel={hideLabel}
      tooltip={tooltip}
      className={className}
    >
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className={cn(
          'flex gap-4',
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'flex items-start gap-3 cursor-pointer',
                (disabled || option.disabled) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange?.(option.value)}
                disabled={disabled || option.disabled}
                className={cn(
                  'w-5 h-5 border-2 cursor-pointer mt-0.5',
                  'text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  state === 'error'
                    ? 'border-red-500'
                    : 'border-neutral-300 dark:border-charcoal-600'
                )}
              />
              <div>
                <span className="text-sm font-semibold text-charcoal-900 dark:text-white">
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </FormFieldWrapper>
  );
}

FormRadioGroup.displayName = 'FormRadioGroup';

// =============================================================================
// FORM SWITCH
// =============================================================================

export interface FormSwitchProps extends Omit<BaseFieldProps, 'leftIcon' | 'rightIcon'> {
  /** Description text */
  description?: string;
  /** Checked state */
  checked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Switch ID */
  id?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function FormSwitch({
  label,
  description,
  helperText,
  error,
  success,
  warning,
  required,
  fullWidth = true,
  checked,
  onCheckedChange,
  id: providedId,
  disabled,
  className,
}: FormSwitchProps) {
  const autoId = useId();
  const id = providedId || autoId;

  const state = getValidationState({ error, success, warning });
  const styles = VALIDATION_STYLES[state];

  return (
    <div className={cn(fullWidth ? 'w-full' : '', className)}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          aria-invalid={error ? 'true' : undefined}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            checked
              ? 'bg-primary'
              : 'bg-neutral-300 dark:bg-charcoal-600',
            state === 'error' && 'ring-2 ring-red-500'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={id}
                className="block text-sm font-semibold text-charcoal-900 dark:text-white cursor-pointer"
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {(error || success || warning || helperText) && (
        <p
          className={cn(
            'mt-2 text-xs font-medium flex items-center gap-1 ml-14',
            styles.messageColor
          )}
          role={error ? 'alert' : undefined}
        >
          {(error || success || warning) && (
            <span className="flex-shrink-0">{styles.icon}</span>
          )}
          {error || success || warning || helperText}
        </p>
      )}
    </div>
  );
}

FormSwitch.displayName = 'FormSwitch';

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormTextarea,
  FormRadioGroup,
  FormSwitch,
  FormFieldWrapper,
};
