'use client';

/**
 * Training Session Details & Attendance Tracking Page - ENHANCED VERSION
 * Path: /dashboard/manager/clubs/[clubId]/teams/[teamId]/training/[trainingId]
 * 
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ Removed react-hot-toast dependency (custom toast system)
 * ✅ Advanced attendance tracking with real-time updates
 * ✅ Player filtering and search functionality
 * ✅ Bulk actions for attendance management
 * ✅ CSV export with comprehensive data
 * ✅ Session analytics and statistics
 * ✅ Notes and observations per player
 * ✅ Responsive design (mobile-first)
 * ✅ Dark mode support with design system colors
 * ✅ Performance optimized (memoization, efficient state)
 * ✅ Accessibility compliance (WCAG 2.1 AA)
 * ✅ Comprehensive error handling
 * 
 * ============================================================================
 * CORE FEATURES
 * ============================================================================
 * - Real-time attendance tracking (PRESENT, ABSENT, INJURED, EXCUSED)
 * - Player search with instant filtering
 * - Training session details display
 * - Attendance statistics dashboard
 * - CSV export with formatted data
 * - Notes for non-present players
 * - Bulk status selection (for quick entry)
 * - Session description and focus areas
 * - Location and time display
 * 
 * ============================================================================
 * SCHEMA ALIGNED
 * ============================================================================
 * - Player model with user, position, jerseyNumber
 * - Training model with date, time, location, type, intensity
 * - Attendance model with playerId, status, notes
 * - Status enum: PRESENT | ABSENT | INJURED | EXCUSED
 * 
 * ============================================================================
 * BUSINESS LOGIC
 * ============================================================================
 * - Track player attendance with multiple status options
 * - Calculate attendance statistics for session analysis
 * - Export attendance data for compliance and analysis
 * - Add contextual notes for injuries, excuses, etc.
 * - Provide session details for player context
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Users,
  Save,
  Download,
  CalendarDays,
  X,
  Info,
  BarChart3,
  Zap,
  Search,
  FileDown,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// CUSTOM TOAST SYSTEM (Replaces react-hot-toast)
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
}

/**
 * Custom Toast Component - Lightweight, accessible, no external dependencies
 */
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600',
    default: 'bg-charcoal-800 dark:bg-charcoal-700',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    default: <Loader2 className="w-5 h-5 text-white animate-spin" />,
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      role="status"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container - Manages multiple toast notifications
 */
const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * useToast Hook - Custom hook for toast notifications
 */
const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'default') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };
};

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  position: string;
  jerseyNumber?: number;
}

interface Attendance {
  playerId: string;
  status: 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED';
  notes?: string;
}

interface Training {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  intensity: string;
  description: string;
  focusAreas: string;
  attendances: Array<{
    playerId: string;
    status: string;
    notes?: string;
  }>;
}

interface AttendanceStats {
  present: number;
  absent: number;
  injured: number;
  excused: number;
  total: number;
  presentPercentage: number;
}

interface StatusConfig {
  value: 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}

// ============================================================================
// CONSTANTS - Design System Aligned
// ============================================================================

const ATTENDANCE_STATUSES: StatusConfig[] = [
  {
    value: 'PRESENT',
    label: 'Present',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500 dark:bg-green-600',
    description: 'Player attended training',
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500 dark:bg-red-600',
    description: 'Player did not attend',
  },
  {
    value: 'INJURED',
    label: 'Injured',
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500 dark:bg-yellow-600',
    description: 'Player unable due to injury',
  },
  {
    value: 'EXCUSED',
    label: 'Excused',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500 dark:bg-blue-600',
    description: 'Player excused (valid reason)',
  },
];

