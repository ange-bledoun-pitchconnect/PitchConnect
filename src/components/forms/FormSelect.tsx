/**
 * Form Select Component
 * Enhanced dropdown with validation
 */

import { ReactNode, SelectHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  success?: boolean;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  options: { value: string | number; label: string }[];
}

export default function FormSelect({
  label,
  icon,
  error,
  success,
  helperText,
  required,
  fullWidth = true,
  options,
  className = '',
  ...props
}: FormSelectProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-bold text-charcoal-900 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500 pointer-events-none">
            {icon}
          </div>
        )}

        <select
          {...props}
          className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} pr-12 border-2 rounded-lg bg-white text-charcoal-900 font-medium appearance-none cursor-pointer transition-all focus:outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : success
              ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-neutral-300 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
          } ${className}`}
        >
          <option value="">Select an option...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-600 pointer-events-none" />

        {success && (
          <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600 pointer-events-none" />
        )}
        {error && (
          <AlertCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600 pointer-events-none" />
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-2 text-xs text-charcoal-600">{helperText}</p>
      )}
    </div>
  );
}
