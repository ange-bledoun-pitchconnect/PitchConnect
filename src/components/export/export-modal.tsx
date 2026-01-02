/**
 * ============================================================================
 * Export Modal Component
 * ============================================================================
 * 
 * Enterprise-grade export modal with multi-sport support and role-based
 * file type access.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/export/export-modal.tsx
 * 
 * FEATURES:
 * - Export format selection (PDF, CSV, Excel, Email)
 * - Sport-specific data context
 * - Role-based file type access
 * - File type selection with descriptions
 * - Email validation
 * - Download progress indicator
 * - Success/error feedback
 * - Mobile responsive
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - COACH, COACH_PRO: Player, team, training exports
 * - MANAGER, CLUB_MANAGER: Team, match exports
 * - CLUB_OWNER: Full club exports
 * - ANALYST: Analytics exports
 * - TREASURER: Financial exports
 * - LEAGUE_ADMIN: League-wide exports
 * - ADMIN, SUPERADMIN: All exports
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileText,
  Sheet,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  Filter,
  Calendar,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ExportFileType,
  type UserRole,
  type Sport,
  EXPORT_FILE_TYPE_CONFIG,
  getAvailableExportTypes,
  getSportConfig,
} from '@/config';

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'email';

export interface ExportOptions {
  fileType: ExportFileType;
  format: ExportFormat;
  sport?: Sport;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, unknown>;
  email?: string;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface ExportModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Export handler - called with export options */
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  /** Current user's roles */
  userRoles: UserRole[];
  /** Pre-selected file type */
  defaultFileType?: ExportFileType;
  /** Current sport context */
  sport?: Sport;
  /** Show sport filter */
  showSportFilter?: boolean;
  /** Show date range filter */
  showDateRange?: boolean;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
}

// =============================================================================
// EXPORT FORMAT OPTIONS
// =============================================================================

interface ExportFormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  extension: string;
}

const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    id: 'pdf',
    label: 'PDF Report',
    description: 'Formatted report with tables, charts, and headers',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    extension: '.pdf',
  },
  {
    id: 'csv',
    label: 'CSV File',
    description: 'Comma-separated values, universal compatibility',
    icon: <Sheet className="w-5 h-5" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    extension: '.csv',
  },
  {
    id: 'xlsx',
    label: 'Excel Spreadsheet',
    description: 'Full Excel workbook with formatting and formulas',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    extension: '.xlsx',
  },
  {
    id: 'email',
    label: 'Email Delivery',
    description: 'Send report directly to an email address',
    icon: <Mail className="w-5 h-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    extension: '',
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  userRoles,
  defaultFileType,
  sport,
  showSportFilter = false,
  showDateRange = false,
  title = 'Export Data',
  description = 'Choose your export format and options',
  isLoading = false,
}: ExportModalProps) {
  // State
  const [selectedFileType, setSelectedFileType] = useState<ExportFileType | null>(
    defaultFileType || null
  );
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Get available file types based on user roles
  const availableFileTypes = useMemo(() => {
    return getAvailableExportTypes(userRoles);
  }, [userRoles]);

  // Get sport config if sport is provided
  const sportConfig = useMemo(() => {
    return sport ? getSportConfig(sport) : null;
  }, [sport]);

  // Get selected file type config
  const selectedFileTypeConfig = useMemo(() => {
    return selectedFileType ? EXPORT_FILE_TYPE_CONFIG[selectedFileType] : null;
  }, [selectedFileType]);

  // Validate email
  const isValidEmail = useCallback((email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }, []);

  // Check if export button is disabled
  const isExportDisabled = useMemo(() => {
    if (isExporting || isLoading) return true;
    if (!selectedFileType) return true;
    if (selectedFormat === 'email' && (!email || !isValidEmail(email))) return true;
    return false;
  }, [isExporting, isLoading, selectedFileType, selectedFormat, email, isValidEmail]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!selectedFileType) return;

    try {
      setIsExporting(true);
      setStatus('exporting');
      setErrorMessage('');
      setResultUrl(null);
      setExportProgress(0);

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const options: ExportOptions = {
        fileType: selectedFileType,
        format: selectedFormat,
        sport,
        email: selectedFormat === 'email' ? email : undefined,
      };

      const result = await onExport(options);

      clearInterval(progressInterval);
      setExportProgress(100);

      if (result.success) {
        setStatus('success');
        if (result.url) {
          setResultUrl(result.url);
        }

        // Auto-close after success (unless there's a download URL)
        if (!result.url) {
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Export failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedFileType, selectedFormat, sport, email, onExport]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isExporting) return;

    onClose();
    // Reset state after animation
    setTimeout(() => {
      setSelectedFileType(defaultFileType || null);
      setSelectedFormat('pdf');
      setEmail('');
      setStatus('idle');
      setErrorMessage('');
      setResultUrl(null);
      setExportProgress(0);
    }, 300);
  }, [isExporting, onClose, defaultFileType]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (resultUrl) {
      window.open(resultUrl, '_blank');
      handleClose();
    }
  }, [resultUrl, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 py-4">
          {/* Sport Context Badge */}
          {sportConfig && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-charcoal-800 rounded-lg">
              <span className="text-xl">{sportConfig.icon}</span>
              <span className="font-medium text-charcoal-900 dark:text-white">
                {sportConfig.name}
              </span>
              <Badge variant="secondary" className="ml-auto">
                Sport Context
              </Badge>
            </div>
          )}

          {/* File Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Data Type
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableFileTypes.map((fileType) => {
                const config = EXPORT_FILE_TYPE_CONFIG[fileType];
                const Icon = config.icon;
                const isSelected = selectedFileType === fileType;

                return (
                  <button
                    key={fileType}
                    onClick={() => setSelectedFileType(fileType)}
                    disabled={isExporting}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-neutral-200 dark:border-charcoal-700 hover:border-primary/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', isSelected ? 'text-primary' : 'text-charcoal-500')} />
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-charcoal-900 dark:text-white'
                      )}>
                        {config.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedFileTypeConfig && (
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {selectedFileTypeConfig.description}
              </p>
            )}
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-charcoal-900 dark:text-white">
              Export Format
            </label>
            <div className="grid gap-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => {
                    setSelectedFormat(format.id);
                    setStatus('idle');
                    setErrorMessage('');
                  }}
                  disabled={isExporting}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    selectedFormat === format.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-neutral-200 dark:border-charcoal-700 hover:border-primary/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn(format.color, format.bgColor, 'p-2 rounded-lg')}>
                      {format.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal-900 dark:text-white">
                        {format.label}
                        {format.extension && (
                          <span className="ml-2 text-xs text-charcoal-500">
                            ({format.extension})
                          </span>
                        )}
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
                className={cn(
                  'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                  'text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                  'disabled:opacity-50 transition-colors',
                  email && !isValidEmail(email)
                    ? 'border-red-500'
                    : 'border-neutral-200 dark:border-charcoal-700'
                )}
              />
              {email && !isValidEmail(email) && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please enter a valid email address
                </p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {status === 'exporting' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600 dark:text-charcoal-400">
                  Preparing export...
                </span>
                <span className="font-medium text-charcoal-900 dark:text-white">
                  {exportProgress}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    Export successful!
                  </p>
                  {resultUrl ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your file is ready for download.
                    </p>
                  ) : selectedFormat === 'email' ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Report sent to {email}
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Closing automatically...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    Export failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-charcoal-700">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>

          {status === 'success' && resultUrl ? (
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={isExportDisabled}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

ExportModal.displayName = 'ExportModal';

export default ExportModal;
