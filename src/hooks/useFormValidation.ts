/**
 * ============================================================================
 * ✅ USE FORM VALIDATION HOOK v7.10.1
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useFormValidation.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { z, ZodSchema, ZodError } from 'zod';

export type ValidationRule<T> = {
  validate: (value: T, formData?: Record<string, unknown>) => boolean;
  message: string;
};

export interface FieldConfig<T = unknown> {
  initialValue: T;
  rules?: ValidationRule<T>[];
  schema?: ZodSchema<T>;
  required?: boolean;
  requiredMessage?: string;
}

export interface FieldState<T = unknown> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string | undefined;
  };
}

export function useFormValidation<T extends Record<string, unknown>>(
  config: Record<keyof T, FieldConfig>
): UseFormValidationReturn<T> {
  const initialValues = useMemo(() => {
    const values = {} as T;
    for (const key in config) {
      values[key] = config[key].initialValue as T[keyof T];
    }
    return values;
  }, [config]);

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      (key) => values[key as keyof T] !== initialValues[key as keyof T]
    );
  }, [values, initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const fieldConfig = config[field];
    const value = values[field];
    let error: string | null = null;

    // Required check
    if (fieldConfig.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        error = fieldConfig.requiredMessage || 'This field is required';
      }
    }

    // Zod schema validation
    if (!error && fieldConfig.schema) {
      try {
        fieldConfig.schema.parse(value);
      } catch (e) {
        if (e instanceof ZodError) {
          error = e.errors[0]?.message || 'Invalid value';
        }
      }
    }

    // Custom rules validation
    if (!error && fieldConfig.rules) {
      for (const rule of fieldConfig.rules) {
        if (!rule.validate(value as any, values as Record<string, unknown>)) {
          error = rule.message;
          break;
        }
      }
    }

    setErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const { [field]: _, ...rest } = prev;
      return rest as Partial<Record<keyof T, string>>;
    });

    return !error;
  }, [config, values]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const field in config) {
      const fieldConfig = config[field];
      const value = values[field];
      let error: string | null = null;

      if (fieldConfig.required) {
        const isEmpty = value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          error = fieldConfig.requiredMessage || 'This field is required';
        }
      }

      if (!error && fieldConfig.schema) {
        try {
          fieldConfig.schema.parse(value);
        } catch (e) {
          if (e instanceof ZodError) {
            error = e.errors[0]?.message || 'Invalid value';
          }
        }
      }

      if (!error && fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          if (!rule.validate(value as any, values as Record<string, unknown>)) {
            error = rule.message;
            break;
          }
        }
      }

      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [config, values]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  }, [touched, validateField]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const { [field]: _, ...rest } = prev;
      return rest as Partial<Record<keyof T, string>>;
    });
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
    if (isTouched) {
      validateField(field);
    }
  }, [validateField]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void> | void) => async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      // Touch all fields
      const allTouched = Object.keys(config).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );
      setTouchedState(allTouched);

      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [config, validateForm, values]
  );

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;
      setValue(field, value as T[K]);
    },
    onBlur: () => setTouched(field, true),
    error: touched[field] ? errors[field] : undefined,
  }), [values, errors, touched, setValue, setTouched]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    setValue,
    setValues,
    setError,
    setTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
  };
}

export default useFormValidation;
