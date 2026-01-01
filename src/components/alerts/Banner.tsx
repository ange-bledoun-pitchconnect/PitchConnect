/**
 * ============================================================================
 * Banner Component
 * ============================================================================
 * 
 * Enterprise-grade full-width alert banner for important announcements.
 * Typically used at the top of pages or sections.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users - Generic UI component
 * 
 * USE CASES:
 * - System maintenance announcements
 * - Feature announcements
 * - Subscription expiration warnings
 * - Trial period notices
 * - Security alerts
 * - Cookie consent
 * 
 * FEATURES:
 * - 4 banner types: info, success, warning, error
 * - Primary and secondary actions
 * - Dismissible with persistence option (localStorage)
 * - Dark mode support
 * - Accessible (ARIA labels)
 * - Sticky option
 * - Animated entrance/exit
 * - Countdown timer option
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
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type BannerType = 'info' | 'success' | 'warning' | 'error';

export interface BannerAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface BannerProps {
  /** Banner type determines color scheme */
  type?: BannerType;
  /** Banner message content */
  message: string | ReactNode;
  /** Primary action button */
  action?: BannerAction;
  /** Secondary action button */
  secondaryAction?: BannerAction;
  /** Callback when banner is closed */
  onClose?: () => void;
  /** Custom icon override */
  icon?: ReactNode;
  /** Hide default icon */
  hideIcon?: boolean;
  /** Persist dismissal in localStorage with this key */
  persistDismissal?: string;
  /** Make banner sticky at top */
  sticky?: boolean;
  /** Show countdown timer (in seconds) */
  countdown?: number;
  /** Callback when countdown ends */
  onCountdownEnd?: () => void;
  /** Custom class name */
  className?: string;
  /** Banner ID for accessibility */
  id?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface TypeConfig {
  bg: string;
  border: string;
  text: string;
  icon: ReactNode;
  buttonPrimary: string;
  buttonSecondary: string;
}

const TYPE_CONFIG: Record<BannerType, TypeConfig> = {
  info: {
    bg: 'bg-blue-600 dark:bg-blue-700',
    border: 'border-b-4 border-blue-700 dark:border-blue-500',
    text: 'text-white',
    icon: <Info className="w-5 h-5" />,
    buttonPrimary: 'bg-white text-blue-700 hover:bg-blue-50',
    buttonSecondary: 'text-white border-white/50 hover:bg-white/10',
  },
  success: {
    bg: 'bg-green-600 dark:bg-green-700',
    border: 'border-b-4 border-green-700 dark:border-green-500',
    text: 'text-white',
    icon: <CheckCircle className="w-5 h-5" />,
    buttonPrimary: 'bg-white text-green-700 hover:bg-green-50',
    buttonSecondary: 'text-white border-white/50 hover:bg-white/10',
  },
  warning: {
    bg: 'bg-yellow-500 dark:bg-yellow-600',
    border: 'border-b-4 border-yellow-600 dark:border-yellow-400',
    text: 'text-charcoal-900',
    icon: <AlertTriangle className="w-5 h-5" />,
    buttonPrimary: 'bg-charcoal-900 text-white hover:bg-charcoal-800',
    buttonSecondary: 'text-charcoal-900 border-charcoal-900/50 hover:bg-charcoal-900/10',
  },
  error: {
    bg: 'bg-red-600 dark:bg-red-700',
    border: 'border-b-4 border-red-700 dark:border-red-500',
    text: 'text-white',
    icon: <AlertCircle className="w-5 h-5" />,
    buttonPrimary: 'bg-white text-red-700 hover:bg-red-50',
    buttonSecondary: 'text-white border-white/50 hover:bg-white/10',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function Banner({
  type = 'info',
  message,
  action,
  secondaryAction,
  onClose,
  icon,
  hideIcon = false,
  persistDismissal,
  sticky = false,
  countdown,
  onCountdownEnd,
  className,
  id,
  testId,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(countdown);

  const config = TYPE_CONFIG[type];

  // Check if previously dismissed
  useEffect(() => {
    if (persistDismissal) {
      const dismissed = localStorage.getItem(`banner-dismissed-${persistDismissal}`);
      if (dismissed) {
        setIsVisible(false);
      }
    }
  }, [persistDismissal]);

  // Countdown timer
  useEffect(() => {
    if (countdown && countdown > 0) {
      setRemainingTime(countdown);

      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev && prev <= 1) {
            clearInterval(interval);
            onCountdownEnd?.();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countdown, onCountdownEnd]);

  // Handle close with animation and persistence
  const handleClose = useCallback(() => {
    setIsExiting(true);

    if (persistDismissal) {
      localStorage.setItem(`banner-dismissed-${persistDismissal}`, 'true');
    }

    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  }, [onClose, persistDismissal]);

  if (!isVisible) {
    return null;
  }

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const bannerId = id || `banner-${type}`;

  return (
    <div
      id={bannerId}
      role="banner"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      data-testid={testId}
      className={cn(
        // Base styles
        'relative w-full transition-all duration-200',
        config.bg,
        config.border,
        // Position
        sticky && 'sticky top-0 z-50',
        // Animation
        isExiting && 'opacity-0 -translate-y-2',
        // Custom
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!hideIcon && (
              <div className={cn('flex-shrink-0', config.text)} aria-hidden="true">
                {icon || config.icon}
              </div>
            )}
            <div className={cn('text-sm font-medium', config.text)}>
              {message}
            </div>

            {/* Countdown */}
            {countdown && remainingTime !== undefined && remainingTime > 0 && (
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/10 text-xs font-mono',
                  config.text
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTime(remainingTime)}
              </div>
            )}
          </div>

          {/* Right: Actions + Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Secondary Action */}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                size="sm"
                className={cn(
                  'text-xs font-bold border',
                  config.buttonSecondary
                )}
              >
                {secondaryAction.label}
              </Button>
            )}

            {/* Primary Action */}
            {action && (
              <Button
                onClick={action.onClick}
                size="sm"
                className={cn('text-xs font-bold', config.buttonPrimary)}
              >
                {action.label}
              </Button>
            )}

            {/* Close Button */}
            {onClose && (
              <button
                onClick={handleClose}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  config.text,
                  'hover:bg-black/10 dark:hover:bg-white/10',
                  'focus:outline-none focus:ring-2 focus:ring-white/50'
                )}
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Banner.displayName = 'Banner';

export default Banner;
