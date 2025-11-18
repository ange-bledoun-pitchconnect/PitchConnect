/**
 * Form Modal Component
 * Generic modal for forms with header, content, and footer
 */

import { useEffect, useRef, ReactNode } from 'react';
import { X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FormModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
}

export default function FormModal({
  isOpen,
  title,
  description,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
  onSubmit,
  onClose,
}: FormModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit();
    } catch (error) {
      console.error('Form modal error:', error);
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isLoading) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-50 w-full ${sizeClasses[size]} p-0 rounded-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm`}
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-charcoal-900">{title}</h2>
            {description && (
              <p className="text-sm text-charcoal-600 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold disabled:opacity-50"
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Processing...' : submitText}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
