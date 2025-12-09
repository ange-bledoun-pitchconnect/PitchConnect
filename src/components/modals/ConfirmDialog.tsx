'use client';

/**
 * Confirm Dialog Component
 * Path: /components/modals/ConfirmDialog.tsx
 * 
 * Core Features:
 * - Reusable confirmation modal for destructive actions
 * - Multiple dialog types (danger, warning, info, success)
 * - Async action handling with loading states
 * - Backdrop dismiss support
 * - Body scroll lock management
 * - Icon indicators based on dialog type
 * - Full dark mode support
 * 
 * Schema Aligned: Follows PitchConnect design system
 * Dialog Element: Uses native HTML5 dialog element with proper typing
 * 
 * Business Logic:
 * - Show confirmation dialogs for critical actions
 * - Type-based styling (danger red, warning yellow, etc.)
 * - Async action execution with error handling
 * - Automatic body overflow management
 * - Backdrop click dismissal
 * - Loading state management
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

type DialogType = 'danger' | 'warning' | 'info' | 'success';

interface DialogTypeConfig {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  accentColor: string;
}

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
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIALOG_TYPE_CONFIGS: Record<DialogType, DialogTypeConfig> = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6" />,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-600 dark:text-red-400',
    buttonColor: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
    accentColor: 'border-red-200 dark:border-red-700/30',
  },
  warning: {
    icon: <AlertCircle className="w-6 h-6" />,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    buttonColor: 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
    accentColor: 'border-yellow-200 dark:border-yellow-700/30',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-600 dark:text-green-400',
    buttonColor: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    accentColor: 'border-green-200 dark:border-green-700/30',
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    buttonColor: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    accentColor: 'border-blue-200 dark:border-blue-700/30',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ConfirmDialog({
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
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get dialog type configuration
   */
  const getDialogConfig = useCallback((): DialogTypeConfig => {
    return DIALOG_TYPE_CONFIGS[type];
  }, [type]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Manage dialog open/close state with proper typing
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // Open dialog if not already open
      if (!dialog.open) {
        dialog.showModal();
      }
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Close dialog if open
      if (dialog.open) {
        dialog.close();
      }
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      // Cleanup: restore body scroll on unmount
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle dialog backdrop click
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Only close if clicking directly on backdrop
      if (e.target === dialogRef.current) {
        onCancel();
      }
    },
    [onCancel]
  );

  /**
   * Handle confirm button click with async support
   */
  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('❌ Confirm dialog error:', error);
      // Re-throw error for caller to handle if needed
      throw error;
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm]);

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    setInternalLoading(false);
    onCancel();
  }, [onCancel]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const config = getDialogConfig();
  const isProcessing = isLoading || internalLoading;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 w-full max-w-md p-0 rounded-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:backdrop:bg-black/60 m-auto"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-charcoal-700">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r from-neutral-50 to-transparent dark:from-charcoal-700 dark:to-transparent border-b ${config.accentColor}`}>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor} ${config.textColor}`}
            >
              {config.icon}
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <h2
                id="dialog-title"
                className="text-xl font-bold text-charcoal-900 dark:text-white"
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p
            id="dialog-message"
            className="text-charcoal-700 dark:text-charcoal-300 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-charcoal-700 border-t border-neutral-200 dark:border-charcoal-600 flex gap-3">
          <Button
            onClick={handleCancel}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 bg-gradient-to-r ${config.buttonColor} text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
          >
            {isProcessing ? (
              <>
                <span className="inline-block w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

ConfirmDialog.displayName = 'ConfirmDialog';
