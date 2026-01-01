/**
 * ============================================================================
 * Toast Component & Provider
 * ============================================================================
 * 
 * Enterprise-grade toast notification system with global state management.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users - Generic UI component
 * 
 * FEATURES:
 * - 4 toast types: info, success, warning, error
 * - Global toast context with useToast hook
 * - Auto-dismiss with configurable duration
 * - Pause on hover
 * - Progress bar option
 * - Multiple position options
 * - Stacking with max visible limit
 * - Accessible (ARIA labels)
 * - Keyboard dismiss (Escape)
 * - Action button support
 * - Custom icons
 * - Dark mode support
 * - Animations (slide + fade)
 * 
 * USAGE:
 * ```tsx
 * // In your app root:
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * 
 * // In any component:
 * const { toast } = useToast();
 * toast.success('Operation completed!');
 * toast.error('Something went wrong', { duration: 10000 });
 * ```
 * 
 * ============================================================================
 */

'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Toast type */
  type?: ToastType;
  /** Title (optional) */
  title?: string;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
  /** Custom icon */
  icon?: ReactNode;
  /** Action button */
  action?: ToastAction;
  /** Show progress bar */
  showProgress?: boolean;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Toast ID (for updates/dismissal) */
  id?: string;
}

export interface Toast extends Required<Omit<ToastOptions, 'action' | 'icon'>> {
  id: string;
  message: string | ReactNode;
  icon?: ReactNode;
  action?: ToastAction;
  createdAt: number;
  pausedAt?: number;
  remainingDuration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  toast: {
    (message: string | ReactNode, options?: ToastOptions): string;
    info: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
    success: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
    warning: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
    error: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
    dismiss: (id?: string) => void;
    update: (id: string, options: Partial<ToastOptions> & { message?: string | ReactNode }) => void;
  };
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Default position for toasts */
  position?: ToastPosition;
  /** Maximum visible toasts */
  maxToasts?: number;
  /** Default duration in ms */
  defaultDuration?: number;
  /** Gap between toasts */
  gap?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TypeConfig {
  bg: string;
  border: string;
  icon: ReactNode;
  progressBg: string;
}

const TYPE_CONFIG: Record<ToastType, TypeConfig> = {
  info: {
    bg: 'bg-blue-600 dark:bg-blue-700',
    border: 'border-blue-500',
    icon: <Info className="w-5 h-5 text-white" />,
    progressBg: 'bg-blue-400',
  },
  success: {
    bg: 'bg-green-600 dark:bg-green-700',
    border: 'border-green-500',
    icon: <CheckCircle className="w-5 h-5 text-white" />,
    progressBg: 'bg-green-400',
  },
  warning: {
    bg: 'bg-yellow-500 dark:bg-yellow-600',
    border: 'border-yellow-400',
    icon: <AlertTriangle className="w-5 h-5 text-charcoal-900" />,
    progressBg: 'bg-yellow-300',
  },
  error: {
    bg: 'bg-red-600 dark:bg-red-700',
    border: 'border-red-500',
    icon: <AlertCircle className="w-5 h-5 text-white" />,
    progressBg: 'bg-red-400',
  },
};

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

const ANIMATION_CLASSES: Record<ToastPosition, { enter: string; exit: string }> = {
  'top-left': {
    enter: 'animate-in slide-in-from-left-full fade-in',
    exit: 'animate-out slide-out-to-left-full fade-out',
  },
  'top-center': {
    enter: 'animate-in slide-in-from-top-full fade-in',
    exit: 'animate-out slide-out-to-top-full fade-out',
  },
  'top-right': {
    enter: 'animate-in slide-in-from-right-full fade-in',
    exit: 'animate-out slide-out-to-right-full fade-out',
  },
  'bottom-left': {
    enter: 'animate-in slide-in-from-left-full fade-in',
    exit: 'animate-out slide-out-to-left-full fade-out',
  },
  'bottom-center': {
    enter: 'animate-in slide-in-from-bottom-full fade-in',
    exit: 'animate-out slide-out-to-bottom-full fade-out',
  },
  'bottom-right': {
    enter: 'animate-in slide-in-from-right-full fade-in',
    exit: 'animate-out slide-out-to-right-full fade-out',
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// =============================================================================
// HOOK
// =============================================================================

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// =============================================================================
// SINGLE TOAST COMPONENT
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  position: ToastPosition;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

function ToastItem({
  toast,
  position,
  onDismiss,
  onPause,
  onResume,
}: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);

  const config = TYPE_CONFIG[toast.type];
  const animations = ANIMATION_CLASSES[position];
  const isWarning = toast.type === 'warning';

  // Progress bar animation
  useEffect(() => {
    if (!toast.showProgress || toast.duration === 0) return;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingRef.current - elapsed;
      const newProgress = (remaining / toast.duration) * 100;

      if (newProgress <= 0) {
        handleDismiss();
      } else {
        setProgress(newProgress);
        progressRef.current = setTimeout(updateProgress, 50);
      }
    };

    progressRef.current = setTimeout(updateProgress, 50);

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [toast.showProgress, toast.duration]);

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration === 0) return;

    const timeout = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => clearTimeout(timeout);
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const handleMouseEnter = () => {
    if (toast.pauseOnHover && progressRef.current) {
      clearTimeout(progressRef.current);
      remainingRef.current = remainingRef.current - (Date.now() - startTimeRef.current);
      onPause(toast.id);
    }
  };

  const handleMouseLeave = () => {
    if (toast.pauseOnHover) {
      startTimeRef.current = Date.now();
      onResume(toast.id);
    }
  };

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        // Base
        'relative flex items-start gap-3 w-full max-w-sm rounded-lg shadow-lg overflow-hidden',
        'text-white p-4',
        config.bg,
        // Animation
        isExiting ? animations.exit : animations.enter,
        'duration-200'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0" aria-hidden="true">
        {toast.icon || config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={cn('font-bold text-sm mb-1', isWarning ? 'text-charcoal-900' : 'text-white')}>
            {toast.title}
          </p>
        )}
        <div className={cn('text-sm', isWarning ? 'text-charcoal-800' : 'text-white/90')}>
          {toast.message}
        </div>

