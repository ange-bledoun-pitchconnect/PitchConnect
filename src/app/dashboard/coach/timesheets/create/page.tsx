'use client';

/**
 * PitchConnect Coach Timesheet Create Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/coach/timesheets/create/page.tsx
 * 
 * Features:
 * ✅ Two entry modes: Session-linked or Manual entry
 * ✅ Load completed training sessions from API
 * ✅ Auto-populate hours from selected session
 * ✅ Manual entry with custom description
 * ✅ Date selection (max: today)
 * ✅ Dynamic hourly rate from coach profile
 * ✅ Real-time earnings calculation
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Loading states and error handling
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Comprehensive validation
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Loader2,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  focus: string;
  team: {
    name: string;
  };
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
// ENTRY TYPE SELECTOR
// ============================================================================

const EntryTypeSelector = ({
  isManual,
  onTypeChange,
}: {
  isManual: boolean;
  onTypeChange: (manual: boolean) => void;
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onTypeChange(false)}
        className={`rounded-xl border-2 p-4 transition-all ${
          !isManual
            ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
            : 'border-neutral-200 hover:border-neutral-300 dark:border-charcoal-700 dark:hover:border-charcoal-600'
        }`}
      >
        <Calendar className={`mx-auto mb-2 h-8 w-8 ${!isManual ? 'text-green-600 dark:text-green-400' : 'text-charcoal-400 dark:text-charcoal-500'}`} />
        <p className="text-sm font-semibold text-charcoal-900 dark:text-white">From Session</p>
        <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-400">
          Link to training session
        </p>
      </button>

      <button
        type="button"
        onClick={() => onTypeChange(true)}
        className={`rounded-xl border-2 p-4 transition-all ${
          isManual
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
            : 'border-neutral-200 hover:border-neutral-300 dark:border-charcoal-700 dark:hover:border-charcoal-600'
        }`}
      >
        <FileText className={`mx-auto mb-2 h-8 w-8 ${isManual ? 'text-blue-600 dark:text-blue-400' : 'text-charcoal-400 dark:text-charcoal-500'}`} />
        <p className="text-sm font-semibold text-charcoal-900 dark:text-white">Manual Entry</p>
        <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-400">
          Enter details manually
        </p>
      </button>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CreateTimesheetPage() {
  const router = useRouter();

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [formData, setFormData] = useState({
    sessionId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    manualEntry: false,
  });

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
    const initializeData = async () => {
      await Promise.all([fetchSessions(), fetchCoachRate()]);
    };
    initializeData();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions?status=COMPLETED');
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showToast('Failed to load training sessions', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchCoachRate = async () => {
    try {
      const response = await fetch('/api/coach/rate');
      if (!response.ok) throw new Error('Failed to fetch rate');

      const data = await response.json();
      setHourlyRate(data.hourlyRate || 25);
    } catch (error) {
      console.error('Error fetching coach rate:', error);
      showToast('Could not load hourly rate, using default', 'info');
    }
  };

  // ========================================================================
  // FORM HANDLERS
  // ========================================================================

  const handleEntryTypeChange = (manual: boolean) => {
    setFormData({
      ...formData,
      manualEntry: manual,
      sessionId: '',
      description: '',
    });
  };

  const handleSessionChange = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setFormData({
        ...formData,
        sessionId,
        date: new Date(session.date).toISOString().split('T')[0],
        hours: (session.duration / 60).toFixed(2),
      });
    }
  };

  const calculateTotal = () => {
    const hours = parseFloat(formData.hours) || 0;
    return (hours * hourlyRate).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const hours = parseFloat(formData.hours);
    if (!formData.hours || hours <= 0 || hours > 24) {
      showToast('Please enter valid hours (0-24)', 'error');
      return;
    }

    if (!formData.manualEntry && !formData.sessionId) {
      showToast('Please select a training session', 'error');
      return;
    }

    if (formData.manualEntry && !formData.description.trim()) {
      showToast('Please add a description for manual entry', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/coach/timesheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: formData.manualEntry ? null : formData.sessionId,
          date: formData.date,
          hours: parseFloat(formData.hours),
          description: formData.manualEntry ? formData.description.trim() : null,
          hourlyRate: hourlyRate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create timesheet');
      }

      const data = await response.json();
      showToast('⏰ Timesheet entry created successfully!', 'success');

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/coach/timesheets');
      }, 1200);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create timesheet. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Timesheet creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/dashboard/coach/timesheets">
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-200 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Timesheets
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-400 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">Add Time Entry</h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">Log your coaching hours</p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ENTRY TYPE SELECTION */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">Entry Type</h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Choose how to log your time
              </p>
            </div>
            <div className="p-6">
              <EntryTypeSelector
                isManual={formData.manualEntry}
                onTypeChange={handleEntryTypeChange}
              />
            </div>
          </div>

          {/* SESSION OR DESCRIPTION */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                {formData.manualEntry ? 'Description' : 'Select Training Session'}
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                {formData.manualEntry
                  ? 'Describe the work performed'
                  : 'Choose a completed training session'}
              </p>
            </div>

            <div className="p-6">
              {formData.manualEntry ? (
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g., Individual coaching session with U16 player, tactical session with first team"
                    rows={4}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                  />
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                    {formData.description.length}/300 characters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor="session"
                    className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    Training Session <span className="text-red-500">*</span>
                  </label>
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        No completed training sessions found. Please create a training session first or use Manual Entry.
                      </p>
                    </div>
                  ) : (
                    <select
                      id="session"
                      value={formData.sessionId}
                      onChange={(e) => handleSessionChange(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                      required
                    >
                      <option value="">Select a session...</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {new Date(session.date).toLocaleDateString('en-GB')} -{' '}
                          {session.focus} ({session.team.name}) -{' '}
                          {(session.duration / 60).toFixed(2)} hours
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TIME DETAILS */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">Time Details</h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Enter date and hours worked
              </p>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* DATE */}
                <div className="space-y-2">
                  <label
                    htmlFor="date"
                    className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                    required
                  />
                </div>

                {/* HOURS */}
                <div className="space-y-2">
                  <label
                    htmlFor="hours"
                    className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    Hours Worked <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="e.g., 2.5"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                    required
                  />
                </div>
              </div>

              {/* RATE DISPLAY */}
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:border-green-900/50 dark:from-green-900/20 dark:to-blue-900/20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 dark:bg-green-500/10">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
                        HOURLY RATE
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        £{hourlyRate.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="border-l border-green-200 pl-4 dark:border-green-900/50 md:border-l">
                    <p className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
                      TOTAL EARNINGS
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      £{calculateTotal()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <Link href="/dashboard/coach/timesheets">
              <button
                type="button"
                className="rounded-lg border border-neutral-200 bg-white px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-500 px-6 py-2 font-semibold text-white transition-all hover:from-green-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-green-600 dark:to-blue-500 dark:hover:from-green-700 dark:hover:to-blue-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit Timesheet
                </>
              )}
            </button>
          </div>
        </form>

        {/* HELPFUL TIPS */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">💡 Tip:</span> Link entries to training sessions for
            automatic hour calculation. Use manual entry for other coaching activities like
            individual mentoring or video analysis.
          </p>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}