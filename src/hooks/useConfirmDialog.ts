/**
 * useConfirmDialog Hook
 * Manage confirm dialog state and actions
 */

import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
  });

  const [isLoading, setIsLoading] = useState(false);

  const show = useCallback(
    (
      title: string,
      message: string,
      options?: {
        description?: string;
        type?: 'danger' | 'warning' | 'info' | 'success';
        onConfirm?: () => void | Promise<void>;
      }
    ) => {
      setState({
        isOpen: true,
        title,
        message,
        description: options?.description,
        type: options?.type || 'danger',
        onConfirm: options?.onConfirm,
      });
    },
    []
  );

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      if (state.onConfirm) {
        await state.onConfirm();
      }
    } finally {
      setIsLoading(false);
      close();
    }
  }, [state, close]);

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    description: state.description,
    type: state.type,
    isLoading,
    show,
    close,
    handleConfirm,
  };
}
