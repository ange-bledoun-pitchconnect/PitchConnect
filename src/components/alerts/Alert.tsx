/**
 * ============================================================================
 * Alert Component
 * ============================================================================
 * 
 * Enterprise-grade alert component for displaying inline feedback messages.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users - Generic UI component
 * 
 * FEATURES:
 * - 4 alert types: info, success, warning, error
 * - Optional title
 * - Closeable with animation
 * - Custom icons support
 * - Dark mode support
 * - Accessible (ARIA labels)
 * - Action button support
 * - Auto-dismiss option
 * - Compound variants for styling
 * 
 * ============================================================================
 */

'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional href for link-style actions */
  href?: string;
  /** External link (opens in new tab) */
  external?: boolean;
}

export interface AlertProps {
  /** Alert type determines color scheme and icon */
  type?: AlertType;
  /** Optional title - displayed prominently */
  title?: string;
  /** Alert message content - can be string or JSX */
  message: string | ReactNode;
  /** Callback when alert is closed */
  onClose?: () => void;
  /** Whether alert can be closed */
  closeable?: boolean;
  /** Custom icon override */
  icon?: ReactNode;
  /** Hide default icon */
  hideIcon?: boolean;
  /** Optional action button */
  action?: AlertAction;
  /** Auto-dismiss after specified milliseconds */
  autoDismiss?: number;
  /** Custom class name */
  className?: string;
  /** Compact mode - reduced padding */
  compact?: boolean;
  /** Full width mode */
  fullWidth?: boolean;
  /** Alert ID for accessibility */
  id?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TypeConfig {
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  iconLight: string;
  iconDark: string;
  icon: ReactNode;
  ariaLabel: string;
}

const TYPE_CONFIG: Record<AlertType, TypeConfig> = {
  info: {
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/30',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
    textLight: 'text-blue-900',
    textDark: 'dark:text-blue-100',
    iconLight: 'text-blue-600',
    iconDark: 'dark:text-blue-400',
    icon: <Info className="w-5 h-5" />,
    ariaLabel: 'Information',
  },
  success: {
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-950/30',
    borderLight: 'border-green-200',
    borderDark: 'dark:border-green-800',
    textLight: 'text-green-900',
    textDark: 'dark:text-green-100',
    iconLight: 'text-green-600',
    iconDark: 'dark:text-green-400',
    icon: <CheckCircle className="w-5 h-5" />,
    ariaLabel: 'Success',
  },
  warning: {
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950/30',
    borderLight: 'border-yellow-200',
    borderDark: 'dark:border-yellow-800',
    textLight: 'text-yellow-900',
    textDark: 'dark:text-yellow-100',
    iconLight: 'text-yellow-600',
    iconDark: 'dark:text-yellow-400',
    icon: <AlertTriangle className="w-5 h-5" />,
    ariaLabel: 'Warning',
  },
  error: {
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/30',
    borderLight: 'border-red-200',
    borderDark: 'dark:border-red-800',
    textLight: 'text-red-900',
    textDark: 'dark:text-red-100',
    iconLight: 'text-red-600',
    iconDark: 'dark:text-red-400',
    icon: <AlertCircle className="w-5 h-5" />,
    ariaLabel: 'Error',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function Alert({
  type = 'info',
  title,
  message,
  onClose,
  closeable = true,
  icon,
  hideIcon = false,
  action,
  autoDismiss,
  className,
  compact = false,
  fullWidth = false,
  id,
  testId,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const config = TYPE_CONFIG[type];

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  }, [onClose]);

  // Auto-dismiss
  useEffect(() => {
    if (autoDismiss && autoDismiss > 0) {
      const timer = setTimeout(handleClose, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, handleClose]);

  // Reset visibility when type changes
  useEffect(() => {
    setIsVisible(true);
    setIsExiting(false);
  }, [type, message]);

  if (!isVisible) {
    return null;
  }

  const alertId = id || `alert-${type}`;

  return (
    <div
      id={alertId}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-label={config.ariaLabel}
      data-testid={testId}
      className={cn(
        // Base styles
        'relative flex items-start gap-3 rounded-lg border-2 transition-all duration-200',
        // Padding
        compact ? 'p-3' : 'p-4',
        // Width
        fullWidth ? 'w-full' : 'max-w-2xl',
        // Colors
        config.bgLight,
        config.bgDark,
        config.borderLight,
        config.borderDark,
        // Animation
        isExiting && 'opacity-0 scale-95',
        // Custom
        className
      )}
    >
      {/* Icon */}
      {!hideIcon && (
        <div
          className={cn(
            'flex-shrink-0 mt-0.5',
            config.iconLight,
            config.iconDark
          )}
          aria-hidden="true"
        >
          {icon || config.icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className={cn(
              'font-bold mb-1',
              compact ? 'text-sm' : 'text-base',
              config.textLight,
              config.textDark
            )}
          >
            {title}
          </h4>
        )}
        <div
          className={cn(
            compact ? 'text-xs' : 'text-sm',
            config.textLight,
            config.textDark,
            'opacity-90'
          )}
        >
          {message}
        </div>

        {/* Action Button */}
        {action && (
          <div className="mt-3">
            {action.href ? (
              <a
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline',
                  config.textLight,
                  config.textDark
                )}
                onClick={action.onClick}
              >
                {action.label}
                {action.external && <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            ) : (
              <button
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded',
                  config.textLight,
                  config.textDark
                )}
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Close Button */}
      {closeable && onClose && (
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md transition-colors',
            'text-charcoal-500 dark:text-charcoal-400',
            'hover:text-charcoal-700 dark:hover:text-charcoal-200',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'focus:outline-none focus:ring-2 focus:ring-offset-2'
          )}
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

Alert.displayName = 'Alert';

export default Alert;
