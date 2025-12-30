// ============================================================================
// 🏆 PITCHCONNECT - Training Sessions List (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/training/page.tsx
// Full multi-sport support with enterprise dark mode design
// ============================================================================

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSportConfig, formatDuration } from '@/lib/sports/sport-config';
import { 
  TrainingStatus, 
  TrainingIntensity, 
  TrainingCategory,
  Sport 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TrainingSessionData {
  id: string;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  status: TrainingStatus;
  intensity: TrainingIntensity;
  category: TrainingCategory;
  location: string | null;
  attendanceCount: number;
  avgRating: number | null;
  club: {
    id: string;
    name: string;
    sport: Sport;
    logo: string | null;
  };
  team: {
    id: string;
    name: string;
  } | null;
  coach: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
  sessionDrills: {
    id: string;
  }[];
  _count: {
    attendance: number;
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getUserClubs(userId: string) {
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      clubId: true,
      role: true,
    },
  });
  return memberships.map(m => m.clubId);
}

async function getTrainingSessions(clubIds: string[], filters: {
  status?: string;
  sport?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: any = {
    clubId: { in: clubIds },
    deletedAt: null,
  };
  
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status as TrainingStatus;
  }
  
  if (filters.dateFrom) {
    where.startTime = { gte: filters.dateFrom };
  }
  
  if (filters.dateTo) {
    where.startTime = { ...where.startTime, lte: filters.dateTo };
  }

  return prisma.trainingSession.findMany({
    where,
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
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
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      sessionDrills: {
        select: { id: true },
      },
      _count: {
        select: {
          attendance: true,
        },
      },
    },
    orderBy: { startTime: 'desc' },
    take: 50,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const STATUS_CONFIG: Record<TrainingStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  POSTPONED: { label: 'Postponed', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
};

const INTENSITY_CONFIG: Record<TrainingIntensity, { label: string; color: string; icon: string }> = {
  RECOVERY: { label: 'Recovery', color: '#22c55e', icon: '🧘' },
  LOW: { label: 'Low', color: '#84cc16', icon: '🚶' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', icon: '🏃' },
  HIGH: { label: 'High', color: '#ef4444', icon: '🔥' },
  MAXIMUM: { label: 'Maximum', color: '#dc2626', icon: '💥' },
  COMPETITIVE: { label: 'Competitive', color: '#8b5cf6', icon: '🏆' },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function isToday(date: Date): boolean {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

function isUpcoming(date: Date): boolean {
  return new Date(date) > new Date();
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: TrainingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${config.color} ${config.bgColor}`}>
      {config.label}
    </span>
  );
}

function IntensityIndicator({ intensity }: { intensity: TrainingIntensity }) {
  const config = INTENSITY_CONFIG[intensity];
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function SportBadge({ sport }: { sport: Sport }) {
  const config = getSportConfig(sport);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <span>{config.icon}</span>
      {config.shortName}
    </span>
  );
}

function TrainingCard({ session }: { session: TrainingSessionData }) {
  const sportConfig = getSportConfig(session.club.sport);
  const duration = Math.round(
    (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000
  );
  const today = isToday(session.startTime);
  const upcoming = isUpcoming(session.startTime);

  return (
    <Link
      href={`/dashboard/training/${session.id}`}
      className={`
        group relative block bg-[#2a2a2a] rounded-2xl border overflow-hidden
        transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1
        ${today 
          ? 'border-amber-500/50 ring-2 ring-amber-500/20' 
          : 'border-[#3a3a3a] hover:border-amber-500/30'
        }
      `}
    >
      {/* Today Badge */}
      {today && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Today</span>
        </div>
      )}

      <div className={`p-5 ${today ? 'pt-10' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <SportBadge sport={session.club.sport} />
              <StatusBadge status={session.status} />
            </div>
            <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors truncate">
              {session.name}
            </h3>
            <p className="text-sm text-gray-400 truncate">
              {session.club.name}
              {session.team && ` • ${session.team.name}`}
            </p>
          </div>
          <IntensityIndicator intensity={session.intensity} />
        </div>

        {/* Time & Location */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date
            </div>
            <div className="text-white font-medium text-sm">
              {formatDate(session.startTime)}
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time
            </div>
            <div className="text-white font-medium text-sm">
              {formatTime(session.startTime)} • {formatDuration(duration)}
            </div>
          </div>
        </div>

        {/* Location */}
        {session.location && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{session.location}</span>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3a3a3a]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-400">{session._count.attendance}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-400">{session.sessionDrills.length} drills</span>
            </div>
          </div>
          
          {/* Coach Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3a3a3a] overflow-hidden ring-2 ring-[#2a2a2a]">
              {session.coach.user.avatar ? (
                <Image
                  src={session.coach.user.avatar}
                  alt={`${session.coach.user.firstName} ${session.coach.user.lastName}`}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  {session.coach.user.firstName[0]}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">
              {session.coach.user.firstName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Training Sessions</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-6">
        You haven't created any training sessions yet. Create your first session to start tracking attendance and drills.
      </p>
      <Link
        href="/dashboard/training/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                   text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                   transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create First Session
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-[#2a2a2a] rounded-2xl p-5 animate-pulse">
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-[#3a3a3a] rounded-lg" />
            <div className="h-6 w-20 bg-[#3a3a3a] rounded-lg" />
          </div>
          <div className="h-6 w-3/4 bg-[#3a3a3a] rounded mb-2" />
          <div className="h-4 w-1/2 bg-[#3a3a3a] rounded mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-16 bg-[#1a1a1a] rounded-xl" />
            <div className="h-16 bg-[#1a1a1a] rounded-xl" />
          </div>
          <div className="h-4 w-full bg-[#3a3a3a] rounded" />
        </div>
      ))}
    </div>
  );
}

function StatusFilter({
  activeStatus,
  onStatusChange,
}: {
  activeStatus: string;
  onStatusChange: (status: string) => void;
}) {
  const statuses = [
    { key: 'all', label: 'All Sessions' },
    { key: 'SCHEDULED', label: 'Scheduled' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <Link
          key={s.key}
          href={`/dashboard/training?status=${s.key}`}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all border
            ${activeStatus === s.key
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent'
              : 'bg-[#2a2a2a] text-gray-300 border-[#3a3a3a] hover:border-amber-500/30 hover:text-white'
            }
          `}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

interface PageProps {
  searchParams: { status?: string; sport?: string };
}

export default async function TrainingListPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const clubIds = await getUserClubs(session.user.id);
  
  if (clubIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">No Club Membership</h2>
          <p className="text-gray-400 mb-4">Join a club to view training sessions.</p>
          <Link
            href="/dashboard/clubs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                       text-white font-semibold rounded-xl"
          >
            Browse Clubs
          </Link>
        </div>
      </div>
    );
  }

  const activeStatus = searchParams.status || 'all';
  const sessions = await getTrainingSessions(clubIds, {
    status: activeStatus,
    sport: searchParams.sport,
  });

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, s) => {
    const dateKey = formatDate(s.startTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(s);
    return acc;
  }, {} as Record<string, TrainingSessionData[]>);

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
            <span className="text-amber-400">Training</span>
          </nav>

          {/* Title */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Training Sessions
              </h1>
              <p className="text-gray-400">
                Manage and track all your training sessions across clubs
              </p>
            </div>

            <Link
              href="/dashboard/training/create"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                         text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                         transition-all duration-300 whitespace-nowrap self-start lg:self-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Session
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <StatusFilter activeStatus={activeStatus} onStatusChange={() => {}} />
        </div>

        {/* Sessions */}
        <Suspense fallback={<LoadingSkeleton />}>
          {sessions.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date}>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {date}
                    <span className="text-sm text-gray-500 font-normal">
                      ({dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {dateSessions.map((s) => (
                      <TrainingCard key={s.id} session={s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </Suspense>
      </div>
    </div>
  );
}

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Training Sessions | PitchConnect',
  description: 'View and manage all your training sessions',
};