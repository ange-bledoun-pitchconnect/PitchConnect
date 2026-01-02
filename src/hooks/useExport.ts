/**
 * ============================================================================
 * 📤 USE EXPORT HOOK v7.10.1 - MULTI-FORMAT EXPORT
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useExport.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { Sport } from './useSportConfig';

export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';
export type ExportType = 'players' | 'teams' | 'matches' | 'standings' | 'training' | 
                         'attendance' | 'performance' | 'financial' | 'medical' | 'analytics';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  sport?: Sport;
  filters?: Record<string, unknown>;
  columns?: string[];
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
  fileName?: string;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface UseExportReturn {
  exportData: (options: ExportOptions) => Promise<void>;
  progress: ExportProgress;
  isExporting: boolean;
  error: Error | null;
  cancel: () => void;
  downloadUrl: string | null;
}

export function useExport(): UseExportReturn {
  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<Error | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const isExporting = progress.status !== 'idle' && progress.status !== 'complete' && progress.status !== 'error';

  const exportData = useCallback(async (options: ExportOptions) => {
    const controller = new AbortController();
    setAbortController(controller);
    setError(null);
    setDownloadUrl(null);

    try {
      // Preparing
      setProgress({ status: 'preparing', progress: 10, message: 'Preparing export...' });

      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to initiate export');
      }

      const { exportId } = await response.json();

      // Generating
      setProgress({ status: 'generating', progress: 30, message: 'Generating export...' });

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`/api/exports/${exportId}/status`, {
          signal: controller.signal,
        });
        
        if (!statusResponse.ok) throw new Error('Failed to check export status');
        
        const { status, progress: exportProgress, downloadUrl: url, error: exportError } = await statusResponse.json();

        if (status === 'COMPLETED' && url) {
          setProgress({ status: 'downloading', progress: 90, message: 'Preparing download...' });
          
          // Trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = options.fileName || `export-${options.type}.${options.format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setDownloadUrl(url);
          setProgress({ status: 'complete', progress: 100, message: 'Export complete!' });
          return;
        }

        if (status === 'FAILED') {
          throw new Error(exportError || 'Export failed');
        }

        setProgress({
          status: 'generating',
          progress: 30 + (exportProgress || 0) * 0.6,
          message: `Generating export... ${exportProgress || 0}%`,
        });

        attempts++;
      }

      throw new Error('Export timed out');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setProgress({ status: 'idle', progress: 0, message: '' });
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      setProgress({ status: 'error', progress: 0, message: error.message });
    }
  }, []);

  const cancel = useCallback(() => {
    abortController?.abort();
    setProgress({ status: 'idle', progress: 0, message: '' });
  }, [abortController]);

  return {
    exportData,
    progress,
    isExporting,
    error,
    cancel,
    downloadUrl,
  };
}

// Quick export utilities
export function downloadAsCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadAsJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default useExport;
