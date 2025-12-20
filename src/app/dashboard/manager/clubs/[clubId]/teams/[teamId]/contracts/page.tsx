'use client';

/**
 * PitchConnect Contract Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/contracts/page.tsx
 *
 * Features:
 * ✅ Add new player contracts with all details
 * ✅ View all contracts in list format
 * ✅ Delete contracts with confirmation
 * ✅ Contract expiration alerts (30-day warning)
 * ✅ Salary tracking and display
 * ✅ Contract type selection (Professional/Semi-Pro/Youth)
 * ✅ Date range management
 * ✅ Player selection dropdown
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Loading and error states
 * ✅ Empty state handling
 * ✅ Dark mode support
 * ✅ Responsive grid layout
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Trash2,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Contract {
  id: string;
  player: {
    firstName: string;
    lastName: string;
  };
  startDate: string;
  endDate: string;
  salary: number;
  position: string;
  contractType: string;
  status: string;
}

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTRACT_TYPES = ['PROFESSIONAL', 'SEMI_PRO', 'YOUTH'];

// ============================================================================
// TOAST COMPONENT
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// CONTRACT CARD COMPONENT
// ============================================================================

const ContractCard = ({
  contract,
  isExpiring,
  onDelete,
}: {
  contract: Contract;
  isExpiring: boolean;
  onDelete: (id: string) => void;
}) => {
  const endDate = new Date(contract.endDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-800 ${
        isExpiring ? 'border-l-4 border-l-amber-500' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-3 text-lg font-bold text-charcoal-900 dark:text-white">
            {contract.player.firstName} {contract.player.lastName}
          </h3>

          <div className="mb-3 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
              <DollarSign className="h-4 w-4" />
              <span>£{contract.salary.toLocaleString()}/year</span>
            </div>
            <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
              <Calendar className="h-4 w-4" />
              <span>{new Date(contract.startDate).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {contract.contractType.replace(/_/g, ' ')}
            </span>
            {isExpiring && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Expires in {daysUntilExpiry} days
              </span>
            )}
          </div>

          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Expires: {endDate.toLocaleDateString('en-GB')}
          </p>
        </div>

        <button
          onClick={() => onDelete(contract.id)}
          className="rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          title="Delete contract"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ContractManagementPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [formData, setFormData] = useState({
    playerId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    salary: '',
    position: '',
    contractType: 'PROFESSIONAL',
  });

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchData();
  }, [clubId, teamId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [contractsRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/contracts`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data || []);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load contracts and players', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId || !formData.salary) {
      showToast('Please select a player and enter a salary', 'error');
      return;
    }

    try {
      setIsAdding(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/contracts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salary: parseInt(formData.salary),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add contract');
      }

      const newContract = await response.json();
      setContracts([newContract, ...contracts]);
      setFormData({
        playerId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        salary: '',
        position: '',
        contractType: 'PROFESSIONAL',
      });
      showToast('Contract added successfully!', 'success');
    } catch (error) {
      console.error('Error adding contract:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to add contract',
        'error'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this contract? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsDeletingId(contractId);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/contracts/${contractId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete contract');

      setContracts(contracts.filter((c) => c.id !== contractId));
      showToast('Contract deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting contract:', error);
      showToast('Failed to delete contract', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  // ========================================================================
  // UTILITIES
  // ========================================================================

  const expiringContracts = contracts.filter((c) => {
    const endDate = new Date(c.endDate);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return endDate <= thirtyDaysFromNow && endDate > new Date();
  });

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-emerald-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading contracts...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-emerald-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                Contract Management
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track and manage all player contracts
              </p>
            </div>
          </div>
        </div>

        {/* EXPIRING CONTRACTS ALERT */}
        {expiringContracts.length > 0 && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <h3 className="mb-2 font-bold text-amber-900 dark:text-amber-200">
                  {expiringContracts.length} Contract(s) Expiring Within 30 Days
                </h3>
                <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  {expiringContracts.map((c) => (
                    <p key={c.id}>
                      • {c.player.firstName} {c.player.lastName} - Expires{' '}
                      {new Date(c.endDate).toLocaleDateString('en-GB')}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ADD CONTRACT FORM */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 lg:col-span-1">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                Add Contract
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Register a new player contract
              </p>
            </div>

            <form onSubmit={handleAddContract} className="space-y-4 p-6">
              {/* Player */}
              <div className="space-y-2">
                <label
                  htmlFor="playerId"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Player <span className="text-red-500">*</span>
                </label>
                <select
                  id="playerId"
                  value={formData.playerId}
                  onChange={(e) =>
                    setFormData({ ...formData, playerId: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-green-500"
                >
                  <option value="">Select a player...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user.firstName} {p.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Type */}
              <div className="space-y-2">
                <label
                  htmlFor="contractType"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Contract Type
                </label>
                <select
                  id="contractType"
                  value={formData.contractType}
                  onChange={(e) =>
                    setFormData({ ...formData, contractType: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-green-500"
                >
                  {CONTRACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <label
                  htmlFor="salary"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Annual Salary (£) <span className="text-red-500">*</span>
                </label>
                <input
                  id="salary"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="e.g., 50000"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-green-500"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-green-500"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label
                  htmlFor="endDate"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding || !formData.playerId || !formData.salary}
                className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 inline-block h-4 w-4" />
                    Add Contract
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CONTRACTS LIST */}
          <div className="space-y-4 lg:col-span-2">
            {contracts.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <FileText className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-lg font-semibold text-charcoal-900 dark:text-white">
                  No contracts registered
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Add your first contract using the form on the left
                </p>
              </div>
            ) : (
              contracts.map((contract) => {
                const isExpiring =
                  new Date(contract.endDate) <
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <div key={contract.id} className="relative">
                    {isDeletingId === contract.id && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 z-10">
                        <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-charcoal-800">
                          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        </div>
                      </div>
                    )}
                    <ContractCard
                      contract={contract}
                      isExpiring={isExpiring}
                      onDelete={handleDeleteContract}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