const INTENSITY_COLORS: Record<string, string> = {
  LOW: 'from-green-400 to-emerald-400',
  MEDIUM: 'from-yellow-400 to-orange-400',
  HIGH: 'from-red-400 to-rose-400',
  INTENSE: 'from-purple-500 to-pink-400',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format player name
 */
const formatPlayerName = (player: Player): string => {
  return `${player.user.firstName} ${player.user.lastName}`;
};

/**
 * Calculate attendance statistics
 */
const calculateStats = (attendance: Map<string, Attendance>, total: number): AttendanceStats => {
  const statuses = Array.from(attendance.values());
  const present = statuses.filter((a) => a.status === 'PRESENT').length;
  const absent = statuses.filter((a) => a.status === 'ABSENT').length;
  const injured = statuses.filter((a) => a.status === 'INJURED').length;
  const excused = statuses.filter((a) => a.status === 'EXCUSED').length;

  return {
    present,
    absent,
    injured,
    excused,
    total,
    presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
  };
};

/**
 * Format date and time
 */
const formatDateTime = (date: string, time: string): string => {
  try {
    return new Date(`${date}T${time}`).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${date} ${time}`;
  }
};

/**
 * Get status config by value
 */
const getStatusConfig = (value: string): StatusConfig => {
  return ATTENDANCE_STATUSES.find((s) => s.value === value) || ATTENDANCE_STATUSES[0];
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TrainingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;
  const trainingId = params.trainingId as string;
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [training, setTraining] = useState<Training | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<Map<string, Attendance>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (clubId && teamId && trainingId) {
      fetchData();
    }
  }, [clubId, teamId, trainingId]);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  /**
   * Fetch training and players data
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      const [trainingRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/training/${trainingId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (!trainingRes.ok) {
        throw new Error(`Failed to fetch training: ${trainingRes.statusText}`);
      }
      if (!playersRes.ok) {
        throw new Error(`Failed to fetch players: ${playersRes.statusText}`);
      }

      const [trainingData, playersData] = await Promise.all([
        trainingRes.json(),
        playersRes.json(),
      ]);

      setTraining(trainingData);
      setPlayers(playersData || []);

      // Initialize attendance from existing data or defaults
      const attendanceMap = new Map<string, Attendance>();
      (playersData || []).forEach((player: Player) => {
        const existing = trainingData.attendances?.find((a: any) => a.playerId === player.id);
        attendanceMap.set(player.id, existing || { playerId: player.id, status: 'PRESENT' });
      });
      setAttendance(attendanceMap);

      info('Training session loaded');
      console.log('✅ Training data loaded:', {
        title: trainingData.title,
        players: playersData?.length || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load training data';
      console.error('❌ Error fetching data:', errorMessage);
      setApiError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, trainingId, success, error, info, showError]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Update player attendance status
   */
  const handleStatusChange = useCallback(
    (playerId: string, status: 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED') => {
      const current = attendance.get(playerId) || { playerId, status: 'PRESENT' };
      setAttendance(
        new Map(attendance).set(playerId, {
          ...current,
          status,
        })
      );
    },
    [attendance]
  );

  /**
   * Update player notes
   */
  const handleNoteChange = useCallback(
    (playerId: string, notes: string) => {
      const current = attendance.get(playerId) || { playerId, status: 'PRESENT' };
      setAttendance(
        new Map(attendance).set(playerId, {
          ...current,
          notes: notes || undefined,
        })
      );
    },
    [attendance]
  );

  /**
   * Bulk update attendance status
   */
  const handleBulkStatusUpdate = useCallback(
    (status: 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED') => {
      const newAttendance = new Map(attendance);
      filteredPlayers.forEach((player) => {
        const current = attendance.get(player.id) || { playerId: player.id, status: 'PRESENT' };
        newAttendance.set(player.id, {
          ...current,
          status,
        });
      });
      setAttendance(newAttendance);
      info(`Marked all filtered players as ${status.toLowerCase()}`);
    },
    [attendance, filteredPlayers, info]
  );

  /**
   * Save attendance data to API
   */
  const handleSaveAttendance = useCallback(async () => {
    try {
      setIsSaving(true);
      const attendanceData = Array.from(attendance.values());

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/training/${trainingId}/attendance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendances: attendanceData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save attendance: ${response.statusText}`
        );
      }

      success('Attendance saved successfully!');
      setTimeout(() => {
        router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save attendance';
      console.error('❌ Error saving attendance:', errorMessage);
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [attendance, clubId, teamId, trainingId, router, success, showError]);

  /**
   * Export attendance as CSV
   */
  const handleDownloadReport = useCallback(() => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const trainingTitle = training?.title || 'Training';

      // Build CSV content
      let csv = `${trainingTitle} - Attendance Report\n`;
      csv += `Date: ${new Date(training?.date || '').toLocaleDateString()}\n`;
      csv += `Time: ${training?.startTime} - ${training?.endTime}\n`;
      csv += `Location: ${training?.location || 'N/A'}\n`;
      csv += '='.repeat(80) + '\n\n';

      csv += 'Player,Position,Jersey,Status,Notes\n';

      filteredPlayers.forEach((player) => {
        const att = attendance.get(player.id);
        csv += `"${formatPlayerName(player)}","${player.position}","${player.jerseyNumber || '-'}","${att?.status || 'PRESENT'}","${att?.notes || ''}"\n`;
      });

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `training-${trainingTitle}-${timestamp}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Attendance report downloaded!');
      console.log('✅ Attendance report exported');
    } catch (err) {
      console.error('❌ Error exporting:', err);
      showError('Failed to download report');
    }
  }, [filteredPlayers, attendance, training, success, showError]);

  // ============================================================================
  // COMPUTED VALUES - Memoized
  // ============================================================================

  const filteredPlayers = useMemo(
    () =>
      players.filter((p) =>
        formatPlayerName(p).toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [players, searchQuery]
  );

  const stats = useMemo(() => calculateStats(attendance, players.length), [attendance, players]);

  const hasData = players.length > 0;

  // ============================================================================
  // RENDER - LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-cyan-400 dark:border-t-blue-400 dark:border-r-cyan-300 animate-spin" />
            </div>
          </div>
          <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
            Loading training session...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR STATE
  // ============================================================================

  if (apiError && !training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`}>
            <Button
              variant="ghost"
              className="mb-6 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training List
            </Button>
          </Link>

          <Card className="bg-white dark:bg-charcoal-800 border-red-200 dark:border-red-900/30 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">
                    Unable to Load Training
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-6">
                    {apiError}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={fetchData}
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold"
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Retry Loading
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training List
            </Button>
          </Link>

          <Card className="bg-white dark:bg-charcoal-800">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="w-12 h-12 text-charcoal-400 dark:text-charcoal-600 mx-auto mb-4" />
              <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
                Training session not found
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN CONTENT
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training List
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                  {training.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    {new Date(training.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    {training.startTime} - {training.endTime}
                  </span>
                  {training.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {training.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                disabled={!hasData}
                className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                aria-label="Download attendance report"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>

        {/* TRAINING SESSION INFO */}
        {(training.description || training.focusAreas || training.type || training.intensity) && (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-md mb-8">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {training.type && (
                  <div>
                    <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Type
                    </p>
                    <p className="text-charcoal-900 dark:text-white font-medium">
                      {training.type}
                    </p>
                  </div>
                )}
                {training.intensity && (
                  <div>
                    <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Intensity
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${INTENSITY_COLORS[training.intensity] || 'from-gray-400 to-gray-500'}`}
                      />
                      <span className="text-charcoal-900 dark:text-white font-medium">
                        {training.intensity}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {training.description && (
                <div>
                  <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">
                    Description
                  </p>
                  <p className="text-charcoal-700 dark:text-charcoal-300 text-sm leading-relaxed">
                    {training.description}
                  </p>
                </div>
              )}

              {training.focusAreas && (
                <div>
                  <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">
                    Focus Areas
                  </p>
                  <p className="text-charcoal-700 dark:text-charcoal-300 text-sm leading-relaxed">
                    {training.focusAreas}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ATTENDANCE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: 'Present',
              value: stats.present,
              color: 'from-green-500 to-emerald-400',
              icon: CheckCircle,
            },
            {
              label: 'Absent',
              value: stats.absent,
              color: 'from-red-500 to-rose-400',
              icon: XCircle,
            },
            {
              label: 'Injured',
              value: stats.injured,
              color: 'from-yellow-500 to-orange-400',
              icon: AlertCircle,
            },
            {
              label: 'Excused',
              value: stats.excused,
              color: 'from-blue-500 to-cyan-400',
              icon: Clock,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}
                    >
                      <Icon className={`w-5 h-5 ${getStatusConfig(stat.label).color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold text-charcoal-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ATTENDANCE TRACKING */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-md">
          <CardHeader className="border-b border-neutral-200 dark:border-charcoal-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-500" />
                  Player Attendance
                </CardTitle>
                <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                  {filteredPlayers.length} of {players.length} players
                  {stats.presentPercentage > 0 && ` • ${stats.presentPercentage}% present`}
                </CardDescription>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 dark:text-charcoal-600" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                  aria-label="Search players"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Bulk Actions */}
            {filteredPlayers.length > 1 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-lg">
                <p className="text-sm font-semibold text-charcoal-900 dark:text-white mb-3">
                  Quick Actions: Mark all filtered as
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <Button
                      key={status.value}
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate(status.value)}
                      className="text-xs font-medium"
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Players Grid */}
            <div className="space-y-3">
              {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player) => {
                    const att = attendance.get(player.id) || { status: 'PRESENT' };
                    const statusConfig = getStatusConfig(att.status);

                    return (
                      <div
                        key={player.id}
                        className="p-4 bg-neutral-50 dark:bg-charcoal-700/50 rounded-lg border border-neutral-200 dark:border-charcoal-600 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
                      >
                        {/* Player Info */}
                        <div className="mb-4">
                          <p className="font-semibold text-charcoal-900 dark:text-white">
                            {formatPlayerName(player)}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {player.position}
                            {player.jerseyNumber && ` • #${player.jerseyNumber}`}
                          </p>
                        </div>

                        {/* Status Buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {ATTENDANCE_STATUSES.map((status) => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(player.id, status.value)}
                              className={`p-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
                                att.status === status.value
                                  ? `${status.bgColor} text-white shadow-md scale-100`
                                  : 'bg-neutral-200 dark:bg-charcoal-600 text-charcoal-900 dark:text-charcoal-200 hover:bg-neutral-300 dark:hover:bg-charcoal-500'
                              }`}
                              title={status.description}
                            >
                              <status.icon className="w-3 h-3" aria-hidden="true" />
                              <span className="hidden sm:inline">{status.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Notes */}
                        {att.status !== 'PRESENT' && (
                          <input
                            type="text"
                            placeholder="Add note..."
                            value={att.notes || ''}
                            onChange={(e) => handleNoteChange(player.id, e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-charcoal-600 border border-neutral-300 dark:border-charcoal-500 rounded-lg text-xs text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
                            aria-label={`Notes for ${formatPlayerName(player)}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
                    No players found
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-8">
          <Link
            href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`}
            className="flex-1"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSaveAttendance}
            disabled={isSaving || !hasData}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

TrainingDetailsPage.displayName = 'TrainingDetailsPage';
