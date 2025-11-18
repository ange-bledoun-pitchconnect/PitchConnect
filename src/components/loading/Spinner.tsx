/**
 * Spinner Component
 * Loading spinner with different sizes and colors
 */

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'gold' | 'blue' | 'purple' | 'white' | 'charcoal';
  className?: string;
}

export default function Spinner({
  size = 'md',
  color = 'gold',
  className = '',
}: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const colorMap = {
    gold: 'border-gold-200 border-t-gold-600',
    blue: 'border-blue-200 border-t-blue-600',
    purple: 'border-purple-200 border-t-purple-600',
    white: 'border-white/30 border-t-white',
    charcoal: 'border-charcoal-200 border-t-charcoal-600',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeMap[size],
        colorMap[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Preset Spinner Components
export function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <Spinner size="xl" />
      </div>
    </div>
  );
}

export function SpinnerInline({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Spinner size="sm" />
      {message && <span className="text-sm text-charcoal-600">{message}</span>}
    </div>
  );
}
