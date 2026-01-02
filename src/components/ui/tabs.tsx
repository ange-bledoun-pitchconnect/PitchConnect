/**
 * ============================================================================
 * TABS COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade tabs (no Radix dependency) with:
 * - Multiple variants (default, pills, underline, card, minimal)
 * - Multiple sizes (sm, md, lg)
 * - Tab icons and badges
 * - Lazy loading support
 * - Keyboard navigation
 * - Controlled and uncontrolled modes
 * - Charcoal/gold design system
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 * 
 * @version 2.0.0
 * @path src/components/ui/tabs.tsx
 * 
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const tabsListVariants = cva(
  'inline-flex items-center justify-start gap-1 transition-colors',
  {
    variants: {
      variant: {
        /** Default - Standard tabs with background */
        default:
          'h-12 bg-neutral-100 dark:bg-charcoal-700 p-1 rounded-lg text-charcoal-600 dark:text-charcoal-400',

        /** Pills - Pill-shaped tabs */
        pills:
          'h-11 bg-neutral-100 dark:bg-charcoal-700 p-1 rounded-xl text-charcoal-600 dark:text-charcoal-400',

        /** Underline - Minimal with underline indicator */
        underline:
          'h-12 border-b border-neutral-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 gap-8 rounded-none',

        /** Card - Card-like tab interface */
        card:
          'h-auto gap-2 border-b border-neutral-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 pb-0 rounded-none',

        /** Minimal - No background */
        minimal:
          'h-11 text-charcoal-600 dark:text-charcoal-400 gap-4',

        /** Segment - iOS-style segmented control */
        segment:
          'h-10 bg-neutral-100 dark:bg-charcoal-700 p-1 rounded-lg text-charcoal-600 dark:text-charcoal-400',
      },

      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-charcoal-800 data-[state=active]:text-charcoal-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:text-charcoal-900 dark:hover:text-white',

        pills:
          'px-4 py-2 rounded-full data-[state=active]:bg-gold-500 dark:data-[state=active]:bg-gold-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-neutral-200 dark:hover:bg-charcoal-600',

        underline:
          'px-1 py-3 border-b-2 border-transparent rounded-none data-[state=active]:border-gold-500 dark:data-[state=active]:border-gold-400 data-[state=active]:text-charcoal-900 dark:data-[state=active]:text-white hover:text-charcoal-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-charcoal-600',

        card:
          'px-4 py-2 border border-neutral-200 dark:border-charcoal-700 rounded-t-lg border-b-0 data-[state=active]:border-gold-500 dark:data-[state=active]:border-gold-400 data-[state=active]:bg-white dark:data-[state=active]:bg-charcoal-800 data-[state=active]:text-gold-600 dark:data-[state=active]:text-gold-400 hover:border-neutral-300 dark:hover:border-charcoal-600 -mb-px',

        minimal:
          'px-2 py-2 data-[state=active]:text-gold-600 dark:data-[state=active]:text-gold-400 hover:text-charcoal-900 dark:hover:text-white',

        segment:
          'flex-1 px-3 py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-charcoal-600 data-[state=active]:text-charcoal-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm',
      },

      size: {
        sm: 'text-xs px-3 py-1.5',
        md: '',
        lg: 'text-base px-5 py-2.5',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
  variant: 'default' | 'pills' | 'underline' | 'card' | 'minimal' | 'segment';
  size: 'sm' | 'md' | 'lg';
}

interface TabsProps extends VariantProps<typeof tabsListVariants> {
  /** Controlled value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Children */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {
  children: React.ReactNode;
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tab value */
  value: string;
  /** Tab icon */
  icon?: React.ReactNode;
  /** Badge count/text */
  badge?: string | number;
  /** Children */
  children: React.ReactNode;
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tab value */
  value: string;
  /** Lazy load content */
  lazy?: boolean;
  /** Force mount (keep in DOM) */
  forceMount?: boolean;
  /** Children */
  children: React.ReactNode;
}

// =============================================================================
// CONTEXT
// =============================================================================

const TabsContext = React.createContext<TabsContextType | null>(null);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Tabs Root Component
 */
const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: controlledValue,
      onValueChange: controlledOnValueChange,
      defaultValue = '',
      variant = 'default',
      size = 'md',
      fullWidth,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const value = controlledValue ?? uncontrolledValue;
    const onValueChange = controlledOnValueChange ?? setUncontrolledValue;

