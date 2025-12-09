'use client';

/**
 * Form Modal Component
 * Path: /components/modals/FormModal.tsx
 * 
 * Core Features:
 * - Generic modal wrapper for forms
 * - Configurable size options (sm, md, lg, xl)
 * - Async form submission support
 * - Loading state management
 * - Backdrop dismiss support (disabled during loading)
 * - Body scroll lock management
 * - Close button with hotkey support
 * - Header, content, footer layout
 * 
 * Schema Aligned: Follows PitchConnect design system
 * Dialog Element: Uses native HTML5 dialog element with proper typing
 * 
 * Business Logic:
 * - Wraps form content for reusable modal dialogs
 * - Prevents backdrop dismissal during submission
 * - Manages body overflow during open/close
 * - Supports async form handlers
 * - Type-safe form event handling
 */

import { useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface SizeConfig {
  container: string;
  contentMaxHeight: string;
}

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
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIGS: Record<ModalSize, SizeConfig> = {
  sm: {
    container: 'max-w-sm',
    contentMaxHeight: 'max-h-[calc(100vh-280px)]',
  },
  md: {
    container: 'max-w-md',
    contentMaxHeight: 'max-h-[calc(100vh-300px)]',
  },
  lg: {
    container: 'max-w-lg',
    contentMaxHeight: 'max-h-[calc(100vh-320px)]',
  },
  xl: {
    container: 'max-w-xl',
    contentMaxHeight: 'max-h-[calc(100vh-340px)]',
  },
};

const ERROR_MESSAGES = {
  submitFailed: 'Form submission failed',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function FormModal({
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
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get size configuration
   */
  const getSizeConfig = useCallback((): SizeConfig => {
    return SIZE_CONFIGS[size];
  }, [size]);

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

  /**
   * Handle escape key to close modal (unless loading)
   */
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !internalLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, isLoading, internalLoading, onClose]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle dialog backdrop click
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Only close if clicking directly on backdrop and not loading
      const isProcessing = isLoading || internalLoading;
      if (e.target === dialogRef.current && !isProcessing) {
        onClose();
      }
    },
    [isLoading, internalLoading, onClose]
  );

  /**
   * Handle form submission with async support
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        setInternalLoading(true);
        await onSubmit();
      } catch (error) {
        console.error('❌ Form modal error:', error);
        // Re-throw for caller to handle if needed
        throw error;
      } finally {
        setInternalLoading(false);
      }
    },
    [onSubmit]
  );

  /**
   * Handle close button click
   */
  const handleClose = useCallback(() => {
    if (!isLoading && !internalLoading) {
      onClose();
    }
  }, [isLoading, internalLoading, onClose]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const sizeConfig = getSizeConfig();
  const isProcessing = isLoading || internalLoading;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 w-full ${sizeConfig.container} p-0 rounded-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:backdrop:bg-black/60 m-auto`}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-charcoal-700"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 dark:from-charcoal-700 dark:via-charcoal-700 dark:to-charcoal-700 border-b border-neutral-200 dark:border-charcoal-600 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2
              id="modal-title"
              className="text-2xl font-bold text-charcoal-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-charcoal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 ${sizeConfig.contentMaxHeight} overflow-y-auto dark:bg-charcoal-800`}>
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-charcoal-700 border-t border-neutral-200 dark:border-charcoal-600 flex gap-3 justify-end sticky bottom-0">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            variant="outline"
            className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isProcessing && (
              <Loader className="w-4 h-4 animate-spin" />
            )}
            {isProcessing ? 'Processing...' : submitText}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

FormModal.displayName = 'FormModal';
