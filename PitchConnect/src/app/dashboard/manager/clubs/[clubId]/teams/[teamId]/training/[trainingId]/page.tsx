'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'Present', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
  { value: 'ABSENT', label: 'Absent', icon: XCircle, color: 'text-red-600 dark:text-red-400' },
  { value: 'INJURED', label: 'Injured', icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'EXCUSED', label: 'Excused', icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
];

export default function TrainingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;
  const trainingId = params.trainingId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [training, setTraining] = useState<Training | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<Map<string, Attendance>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [trainingRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/training/${trainingId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (!trainingRes.ok) throw new Error('Failed to fetch training');
      if (!playersRes.ok) throw new Error('Failed to fetch players');

      const [trainingData, playersData] = await Promise.all([
        trainingRes.json(),
        playersRes.json(),
      ]);

      setTraining(trainingData);
      setPlayers(playersData);

      // Initialize attendance from existing data or defaults
      const attendanceMap = new Map<string, Attendance>();
      playersData.forEach((player: Player) => {
        const existing = trainingData.attendances?.find(
          (a: any) => a.playerId === player.id
        );
        attendanceMap.set(player.id, existing || { playerId: player.id, status: 'PRESENT' });
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load training data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (playerId: string, status: string) => {
    const current = attendance.get(playerId) || { playerId, status: 'PRESENT' };
    setAttendance(
      new Map(attendance).set(playerId, {
        ...current,
        status: status as 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED',
      })
    );
  };

  const handleNoteChange = (playerId: string, notes: string) => {
    const current = attendance.get(playerId) || { playerId, status: 'PRESENT' };
    setAttendance(
      new Map(attendance).set(playerId, {
        ...current,
        notes: notes || undefined,
      })
    );
  };

  const handleSaveAttendance = async () => {
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

      if (!response.ok) throw new Error('Failed to save attendance');

      toast.success('Attendance saved successfully!');
      router.push(`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Generate CSV
      let csv = 'Player,Position,Status,Notes\n';
      
      filteredPlayers.forEach((player) => {
        const att = attendance.get(player.id);
        csv += `"${player.user.firstName} ${player.user.lastName}","${player.position}","${att?.status || 'PRESENT'}","${att?.notes || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-attendance-${training?.date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Training not found</p>
        </div>
      </div>
    );
  }

  const filteredPlayers = players.filter((p) =>
    `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    present: Array.from(attendance.values()).filter((a) => a.status === 'PRESENT').length,
    absent: Array.from(attendance.values()).filter((a) => a.status === 'ABSENT').length,
    injured: Array.from(attendance.values()).filter((a) => a.status === 'INJURED').length,
    excused: Array.from(attendance.values()).filter((a) => a.status === 'EXCUSED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-cyan-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training List
            </Button>
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                  {training.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-charcoal-600 dark:text-charcoal-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {new Date(training.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {training.startTime} - {training.endTime}
                  </span>
                  {training.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {training.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Training Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Present', value: stats.present, color: 'from-green-500 to-emerald-400' },
            { label: 'Absent', value: stats.absent, color: 'from-red-500 to-rose-400' },
            { label: 'Injured', value: stats.injured, color: 'from-yellow-500 to-orange-400' },
            { label: 'Excused', value: stats.excused, color: 'from-blue-500 to-cyan-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Details */}
        {(training.description || training.focusAreas) && (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 mb-8">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {training.description && (
                <div>
                  <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">Description</p>
                  <p className="text-charcoal-900 dark:text-white">{training.description}</p>
                </div>
              )}
              {training.focusAreas && (
                <div>
                  <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-400 mb-2">Focus Areas</p>
                  <p className="text-charcoal-900 dark:text-white">{training.focusAreas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Tracking */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="text-charcoal-900 dark:text-white">Player Attendance</CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Track which players attended the training session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-all"
            />

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => {
                const att = attendance.get(player.id) || { status: 'PRESENT' };
                const statusConfig = ATTENDANCE_STATUSES.find((s) => s.value === att.status);
                const IconComponent = statusConfig?.icon || CheckCircle;

                return (
                  <div
                    key={player.id}
                    className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600 hover:shadow-md dark:hover:shadow-charcoal-900/30 transition-all"
                  >
                    <div className="mb-3">
                      <p className="font-semibold text-charcoal-900 dark:text-white">
                        {player.user.firstName} {player.user.lastName}
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
                          className={`p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                            att.status === status.value
                              ? 'bg-blue-500 text-white dark:bg-blue-600'
                              : 'bg-neutral-200 dark:bg-charcoal-600 text-charcoal-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-charcoal-500'
                          }`}
                        >
                          <IconComponent className="w-3 h-3" />
                          {status.label}
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
                        className="w-full px-2 py-1 bg-white dark:bg-charcoal-600 border border-neutral-300 dark:border-charcoal-500 rounded text-xs text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <p className="text-charcoal-600 dark:text-charcoal-400">No players found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4 mt-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}/training`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
            >
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold disabled:opacity-50"
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
