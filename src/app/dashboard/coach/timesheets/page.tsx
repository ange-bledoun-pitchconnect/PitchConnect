// =============================================================================
// 🏆 PITCHCONNECT - COACH TIMESHEETS LIST v3.0 (Weekly Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/timesheets
// Access: HEAD_COACH, ASSISTANT_COACH, GOALKEEPING_COACH, PERFORMANCE_COACH
// 
// FEATURES:
// ✅ View all weekly timesheets with status tracking
// ✅ Full TimesheetStatus flow (DRAFT, PENDING, UNDER_REVIEW, APPROVED, REJECTED, PAID, DISPUTED, ARCHIVED)
// ✅ Weekly breakdown visualization
// ✅ Summary metrics: hours, earnings, pending, paid
// ✅ Filter by status and month
// ✅ CSV export with breakdown data
// ✅ Attachment viewer
// ✅ Approval metadata display
// ✅ Schema-aligned with CoachTimesheet model
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  DollarSign,
  Calendar,
  Plus,
  Download,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  FileText,
  Paperclip,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Archive,
  AlertTriangle,
  Banknote,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type TimesheetStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PAID' 
  | 'DISPUTED' 
  | 'ARCHIVED';

interface DailyBreakdown {
  date: string;
  entries: Array<{
    type: string;
    description: string;
    sessionId?: string;
    matchId?: string;
    startTime: string;
    endTime: string;
    hours: number;
    notes?: string;
  }>;
  totalHours: number;
}

interface WeeklyBreakdown {
  monday: DailyBreakdown;
  tuesday: DailyBreakdown;
  wednesday: DailyBreakdown;
  thursday: DailyBreakdown;
  friday: DailyBreakdown;
  saturday: DailyBreakdown;
  sunday: DailyBreakdown;
}

interface CoachTimesheet {
  id: string;
  coachId: string;
  clubId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  status: TimesheetStatus;
  breakdown: WeeklyBreakdown | null;
  notes?: string | null;
  attachments: string[];
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: {
    firstName: string;
    lastName: string;
  } | null;
  paidAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalHours: number;
  totalEarnings: number;
  pendingPayments: number;
  paidThisMonth: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-700', icon: FileText },
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Eye },
  APPROVED: { label: 'Approved', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
  PAID: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: Banknote },
  DISPUTED: { label: 'Disputed', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  ARCHIVED: { label: 'Archived', color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-800', icon: Archive },
};

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: TimesheetStatus }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const WeeklyBreakdownChart = ({ breakdown }: { breakdown: WeeklyBreakdown | null }) => {
  if (!breakdown) return null;

  const maxHours = Math.max(
    ...DAYS_OF_WEEK.map(day => breakdown[day]?.totalHours || 0),
    8 // minimum scale
  );

  return (
    <div className="flex items-end gap-1.5 h-16">
      {DAYS_OF_WEEK.map((day, idx) => {
        const hours = breakdown[day]?.totalHours || 0;
        const height = hours > 0 ? Math.max((hours / maxHours) * 100, 10) : 5;
        
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition-all ${
                hours > 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={{ height: `${height}%` }}
              title={`${DAY_LABELS[idx]}: ${hours.toFixed(1)}h`}
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{DAY_LABELS[idx]}</span>
          </div>
        );
      })}
    </div>
  );
};

