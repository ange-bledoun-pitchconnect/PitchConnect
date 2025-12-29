// =============================================================================
// 🏆 PITCHCONNECT - COACH TIMESHEET CREATE v3.0 (Weekly Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/timesheets/create
// Access: HEAD_COACH, ASSISTANT_COACH, GOALKEEPING_COACH, PERFORMANCE_COACH
// 
// FEATURES:
// ✅ Weekly timesheet with 7-day breakdown
// ✅ breakdown JSON for detailed daily entries
// ✅ File attachments support
// ✅ Training session linking
// ✅ Match day entries
// ✅ Manual activity entries
// ✅ Real-time earnings calculation
// ✅ Schema-aligned with CoachTimesheet model
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Upload,
  File,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

interface DailyEntry {
  date: string;
  dayOfWeek: string;
  entries: ActivityEntry[];
  totalHours: number;
}

interface ActivityEntry {
  id: string;
  type: 'TRAINING' | 'MATCH' | 'MEETING' | 'ADMIN' | 'TRAVEL' | 'OTHER';
  sessionId?: string | null;
  matchId?: string | null;
  description: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes?: string;
}

interface TrainingSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  team: {
    name: string;
  };
}

interface Match {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  kickOffTime: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ACTIVITY_TYPES = [
  { id: 'TRAINING', label: 'Training Session', icon: '🏃', color: 'bg-emerald-500' },
  { id: 'MATCH', label: 'Match Day', icon: '⚽', color: 'bg-gold-500' },
  { id: 'MEETING', label: 'Meeting', icon: '👥', color: 'bg-blue-500' },
  { id: 'ADMIN', label: 'Admin Work', icon: '📋', color: 'bg-purple-500' },
  { id: 'TRAVEL', label: 'Travel', icon: '🚗', color: 'bg-amber-500' },
  { id: 'OTHER', label: 'Other', icon: '📝', color: 'bg-slate-500' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
// HELPER FUNCTIONS
// =============================================================================

const getWeekDates = (weekStart: Date): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const calculateHours = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return Math.max(0, (endMinutes - startMinutes) / 60);
};

// =============================================================================
// ENTRY ROW COMPONENT
// =============================================================================

const EntryRow = ({
  entry,
  trainingSessions,
  matches,
  onChange,
  onDelete,
}: {
  entry: ActivityEntry;
  trainingSessions: TrainingSession[];
  matches: Match[];
  onChange: (entry: ActivityEntry) => void;
  onDelete: () => void;
}) => {
  const activityType = ACTIVITY_TYPES.find(t => t.id === entry.type);

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newEntry = { ...entry, [field]: value };
    newEntry.hours = calculateHours(newEntry.startTime, newEntry.endTime);
    onChange(newEntry);
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
      <div className="flex flex-wrap gap-4">
        {/* Activity Type */}
        <div className="w-full md:w-auto">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Type</label>
          <select
            value={entry.type}
            onChange={(e) => onChange({ ...entry, type: e.target.value as ActivityEntry['type'], sessionId: null, matchId: null })}
            className="w-full md:w-40 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
          >
            {ACTIVITY_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
            ))}
          </select>
        </div>

