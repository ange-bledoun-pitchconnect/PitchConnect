/**
 * Empty State Component
 * Display when no data is available
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  size = 'md',
}: EmptyStateProps) {
  const sizeMap = {
    sm: { icon: 'w-12 h-12', padding: 'p-6', gap: 'gap-2' },
    md: { icon: 'w-16 h-16', padding: 'p-12', gap: 'gap-3' },
    lg: { icon: 'w-20 h-20', padding: 'p-16', gap: 'gap-4' },
  };

  const { icon: iconSize, padding, gap } = sizeMap[size];

  return (
    <div className={`text-center ${padding}`}>
      <div className={`flex justify-center mb-4`}>
        <div className="text-neutral-300">{icon}</div>
      </div>

      <h3 className="text-lg font-bold text-charcoal-900 mb-2">{title}</h3>

      {description && (
        <p className="text-charcoal-600 text-sm mb-6">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md inline-flex items-center gap-2"
        >
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
