'use client';

/**
 * PitchConnect Injury Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/manager/clubs/[clubId]/teams/[teamId]/injuries/page.tsx
 *
 * Features:
 * ✅ Report new player injuries with comprehensive details
 * ✅ Track injury severity levels with color-coded UI
 * ✅ Monitor injury recovery progress and return dates
 * ✅ View active and recovering injuries separately
 * ✅ Mark injuries as cleared when player returns
 * ✅ Add detailed notes for each injury
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Responsive grid layout
 * ✅ Loading and empty states
 * ✅ Dark mode support
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 * ✅ Player selection dropdown
 * ✅ Injury type and severity dropdowns
 * ✅ Estimated return date tracking
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Stethoscope,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Injury {
  id: string;
  player: {
    firstName: string;
    lastName: string;
  };
  type: string;
  severity: string;
  dateOccurred: string;
  estimatedReturnDate: string;
  status: 'ACTIVE' | 'RECOVERING' | 'CLEARED';
  notes?: string;
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

const INJURY_TYPES = [
  'Hamstring strain',
  'Muscle tear',
  'Ligament injury',
  'Fracture',
  'Concussion',
  'Sprain',
  'Contusion',
  'Inflammation',
  'Dislocation',
  'Bruising',
  'Laceration',
  'Other',
];

const SEVERITY_LEVELS = [
  {
    value: 'MILD',
    label: 'Mild (1-2 weeks)',
    color: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-900/50',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    value: 'MODERATE',
    label: 'Moderate (2-6 weeks)',
    color: 'bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-900/50',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
  {
    value: 'SEVERE',
    label: 'Severe (6+ weeks)',
    color: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-900/50',
    textColor: 'text-red-700 dark:text-red-400',
  },
];

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
// INJURY CARD COMPONENT
// ============================================================================

const InjuryCard = ({
  injury,
  severity,
  onClear,
  isClearing,
}: {
  injury: Injury;
  severity: (typeof SEVERITY_LEVELS)[0];
  onClear: (id: string) => void;
  isClearing: boolean;
}) => {
  const returnDate = injury.estimatedReturnDate
    ? new Date(injury.estimatedReturnDate)
    : null;
  const today = new Date();
  const daysUntilReturn = returnDate
    ? Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={`rounded-lg border p-4 ${severity.color} ${severity.borderColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="mb-1 font-bold text-charcoal-900 dark:text-white">
            {injury.player.firstName} {injury.player.lastName}
          </p>
          <p className={`text-sm font-semibold ${severity.textColor}`}>
            {injury.type}
          </p>
          <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-400">
            Reported: {new Date(injury.dateOccurred).toLocaleDateString('en-GB')}
          </p>

          {returnDate && (
            <div className="mt-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-charcoal-600 dark:text-charcoal-400" />
              <p className={`text-xs font-medium ${severity.textColor}`}>
                Est. return: {returnDate.toLocaleDateString('en-GB')}
                {daysUntilReturn !== null && (
                  <span className="ml-1">
                    ({daysUntilReturn > 0 ? `in ${daysUntilReturn} days` : 'today'})
                  </span>
                )}
              </p>
            </div>
          )}

          {injury.notes && (
            <p className="mt-2 text-xs italic text-charcoal-700 dark:text-charcoal-300">
              {injury.notes}
            </p>
          )}
        </div>

        <button
          onClick={() => onClear(injury.id)}
          disabled={isClearing}
          className="rounded-lg bg-green-100 p-2 text-green-600 transition-all hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
          title="Mark as cleared"
        >
          {isClearing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function InjuryManagementPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State Management
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isClearingId, setIsClearingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [formData, setFormData] = useState({
    playerId: '',
    type: '',
    severity: 'MILD',
    dateOccurred: new Date().toISOString().split('T')[0],
    estimatedReturnDate: '',
    notes: '',
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
      const [injuriesRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/injuries`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (injuriesRes.ok) {
        const data = await injuriesRes.json();
        setInjuries(data || []);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load injury records and players', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId) {
      showToast('Please select a player', 'error');
      return;
    }

    if (!formData.type) {
      showToast('Please select injury type', 'error');
      return;
    }

    try {
      setIsAdding(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/injuries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add injury');
      }

      const newInjury = await response.json();
      setInjuries([newInjury, ...injuries]);
      setFormData({
        playerId: '',
        type: '',
        severity: 'MILD',
        dateOccurred: new Date().toISOString().split('T')[0],
        estimatedReturnDate: '',
        notes: '',
      });
      showToast('Injury recorded successfully!', 'success');
    } catch (error) {
      console.error('Error adding injury:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to add injury',
        'error'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleClearInjury = async (injuryId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to mark this injury as cleared? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsClearingId(injuryId);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/injuries/${injuryId}/clear`,
        { method: 'PATCH' }
      );

      if (!response.ok) throw new Error('Failed to clear injury');

      setInjuries(injuries.filter((i) => i.id !== injuryId));
      showToast('Injury marked as cleared', 'success');
    } catch (error) {
      console.error('Error clearing injury:', error);
      showToast('Failed to clear injury', 'error');
    } finally {
      setIsClearingId(null);
    }
  };

  // ========================================================================
  // COMPUTED STATE
  // ========================================================================

  const activeInjuries = injuries.filter((i) => i.status === 'ACTIVE');
  const recoveringInjuries = injuries.filter((i) => i.status === 'RECOVERING');

  // ========================================================================
  // RENDER - LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 p-4 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-red-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading injury records...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - MAIN PAGE
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-red-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="mb-1 text-3xl font-bold text-charcoal-900 dark:text-white">
                Injury Management
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track player injuries and recovery progress
              </p>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ADD INJURY FORM */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 lg:col-span-1 h-fit">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-white">
                Report Injury
              </h2>
            </div>
            <p className="mb-6 text-sm text-charcoal-600 dark:text-charcoal-400">
              Record a new player injury
            </p>

            <form onSubmit={handleAddInjury} className="space-y-4">
              {/* Player Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Player <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.playerId}
                  onChange={(e) =>
                    setFormData({ ...formData, playerId: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-red-500"
                >
                  <option value="">Select player...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user.firstName} {p.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Injury Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Injury Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-red-500"
                >
                  <option value="">Select type...</option>
                  {INJURY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-red-500"
                >
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Occurred */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Date Occurred
                </label>
                <input
                  type="date"
                  value={formData.dateOccurred}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOccurred: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-red-500"
                />
              </div>

              {/* Estimated Return Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Est. Return Date
                </label>
                <input
                  type="date"
                  value={formData.estimatedReturnDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedReturnDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-red-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional details about the injury..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500 dark:focus:border-red-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAdding}
                className="w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-400 px-4 py-2 font-bold text-white transition-all hover:from-red-600 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 inline h-4 w-4" />
                    Record Injury
                  </>
                )}
              </button>
            </form>
          </div>

          {/* INJURIES LIST */}
          <div className="space-y-6 lg:col-span-2">
            {/* ACTIVE INJURIES */}
            {activeInjuries.length > 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-charcoal-900 dark:text-white">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Active Injuries ({activeInjuries.length})
                  </h3>
                </div>
                <div className="space-y-3 p-6">
                  {activeInjuries.map((injury) => {
                    const severity = SEVERITY_LEVELS.find(
                      (s) => s.value === injury.severity
                    )!;
                    return (
                      <InjuryCard
                        key={injury.id}
                        injury={injury}
                        severity={severity}
                        onClear={handleClearInjury}
                        isClearing={isClearingId === injury.id}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECOVERING INJURIES */}
            {recoveringInjuries.length > 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-charcoal-900 dark:text-white">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                    Recovering ({recoveringInjuries.length})
                  </h3>
                </div>
                <div className="space-y-3 p-6">
                  {recoveringInjuries.map((injury) => {
                    const severity = SEVERITY_LEVELS.find(
                      (s) => s.value === injury.severity
                    )!;
                    return (
                      <InjuryCard
                        key={injury.id}
                        injury={injury}
                        severity={severity}
                        onClear={handleClearInjury}
                        isClearing={isClearingId === injury.id}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {injuries.length === 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white text-center shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
                <div className="px-6 py-16">
                  <Stethoscope className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    No injury records. Hopefully everyone stays healthy! ⚽
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
