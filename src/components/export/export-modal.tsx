'use client';

/**
 * Export Modal Component
 * Path: src/components/export/export-modal.tsx
 * 
 * Features:
 * - Export format selection (PDF, CSV, Email)
 * - File type selection
 * - Email validation
 * - Download progress
 * - Success/error feedback
 * - Mobile responsive
 * - Dark mode support
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  Sheet,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
} from 'lucide-react';

type ExportFormat = 'pdf' | 'csv' | 'email';
type FileType = 'players' | 'teams' | 'standings' | 'matches';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: (fileType: FileType) => Promise<void>;
  onExportCSV: (fileType: FileType) => Promise<void>;
  onExportEmail: (fileType: FileType, email: string) => Promise<void>;
  fileType: FileType;
  isLoading?: boolean;
}

interface ExportFormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    id: 'pdf',
    label: 'PDF Report',
    description: 'Beautiful formatted report with tables and headers',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-red-600',
  },
  {
    id: 'csv',
    label: 'CSV Spreadsheet',
    description: 'Excel-compatible spreadsheet format',
    icon: <Sheet className="w-5 h-5" />,
    color: 'text-green-600',
  },
  {
    id: 'email',
    label: 'Email Delivery',
    description: 'Send report to email address',
    icon: <Mail className="w-5 h-5" />,
    color: 'text-blue-600',
  },
];

const FILE_TYPE_LABELS: Record<FileType, string> = {
  players: 'Player Statistics',
  teams: 'Team Data',
  standings: 'League Standings',
  matches: 'Match Results',
};

export function ExportModal({
  isOpen,
  onClose,
  onExportPDF,
  onExportCSV,
  onExportEmail,
  fileType,
  isLoading = false,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validate email
  const isValidEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      setStatus('idle');
      setErrorMessage('');

      switch (selectedFormat) {
        case 'pdf':
          await onExportPDF(fileType);
          break;
        case 'csv':
          await onExportCSV(fileType);
          break;
        case 'email':
          if (!email || !isValidEmail(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address');
            setIsExporting(false);
            return;
          }
          await onExportEmail(fileType, email);
          break;
      }

      setStatus('success');
      setTimeout(() => {
        onClose();
        setSelectedFormat('pdf');
        setEmail('');
        setStatus('idle');
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to export'
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedFormat, fileType, email, onExportPDF, onExportCSV, onExportEmail, isValidEmail, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isExporting) {
      onClose();
      setStatus('idle');
      setErrorMessage('');
      setEmail('');
      setSelectedFormat('pdf');
    }
  }, [isExporting, onClose]);

  // Check if export button is disabled
  const isExportDisabled =
    isExporting ||
    isLoading ||
    (selectedFormat === 'email' && (!email || !isValidEmail(email)));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Export {FILE_TYPE_LABELS[fileType]}
              </DialogTitle>
              <DialogDescription>
                Choose your preferred export format
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-charcoal-900 dark:text-white">
              Export Format
            </label>
            <div className="grid gap-3">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => {
                    setSelectedFormat(format.id);
                    setStatus('idle');
                    setErrorMessage('');
                  }}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-neutral-200 dark:border-charcoal-700 hover:border-blue-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`${format.color} mt-1`}>
                      {format.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-charcoal-900 dark:text-white">
                        {format.label}
                      </p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Input (conditional) */}
          {selectedFormat === 'email' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-charcoal-900 dark:text-white">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="user@example.com"
                disabled={isExporting}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  !email || isValidEmail(email)
                    ? 'border-neutral-200 dark:border-charcoal-700'
                    : 'border-red-500'
                }`}
              />
              {email && !isValidEmail(email) && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please enter a valid email address
                </p>
              )}
            </div>
          )}

          {/* Status Messages */}
          {status === 'success' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Export successful! Closing...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExportDisabled}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ExportModal.displayName = 'ExportModal';
