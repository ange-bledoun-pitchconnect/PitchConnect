'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportType = 'USERS' | 'CLUBS' | 'LEAGUES' | 'DIVISIONS';

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [importType, setImportType] = useState<ImportType>('USERS');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);

      // Read CSV file
      const text = await file.text();
      const parsedData = parseCSV(text);

      // Determine operation based on import type
      const operationMap = {
        USERS: 'IMPORT_USERS',
        CLUBS: 'IMPORT_CLUBS',
        LEAGUES: 'IMPORT_LEAGUES',
        DIVISIONS: 'IMPORT_DIVISIONS',
      };

      const dataKey = {
        USERS: 'users',
        CLUBS: 'clubs',
        LEAGUES: 'leagues',
        DIVISIONS: 'divisions',
      };

      // Call API
      const response = await fetch('/api/superadmin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: operationMap[importType],
          data: {
            [dataKey[importType]]: parsedData,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.result);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      USERS: 'email,firstName,lastName,phoneNumber,dateOfBirth,roles,password\njohn.doe@email.com,John,Doe,07123456789,1995-03-15,PLAYER,SecurePass123!',
      CLUBS: 'name,description,location,contactEmail,contactPhone,managerId\nArsenal Youth,Youth academy,London,info@arsenal.com,02012345678,user_id_here',
      LEAGUES: 'name,description,sport,season,adminId\nPremier League,Top tier,Football,2025,user_id_here',
      DIVISIONS: 'name,leagueId,level,maxTeams\nDivision 1,league_id_here,1,20',
    };

    const csvContent = templates[importType];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType.toLowerCase()}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-gold-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">CSV Import</h2>
              <p className="text-sm text-charcoal-600">Bulk import users, clubs, leagues, or divisions</p>
            </div>
            <button
              onClick={onClose}
              className="text-charcoal-400 hover:text-charcoal-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Import Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-700 mb-3">
              Select Import Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['USERS', 'CLUBS', 'LEAGUES', 'DIVISIONS'] as ImportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setImportType(type)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    importType === type
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        importType === type
                          ? 'bg-gradient-to-br from-gold-500 to-orange-400'
                          : 'bg-neutral-100'
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 ${
                          importType === type ? 'text-white' : 'text-neutral-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-bold ${
                          importType === type ? 'text-gold-600' : 'text-charcoal-900'
                        }`}
                      >
                        {type}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        {type === 'USERS' && 'Players, Coaches, Managers'}
                        {type === 'CLUBS' && 'Football clubs/teams'}
                        {type === 'LEAGUES' && 'League structures'}
                        {type === 'DIVISIONS' && 'League divisions'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-charcoal-900 mb-1">
                  Need a template?
                </p>
                <p className="text-sm text-charcoal-600 mb-3">
                  Download a CSV template with the correct format for {importType.toLowerCase()}
                </p>
                <Button
                  onClick={downloadTemplate}
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-700 mb-3">
              Upload CSV File
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file
                  ? 'border-green-300 bg-green-50'
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    file
                      ? 'bg-green-100'
                      : 'bg-neutral-100'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 ${
                      file ? 'text-green-600' : 'text-neutral-400'
                    }`}
                  />
                </div>
                {file ? (
                  <>
                    <p className="font-bold text-green-600 mb-1">{file.name}</p>
                    <p className="text-sm text-charcoal-600">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-charcoal-900 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-charcoal-600">
                      CSV files only
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Import Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">Import Successful!</p>
                  <p className="text-sm text-green-700">
                    {result.created} {importType.toLowerCase()} imported successfully
                    {result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                </div>
              </div>

              {/* Failed Items */}
              {result.failed > 0 && result.failedUsers && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">
                    Failed Imports ({result.failedUsers.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.failedUsers.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="text-xs text-yellow-800">
                        <span className="font-semibold">
                          {item.data.email || item.data.name}:
                        </span>{' '}
                        {item.reason}
                      </div>
                    ))}
                    {result.failedUsers.length > 5 && (
                      <p className="text-xs text-yellow-700 italic">
                        And {result.failedUsers.length - 5} more...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Success Summary */}
              {result.created > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-charcoal-600">Successfully Created</p>
                    <p className="text-lg font-bold text-green-600">{result.created}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-charcoal-600">Failed</p>
                    <p className="text-lg font-bold text-red-600">{result.failed}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {importType}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
