/**
 * Toast Component
 * Small notification that appears in corner
 */

import { ReactNode, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string | ReactNode;
  duration?: number;
  onClose?: () => void;
  icon?: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function Toast({
  type = 'info',
  message,
  duration = 5000,
  onClose,
  icon,
  position = 'top-right',
}: ToastProps) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    info: {
      bg: 'bg-blue-600',
      icon: <Info className="w-5 h-5 text-white" />,
    },
    success: {
      bg: 'bg-green-600',
      icon: <CheckCircle className="w-5 h-5 text-white" />,
    },
    warning: {
      bg: 'bg-yellow-600',
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <AlertCircle className="w-5 h-5 text-white" />,
    },
  };

  const positionMap = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed ${positionMap[position]} z-50 ${config.bg} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm animate-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex-shrink-0">{icon || config.icon}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