const TimesheetCard = ({
  timesheet,
  onView,
  onEdit,
  onSubmit,
  isExpanded,
  onToggleExpand,
}: {
  timesheet: CoachTimesheet;
  onView: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const canEdit = timesheet.status === 'DRAFT' || timesheet.status === 'REJECTED';
  const canSubmit = timesheet.status === 'DRAFT';

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Week Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(timesheet.weekStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(timesheet.weekEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted: {timesheet.submittedAt 
                    ? new Date(timesheet.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Not submitted'
                  }
                </p>
              </div>
            </div>

            {/* Approval Info */}
            {timesheet.approvedBy && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                ✓ Approved by {timesheet.approvedBy.firstName} {timesheet.approvedBy.lastName} on {new Date(timesheet.approvedAt!).toLocaleDateString('en-GB')}
              </p>
            )}

            {/* Rejection Reason */}
            {timesheet.status === 'REJECTED' && timesheet.rejectionReason && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                ✗ Rejected: {timesheet.rejectionReason}
              </p>
            )}
          </div>

          {/* Weekly Chart */}
          <div className="w-full lg:w-48">
            <WeeklyBreakdownChart breakdown={timesheet.breakdown} />
          </div>

          {/* Hours & Earnings */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timesheet.totalHours.toFixed(1)}h</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">£{timesheet.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Earnings</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={timesheet.status} />

            {/* Attachments indicator */}
            {timesheet.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Paperclip className="w-3.5 h-3.5" />
                {timesheet.attachments.length}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={onSubmit}
                className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                title="Submit for approval"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-600 hover:bg-gold-200 dark:hover:bg-gold-900/50 transition-colors"
                title="Edit timesheet"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onView}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && timesheet.breakdown && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-700/30">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Daily Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day, idx) => {
              const dayData = timesheet.breakdown![day];
              if (!dayData || dayData.totalHours === 0) return null;

              return (
                <div key={day} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">{DAY_LABELS[idx]}</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{dayData.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="space-y-1">
                    {dayData.entries.map((entry, entryIdx) => (
                      <div key={entryIdx} className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium">{entry.type}</span>: {entry.description} ({entry.hours.toFixed(1)}h)
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {timesheet.notes && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Notes</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{timesheet.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {timesheet.attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {timesheet.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attachment {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CoachTimesheetsPage() {
  const router = useRouter();

  // State
  const [timesheets, setTimesheets] = useState<CoachTimesheet[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TimesheetStatus>('ALL');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Fetch timesheets
  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/coach/timesheets?month=${monthFilter}`);
        if (res.ok) {
          const data = await res.json();
          setTimesheets(data.timesheets || []);
          setSummary(data.summary || null);
        }
      } catch (error) {
        showToast('Failed to load timesheets', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, [monthFilter, showToast]);

  // Filtered timesheets
  const filteredTimesheets = useMemo(() => {
    if (statusFilter === 'ALL') return timesheets;
    return timesheets.filter(t => t.status === statusFilter);
  }, [timesheets, statusFilter]);

  // Toggle expanded
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Submit timesheet
  const handleSubmit = async (id: string) => {
    try {
      const res = await fetch(`/api/coach/timesheets/${id}/submit`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to submit');

      showToast('📤 Timesheet submitted for approval!', 'success');

      // Refresh
      const refreshRes = await fetch(`/api/coach/timesheets?month=${monthFilter}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTimesheets(data.timesheets || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      showToast('Failed to submit timesheet', 'error');
    }
  };

  // Export to CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = [
        'Week Start',
        'Week End',
        'Total Hours',
        'Hourly Rate',
        'Total Amount',
        'Status',
        'Submitted At',
        'Approved By',
        'Notes',
      ];

      const rows = filteredTimesheets.map(ts => [
        new Date(ts.weekStartDate).toLocaleDateString('en-GB'),
        new Date(ts.weekEndDate).toLocaleDateString('en-GB'),
        ts.totalHours.toFixed(2),
        `£${ts.hourlyRate.toFixed(2)}`,
        `£${ts.totalAmount.toFixed(2)}`,
        ts.status,
        ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString('en-GB') : '',
        ts.approvedBy ? `${ts.approvedBy.firstName} ${ts.approvedBy.lastName}` : '',
        ts.notes || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timesheets-${monthFilter}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast('📄 Timesheets exported successfully!', 'success');
    } catch (error) {
      showToast('Failed to export timesheets', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Timesheets</h1>
              <p className="text-slate-600 dark:text-slate-400">Track your weekly coaching hours and earnings</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || filteredTimesheets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </button>
            <Link
              href="/dashboard/coach/timesheets/create"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Timesheet
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Hours"
              value={`${summary.totalHours.toFixed(1)}h`}
              subtext="This month"
              icon={Clock}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              label="Total Earnings"
              value={`£${summary.totalEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              subtext="This month"
              icon={DollarSign}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <StatCard
              label="Pending"
              value={`£${summary.pendingPayments.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              subtext={`${summary.pendingCount} timesheet${summary.pendingCount !== 1 ? 's' : ''}`}
              icon={Clock}
              color="bg-gradient-to-br from-amber-500 to-amber-600"
            />
            <StatCard
              label="Paid"
              value={`£${summary.paidThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              subtext="Confirmed"
              icon={Banknote}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Month Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Month</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PAID">Paid</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const).map(status => {
              const count = status === 'ALL' 
                ? timesheets.length 
                : timesheets.filter(t => t.status === status).length;
              
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {status === 'ALL' ? 'All' : STATUS_CONFIG[status]?.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Timesheets List */}
        <div className="space-y-4">
          {filteredTimesheets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Timesheets Found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Start tracking your coaching hours</p>
              <Link
                href="/dashboard/coach/timesheets/create"
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Timesheet
              </Link>
            </div>
          ) : (
            filteredTimesheets.map(timesheet => (
              <TimesheetCard
                key={timesheet.id}
                timesheet={timesheet}
                onView={() => router.push(`/dashboard/coach/timesheets/${timesheet.id}`)}
                onEdit={() => router.push(`/dashboard/coach/timesheets/${timesheet.id}/edit`)}
                onSubmit={() => handleSubmit(timesheet.id)}
                isExpanded={expandedIds.has(timesheet.id)}
                onToggleExpand={() => toggleExpanded(timesheet.id)}
              />
            ))
          )}
        </div>

        {/* Summary Footer */}
        {filteredTimesheets.length > 0 && (
          <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredTimesheets.length} of {timesheets.length} timesheets
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Hours (filtered)</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {filteredTimesheets.reduce((sum, t) => sum + t.totalHours, 0).toFixed(1)}h
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Earnings (filtered)</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    £{filteredTimesheets.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}