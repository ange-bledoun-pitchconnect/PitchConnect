'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  UserX, 
  UserCheck, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  Users,
  RefreshCw
} from 'lucide-react';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: string[];
  onSuccess: () => void;
}

type BulkAction = 'SUSPEND' | 'ACTIVATE' | 'DELETE' | null;

export default function BulkOperationsModal({
  isOpen,
  onClose,
  selectedUsers,
  onSuccess,
}: BulkOperationsModalProps) {
  const [action, setAction] = useState<BulkAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleBulkOperation = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    // Confirmation check for DELETE
    if (action === 'DELETE' && confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm deletion');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);

      const operationMap = {
        SUSPEND: 'BULK_SUSPEND',
        ACTIVATE: 'BULK_ACTIVATE',
        DELETE: 'BULK_DELETE',
      };

      const response = await fetch('/api/superadmin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: operationMap[action],
          data: {
            userIds: selectedUsers,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk operation failed');
      }

      setResult(data.result);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setError(null);
    setResult(null);
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-orange-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">Bulk Operations</h2>
              <p className="text-sm text-charcoal-600">
                Perform actions on {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-charcoal-400 hover:text-charcoal-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selected Users Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-charcoal-900">
                  {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''} Selected
                </p>
                <p className="text-sm text-charcoal-600">
                  Choose an action to perform on all selected users
                </p>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-700 mb-3">
              Select Action
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Suspend */}
              <button
                onClick={() => setAction('SUSPEND')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  action === 'SUSPEND'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      action === 'SUSPEND'
                        ? 'bg-orange-500'
                        : 'bg-neutral-100'
                    }`}
                  >
                    <UserX
                      className={`w-5 h-5 ${
                        action === 'SUSPEND' ? 'text-white' : 'text-neutral-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-bold ${
                        action === 'SUSPEND' ? 'text-orange-600' : 'text-charcoal-900'
                      }`}
                    >
                      Suspend
                    </p>
                  </div>
                </div>
                <p className="text-xs text-charcoal-500">
                  Temporarily disable user accounts
                </p>
              </button>

              {/* Activate */}
              <button
                onClick={() => setAction('ACTIVATE')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  action === 'ACTIVATE'
                    ? 'border-green-500 bg-green-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      action === 'ACTIVATE'
                        ? 'bg-green-500'
                        : 'bg-neutral-100'
                    }`}
                  >
                    <UserCheck
                      className={`w-5 h-5 ${
                        action === 'ACTIVATE' ? 'text-white' : 'text-neutral-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-bold ${
                        action === 'ACTIVATE' ? 'text-green-600' : 'text-charcoal-900'
                      }`}
                    >
                      Activate
                    </p>
                  </div>
                </div>
                <p className="text-xs text-charcoal-500">
                  Enable suspended user accounts
                </p>
              </button>

              {/* Delete */}
              <button
                onClick={() => setAction('DELETE')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  action === 'DELETE'
                    ? 'border-red-500 bg-red-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      action === 'DELETE'
                        ? 'bg-red-500'
                        : 'bg-neutral-100'
                    }`}
                  >
                    <Trash2
                      className={`w-5 h-5 ${
                        action === 'DELETE' ? 'text-white' : 'text-neutral-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-bold ${
                        action === 'DELETE' ? 'text-red-600' : 'text-charcoal-900'
                      }`}
                    >
                      Delete
                    </p>
                  </div>
                </div>
                <p className="text-xs text-charcoal-500">
                  Permanently delete user accounts
                </p>
              </button>
            </div>
          </div>

          {/* DELETE Confirmation */}
          {action === 'DELETE' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">⚠️ Permanent Action</p>
                  <p className="text-sm text-red-700 mb-3">
                    This will permanently delete {selectedUsers.length} user account
                    {selectedUsers.length !== 1 ? 's' : ''} and all associated data. This
                    action cannot be undone!
                  </p>
                  <label className="block text-sm font-semibold text-red-900 mb-2">
                    Type <code className="bg-red-100 px-2 py-1 rounded">DELETE</code> to
                    confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Operation Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">Operation Successful!</p>
                  <p className="text-sm text-green-700">
                    {action === 'SUSPEND' && `${result.updated} users suspended`}
                    {action === 'ACTIVATE' && `${result.updated} users activated`}
                    {action === 'DELETE' && `${result.deleted} users deleted`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleBulkOperation}
              disabled={
                !action ||
                isProcessing ||
                (action === 'DELETE' && confirmText !== 'DELETE')
              }
              className={
                action === 'DELETE'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : action === 'SUSPEND'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'SUSPEND' && (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Suspend Users
                    </>
                  )}
                  {action === 'ACTIVATE' && (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate Users
                    </>
                  )}
                  {action === 'DELETE' && (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Users
                    </>
                  )}
                  {!action && 'Select Action'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
