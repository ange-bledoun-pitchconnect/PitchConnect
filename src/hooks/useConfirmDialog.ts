/**
 * ============================================================================
 * ⚠️ USE CONFIRM DIALOG HOOK v7.10.1
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useConfirmDialog.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

export type ConfirmDialogVariant = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmDialogConfig {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ReactNode;
  isDestructive?: boolean;
}

export interface UseConfirmDialogReturn {
  isOpen: boolean;
  config: ConfirmDialogConfig | null;
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>;
  close: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmDialogConfig | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((dialogConfig: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        variant: 'default',
        ...dialogConfig,
      });
      setResolveRef(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
    setResolveRef(null);
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    close();
  }, [resolveRef, close]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    close();
  }, [resolveRef, close]);

  return useMemo(() => ({
    isOpen,
    config,
    confirm,
    close,
    handleConfirm,
    handleCancel,
  }), [isOpen, config, confirm, close, handleConfirm, handleCancel]);
}

export default useConfirmDialog;
