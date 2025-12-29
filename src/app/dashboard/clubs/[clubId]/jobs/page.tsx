// =============================================================================
// 💼 CLUB JOBS MANAGEMENT - Manage Job Postings
// =============================================================================
// Path: /dashboard/clubs/[clubId]/jobs
// Access: Club owners, managers
// Features: View, create, edit, manage job postings
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Edit,
  Eye,
  Trash2,
  Users,
  Clock,
  MapPin,
  Banknote,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  BarChart3,
  Globe,
  Star,
  Zap,
} from 'lucide-react';

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getClubJobsData(clubId: string, userId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      members: {
        where: {
          userId,
          isActive: true,
          role: { in: ['OWNER', 'MANAGER'] },
        },
      },
    },
  });

  if (!club) return null;

  const hasAccess = 
    club.managerId === userId ||
    club.ownerId === userId ||
    club.members.length > 0;

  if (!hasAccess) return null;

  const jobs = await prisma.jobPosting.findMany({
    where: { 
      clubId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get status counts
  const statusCounts = await prisma.jobPosting.groupBy({
    by: ['status'],
    where: { clubId, deletedAt: null },
    _count: true,
  });

  // Get total applications
  const totalApplications = await prisma.jobApplication.count({
    where: {
      jobPosting: { clubId },
    },
  });

  return {
    club: {
      id: club.id,
      name: club.name,
      logo: club.logo,
    },
    jobs: jobs.map(job => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      category: job.category,
      role: job.role,
      employmentType: job.employmentType,
      status: job.status,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      city: job.city,
      country: job.country,
      isRemote: job.isRemote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      deadline: job.deadline?.toISOString() ?? null,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      viewCount: job.viewCount,
      applicationCount: job._count.applications,
    })),
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>),
    totalApplications,
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    DRAFT: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Edit, label: 'Draft' },
    OPEN: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Open' },
    PAUSED: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Pause, label: 'Paused' },
    CLOSED: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle, label: 'Closed' },
    FILLED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Users, label: 'Filled' },
    CANCELLED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Cancelled' },
    EXPIRED: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock, label: 'Expired' },
  };

  const c = config[status] || config.DRAFT;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function formatSalary(job: any): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: job.currency,
    maximumFractionDigits: 0,
  });

  if (job.salaryMin && job.salaryMax) {
    return `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
  } else if (job.salaryMin) {
    return `From ${formatter.format(job.salaryMin)}`;
  } else {
    return `Up to ${formatter.format(job.salaryMax)}`;
  }
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

function JobRow({ job, clubId }: { job: any; clubId: string }) {
  const salary = formatSalary(job);
  const daysUntilDeadline = job.deadline 
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/dashboard/clubs/${clubId}/jobs/${job.id}`}
                className="text-lg font-semibold text-white hover:text-blue-400 transition-colors truncate"
              >
                {job.title}
              </Link>
              {job.isFeatured && (
                <Star className="h-4 w-4 text-amber-400 flex-shrink-0" />
              )}
              {job.isUrgent && (
                <Zap className="h-4 w-4 text-red-400 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>{job.category.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span>{job.employmentType.replace(/_/g, ' ')}</span>
              {(job.city || job.country || job.isRemote) && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {job.isRemote ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                    {job.isRemote ? 'Remote' : [job.city, job.country].filter(Boolean).join(', ')}
                  </span>
                </>
              )}
              {salary && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Banknote className="h-3.5 w-3.5" />
                    {salary}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{job.applicationCount} applications</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{job.viewCount} views</span>
            </div>
            {daysUntilDeadline !== null && job.status === 'OPEN' && (
              <div className={`flex items-center gap-1.5 ${daysUntilDeadline <= 3 ? 'text-red-400' : ''}`}>
                <Clock className="h-4 w-4" />
                <span>
                  {daysUntilDeadline > 0 
                    ? `${daysUntilDeadline} days left`
                    : 'Deadline passed'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/clubs/${clubId}/jobs/${job.id}`}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/clubs/${clubId}/jobs/${job.id}/applications`}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="View Applications"
            >
              <Users className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ clubId }: { clubId: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Briefcase className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Job Postings Yet</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Start attracting top talent by creating your first job posting.
      </p>
      <Link
        href={`/dashboard/clubs/${clubId}/jobs/new`}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <Plus className="h-5 w-5" />
        Create Job Posting
      </Link>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function ClubJobsPage({
  params,
  searchParams,
}: {
  params: { clubId: string };
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const data = await getClubJobsData(params.clubId, session.user.id);

  if (!data) {
    notFound();
  }

  const { club, jobs, statusCounts, totalApplications } = data;

  // Filter jobs
  const filter = searchParams.status || 'all';
  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter(j => j.status === filter);

  const openCount = statusCounts['OPEN'] || 0;
  const draftCount = statusCounts['DRAFT'] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link 
            href={`/dashboard/clubs/${params.clubId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Club
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-blue-400" />
                Job Postings
              </h1>
              <p className="text-slate-400 mt-1">{club.name}</p>
            </div>

            <Link
              href={`/dashboard/clubs/${params.clubId}/jobs/new`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Job
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Briefcase} 
            value={jobs.length} 
            label="Total Jobs" 
            color="bg-blue-500/20 text-blue-400" 
          />
          <StatCard 
            icon={CheckCircle2} 
            value={openCount} 
            label="Open Positions" 
            color="bg-emerald-500/20 text-emerald-400" 
          />
          <StatCard 
            icon={Users} 
            value={totalApplications} 
            label="Total Applications" 
            color="bg-purple-500/20 text-purple-400" 
          />
          <StatCard 
            icon={Edit} 
            value={draftCount} 
            label="Drafts" 
            color="bg-amber-500/20 text-amber-400" 
          />
        </div>

        {/* Filter Tabs */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { value: 'all', label: 'All', count: jobs.length },
              { value: 'OPEN', label: 'Open', count: statusCounts['OPEN'] || 0 },
              { value: 'DRAFT', label: 'Drafts', count: statusCounts['DRAFT'] || 0 },
              { value: 'PAUSED', label: 'Paused', count: statusCounts['PAUSED'] || 0 },
              { value: 'CLOSED', label: 'Closed', count: (statusCounts['CLOSED'] || 0) + (statusCounts['FILLED'] || 0) },
            ].map(tab => (
              <Link
                key={tab.value}
                href={`/dashboard/clubs/${params.clubId}/jobs?status=${tab.value}`}
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
        )}

        {/* Job List */}
        {filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <JobRow key={job.id} job={job} clubId={params.clubId} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No jobs match the selected filter.</p>
            <Link
              href={`/dashboard/clubs/${params.clubId}/jobs`}
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              View all jobs
            </Link>
          </div>
        ) : (
          <EmptyState clubId={params.clubId} />
        )}
      </div>
    </div>
  );
}