/**
 * ============================================================================
 * Modal Components Bundle
 * ============================================================================
 * 
 * Enterprise-grade modal dialogs with multiple variants.
 * 
 * @version 2.0.0
 * @path src/components/modals/index.tsx
 * 
 * COMPONENTS:
 * - FormModal: Form submission modal
 * - ConfirmDialog: Confirmation dialogs
 * - AlertModal: Alert/info modals
 * - FullScreenModal: Full screen modal
 * 
 * FEATURES:
 * - Native HTML5 dialog element
 * - Async form submission
 * - Loading states
 * - Backdrop dismiss
 * - Escape key support
 * - Body scroll lock
 * - Multiple sizes
 * - Dark mode support
 * - Type-based styling
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useRef, useCallback, useState, type ReactNode } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, AlertTriangle, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DialogType = 'danger' | 'warning' | 'success' | 'info';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

const DIALOG_CONFIG: Record<DialogType, { icon: LucideIcon; color: string; bgColor: string; buttonColor: string }> = {
  danger: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
};

// =============================================================================
// FORM MODAL
// =============================================================================

export interface FormModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: ModalSize;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
  disableBackdropClose?: boolean;
  className?: string;
}

export function FormModal({
  isOpen,
  title,
  description,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
  onSubmit,
  onClose,
  disableBackdropClose = false,
  className,
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const isProcessing = isLoading || internalLoading;

  // Manage dialog state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isProcessing, onClose]);

  // Backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && !isProcessing && !disableBackdropClose) onClose();
  }, [isProcessing, disableBackdropClose, onClose]);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInternalLoading(true);
      await onSubmit();
    } catch (error) {
      console.error('Form modal error:', error);
      throw error;
    } finally {
      setInternalLoading(false);
    }
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    if (!isProcessing) onClose();
  }, [isProcessing, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 w-full p-0 rounded-xl m-auto',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        SIZE_CLASSES[size],
        className
      )}
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <form onSubmit={handleSubmit} className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-charcoal-700">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 dark:from-charcoal-700 dark:via-charcoal-700 dark:to-charcoal-700 border-b border-neutral-200 dark:border-charcoal-600 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-2xl font-bold text-charcoal-900 dark:text-white">{title}</h2>
            {description && <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-280px)] overflow-y-auto dark:bg-charcoal-800">
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-charcoal-700 border-t border-neutral-200 dark:border-charcoal-600 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
            {cancelText}
          </Button>
          <Button type="submit" disabled={isProcessing} className="bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-bold">
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isProcessing ? 'Processing...' : submitText}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

FormModal.displayName = 'FormModal';

// =============================================================================
// CONFIRM DIALOG
// =============================================================================

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const isProcessing = isLoading || internalLoading;
  const config = DIALOG_CONFIG[type];
  const Icon = config.icon;

  // Manage dialog state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && !isProcessing) onCancel();
  }, [isProcessing, onCancel]);

  // Confirm handler
  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('Confirm dialog error:', error);
      throw error;
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 w-full max-w-md p-0 rounded-xl m-auto',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        className
      )}
      aria-labelledby="dialog-title"
    >
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-charcoal-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-600">
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
              <Icon className={cn('w-6 h-6', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="dialog-title" className="text-xl font-bold text-charcoal-900 dark:text-white">{title}</h2>
              {description && <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">{description}</p>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-charcoal-700 dark:text-charcoal-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-charcoal-700 border-t border-neutral-200 dark:border-charcoal-600 flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1">
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className={cn('flex-1 text-white', config.buttonColor)}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isProcessing ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

ConfirmDialog.displayName = 'ConfirmDialog';

// =============================================================================
// ALERT MODAL
// =============================================================================

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: DialogType;
  buttonText?: string;
  onClose: () => void;
  className?: string;
}

export function AlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  onClose,
  className,
}: AlertModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const config = DIALOG_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 w-full max-w-sm p-0 rounded-xl m-auto',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        className
      )}
    >
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-charcoal-700 text-center">
        <div className="p-6">
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', config.bgColor)}>
            <Icon className={cn('w-8 h-8', config.color)} />
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">{title}</h2>
          <p className="text-charcoal-600 dark:text-charcoal-400">{message}</p>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 border-t border-neutral-200 dark:border-charcoal-600">
          <Button onClick={onClose} className={cn('w-full text-white', config.buttonColor)}>
            {buttonText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

AlertModal.displayName = 'AlertModal';

// =============================================================================
// FULL SCREEN MODAL
// =============================================================================

export interface FullScreenModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function FullScreenModal({
  isOpen,
  title,
  children,
  onClose,
  showCloseButton = true,
  className,
}: FullScreenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 w-full h-full max-w-full max-h-full p-0 m-0',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        className
      )}
    >
      <div className="w-full h-full bg-white dark:bg-charcoal-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-charcoal-700">
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}

FullScreenModal.displayName = 'FullScreenModal';

// =============================================================================
// EXPORTS
// =============================================================================

export default { FormModal, ConfirmDialog, AlertModal, FullScreenModal };
