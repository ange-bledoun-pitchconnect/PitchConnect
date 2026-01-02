/**
 * ============================================================================
 * CSV IMPORT MODAL - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade CSV import modal for bulk data operations.
 * Supports multiple entity types with validation and preview.
 * 
 * FEATURES:
 * - Multiple import types (users, clubs, leagues, divisions, teams, players)
 * - Template download functionality
 * - CSV parsing with Papa Parse
 * - Data validation and preview
 * - Progress tracking
 * - Error handling with row-level details
 * - Role-based access control
 * - Dark mode support
 * 
 * @version 2.0.0
 * @path src/components/superadmin/CSVImportModal.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  X,
  Loader2,
  FileText,
  Users,
  Building2,
  Trophy,
  Shield,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type UserRole } from '@/config/user-roles-config';

// =============================================================================
// TYPES
// =============================================================================

export type ImportEntityType =
  | 'USERS'
  | 'CLUBS'
  | 'LEAGUES'
  | 'DIVISIONS'
  | 'TEAMS'
  | 'PLAYERS'
  | 'MATCHES';

export interface ImportEntityConfig {
  type: ImportEntityType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  requiredFields: string[];
  optionalFields: string[];
  templateFilename: string;
  allowedRoles: UserRole[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  row: number;
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: ValidationError[];
}

export interface CSVImportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Entity type to import */
  entityType: ImportEntityType;
  /** Current user's role */
  currentUserRole: UserRole;
  /** Handler for executing the import */
  onImport: (
    entityType: ImportEntityType,
    data: Record<string, string>[]
  ) => Promise<ImportResult[]>;
  /** Template download handler */
  onDownloadTemplate?: (entityType: ImportEntityType) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ENTITY CONFIGURATIONS
// =============================================================================

export const IMPORT_ENTITIES: Record<ImportEntityType, ImportEntityConfig> = {
  USERS: {
    type: 'USERS',
    label: 'Users',
    description: 'Import user accounts with profile information.',
    icon: Users,
    color: 'bg-blue-500',
    requiredFields: ['email', 'firstName', 'lastName'],
    optionalFields: ['phone', 'dateOfBirth', 'role', 'password'],
    templateFilename: 'users_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN'],
  },
  CLUBS: {
    type: 'CLUBS',
    label: 'Clubs',
    description: 'Import club/organization data.',
    icon: Building2,
    color: 'bg-green-500',
    requiredFields: ['name', 'sport'],
    optionalFields: ['shortName', 'website', 'email', 'phone', 'address', 'city', 'country'],
    templateFilename: 'clubs_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
  },
  LEAGUES: {
    type: 'LEAGUES',
    label: 'Leagues',
    description: 'Import league/competition data.',
    icon: Trophy,
    color: 'bg-yellow-500',
    requiredFields: ['name', 'sport', 'season'],
    optionalFields: ['shortName', 'startDate', 'endDate', 'description'],
    templateFilename: 'leagues_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
  },
  DIVISIONS: {
    type: 'DIVISIONS',
    label: 'Divisions',
    description: 'Import division/tier data for leagues.',
    icon: Layers,
    color: 'bg-purple-500',
    requiredFields: ['name', 'leagueId'],
    optionalFields: ['level', 'description', 'maxTeams'],
    templateFilename: 'divisions_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
  },
  TEAMS: {
    type: 'TEAMS',
    label: 'Teams',
    description: 'Import team data with club associations.',
    icon: Shield,
    color: 'bg-teal-500',
    requiredFields: ['name', 'clubId'],
    optionalFields: ['shortName', 'sport', 'ageGroup', 'gender', 'divisionId'],
    templateFilename: 'teams_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'CLUB_MANAGER'],
  },
  PLAYERS: {
    type: 'PLAYERS',
    label: 'Players',
    description: 'Import player profiles with team assignments.',
    icon: Users,
    color: 'bg-indigo-500',
    requiredFields: ['email', 'firstName', 'lastName', 'teamId'],
    optionalFields: ['position', 'jerseyNumber', 'dateOfBirth', 'height', 'weight'],
    templateFilename: 'players_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'CLUB_MANAGER', 'MANAGER'],
  },
  MATCHES: {
    type: 'MATCHES',
    label: 'Matches',
    description: 'Import match/fixture data.',
    icon: Trophy,
    color: 'bg-orange-500',
    requiredFields: ['homeTeamId', 'awayTeamId', 'date'],
    optionalFields: ['time', 'venue', 'divisionId', 'leagueId', 'round'],
    templateFilename: 'matches_template.csv',
    allowedRoles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function validateRow(
  row: Record<string, string>,
  rowNumber: number,
  config: ImportEntityConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check required fields
  config.requiredFields.forEach(field => {
    if (!row[field] || row[field].trim() === '') {
      errors.push({
        row: rowNumber,
        field,
        message: `${field} is required`,
      });
    }
  });
  
  // Email validation
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      message: 'Invalid email format',
    });
  }
  
  // Date validation
  ['dateOfBirth', 'startDate', 'endDate', 'date'].forEach(field => {
    if (row[field] && isNaN(Date.parse(row[field]))) {
      errors.push({
        row: rowNumber,
        field,
        message: 'Invalid date format (use YYYY-MM-DD)',
      });
    }
  });
  
  // Number validation
  ['jerseyNumber', 'height', 'weight', 'maxTeams', 'level'].forEach(field => {
    if (row[field] && isNaN(Number(row[field]))) {
      errors.push({
        row: rowNumber,
        field,
        message: 'Must be a number',
      });
    }
  });
  
  return errors;
}

