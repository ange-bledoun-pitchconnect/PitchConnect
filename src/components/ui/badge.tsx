import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-border bg-background text-foreground hover:bg-accent',
        primary:
          'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/20',
        destructive:
          'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
        success:
          'border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20',
        warning:
          'border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20',
        info: 'border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20',
        outline: 'border-2 border-primary text-primary hover:bg-primary/5',
      },
      size: {
        default: 'text-xs',
        sm: 'text-[10px] px-2 py-0.5',
        lg: 'text-sm px-4 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
