import React, { ReactNode } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormProps<T extends FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  methods: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  children: ReactNode;
  isSubmitting?: boolean;
  submitButtonText?: string;
  submitButtonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

export const Form = React.forwardRef<HTMLFormElement, FormProps<any>>(
  (
    {
      methods,
      onSubmit,
      children,
      isSubmitting,
      submitButtonText = 'Submit',
      submitButtonVariant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <FormProvider {...methods}>
        <form
          ref={ref}
          onSubmit={methods.handleSubmit(onSubmit)}
          className={cn('space-y-6', className)}
          {...props}
        >
          {children}
          <Button
            type="submit"
            variant={submitButtonVariant}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {submitButtonText}
          </Button>
        </form>
      </FormProvider>
    );
  }
);

Form.displayName = 'Form';

export default Form;