    return (
      <TabsContext.Provider value={{ value, onValueChange, variant: variant!, size: size! }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

/**
 * Tabs List Component
 */
const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, size, fullWidth, children, ...props }, ref) => {
    const context = useTabs();

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          tabsListVariants({
            variant: variant ?? context.variant,
            size: size ?? context.size,
            fullWidth,
          }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

/**
 * Tabs Trigger Component
 */
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled = false, icon, badge, children, onClick, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant, size } = useTabs();
    const isActive = selectedValue === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        onValueChange(value);
      }
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          onValueChange(value);
        }
      }
    };

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(tabsTriggerVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {badge !== undefined && (
          <span
            className={cn(
              'ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-xs font-semibold rounded-full',
              isActive
                ? 'bg-gold-100 dark:bg-gold-900/50 text-gold-700 dark:text-gold-300'
                : 'bg-neutral-200 dark:bg-charcoal-600 text-charcoal-600 dark:text-charcoal-300'
            )}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

/**
 * Tabs Content Component
 */
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, lazy = false, forceMount = false, children, ...props }, ref) => {
    const { value: selectedValue } = useTabs();
    const isActive = selectedValue === value;
    const [hasBeenActive, setHasBeenActive] = React.useState(isActive);

    React.useEffect(() => {
      if (isActive) {
        setHasBeenActive(true);
      }
    }, [isActive]);

    // Lazy loading: don't render until first activated
    if (lazy && !hasBeenActive && !forceMount) {
      return null;
    }

    // Hide inactive tabs (unless forceMount)
    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={`tabpanel-${value}`}
        role="tabpanel"
        aria-labelledby={`tab-${value}`}
        hidden={!isActive}
        tabIndex={0}
        className={cn(
          'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-900 rounded-lg',
          isActive && 'animate-in fade-in-0 duration-200',
          !isActive && forceMount && 'hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

/**
 * Simple Tabs - All-in-one tabs component
 */
interface SimpleTabsProps extends Omit<TabsProps, 'children'> {
  /** Tab items with content */
  items: TabItem[];
  /** Content className */
  contentClassName?: string;
}

const SimpleTabs = React.forwardRef<HTMLDivElement, SimpleTabsProps>(
  ({ items, variant, size, contentClassName, className, ...props }, ref) => {
    const defaultValue = items[0]?.value || '';

    return (
      <Tabs ref={ref} defaultValue={defaultValue} variant={variant} size={size} className={className} {...props}>
        <TabsList variant={variant} size={size}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              icon={item.icon}
              badge={item.badge}
              disabled={item.disabled}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {items.map((item) => (
          <TabsContent key={item.value} value={item.value} className={contentClassName}>
            {item.content}
          </TabsContent>
        ))}
      </Tabs>
    );
  }
);
SimpleTabs.displayName = 'SimpleTabs';

/**
 * Vertical Tabs
 */
interface VerticalTabsProps extends Omit<TabsProps, 'children'> {
  /** Tab items */
  items: TabItem[];
  /** Tab list width */
  tabsWidth?: string;
}

const VerticalTabs = React.forwardRef<HTMLDivElement, VerticalTabsProps>(
  ({ items, tabsWidth = '200px', variant = 'minimal', size, className, ...props }, ref) => {
    const defaultValue = items[0]?.value || '';

    return (
      <Tabs ref={ref} defaultValue={defaultValue} variant={variant} size={size} className={cn('flex gap-6', className)} {...props}>
        <TabsList
          className={cn(
            'flex-col h-auto items-stretch bg-transparent gap-1',
            `w-[${tabsWidth}]`
          )}
          style={{ width: tabsWidth }}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              icon={item.icon}
              badge={item.badge}
              disabled={item.disabled}
              className="justify-start text-left"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          {items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="mt-0">
              {item.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    );
  }
);
VerticalTabs.displayName = 'VerticalTabs';

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SimpleTabs,
  VerticalTabs,
  tabsListVariants,
  tabsTriggerVariants,
};