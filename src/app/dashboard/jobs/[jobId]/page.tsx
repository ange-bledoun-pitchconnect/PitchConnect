// =============================================================================
// 🏆 PITCHCONNECT - JOB DETAILS PAGE v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/jobs/[jobId]
// Access: All authenticated users
//
// FEATURES:
// ✅ Full job description and requirements
// ✅ Sport-specific job categories
// ✅ Application status tracking
// ✅ Club information with sport context
// ✅ Schema-aligned with JobPosting, Club
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Banknote,
  Globe,
  Calendar,
  Users,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  Zap,
  ExternalLink,
  Share2,
  Heart,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL' | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES' | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getJobDetails(jobId: string, userId: string) {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          banner: true,
          description: true,
          city: true,
          country: true,
          sport: true,
          teamType: true,
          website: true,
          foundedYear: true,
          isVerified: true,
        },
      },
      _count: { select: { applications: true } },
    },
  });

  if (!job || job.deletedAt) return null;

  const application = await prisma.jobApplication.findUnique({
    where: { jobPostingId_userId: { jobPostingId: jobId, userId } },
    select: { status: true, createdAt: true },
  });

  await prisma.jobPosting.update({
    where: { id: jobId },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return {
    ...job,
    hasApplied: !!application,
    applicationStatus: application?.status ?? null,
    applicationDate: application?.createdAt ?? null,
    applicationCount: job._count.applications,
    isExpired: job.deadline ? new Date(job.deadline) < new Date() : false,
    daysUntilDeadline: job.deadline ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
  };
}

function formatSalary(job: any): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: job.currency || 'GBP', maximumFractionDigits: 0 });
  let salary = job.salaryMin && job.salaryMax ? `${fmt.format(job.salaryMin)} - ${fmt.format(job.salaryMax)}` : job.salaryMin ? `From ${fmt.format(job.salaryMin)}` : `Up to ${fmt.format(job.salaryMax)}`;
  if (job.salaryPeriod) salary += ` ${job.salaryPeriod.toLowerCase()}`;
  return salary;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function JobDetailsPage({ params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  const job = await getJobDetails(params.jobId, session.user.id);
  if (!job) notFound();

  const salary = formatSalary(job);
  const sportConfig = job.club?.sport ? SPORT_CONFIG[job.club.sport as Sport] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${sportConfig ? `bg-gradient-to-br ${sportConfig.color}` : 'bg-slate-200 dark:bg-slate-700'}`}>
              {job.club.logo ? <img src={job.club.logo} alt={job.club.name} className="w-full h-full object-cover" /> : sportConfig ? <span className="text-4xl">{sportConfig.icon}</span> : <Building2 className="h-10 w-10 text-slate-400" />}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {job.isFeatured && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Star className="h-3 w-3" /> Featured</span>}
                {job.isUrgent && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Zap className="h-3 w-3" /> Urgent</span>}
                {job.isExpired && <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">Expired</span>}
                {sportConfig && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium">{sportConfig.icon} {sportConfig.label}</span>}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">{job.title}</h1>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                <span className="font-medium text-slate-900 dark:text-white">{job.club.name}</span>
                {job.club.isVerified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {(job.city || job.country || job.isRemote) && (
                  <div className="flex items-center gap-1.5">
                    {job.isRemote ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    <span>{job.isRemote ? 'Remote' : [job.city, job.country].filter(Boolean).join(', ')}{job.isHybrid && ' (Hybrid)'}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /><span>{job.employmentType.replace(/_/g, ' ')}</span></div>
                {salary && <div className="flex items-center gap-1.5"><Banknote className="h-4 w-4" /><span>{salary}</span></div>}
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{job.applicationCount} applicants</span></div>
              </div>
            </div>

            <div className="lg:text-right">
              {job.hasApplied ? (
                <ApplicationStatus status={job.applicationStatus!} date={job.applicationDate} />
              ) : job.isExpired ? (
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">No longer accepting applications</p>
                </div>
              ) : (
                <div>
                  <Link href={`/dashboard/jobs/${job.id}/apply`} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold w-full lg:w-auto">
                    Apply Now
                  </Link>
                  {job.daysUntilDeadline !== null && job.daysUntilDeadline > 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center lg:justify-end gap-1">
                      <Clock className="h-4 w-4" /> {job.daysUntilDeadline} days left
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">About This Role</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {(job.requirements?.length > 0 || job.qualifications?.length > 0 || job.skills?.length > 0) && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                {job.requirements?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Requirements</h3>
                    <ul className="space-y-2">
                      {job.requirements.map((r: string, i: number) => <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />{r}</li>)}
                    </ul>
                  </div>
                )}
                {job.qualifications?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-500" /> Qualifications</h3>
                    <ul className="space-y-2">
                      {job.qualifications.map((q: string, i: number) => <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />{q}</li>)}
                    </ul>
                  </div>
                )}
                {job.skills?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-blue-500" /> Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((s: string, i: number) => <span key={i} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {job.benefits?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-pink-500" /> Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.benefits.map((b: string, i: number) => <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{b}</div>)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Details</h3>
              <div className="space-y-3">
                <InfoBadge icon={Briefcase} label="Category" value={job.category.replace(/_/g, ' ')} />
                <InfoBadge icon={GraduationCap} label="Experience" value={job.experienceLevel} />
                <InfoBadge icon={Clock} label="Type" value={job.employmentType.replace(/_/g, ' ')} />
                {job.yearsExperience && <InfoBadge icon={Calendar} label="Years Required" value={`${job.yearsExperience}+`} />}
                {job.startDate && <InfoBadge icon={Calendar} label="Start Date" value={new Date(job.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About {job.club.name}</h3>
              {job.club.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-4">{job.club.description}</p>}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Sport</span><span className="text-slate-900 dark:text-white">{sportConfig?.label || job.club.sport}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-900 dark:text-white">{job.club.teamType?.replace(/_/g, ' ')}</span></div>
                {job.club.foundedYear && <div className="flex justify-between"><span className="text-slate-500">Founded</span><span className="text-slate-900 dark:text-white">{job.club.foundedYear}</span></div>}
                {(job.club.city || job.club.country) && <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="text-slate-900 dark:text-white">{[job.club.city, job.club.country].filter(Boolean).join(', ')}</span></div>}
              </div>
              {job.club.website && (
                <a href={job.club.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm">
                  <ExternalLink className="h-4 w-4" /> Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function InfoBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="p-2 bg-slate-200 dark:bg-slate-600 rounded-lg"><Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p></div>
    </div>
  );
}

function ApplicationStatus({ status, date }: { status: string; date: Date | null }) {
  const configs: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700', label: 'Pending' },
    REVIEWING: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700', label: 'Under Review' },
    SHORTLISTED: { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700', label: 'Shortlisted' },
    INTERVIEW_SCHEDULED: { color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700', label: 'Interview Scheduled' },
    OFFERED: { color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700', label: 'Offer Made' },
    REJECTED: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700', label: 'Not Selected' },
  };
  const cfg = configs[status] || configs.PENDING;
  return (
    <div className={`rounded-xl p-4 border ${cfg.color}`}>
      <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">{cfg.label}</span></div>
      {date && <p className="text-sm opacity-80">Applied {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
    </div>
  );
}