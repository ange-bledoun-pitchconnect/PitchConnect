/**
 * ============================================================================
 * 🍞 USE TOAST HOOK v7.10.1 - TOAST NOTIFICATIONS
 * ============================================================================
 * 
 * Simple toast notification management hook.
 * Works with shadcn/ui toast component or Sonner.
 * 
 * @version 7.10.1
 * @path src/hooks/use-toast.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: Toast['action'];
}

// =============================================================================
// HOOK
// =============================================================================

const TOAST_DEFAULT_DURATION = 5000;
const TOAST_MAX_COUNT = 5;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const dismiss = useCallback((toastId: string) => {
    const timeout = timeoutsRef.current.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const toast = useCallback((options: ToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration ?? TOAST_DEFAULT_DURATION;

    const newToast: Toast = {
      id,
      ...options,
      duration,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      // Remove oldest if exceeding max count
      if (updated.length > TOAST_MAX_COUNT) {
        const removed = updated.pop();
        if (removed) {
          const timeout = timeoutsRef.current.get(removed.id);
          if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(removed.id);
          }
        }
      }
      return updated;
    });

    // Auto-dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismiss(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'success' });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'destructive' });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    return toast({ title, description, variant: 'info' });
  }, [toast]);

  const dismissAll = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    toast,
    toasts,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
  };
}

export default useToast;
