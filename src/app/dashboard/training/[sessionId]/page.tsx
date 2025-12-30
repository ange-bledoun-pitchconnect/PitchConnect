// ============================================================================
// 🏆 PITCHCONNECT - Training Session Details (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/training/[sessionId]/page.tsx
// Full multi-sport support with drill library integration
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getSportConfig, 
  getPositionsForSport,
  getDrillCategories,
  formatDuration 
} from '@/lib/sports/sport-config';
import { 
  TrainingStatus, 
  TrainingIntensity, 
  AttendanceStatus,
  DrillCategory,
  DrillIntensity,
  Sport 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  params: { sessionId: string };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTrainingSession(sessionId: string) {
  return prisma.trainingSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
          slug: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      coach: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
        },
      },
      sessionDrills: {
        include: {
          drill: true,
        },
        orderBy: { order: 'asc' },
      },
      attendance: {
        include: {
          player: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { player: { user: { lastName: 'asc' } } },
      },
    },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const STATUS_CONFIG: Record<TrainingStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: '📝' },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: '📅' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: '▶️' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: '❌' },
  POSTPONED: { label: 'Postponed', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: '⏸️' },
};

const INTENSITY_CONFIG: Record<TrainingIntensity, { 
  label: string; 
  color: string; 
  icon: string;
  description: string;
}> = {
  RECOVERY: { label: 'Recovery', color: '#22c55e', icon: '🧘', description: 'Light activity for recovery' },
  LOW: { label: 'Low', color: '#84cc16', icon: '🚶', description: 'Easy-paced training' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', icon: '🏃', description: 'Moderate effort required' },
  HIGH: { label: 'High', color: '#ef4444', icon: '🔥', description: 'Demanding session' },
  MAXIMUM: { label: 'Maximum', color: '#dc2626', icon: '💥', description: 'Peak performance required' },
  COMPETITIVE: { label: 'Competitive', color: '#8b5cf6', icon: '🏆', description: 'Match-intensity' },
};

const ATTENDANCE_CONFIG: Record<AttendanceStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  PRESENT: { label: 'Present', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  ABSENT: { label: 'Absent', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  EXCUSED: { label: 'Excused', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  LATE: { label: 'Late', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  LEFT_EARLY: { label: 'Left Early', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  PARTIAL: { label: 'Partial', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  INJURED: { label: 'Injured', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  SICK: { label: 'Sick', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  SUSPENDED: { label: 'Suspended', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

const DRILL_INTENSITY_CONFIG: Record<DrillIntensity, { color: string; icon: string }> = {
  RECOVERY: { color: '#22c55e', icon: '🧘' },
  LOW: { color: '#84cc16', icon: '🚶' },
  MEDIUM: { color: '#f59e0b', icon: '🏃' },
  HIGH: { color: '#ef4444', icon: '🔥' },
  MAXIMUM: { color: '#dc2626', icon: '💥' },
  VARIABLE: { color: '#8b5cf6', icon: '🔄' },
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatTimeOnly(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: TrainingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${config.color} ${config.bgColor}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function IntensityCard({ intensity }: { intensity: TrainingIntensity }) {
  const config = INTENSITY_CONFIG[intensity];
  return (
    <div 
      className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] p-5"
      style={{ borderColor: `${config.color}30` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{config.icon}</span>
        <div>
          <div className="text-sm text-gray-400">Intensity</div>
          <div className="font-bold text-white" style={{ color: config.color }}>
            {config.label}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">{config.description}</p>
    </div>
  );
}

function DrillCard({ 
  sessionDrill, 
  index,
  sport,
}: { 
  sessionDrill: any;
  index: number;
  sport: Sport;
}) {
  const drill = sessionDrill.drill;
  const intensityConfig = DRILL_INTENSITY_CONFIG[drill.intensity as DrillIntensity];
  
  return (
    <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] overflow-hidden hover:border-amber-500/30 transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white mb-1 truncate">{drill.name}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: `${intensityConfig.color}20`, color: intensityConfig.color }}
              >
                {intensityConfig.icon} {drill.intensity}
              </span>
              <span className="text-xs text-gray-500">
                {sessionDrill.duration} min
              </span>
              {drill.category && (
                <span className="text-xs text-gray-500 bg-[#1a1a1a] px-2 py-0.5 rounded">
                  {drill.category.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {drill.description && (
          <p className="text-sm text-gray-400 mt-3 line-clamp-2">{drill.description}</p>
        )}

        {/* Equipment & Players */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#3a3a3a]">
          {drill.equipment && drill.equipment.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {drill.equipment.slice(0, 3).join(', ')}
              {drill.equipment.length > 3 && ` +${drill.equipment.length - 3}`}
            </div>
          )}
          {(drill.minPlayers || drill.maxPlayers) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {drill.minPlayers || 1}-{drill.maxPlayers || '∞'} players
            </div>
          )}
        </div>

        {/* Modifications */}
        {sessionDrill.notes && (
          <div className="mt-3 p-3 bg-[#1a1a1a] rounded-xl">
            <div className="text-xs text-amber-400 font-medium mb-1">Session Notes:</div>
            <p className="text-sm text-gray-400">{sessionDrill.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceCard({ attendance }: { attendance: any }) {
  const config = ATTENDANCE_CONFIG[attendance.status as AttendanceStatus] || ATTENDANCE_CONFIG.PRESENT;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a]">
      <div className="w-10 h-10 rounded-lg bg-[#3a3a3a] overflow-hidden">
        {attendance.player.user.avatar ? (
          <Image
            src={attendance.player.user.avatar}
            alt={`${attendance.player.user.firstName} ${attendance.player.user.lastName}`}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
            {attendance.player.user.firstName[0]}{attendance.player.user.lastName[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate">
          {attendance.player.user.firstName} {attendance.player.user.lastName}
        </div>
        {attendance.notes && (
          <div className="text-xs text-gray-500 truncate">{attendance.notes}</div>
        )}
      </div>
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color} ${config.bgColor}`}>
        {config.label}
      </span>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subValue,
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  subValue?: string;
}) {
  return (
    <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400">
          {icon}
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function TrainingSessionPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const trainingSession = await getTrainingSession(params.sessionId);
  if (!trainingSession) {
    notFound();
  }

  const sport = trainingSession.club.sport;
  const sportConfig = getSportConfig(sport);
  const duration = Math.round(
    (new Date(trainingSession.endTime).getTime() - new Date(trainingSession.startTime).getTime()) / 60000
  );

  const presentCount = trainingSession.attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = trainingSession.attendance.filter(a => a.status === 'ABSENT').length;
  const totalDrillTime = trainingSession.sessionDrills.reduce((sum, d) => sum + d.duration, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="/dashboard/training" className="text-gray-400 hover:text-white transition-colors">
              Training
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-amber-400 truncate max-w-[200px]">{trainingSession.name}</span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              {trainingSession.club.logo ? (
                <Image
                  src={trainingSession.club.logo}
                  alt={trainingSession.club.name}
                  width={64}
                  height={64}
                  className="rounded-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl">{sportConfig.icon}</span>
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <StatusBadge status={trainingSession.status} />
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: `${sportConfig.color}20`, color: sportConfig.color }}
                  >
                    <span>{sportConfig.icon}</span>
                    {sportConfig.name}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {trainingSession.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-400">
                  <span>{trainingSession.club.name}</span>
                  {trainingSession.team && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>{trainingSession.team.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/dashboard/training/${params.sessionId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a]
                           text-white rounded-xl hover:border-amber-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500
                           text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                           transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Take Attendance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {trainingSession.description && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                <p className="text-gray-400 whitespace-pre-wrap">{trainingSession.description}</p>
              </div>
            )}

            {/* Drills Section */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
              <div className="p-6 border-b border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Training Drills</h2>
                      <p className="text-sm text-gray-400">
                        {trainingSession.sessionDrills.length} drills • {totalDrillTime} min total
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/training/${params.sessionId}/drills`}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Manage Drills →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {trainingSession.sessionDrills.length > 0 ? (
                  <div className="space-y-4">
                    {trainingSession.sessionDrills.map((sd, idx) => (
                      <DrillCard 
                        key={sd.id} 
                        sessionDrill={sd} 
                        index={idx}
                        sport={sport}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white mb-2">No Drills Added</h3>
                    <p className="text-sm text-gray-400 mb-4">Add drills from your library to plan this session</p>
                    <Link
                      href={`/dashboard/training/${params.sessionId}/drills/add`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400
                                 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Drills
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Section */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
              <div className="p-6 border-b border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Attendance</h2>
                      <p className="text-sm text-gray-400">
                        {presentCount} present • {absentCount} absent
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {trainingSession.attendance.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trainingSession.attendance.map((att) => (
                      <AttendanceCard key={att.id} attendance={att} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No attendance recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Time & Location */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Date & Time
                </div>
                <div className="text-white font-medium">{formatDateTime(trainingSession.startTime)}</div>
                <div className="text-sm text-gray-400">
                  {formatTimeOnly(trainingSession.startTime)} - {formatTimeOnly(trainingSession.endTime)} 
                  ({formatDuration(duration)})
                </div>
              </div>
              
              {trainingSession.location && (
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </div>
                  <div className="text-white font-medium">{trainingSession.location}</div>
                </div>
              )}
            </div>

            {/* Intensity */}
            <IntensityCard intensity={trainingSession.intensity} />

            {/* Coach */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
              <div className="text-sm text-gray-400 mb-3">Coach</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] overflow-hidden">
                  {trainingSession.coach.user.avatar ? (
                    <Image
                      src={trainingSession.coach.user.avatar}
                      alt={`${trainingSession.coach.user.firstName} ${trainingSession.coach.user.lastName}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                      {trainingSession.coach.user.firstName[0]}{trainingSession.coach.user.lastName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {trainingSession.coach.user.firstName} {trainingSession.coach.user.lastName}
                  </div>
                  <div className="text-sm text-gray-400">{trainingSession.coach.user.email}</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 text-center">
                <div className="text-2xl font-bold text-white">{trainingSession.sessionDrills.length}</div>
                <div className="text-sm text-gray-400">Drills</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {trainingSession.avgRating ? trainingSession.avgRating.toFixed(1) : '—'}
                </div>
                <div className="text-sm text-gray-400">Avg Rating</div>
              </div>
            </div>

            {/* Focus Areas */}
            {trainingSession.focusAreas && trainingSession.focusAreas.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
                <div className="text-sm text-gray-400 mb-3">Focus Areas</div>
                <div className="flex flex-wrap gap-2">
                  {trainingSession.focusAreas.map((area, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-[#2a2a2a] rounded-lg text-sm text-white"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {trainingSession.equipment && trainingSession.equipment.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
                <div className="text-sm text-gray-400 mb-3">Equipment Needed</div>
                <div className="space-y-2">
                  {trainingSession.equipment.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white text-sm">
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps) {
  const session = await getTrainingSession(params.sessionId);
  if (!session) return { title: 'Session Not Found' };

  return {
    title: `${session.name} | Training | PitchConnect`,
    description: `Training session details for ${session.name}`,
  };
}