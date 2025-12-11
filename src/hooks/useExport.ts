'use client';

/**
 * Export Hook
 * Path: src/hooks/useExport.ts
 * 
 * Provides export functionality:
 * - PDF export
 * - CSV export
 * - Email delivery
 * - Loading states
 * - Error handling
 * - Download management
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type FileType = 'players' | 'teams' | 'standings' | 'matches';
type ExportFormat = 'pdf' | 'csv';

interface ExportOptions {
  leagueId?: string;
  clubId?: string;
  playerId?: string;
  format?: 'portrait' | 'landscape';
}

interface ExportState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook for managing export operations
 */
export function useExport() {
  const [state, setState] = useState<ExportState>({
    isLoading: false,
    progress: 0,
    error: null,
  });
  const { toast } = useToast();

  /**
   * Export to PDF
   */
  const exportPDF = useCallback(
    async (fileType: FileType, options?: ExportOptions) => {
      setState({ isLoading: true, progress: 0, error: null });

      try {
        setState((prev) => ({ ...prev, progress: 25 }));

        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileType,
            ...options,
          }),
        });

        setState((prev) => ({ ...prev, progress: 50 }));

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to export PDF');
        }

        setState((prev) => ({ ...prev, progress: 75 }));

        // Get filename from content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')?.replace(/"/g, '')
          : `export_${Date.now()}.pdf`;

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setState((prev) => ({ ...prev, progress: 100, isLoading: false }));
        toast({
          title: 'Success',
          description: 'PDF exported successfully',
          variant: 'default',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed';
        setState({
          isLoading: false,
          progress: 0,
          error: message,
        });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Export to CSV
   */
  const exportCSV = useCallback(
    async (fileType: FileType, options?: ExportOptions) => {
      setState({ isLoading: true, progress: 0, error: null });

      try {
        setState((prev) => ({ ...prev, progress: 25 }));

        const response = await fetch('/api/export/csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileType,
            ...options,
          }),
        });

        setState((prev) => ({ ...prev, progress: 50 }));

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to export CSV');
        }

        setState((prev) => ({ ...prev, progress: 75 }));

        // Get filename from content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')?.replace(/"/g, '')
          : `export_${Date.now()}.csv`;

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setState((prev) => ({ ...prev, progress: 100, isLoading: false }));
        toast({
          title: 'Success',
          description: 'CSV exported successfully',
          variant: 'default',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed';
        setState({
          isLoading: false,
          progress: 0,
          error: message,
        });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Export via email
   */
  const exportEmail = useCallback(
    async (
      fileType: FileType,
      email: string,
      format: ExportFormat = 'pdf',
      options?: ExportOptions
    ) => {
      setState({ isLoading: true, progress: 0, error: null });

      try {
        setState((prev) => ({ ...prev, progress: 25 }));

        // First generate the file
        const generateResponse = await fetch(
          format === 'pdf' ? '/api/export/pdf' : '/api/export/csv',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileType,
              ...options,
            }),
          }
        );

        setState((prev) => ({ ...prev, progress: 50 }));

        if (!generateResponse.ok) {
          throw new Error('Failed to generate file for email');
        }

        // Then send via email
        const emailResponse = await fetch('/api/export/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileType,
            recipients: [email],
            format,
            ...options,
          }),
        });

        setState((prev) => ({ ...prev, progress: 75 }));

        if (!emailResponse.ok) {
          const error = await emailResponse.json();
          throw new Error(error.error || 'Failed to send email');
        }

        setState((prev) => ({ ...prev, progress: 100, isLoading: false }));
        toast({
          title: 'Success',
          description: `File sent to ${email}`,
          variant: 'default',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed';
        setState({
          isLoading: false,
          progress: 0,
          error: message,
        });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    ...state,
    exportPDF,
    exportCSV,
    exportEmail,
  };
}
