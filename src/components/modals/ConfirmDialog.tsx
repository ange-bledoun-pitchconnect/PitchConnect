/**
 * Confirm Dialog Component
 * Reusable confirmation modal for destructive actions
 */

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'bg-red-100 text-red-600',
          buttonColor: 'from-red-600 to-red-700',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'bg-yellow-100 text-yellow-600',
          buttonColor: 'from-yellow-600 to-yellow-700',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'bg-green-100 text-green-600',
          buttonColor: 'from-green-600 to-green-700',
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'bg-blue-100 text-blue-600',
          buttonColor: 'from-blue-600 to-blue-700',
        };
    }
  };

  const { icon, color, buttonColor } = getIconAndColors();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirm dialog error:', error);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-50 w-full max-w-md p-0 rounded-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-neutral-50 to-transparent border-b border-neutral-200">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-charcoal-900">{title}</h2>
              {description && (
                <p className="text-sm text-charcoal-600 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-charcoal-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex gap-3">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold disabled:opacity-50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 bg-gradient-to-r ${buttonColor} text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
