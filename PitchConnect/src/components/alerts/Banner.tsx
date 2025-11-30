/**
 * Banner Component
 * Full-width alert banner
 */

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string | ReactNode;
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
  icon?: ReactNode;
}

export default function Banner({
  type = 'info',
  message,
  action,
  onClose,
  icon,
}: BannerProps) {
  const typeConfig = {
    info: 'bg-blue-50 border-b-4 border-blue-500',
    success: 'bg-green-50 border-b-4 border-green-500',
    warning: 'bg-yellow-50 border-b-4 border-yellow-500',
    error: 'bg-red-50 border-b-4 border-red-500',
  };

  return (
    <div className={`${typeConfig[type]} px-6 py-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3 flex-1">
        {icon}
        <div className="text-sm font-medium text-charcoal-900">{message}</div>
      </div>

      <div className="flex items-center gap-2">
        {action && (
          <Button
            onClick={action.onClick}
            size="sm"
            className="text-xs font-bold"
          >
            {action.label}
          </Button>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded">
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        )}
      </div>
    </div>
  );
}
