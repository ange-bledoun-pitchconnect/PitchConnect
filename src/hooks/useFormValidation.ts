/**
 * useFormValidation Hook
 * Form validation with error tracking
 */

import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  [K in keyof T]?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T[K]) => boolean;
    message?: string;
  }[];
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRule<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = useCallback(
    (field?: keyof T): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {};

      const fieldsToValidate = field ? [field] : (Object.keys(rules) as (keyof T)[]);

      fieldsToValidate.forEach((key) => {
        const value = values[key];
        const fieldRules = rules[key];

        if (!fieldRules) return;

        for (const rule of fieldRules) {
          if (rule.required && !value) {
            newErrors[key] = rule.message || 'This field is required';
            break;
          }

          if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
            newErrors[key] = rule.message || `Minimum ${rule.minLength} characters required`;
            break;
          }

          if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
            newErrors[key] = rule.message || `Maximum ${rule.maxLength} characters allowed`;
            break;
          }

          if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            newErrors[key] = rule.message || 'Invalid format';
            break;
          }

          if (rule.custom && !rule.custom(value)) {
            newErrors[key] = rule.message || 'Invalid value';
            break;
          }
        }
      });

      setErrors((prev) => ({ ...prev, ...newErrors }));
      return Object.keys(newErrors).length === 0;
    },
    [values, rules]
  );

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validate(field);
    },
    [validate]
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Record<keyof T, boolean>
        );
        setTouched(allTouched);

        if (validate()) {
          await onSubmit(values);
        }
      };
    },
    [values, validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setValues,
    setErrors,
  };
}
