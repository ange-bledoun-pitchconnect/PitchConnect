/**
 * Form Checkbox Component
 * Enhanced checkbox with label and validation
 */

import { InputHTMLAttributes } from 'react';

export interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function FormCheckbox({
  label,
  description,
  error,
  fullWidth = true,
  className = '',
  ...props
}: FormCheckboxProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          {...props}
          className={`w-5 h-5 rounded border-2 border-neutral-300 text-gold-600 cursor-pointer hover:border-gold-300 focus:ring-2 focus:ring-gold-200 focus:border-gold-500 transition-all mt-0.5 ${className}`}
        />

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label className="block text-sm font-semibold text-charcoal-900 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-charcoal-600 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 font-semibold ml-8">{error}</p>
      )}
    </div>
  );
}
