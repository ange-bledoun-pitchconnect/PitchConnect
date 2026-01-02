/**
 * ============================================================================
 * DIALOG COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade modal dialog (no Radix dependency) with:
 * - Multiple sizes (sm, md, lg, xl, full)
 * - Body scroll lock
 * - Focus trap
 * - Escape key handling
 * - Click outside to close
 * - Smooth animations
 * - Nested dialog support
 * - Charcoal/gold design system
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/dialog.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const dialogContentVariants = cva(
  'relative w-full bg-white dark:bg-charcoal-800 shadow-2xl focus:outline-none',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
      rounded: 'md',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

interface DialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Children */
  children: React.ReactNode;
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as child element */
  asChild?: boolean;
  children: React.ReactNode;
}

interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants> {
  /** Show close button */
  showClose?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll */
  preventScroll?: boolean;
  /** Children */
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as child element */
  asChild?: boolean;
  children?: React.ReactNode;
}

// =============================================================================
// CONTEXT
// =============================================================================

const DialogContext = React.createContext<DialogContextType | null>(null);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Body scroll lock hook
 */
const useBodyScrollLock = (lock: boolean) => {
  React.useEffect(() => {
    if (!lock) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    };
  }, [lock]);
};

/**
 * Focus trap hook
 */
const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, active: boolean) => {
  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, active]);
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Dialog Root Component
 */
const Dialog: React.FC<DialogProps> = ({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      setUncontrolledOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};
Dialog.displayName = 'Dialog';

/**
 * Dialog Trigger Component
 */
const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialog();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: handleClick,
        ref,
      });
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

/**
 * Dialog Portal Component
 */
const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return typeof document !== 'undefined'
    ? React.createPortal(children, document.body)
    : null;
};

/**
 * Dialog Overlay Component
 */
const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm',
        'animate-in fade-in-0 duration-200',
        className
      )}
      {...props}
    />
  )
);
DialogOverlay.displayName = 'DialogOverlay';

/**
 * Dialog Content Component
 */
const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      size,
      rounded,
      showClose = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      preventScroll = true,
      ...props
    },
    ref
  ) => {
    const { open, setOpen } = useDialog();
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Body scroll lock
    useBodyScrollLock(open && preventScroll);

    // Focus trap
    useFocusTrap(contentRef, open);

    // Escape key handler
    React.useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, setOpen]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        setOpen(false);
      }
    };

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay onClick={handleOverlayClick} />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          <div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            className={cn(
              dialogContentVariants({ size, rounded }),
              'animate-in fade-in-0 zoom-in-95 duration-200',
              'border border-neutral-200 dark:border-charcoal-700',
              className
            )}
            {...props}
          >
            {children}

            {/* Close button */}
            {showClose && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  'absolute right-4 top-4 p-1.5 rounded-lg transition-colors',
                  'text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-200',
                  'hover:bg-neutral-100 dark:hover:bg-charcoal-700',
                  'focus:outline-none focus:ring-2 focus:ring-gold-500'
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = 'DialogContent';

/**
 * Dialog Header Component
 */
const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 p-6 pb-4',
        'border-b border-neutral-200 dark:border-charcoal-700',
        className
      )}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

/**
 * Dialog Title Component
 */
const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'text-xl font-semibold text-charcoal-900 dark:text-white pr-8',
        className
      )}
      {...props}
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

/**
 * Dialog Description Component
 */
const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-charcoal-600 dark:text-charcoal-400', className)}
      {...props}
    />
  )
);
DialogDescription.displayName = 'DialogDescription';

/**
 * Dialog Body Component
 */
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 overflow-y-auto max-h-[60vh]', className)}
      {...props}
    />
  )
);
DialogBody.displayName = 'DialogBody';

/**
 * Dialog Footer Component
 */
const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 p-6 pt-4',
        'border-t border-neutral-200 dark:border-charcoal-700',
        'bg-neutral-50 dark:bg-charcoal-800/50 rounded-b-xl',
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

/**
 * Dialog Close Component
 */
const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild, children, onClick, className, ...props }, ref) => {
    const { setOpen } = useDialog();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(false);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: handleClick,
        ref,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700',
          'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 dark:focus:ring-offset-charcoal-800',
          className
        )}
        {...props}
      >
        {children || 'Cancel'}
      </button>
    );
  }
);
DialogClose.displayName = 'DialogClose';

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

/**
 * Alert Dialog - Confirmation dialogs
 */
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showClose={false} closeOnOverlayClick={false}>
        <DialogHeader className="border-b-0 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t-0 pt-2 bg-transparent">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
              confirmButtonStyles[variant]
            )}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
AlertDialog.displayName = 'AlertDialog';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  AlertDialog,
  dialogContentVariants,
  useDialog,
};