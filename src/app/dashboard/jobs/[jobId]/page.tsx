// =============================================================================
// 💼 JOB DETAILS PAGE - View Full Job Posting
// =============================================================================
// Path: /dashboard/jobs/[jobId]
// Access: All authenticated users
// Features: Full job description, requirements, club info, apply action
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
          twitter: true,
          instagram: true,
          foundedYear: true,
          isVerified: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!job || job.deletedAt) {
    return null;
  }

  // Check if user has applied
  const application = await prisma.jobApplication.findUnique({
    where: {
      jobPostingId_userId: {
        jobPostingId: jobId,
        userId,
      },
    },
    select: { status: true, createdAt: true },
  });

  // Increment view count
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
    daysUntilDeadline: job.deadline 
      ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function formatSalary(job: any): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: job.currency,
    maximumFractionDigits: 0,
  });

  let salary = '';
  if (job.salaryMin && job.salaryMax) {
    salary = `${formatter.format(job.salaryMin)} - ${formatter.format(job.salaryMax)}`;
  } else if (job.salaryMin) {
    salary = `From ${formatter.format(job.salaryMin)}`;
  } else if (job.salaryMax) {
    salary = `Up to ${formatter.format(job.salaryMax)}`;
  }

  if (job.salaryPeriod) {
    salary += ` ${job.salaryPeriod.toLowerCase()}`;
  }

  return salary;
}

function InfoBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="p-2 bg-slate-700 rounded-lg">
        <Icon className="h-5 w-5 text-blue-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

function RequirementsList({ items, title, icon: Icon }: { items: string[]; title: string; icon: React.ElementType }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-400" />
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApplicationStatus({ status, date }: { status: string; date: Date | null }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Application Pending' },
    REVIEWING: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Under Review' },
    SHORTLISTED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Shortlisted' },
    INTERVIEW_SCHEDULED: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Interview Scheduled' },
    OFFERED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Offer Made' },
    REJECTED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Not Selected' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className={`rounded-xl p-6 border ${config.color}`}>
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 className="h-6 w-6" />
        <span className="font-semibold text-lg">{config.label}</span>
      </div>
      {date && (
        <p className="text-sm opacity-80">
          Applied on {new Date(date).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const job = await getJobDetails(params.jobId, session.user.id);

  if (!job) {
    notFound();
  }

  const salary = formatSalary(job);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link 
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Club Logo */}
            <div className="w-20 h-20 rounded-2xl bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.club.logo ? (
                <img src={job.club.logo} alt={job.club.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-slate-400" />
              )}
            </div>

            {/* Job Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {job.isFeatured && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
                {job.isUrgent && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Urgent
                  </span>
                )}
                {job.isExpired && (
                  <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full font-medium">
                    Expired
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{job.title}</h1>
              
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <span className="font-medium text-white">{job.club.name}</span>
                {job.club.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                )}
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {(job.city || job.country || job.isRemote) && (
                  <div className="flex items-center gap-1.5">
                    {job.isRemote ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    <span>
                      {job.isRemote ? 'Remote' : [job.city, job.country].filter(Boolean).join(', ')}
                      {job.isHybrid && ' (Hybrid)'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>{job.employmentType.replace(/_/g, ' ')}</span>
                </div>
                {salary && (
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-4 w-4" />
                    <span>{salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{job.applicationCount} applicants</span>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="lg:text-right">
              {job.hasApplied ? (
                <ApplicationStatus status={job.applicationStatus!} date={job.applicationDate} />
              ) : job.isExpired ? (
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400">This position is no longer accepting applications</p>
                </div>
              ) : (
                <div>
                  <Link
                    href={`/dashboard/jobs/${job.id}/apply`}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all w-full lg:w-auto"
                  >
                    Apply Now
                  </Link>
                  {job.daysUntilDeadline !== null && job.daysUntilDeadline > 0 && (
                    <p className="text-sm text-slate-400 mt-2 flex items-center justify-center lg:justify-end gap-1">
                      <Clock className="h-4 w-4" />
                      {job.daysUntilDeadline} days left to apply
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
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">About This Role</h2>
              <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
              <RequirementsList 
                items={job.requirements} 
                title="Requirements" 
                icon={CheckCircle2} 
              />
              <RequirementsList 
                items={job.qualifications} 
                title="Qualifications" 
                icon={GraduationCap} 
              />
              <RequirementsList 
                items={job.certifications} 
                title="Certifications" 
                icon={Award} 
              />
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-400" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-400" />
                  Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.benefits.map((benefit: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>
              <div className="space-y-3">
                <InfoBadge icon={Briefcase} label="Category" value={job.category.replace(/_/g, ' ')} />
                <InfoBadge icon={GraduationCap} label="Experience Level" value={job.experienceLevel} />
                <InfoBadge icon={Clock} label="Employment Type" value={job.employmentType.replace(/_/g, ' ')} />
                {job.yearsExperience && (
                  <InfoBadge icon={Calendar} label="Years Required" value={`${job.yearsExperience}+ years`} />
                )}
                {job.startDate && (
                  <InfoBadge 
                    icon={Calendar} 
                    label="Start Date" 
                    value={new Date(job.startDate).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })} 
                  />
                )}
              </div>
            </div>

            {/* About the Club */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">About {job.club.name}</h3>
              
              {job.club.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-4">{job.club.description}</p>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sport</span>
                  <span className="text-white">{job.club.sport}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white">{job.club.teamType.replace(/_/g, ' ')}</span>
                </div>
                {job.club.foundedYear && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Founded</span>
                    <span className="text-white">{job.club.foundedYear}</span>
                  </div>
                )}
                {(job.club.city || job.club.country) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="text-white">{[job.club.city, job.club.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {job.club.website && (
                <a
                  href={job.club.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Website
                </a>
              )}
            </div>

            {/* Share */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Share This Job</h3>
              <button className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}