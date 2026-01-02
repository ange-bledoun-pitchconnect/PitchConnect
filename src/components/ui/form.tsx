/**
 * ============================================================================
 * FORM COMPONENT SYSTEM - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade form system with:
 * - React Hook Form integration
 * - Zod validation support
 * - FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage
 * - Error state handling
 * - Loading states
 * - Accessible form structure
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/ui/form.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// =============================================================================
// CONTEXT
// =============================================================================

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

// =============================================================================
// HOOKS
// =============================================================================

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext || { id: '' };

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// =============================================================================
// FORM ROOT
// =============================================================================

interface FormProps<T extends FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  /** React Hook Form methods */
  form: UseFormReturn<T>;
  /** Form submit handler */
  onSubmit?: (data: T) => void | Promise<void>;
  /** Children */
  children: React.ReactNode;
}

function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
        className={cn('space-y-6', className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

// =============================================================================
// FORM FIELD
// =============================================================================

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = ControllerProps<TFieldValues, TName>;

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: FormFieldProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// =============================================================================
// FORM ITEM
// =============================================================================

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Horizontal layout */
  horizontal?: boolean;
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, horizontal = false, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          className={cn(
            horizontal ? 'flex items-center gap-4' : 'space-y-2',
            className
          )}
          {...props}
        />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

// =============================================================================
// FORM LABEL
// =============================================================================

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Required field indicator */
  required?: boolean;
  /** Optional field indicator */
  optional?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, optional, children, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
      <Label
        ref={ref}
        className={cn(
          'text-sm font-medium text-charcoal-900 dark:text-white',
          error && 'text-red-600 dark:text-red-400',
          className
        )}
        htmlFor={formItemId}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-red-500 dark:text-red-400" aria-label="required">*</span>
          )}
          {optional && (
            <span className="text-charcoal-500 dark:text-charcoal-400 text-xs italic">(optional)</span>
          )}
        </span>
      </Label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

// =============================================================================
// FORM CONTROL
// =============================================================================

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      {...props}
    >
      {React.Children.map(props.children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            id: formItemId,
            'aria-describedby': !error
              ? formDescriptionId
              : `${formDescriptionId} ${formMessageId}`,
            'aria-invalid': !!error,
          });
        }
        return child;
      })}
    </div>
  );
});
FormControl.displayName = 'FormControl';

// =============================================================================
// FORM DESCRIPTION
// =============================================================================

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-charcoal-600 dark:text-charcoal-400', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

// =============================================================================
// FORM MESSAGE
// =============================================================================

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Show success message */
  success?: string;
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, success, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : success || children;

    if (!body) {
      return null;
    }

    const isError = !!error;

    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn(
          'text-sm font-medium flex items-center gap-1.5',
          isError
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400',
          className
        )}
        {...props}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
        ) : success ? (
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        ) : null}
        {body}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

// =============================================================================
// FORM SECTION
// =============================================================================

interface FormSectionProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

const FormSection = React.forwardRef<HTMLFieldSetElement, FormSectionProps>(
  (
    {
      className,
      children,
      title,
      description,
      collapsible = false,
      defaultExpanded = true,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
      <fieldset
        ref={ref}
        className={cn(
          'rounded-xl border border-neutral-200 dark:border-charcoal-700 p-6',
          className
        )}
        {...props}
      >
        {title && (
          <legend
            className={cn(
              'px-2 text-base font-semibold text-charcoal-900 dark:text-white',
              collapsible && 'cursor-pointer select-none'
            )}
            onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <span className="flex items-center gap-2">
              {title}
              {collapsible && (
                <span className="text-charcoal-500 dark:text-charcoal-400">
                  {isExpanded ? '−' : '+'}
                </span>
              )}
            </span>
          </legend>
        )}
        {description && (
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">
            {description}
          </p>
        )}
        {(!collapsible || isExpanded) && (
          <div className="space-y-4">{children}</div>
        )}
      </fieldset>
    );
  }
);
FormSection.displayName = 'FormSection';

// =============================================================================
// FORM ROW
// =============================================================================

interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, cols = 2, children, ...props }, ref) => {
    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
      <div
        ref={ref}
        className={cn('grid gap-4', colClasses[cols], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormRow.displayName = 'FormRow';

// =============================================================================
// FORM FOOTER
// =============================================================================

interface FormFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sticky footer */
  sticky?: boolean;
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between';
}

const FormFooter = React.forwardRef<HTMLDivElement, FormFooterProps>(
  ({ className, sticky = false, justify = 'end', children, ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 pt-6',
          justifyClasses[justify],
          sticky && 'sticky bottom-0 bg-white dark:bg-charcoal-900 py-4 -mx-6 px-6 border-t border-neutral-200 dark:border-charcoal-700',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormFooter.displayName = 'FormFooter';

// =============================================================================
// SUBMIT BUTTON
// =============================================================================

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Loading state */
  isLoading?: boolean;
  /** Loading text */
  loadingText?: string;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      className,
      children,
      isLoading = false,
      loadingText = 'Saving...',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="submit"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-200',
          'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700',
          'text-white shadow-md hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 dark:focus:ring-offset-charcoal-800',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? loadingText : children}
      </button>
    );
  }
);
SubmitButton.displayName = 'SubmitButton';

// =============================================================================
// RESET BUTTON
// =============================================================================

interface ResetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Form to reset */
  form?: UseFormReturn<any>;
}

const ResetButton = React.forwardRef<HTMLButtonElement, ResetButtonProps>(
  ({ className, children = 'Reset', form, onClick, ...props }, ref) => {
    const formContext = useFormContext();
    const formToReset = form || formContext;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (formToReset) {
        formToReset.reset();
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors',
          'border border-neutral-300 dark:border-charcoal-600',
          'text-charcoal-700 dark:text-charcoal-300',
          'hover:bg-neutral-100 dark:hover:bg-charcoal-700',
          'focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:focus:ring-offset-charcoal-800',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ResetButton.displayName = 'ResetButton';

// =============================================================================
// FORM STATUS
// =============================================================================

interface FormStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Form state */
  form: UseFormReturn<any>;
}

const FormStatus = React.forwardRef<HTMLDivElement, FormStatusProps>(
  ({ className, form, ...props }, ref) => {
    const { isSubmitting, isSubmitSuccessful, errors } = form.formState;
    const errorCount = Object.keys(errors).length;

    if (isSubmitting) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400',
            className
          )}
          {...props}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving changes...
        </div>
      );
    }

    if (isSubmitSuccessful) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-2 text-sm text-green-600 dark:text-green-400',
            className
          )}
          {...props}
        >
          <CheckCircle2 className="h-4 w-4" />
          Changes saved successfully!
        </div>
      );
    }

    if (errorCount > 0) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-2 text-sm text-red-600 dark:text-red-400',
            className
          )}
          {...props}
        >
          <AlertCircle className="h-4 w-4" />
          {errorCount} {errorCount === 1 ? 'error' : 'errors'} found
        </div>
      );
    }

    return null;
  }
);
FormStatus.displayName = 'FormStatus';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
  FormRow,
  FormFooter,
  SubmitButton,
  ResetButton,
  FormStatus,
  useFormField,
};