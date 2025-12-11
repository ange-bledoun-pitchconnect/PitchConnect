import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helper?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      label,
      helper,
      maxLength,
      showCharCount,
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-24 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            {helper && !error && (
              <p className="text-sm text-muted-foreground">{helper}</p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p
              className={cn(
                'text-xs',
                charCount > maxLength * 0.9
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground',
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
