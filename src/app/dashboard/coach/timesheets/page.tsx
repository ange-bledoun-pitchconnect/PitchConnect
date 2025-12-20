'use client';

/**
 * PitchConnect Coach Timesheets Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/coach/timesheets/page.tsx
 * 
 * Features:
 * ✅ View all coach timesheets with summary metrics
 * ✅ Filter by status (Pending, Approved, Paid, Rejected)
 * ✅ Month-based filtering for chronological organization
 * ✅ Summary cards: total hours, earnings, pending, paid
 * ✅ Detailed timesheet list with session/manual entry info
 * ✅ Status badges with visual indicators
 * ✅ Approval metadata (approver, approval date)
 * ✅ CSV export functionality
 * ✅ Empty state with call-to-action
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Loading states
 * ✅ Schema-aligned data models
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Loader2,
  Filter,
  TrendingUp,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Timesheet {
  id: string;
  date: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  session: {
    id: string;
    focus: string;
    team: {
      name: string;
    };
  } | null;
  description: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface Summary {
  totalHours: number;
  totalEarnings: number;
  pendingPayments: number;
  paidThisMonth: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// TOAST COMPONENT (No External Dependency)
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
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
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
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    PENDING: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-900/50',
      text: 'text-orange-700 dark:text-orange-400',
      icon: <AlertCircle className="h-3 w-3" />,
      label: 'Pending',
    },
    APPROVED: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-900/50',
      text: 'text-blue-700 dark:text-blue-400',
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Approved',
    },
    REJECTED: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-900/50',
      text: 'text-red-700 dark:text-red-400',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Rejected',
    },
    PAID: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-900/50',
      text: 'text-green-700 dark:text-green-400',
      icon: <CheckCircle className="h-3 w-3" />,
      label: 'Paid',
    },
  };

  const style = styles[status as keyof typeof styles] || styles.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${style.bg} ${style.border} ${style.text}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

// ============================================================================
// SUMMARY CARD COMPONENT
// ============================================================================

const SummaryCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange';
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-charcoal-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-500">
            {subtext}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CoachTimesheetsPage() {
  const router = useRouter();

  // State Management
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchTimesheets();
  }, [monthFilter]);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, timesheets]);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/coach/timesheets?month=${monthFilter}`);
      if (!response.ok) throw new Error('Failed to fetch timesheets');

      const data = await response.json();
      setTimesheets(data.timesheets || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      showToast('Failed to load timesheets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (statusFilter === 'ALL') {
      setFilteredTimesheets(timesheets);
    } else {
      setFilteredTimesheets(timesheets.filter((t) => t.status === statusFilter));
    }
  };

  // ========================================================================
  // EXPORT HANDLER
  // ========================================================================

  const handleExportTimesheets = async () => {
    setIsExporting(true);
    try {
      // Prepare CSV data
      const headers = [
        'Date',
        'Hours',
        'Hourly Rate',
        'Total Amount',
        'Status',
        'Description',
      ];
      const rows = filteredTimesheets.map((ts) => [
        new Date(ts.date).toLocaleDateString('en-GB'),
        ts.hours,
        `£${ts.hourlyRate.toFixed(2)}`,
        `£${ts.totalAmount.toFixed(2)}`,
        ts.status,
        ts.session ? `${ts.session.focus} - ${ts.session.team.name}` : ts.description || '',
      ]);

      // Create CSV string
      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `timesheets-${monthFilter}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('📄 Timesheets exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export timesheets', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-400 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">
                  My Timesheets
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Track hours and earnings
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportTimesheets}
                disabled={isExporting || filteredTimesheets.length === 0}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export
                  </>
                )}
              </button>
              <Link href="/dashboard/coach/timesheets/create">
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-500 px-4 py-2 font-semibold text-white transition-all hover:from-green-700 hover:to-blue-600 dark:from-green-600 dark:to-blue-500 dark:hover:from-green-700 dark:hover:to-blue-600">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Total Hours"
              value={summary.totalHours.toFixed(1)}
              subtext="This month"
              icon={Clock}
              color="blue"
            />
            <SummaryCard
              label="Total Earnings"
              value={`£${summary.totalEarnings.toLocaleString('en-GB', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              subtext="This month"
              icon={DollarSign}
              color="green"
            />
            <SummaryCard
              label="Pending Payment"
              value={`£${summary.pendingPayments.toLocaleString('en-GB', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              subtext="Awaiting approval"
              icon={AlertCircle}
              color="orange"
            />
            <SummaryCard
              label="Paid This Month"
              value={`£${summary.paidThisMonth.toLocaleString('en-GB', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              subtext="Confirmed payments"
              icon={CheckCircle}
              color="green"
            />
          </div>
        )}

        {/* FILTERS */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* MONTH FILTER */}
              <div className="space-y-2">
                <label
                  htmlFor="month"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Month
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
                  <input
                    id="month"
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 pl-10 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                  />
                </div>
              </div>

              {/* STATUS FILTER */}
              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Status
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 pl-10 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TIMESHEETS LIST */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Calendar className="h-5 w-5 text-green-500" />
              Time Entries ({filteredTimesheets.length})
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Your submitted timesheets
            </p>
          </div>

          <div className="p-6">
            {filteredTimesheets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
                  No timesheets found
                </h3>
                <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
                  Start tracking your coaching hours
                </p>
                <Link href="/dashboard/coach/timesheets/create">
                  <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-500 px-4 py-2 font-semibold text-white transition-all hover:from-green-700 hover:to-blue-600">
                    <Plus className="h-4 w-4" />
                    Add Time Entry
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTimesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-700/50"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          {timesheet.session
                            ? `${timesheet.session.focus} - ${timesheet.session.team.name}`
                            : timesheet.description || 'Manual Entry'}
                        </p>
                        <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                          {new Date(timesheet.date).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        {timesheet.approvedBy && (
                          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                            ✓ Approved by {timesheet.approvedBy} on{' '}
                            {new Date(timesheet.approvedAt!).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={timesheet.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-6 border-t border-neutral-200 pt-3 dark:border-charcoal-600 sm:gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {timesheet.hours.toFixed(2)}h
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                          Hours
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          £{timesheet.hourlyRate.toFixed(2)}/hr
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                          Rate
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          £{timesheet.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                          Total
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