function generateTemplate(config: ImportEntityConfig): string {
  const headers = [...config.requiredFields, ...config.optionalFields];
  return headers.join(',') + '\n';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CSVImportModal({
  isOpen,
  onClose,
  entityType,
  currentUserRole,
  onImport,
  onDownloadTemplate,
  className,
}: CSVImportModalProps) {
  const config = IMPORT_ENTITIES[entityType];
  const Icon = config.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  
  // Check role authorization
  const isAuthorized = config.allowedRoles.includes(currentUserRole);
  
  // Calculate stats
  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  // Reset state
  const handleClose = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsedRows([]);
    setProgress(0);
    setResults([]);
    onClose();
  }, [onClose]);
  
  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = (results.data as Record<string, string>[]).map((row, index) => {
          const errors = validateRow(row, index + 1, config);
          return {
            rowNumber: index + 1,
            data: row,
            isValid: errors.length === 0,
            errors,
          };
        });
        
        setParsedRows(rows);
        setStep('preview');
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        alert('Failed to parse CSV file. Please check the format.');
      },
    });
  }, [config]);
  
  // Handle template download
  const handleDownloadTemplate = useCallback(() => {
    if (onDownloadTemplate) {
      onDownloadTemplate(entityType);
      return;
    }
    
    // Generate and download template
    const template = generateTemplate(config);
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config.templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, entityType, onDownloadTemplate]);
  
  // Handle import
  const handleImport = async () => {
    if (validRows.length === 0) return;
    
    setStep('importing');
    setProgress(0);
    
    try {
      const dataToImport = validRows.map(r => r.data);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);
      
      const importResults = await onImport(entityType, dataToImport);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(importResults);
      setStep('results');
    } catch (error) {
      console.error('Import failed:', error);
      setResults(validRows.map((_, i) => ({
        row: i + 1,
        success: false,
        error: 'Import failed',
      })));
      setStep('results');
    }
  };
  
  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  if (!isAuthorized) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Unauthorized
            </DialogTitle>
            <DialogDescription>
              You do not have permission to import {config.label.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn('sm:max-w-2xl', className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg text-white', config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Import {config.label}</DialogTitle>
              <DialogDescription className="mt-1">
                {config.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            <div className="py-4 space-y-4">
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gold-400 dark:hover:border-gold-500 transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse
                </p>
              </div>
              
              {/* Required Fields */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-charcoal-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.requiredFields.map(field => (
                    <Badge key={field} variant="destructive" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
                {config.optionalFields.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 mb-2">
                      Optional Fields:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {config.optionalFields.map(field => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Template Download */}
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
        
        {/* Step: Preview */}
        {step === 'preview' && (
          <>
            <div className="py-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-charcoal-800 text-center">
                  <FileSpreadsheet className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {parsedRows.length}
                  </p>
                  <p className="text-xs text-gray-500">Total Rows</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {validRows.length}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Valid</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                  <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">
                    {invalidRows.length}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">Invalid</p>
                </div>
              </div>
              
              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Row</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        {config.requiredFields.slice(0, 3).map(field => (
                          <TableHead key={field}>{field}</TableHead>
                        ))}
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 10).map(row => (
                        <TableRow key={row.rowNumber}>
                          <TableCell className="font-mono text-xs">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          {config.requiredFields.slice(0, 3).map(field => (
                            <TableCell key={field} className="max-w-[150px] truncate text-xs">
                              {row.data[field] || '-'}
                            </TableCell>
                          ))}
                          <TableCell>
                            {row.errors.length > 0 && (
                              <span className="text-xs text-red-500">
                                {row.errors.map(e => e.message).join(', ')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedRows.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-charcoal-800 text-xs text-gray-500">
                    Showing first 10 of {parsedRows.length} rows
                  </div>
                )}
              </div>
              
              {/* Validation Errors */}
              {invalidRows.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {invalidRows.length} rows have validation errors
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Invalid rows will be skipped during import.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className={config.color}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {validRows.length} {config.label}
              </Button>
            </DialogFooter>
          </>
        )}
        
        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-8 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-gold-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Importing {config.label}...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please wait while we import your data.
            </p>
            <div className="w-full max-w-xs">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500 mt-1">{progress}%</p>
            </div>
          </div>
        )}
        
        {/* Step: Results */}
        {step === 'results' && (
          <>
            <div className="py-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-center">
                  <Check className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {successCount}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Successfully Imported
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-center">
                  <X className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {failureCount}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                </div>
              </div>
              
              {/* Detailed Results */}
              {failureCount > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    Failed Imports:
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {results.filter(r => !r.success).map((result, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-700 dark:text-red-300">
                          Row {result.row}:
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          {result.error || 'Unknown error'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CSVImportModal;