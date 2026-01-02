/**
 * ============================================================================
 * TOOLTIP COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Custom tooltip component (no Radix dependency) with:
 * - Multiple positions (top, bottom, left, right)
 * - Delay control
 * - Arrow indicator
 * - Dark mode support
 * - Keyboard accessibility
 * 
 * @version 1.0.0
 * @path src/components/ui/tooltip.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// CONTEXT
// =============================================================================

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const useTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within TooltipProvider');
  }
  return context;
};

// =============================================================================
// TOOLTIP PROVIDER
// =============================================================================

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipProvider = ({
  children,
  delayDuration = 400,
}: TooltipProviderProps) => {
  return <>{children}</>;
};

// =============================================================================
// TOOLTIP ROOT
// =============================================================================

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

const Tooltip = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 400,
}: TooltipProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      setUncontrolledOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

// =============================================================================
// TOOLTIP TRIGGER
// =============================================================================

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const { setOpen, delayDuration } = useTooltip();
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
      }, delayDuration);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setOpen(false);
    };

    const handleFocus = () => {
      setOpen(true);
    };

    const handleBlur = () => {
      setOpen(false);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        ...props,
      });
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

// =============================================================================
// TOOLTIP CONTENT
// =============================================================================

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = 'top',
      sideOffset = 4,
      align = 'center',
      children,
      ...props
    },
    ref
  ) => {
    const { open } = useTooltip();

    if (!open) return null;

    const positionClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    };

    const alignClasses = {
      start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
      center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
      end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    };

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          'absolute z-50 px-3 py-1.5 text-sm rounded-md shadow-md',
          'bg-charcoal-900 dark:bg-charcoal-700 text-white',
          'animate-in fade-in zoom-in-95 duration-150',
          positionClasses[side],
          alignClasses[align],
          className
        )}
        style={{ marginTop: side === 'bottom' ? sideOffset : undefined, marginBottom: side === 'top' ? sideOffset : undefined }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

// =============================================================================
// SIMPLE TOOLTIP WRAPPER
// =============================================================================

interface SimpleTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  disabled?: boolean;
}

const SimpleTooltip = ({
  children,
  content,
  side = 'top',
  delayDuration = 300,
  disabled = false,
}: SimpleTooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && !disabled && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-1.5 text-sm rounded-md shadow-md whitespace-nowrap',
            'bg-charcoal-900 dark:bg-charcoal-700 text-white',
            'animate-in fade-in zoom-in-95 duration-150',
            positionClasses[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
};