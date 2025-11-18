/**
 * useModal Hook
 * Manage modal state and actions
 */

import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  data?: any;
}

export function useModal(initialState: boolean = false) {
  const [state, setState] = useState<ModalState>({
    isOpen: initialState,
    data: null,
  });

  const open = useCallback((data?: any) => {
    setState({
      isOpen: true,
      data,
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      data: null,
    });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? null : prev.data,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  };
}
