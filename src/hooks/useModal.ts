/**
 * ============================================================================
 * 📦 USE MODAL HOOK v7.10.1 - MODAL STATE MANAGEMENT
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useModal.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

interface ModalState<T = unknown> {
  isOpen: boolean;
  data: T | null;
}

export interface UseModalReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
  setData: (data: T | null) => void;
}

export function useModal<T = unknown>(initialState = false): UseModalReturn<T> {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: initialState,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data ?? null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? null : prev.data,
    }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return useMemo(() => ({
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
    setData,
  }), [state, open, close, toggle, setData]);
}

// Multiple modals manager
export function useModalManager<K extends string>() {
  const [openModals, setOpenModals] = useState<Set<K>>(new Set());
  const [modalData, setModalData] = useState<Record<K, unknown>>({} as Record<K, unknown>);

  const open = useCallback(<T>(key: K, data?: T) => {
    setOpenModals((prev) => new Set(prev).add(key));
    if (data !== undefined) {
      setModalData((prev) => ({ ...prev, [key]: data }));
    }
  }, []);

  const close = useCallback((key: K) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setModalData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const isOpen = useCallback((key: K) => openModals.has(key), [openModals]);

  const getData = useCallback(<T>(key: K): T | undefined => {
    return modalData[key] as T | undefined;
  }, [modalData]);

  const closeAll = useCallback(() => {
    setOpenModals(new Set());
    setModalData({} as Record<K, unknown>);
  }, []);

  return { open, close, isOpen, getData, closeAll, openModals };
}

export default useModal;
