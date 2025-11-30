/**
 * Alert Component
 * Display alerts with different types
 */

import { ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string | ReactNode;
  onClose?: () => void;
  closeable?: boolean;
  icon?: ReactNode;
}

export default function Alert({
  type = 'info',
  title,
  message,
  onClose,
  closeable = true,
  icon,
}: AlertProps) {
  const typeConfig = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: 'text-blue-900',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-900',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      title: 'text-green-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      title: 'text-yellow-900',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      title: 'text-red-900',
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`${config.bg} border-2 ${config.border} rounded-lg p-4 flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-0.5">{icon || config.icon}</div>

      <div className="flex-1">
        {title && (
          <h4 className={`font-bold ${config.title} mb-1`}>{title}</h4>
        )}
        <div className={`text-sm ${config.text}`}>{message}</div>
      </div>

      {closeable && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-charcoal-500 hover:text-charcoal-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
