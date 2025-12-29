// =============================================================================
// 🤝 TEAM JOIN REQUESTS MANAGEMENT - Review Player Requests
// =============================================================================
// Path: /dashboard/clubs/[clubId]/teams/[teamId]/join-requests
// Access: Club managers, owners, coaches
// Features: View, approve, reject player join requests
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Check,
  X,
  Clock,
  Shield,
  MapPin,
  Calendar,
  AlertCircle,
  User,
  Target,
  Activity,
  ChevronRight,
  Mail,
  Ruler,
  Weight,
} from 'lucide-react';

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getJoinRequestsData(clubId: string, teamId: string, userId: string) {
  // Verify team exists and user has access
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      club: {
        include: {
          members: {
            where: {
              userId,
              isActive: true,
              role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
            },
          },
        },
      },
      players: {
        where: { isActive: true },
        select: { jerseyNumber: true },
      },
    },
  });

  if (!team || team.clubId !== clubId) {
    return null;
  }

  const hasAccess = 
    team.club.managerId === userId ||
    team.club.ownerId === userId ||
    team.club.members.length > 0;

  if (!hasAccess) {
    return null;
  }

  // Fetch join requests
  const requests = await prisma.teamJoinRequest.findMany({
    where: { teamId },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              dateOfBirth: true,
            },
          },
          aggregateStats: {
            select: {
              totalMatches: true,
              totalGoals: true,
              totalAssists: true,
              avgRating: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get counts by status
  const statusCounts = await prisma.teamJoinRequest.groupBy({
    by: ['status'],
    where: { teamId },
    _count: true,
  });

  const takenJerseyNumbers = team.players.map(p => p.jerseyNumber).filter(Boolean) as number[];

  return {
    team: {
      id: team.id,
      name: team.name,
      ageGroup: team.ageGroup,
      acceptingJoinRequests: team.acceptingJoinRequests,
    },
    club: {
      id: team.club.id,
      name: team.club.name,
    },
    requests: requests.map(r => ({
      id: r.id,
      status: r.status,
      message: r.message,
      preferredPosition: r.preferredPosition,
      preferredJerseyNumber: r.preferredJerseyNumber,
      reviewNotes: r.reviewNotes,
      rejectionReason: r.rejectionReason,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      player: {
        id: r.player.id,
        userId: r.player.userId,
        name: `${r.player.user.firstName} ${r.player.user.lastName}`,
        email: r.player.user.email,
        avatar: r.player.user.avatar,
        dateOfBirth: r.player.user.dateOfBirth?.toISOString() ?? null,
        primaryPosition: r.player.primaryPosition,
        secondaryPosition: r.player.secondaryPosition,
        preferredFoot: r.player.preferredFoot,
        height: r.player.height,
        weight: r.player.weight,
        isVerified: r.player.isVerified,
        stats: r.player.aggregateStats,
      },
    })),
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>),
    takenJerseyNumbers,
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' },
    APPROVED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Approved' },
    REJECTED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejected' },
    CANCELLED: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Cancelled' },
    EXPIRED: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Expired' },
    WITHDRAWN: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Withdrawn' },
  };

  const c = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      {c.label}
    </span>
  );
}

function StatBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <div>
        <p className="text-sm font-medium text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function RequestCard({ 
  request, 
  clubId, 
  teamId,
  takenJerseyNumbers,
}: { 
  request: any;
  clubId: string;
  teamId: string;
  takenJerseyNumbers: number[];
}) {
  const age = calculateAge(request.player.dateOfBirth);
  const isPending = request.status === 'PENDING';

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {request.player.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white truncate">{request.player.name}</h3>
              {request.player.isVerified && (
                <Shield className="h-4 w-4 text-blue-400" />
              )}
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              {request.player.email}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(request.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Player Details */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {request.player.primaryPosition && (
            <StatBadge icon={Target} value={request.player.primaryPosition} label="Position" />
          )}
          {age !== null && (
            <StatBadge icon={Calendar} value={`${age} yrs`} label="Age" />
          )}
          {request.player.height && (
            <StatBadge icon={Ruler} value={`${request.player.height} cm`} label="Height" />
          )}
          {request.player.preferredFoot && (
            <StatBadge icon={Activity} value={request.player.preferredFoot} label="Foot" />
          )}
        </div>

        {/* Stats */}
        {request.player.stats && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Matches:</span>
              <span className="text-white font-medium">{request.player.stats.totalMatches || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Goals:</span>
              <span className="text-white font-medium">{request.player.stats.totalGoals || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Assists:</span>
              <span className="text-white font-medium">{request.player.stats.totalAssists || 0}</span>
            </div>
            {request.player.stats.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Avg Rating:</span>
                <span className="text-white font-medium">{request.player.stats.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {request.message && (
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400 italic">"{request.message}"</p>
          </div>
        )}

        {/* Preferred Jersey */}
        {request.preferredJerseyNumber && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Preferred Jersey:</span>
            <span className={`px-2 py-1 rounded-md font-bold ${
              takenJerseyNumbers.includes(request.preferredJerseyNumber)
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              #{request.preferredJerseyNumber}
              {takenJerseyNumbers.includes(request.preferredJerseyNumber) && ' (Taken)'}
            </span>
          </div>
        )}

        {/* Rejection Reason */}
        {request.rejectionReason && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">
              <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-end gap-3">
          <form action={`/api/clubs/${clubId}/teams/${teamId}/join-requests`} method="POST">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="action" value="REJECT" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          </form>
          <form action={`/api/clubs/${clubId}/teams/${teamId}/join-requests`} method="POST">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="action" value="APPROVE" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <UserPlus className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {filter === 'all' ? 'No Join Requests Yet' : `No ${filter} Requests`}
      </h3>
      <p className="text-slate-400 max-w-md mx-auto">
        {filter === 'all' 
          ? 'When players request to join this team, their requests will appear here for review.'
          : `There are no ${filter.toLowerCase()} join requests at the moment.`}
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function JoinRequestsPage({
  params,
  searchParams,
}: {
  params: { clubId: string; teamId: string };
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const data = await getJoinRequestsData(params.clubId, params.teamId, session.user.id);

  if (!data) {
    notFound();
  }

  const { team, club, requests, statusCounts, takenJerseyNumbers } = data;

  // Filter requests
  const filter = searchParams.status || 'PENDING';
  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const pendingCount = statusCounts['PENDING'] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link 
            href={`/dashboard/clubs/${params.clubId}/teams/${params.teamId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <UserPlus className="h-7 w-7 text-blue-400" />
                Join Requests
                {pendingCount > 0 && (
                  <span className="bg-blue-600 text-white text-sm px-2.5 py-1 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </h1>
              <p className="text-slate-400 mt-1">
                {team.name} • {club.name}
              </p>
            </div>

            {!team.acceptingJoinRequests && (
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                Join requests disabled
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { value: 'PENDING', label: 'Pending', count: statusCounts['PENDING'] || 0 },
              { value: 'APPROVED', label: 'Approved', count: statusCounts['APPROVED'] || 0 },
              { value: 'REJECTED', label: 'Rejected', count: statusCounts['REJECTED'] || 0 },
              { value: 'all', label: 'All', count: requests.length },
            ].map(tab => (
              <Link
                key={tab.value}
                href={`/dashboard/clubs/${params.clubId}/teams/${params.teamId}/join-requests?status=${tab.value}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label} ({tab.count})
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {filteredRequests.length > 0 ? (
          <div className="space-y-6">
            {filteredRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                clubId={params.clubId}
                teamId={params.teamId}
                takenJerseyNumbers={takenJerseyNumbers}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>
    </div>
  );
}