        {/* Action */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className={cn(
              'mt-2 text-xs font-bold underline underline-offset-2',
              isWarning ? 'text-charcoal-900' : 'text-white'
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 p-1 rounded transition-colors',
          isWarning
            ? 'text-charcoal-600 hover:bg-charcoal-900/10'
            : 'text-white/70 hover:text-white hover:bg-white/10',
          'focus:outline-none focus:ring-2 focus:ring-white/50'
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      {toast.showProgress && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className={cn('h-full transition-all duration-75', config.progressBg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TOAST PROVIDER
// =============================================================================

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
  gap = 12,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Keyboard dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        // Dismiss most recent toast
        const latestToast = toasts[toasts.length - 1];
        if (latestToast) {
          dismissToast(latestToast.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toasts]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addToast = useCallback(
    (message: string | ReactNode, options: ToastOptions = {}): string => {
      const id = options.id || generateId();

      const newToast: Toast = {
        id,
        message,
        type: options.type || 'info',
        title: options.title || '',
        duration: options.duration ?? defaultDuration,
        showProgress: options.showProgress ?? true,
        pauseOnHover: options.pauseOnHover ?? true,
        icon: options.icon,
        action: options.action,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Check if updating existing toast
        const existingIndex = prev.findIndex((t) => t.id === id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...newToast };
          return updated;
        }

        // Add new toast, respecting max limit
        const newToasts = [...prev, newToast];
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });

      return id;
    },
    [defaultDuration, maxToasts]
  );

  const dismissToast = useCallback((id?: string) => {
    if (id) {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  const updateToast = useCallback(
    (id: string, options: Partial<ToastOptions> & { message?: string | ReactNode }) => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...options,
                message: options.message ?? t.message,
              }
            : t
        )
      );
    },
    []
  );

  const pauseToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, pausedAt: Date.now() }
          : t
      )
    );
  }, []);

  const resumeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id && t.pausedAt) {
          const pausedDuration = Date.now() - t.pausedAt;
          return {
            ...t,
            pausedAt: undefined,
            remainingDuration: (t.remainingDuration || t.duration) - pausedDuration,
          };
        }
        return t;
      })
    );
  }, []);

  // Toast helper object
  const toast = Object.assign(
    (message: string | ReactNode, options?: ToastOptions) => addToast(message, options),
    {
      info: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'info' }),
      success: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'success' }),
      warning: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'warning' }),
      error: (message: string | ReactNode, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'error' }),
      dismiss: dismissToast,
      update: updateToast,
    }
  );

  const contextValue: ToastContextValue = {
    toasts,
    toast,
  };

  // Determine stacking direction based on position
  const isBottom = position.startsWith('bottom');

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div
          className={cn(
            'fixed z-[100] flex flex-col pointer-events-none',
            POSITION_CLASSES[position]
          )}
          style={{ gap: `${gap}px` }}
          aria-live="polite"
          aria-label="Notifications"
        >
          {(isBottom ? [...toasts].reverse() : toasts).map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem
                toast={t}
                position={position}
                onDismiss={dismissToast}
                onPause={pauseToast}
                onResume={resumeToast}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// =============================================================================
// STANDALONE TOAST (for non-provider usage)
// =============================================================================

export interface StandaloneToastProps {
  type?: ToastType;
  message: string | ReactNode;
  title?: string;
  duration?: number;
  onClose?: () => void;
  icon?: ReactNode;
  action?: ToastAction;
  position?: ToastPosition;
  showProgress?: boolean;
}

export function Toast({
  type = 'info',
  message,
  title,
  duration = 5000,
  onClose,
  icon,
  action,
  position = 'top-right',
  showProgress = true,
}: StandaloneToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const config = TYPE_CONFIG[type];
  const animations = ANIMATION_CLASSES[position];
  const isWarning = type === 'warning';

  useEffect(() => {
    if (duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      const newProgress = (remaining / duration) * 100;

      if (newProgress <= 0) {
        clearInterval(interval);
        handleClose();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed z-[100]',
        POSITION_CLASSES[position]
      )}
    >
      <div
        role="alert"
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'relative flex items-start gap-3 w-full max-w-sm rounded-lg shadow-lg overflow-hidden',
          'text-white p-4',
          config.bg,
          animations.enter,
          'duration-200'
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0" aria-hidden="true">
          {icon || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('font-bold text-sm mb-1', isWarning ? 'text-charcoal-900' : 'text-white')}>
              {title}
            </p>
          )}
          <div className={cn('text-sm', isWarning ? 'text-charcoal-800' : 'text-white/90')}>
            {message}
          </div>

          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={cn(
                'mt-2 text-xs font-bold underline underline-offset-2',
                isWarning ? 'text-charcoal-900' : 'text-white'
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 p-1 rounded transition-colors',
              isWarning
                ? 'text-charcoal-600 hover:bg-charcoal-900/10'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Progress Bar */}
        {showProgress && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className={cn('h-full transition-all duration-75', config.progressBg)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

Toast.displayName = 'Toast';

export default Toast;