        {/* Session/Match Selection */}
        {entry.type === 'TRAINING' && trainingSessions.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Training Session</label>
            <select
              value={entry.sessionId || ''}
              onChange={(e) => {
                const session = trainingSessions.find(s => s.id === e.target.value);
                if (session) {
                  const start = new Date(session.startTime);
                  const end = new Date(session.endTime);
                  onChange({
                    ...entry,
                    sessionId: session.id,
                    description: `${session.name} - ${session.team.name}`,
                    startTime: start.toTimeString().slice(0, 5),
                    endTime: end.toTimeString().slice(0, 5),
                    hours: calculateHours(start.toTimeString().slice(0, 5), end.toTimeString().slice(0, 5)),
                  });
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="">Select session...</option>
              {trainingSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.name} - {session.team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {entry.type === 'MATCH' && matches.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Match</label>
            <select
              value={entry.matchId || ''}
              onChange={(e) => {
                const match = matches.find(m => m.id === e.target.value);
                if (match) {
                  onChange({
                    ...entry,
                    matchId: match.id,
                    description: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                  });
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="">Select match...</option>
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description (for non-session entries) */}
        {!entry.sessionId && !entry.matchId && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={entry.description}
              onChange={(e) => onChange({ ...entry, description: e.target.value })}
              placeholder="Activity description..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
        )}

        {/* Time Inputs */}
        <div className="flex gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Start</label>
            <input
              type="time"
              value={entry.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">End</label>
            <input
              type="time"
              value={entry.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Hours Display */}
        <div className="flex items-end">
          <div className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
            {entry.hours.toFixed(2)}h
          </div>
        </div>

        {/* Delete Button */}
        <div className="flex items-end">
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3">
        <input
          type="text"
          value={entry.notes || ''}
          onChange={(e) => onChange({ ...entry, notes: e.target.value })}
          placeholder="Additional notes (optional)..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
        />
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CreateTimesheetPage() {
  const router = useRouter();

  // Week state
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getWeekStartDate(new Date()));
  const [dailyEntries, setDailyEntries] = useState<Record<string, ActivityEntry[]>>({});
  
  // Data state
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Week dates
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  const weekEndDate = useMemo(() => {
    const end = new Date(weekStartDate);
    end.setDate(weekStartDate.getDate() + 6);
    return end;
  }, [weekStartDate]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const startStr = formatDate(weekStartDate);
        const endStr = formatDate(weekEndDate);

        const [sessionsRes, matchesRes, rateRes] = await Promise.all([
          fetch(`/api/coach/training-sessions?startDate=${startStr}&endDate=${endStr}`),
          fetch(`/api/coach/matches?startDate=${startStr}&endDate=${endStr}`),
          fetch('/api/coach/rate'),
        ]);

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setTrainingSessions(data.sessions || []);
        }

        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.matches || []);
        }

        if (rateRes.ok) {
          const data = await rateRes.json();
          setHourlyRate(data.hourlyRate || 25);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [weekStartDate, weekEndDate]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(weekStartDate.getDate() + 7);
    // Don't allow future weeks
    if (newStart <= new Date()) {
      setWeekStartDate(newStart);
    }
  };

  // Add entry for a day
  const addEntry = (dateStr: string) => {
    const newEntry: ActivityEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'TRAINING',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      hours: 1,
    };
    setDailyEntries(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newEntry],
    }));
  };

  // Update entry
  const updateEntry = (dateStr: string, entryId: string, updatedEntry: ActivityEntry) => {
    setDailyEntries(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).map(e => e.id === entryId ? updatedEntry : e),
    }));
  };

  // Delete entry
  const deleteEntry = (dateStr: string, entryId: string) => {
    setDailyEntries(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(e => e.id !== entryId),
    }));
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`${file.name} exceeds 10MB limit`, 'error');
        return;
      }
      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let totalHours = 0;
    const dailyTotals: Record<string, number> = {};

    Object.entries(dailyEntries).forEach(([date, entries]) => {
      const dayTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);
      dailyTotals[date] = dayTotal;
      totalHours += dayTotal;
    });

    return {
      totalHours,
      dailyTotals,
      totalEarnings: totalHours * hourlyRate,
    };
  }, [dailyEntries, hourlyRate]);

  // Build breakdown JSON
  const buildBreakdownJson = () => {
    const breakdown: Record<string, unknown> = {};

    weekDates.forEach((date, idx) => {
      const dateStr = formatDate(date);
      const entries = dailyEntries[dateStr] || [];
      
      breakdown[DAYS_OF_WEEK[idx].toLowerCase()] = {
        date: dateStr,
        entries: entries.map(e => ({
          type: e.type,
          description: e.description,
          sessionId: e.sessionId,
          matchId: e.matchId,
          startTime: e.startTime,
          endTime: e.endTime,
          hours: e.hours,
          notes: e.notes,
        })),
        totalHours: totals.dailyTotals[dateStr] || 0,
      };
    });

    return breakdown;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (totals.totalHours === 0) {
      showToast('Please add at least one time entry', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload attachments first
      const attachmentUrls: string[] = [];
      for (const attachment of attachments) {
        if (attachment.file) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            attachmentUrls.push(data.url);
          }
        } else if (attachment.url) {
          attachmentUrls.push(attachment.url);
        }
      }

      // Submit timesheet
      const timesheetData = {
        weekStartDate: formatDate(weekStartDate),
        weekEndDate: formatDate(weekEndDate),
        totalHours: totals.totalHours,
        hourlyRate,
        totalAmount: totals.totalEarnings,
        breakdown: buildBreakdownJson(),
        notes,
        attachments: attachmentUrls,
        status: 'PENDING',
      };

      const res = await fetch('/api/coach/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timesheetData),
      });

      if (!res.ok) throw new Error('Failed to submit timesheet');

      showToast('✅ Weekly timesheet submitted successfully!', 'success');
      setTimeout(() => router.push('/dashboard/coach/timesheets'), 1500);
    } catch (error) {
      showToast('Failed to submit timesheet', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading timesheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/coach/timesheets" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Timesheets
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Weekly Timesheet</h1>
              <p className="text-slate-600 dark:text-slate-400">Log your coaching hours for the week</p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {weekStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {weekEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Week {Math.ceil((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>

            <button
              onClick={goToNextWeek}
              disabled={weekEndDate >= new Date()}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Daily Entries */}
        <div className="space-y-4 mb-6">
          {weekDates.map((date, idx) => {
            const dateStr = formatDate(date);
            const dayEntries = dailyEntries[dateStr] || [];
            const dayTotal = totals.dailyTotals[dateStr] || 0;
            const isToday = formatDate(new Date()) === dateStr;
            const isPast = date < new Date();

            return (
              <div
                key={dateStr}
                className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden ${
                  isToday ? 'border-emerald-500 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Day Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isToday ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-700/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      isToday ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {DAYS_OF_WEEK[idx]}
                        {isToday && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Today)</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Day Total</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{dayTotal.toFixed(2)}h</p>
                    </div>
                    <button
                      onClick={() => addEntry(dateStr)}
                      disabled={!isPast && !isToday}
                      className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Entries */}
                {dayEntries.length > 0 && (
                  <div className="p-4 space-y-3">
                    {dayEntries.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        trainingSessions={trainingSessions.filter(s => formatDate(new Date(s.startTime)) === dateStr)}
                        matches={matches.filter(m => formatDate(new Date(m.kickOffTime)) === dateStr)}
                        onChange={(updated) => updateEntry(dateStr, entry.id, updated)}
                        onDelete={() => deleteEntry(dateStr, entry.id)}
                      />
                    ))}
                  </div>
                )}

                {dayEntries.length === 0 && (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No entries for this day
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Attachments */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-blue-500" />
            Attachments
          </h3>

          <div className="space-y-3">
            {attachments.map(attachment => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{attachment.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Upload supporting documents (max 10MB)</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Weekly Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes for this week..."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Summary & Submit */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total Hours</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totals.totalHours.toFixed(2)}h</p>
              </div>
              <div className="h-12 w-px bg-slate-300 dark:bg-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Hourly Rate</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">£{hourlyRate.toFixed(2)}</p>
              </div>
              <div className="h-12 w-px bg-slate-300 dark:bg-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total Earnings</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">£{totals.totalEarnings.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard/coach/timesheets" className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || totals.totalHours === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Timesheet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">💡 Tip:</span> Link entries to training sessions and matches for automatic hour tracking. 
            Use the attachment feature to upload supporting documents like receipts or training plans.
          </p>
        </div>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}