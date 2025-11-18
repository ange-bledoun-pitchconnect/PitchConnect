/**
 * useNotification Hook
 * Toast notification management
 */

import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useNotification() {
  const success = useCallback((message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontWeight: 600,
      },
    });
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontWeight: 600,
      },
    });
  }, []);

  const info = useCallback((message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontWeight: 600,
      },
    });
  }, []);

  const warning = useCallback((message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontWeight: 600,
      },
    });
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#fff',
        color: '#1f2937',
        padding: '16px',
        borderRadius: '8px',
        fontWeight: 600,
      },
    });
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
}
