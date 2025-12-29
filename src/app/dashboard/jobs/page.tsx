// =============================================================================
// 💼 JOBS BOARD - Browse & Search Job Opportunities
// =============================================================================
// Path: /dashboard/jobs
// Access: All authenticated users
// Features: Search, filter, browse open positions across all clubs
// =============================================================================

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Search,
  Filter,
  ChevronRight,
  Banknote,
  Globe,
  Star,
  Zap,
  Users,
  GraduationCap,
  Calendar,
  ArrowRight,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface JobListing {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  category: string;
  role: string;
  employmentType: string;
  experienceLevel: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryPeriod: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  deadline: string | null;
  publishedAt: string | null;
  applicationCount: number;
  club: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    city: string | null;
    country: string | null;
    sport: string;
    teamType: string;
  };
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getJobs(searchParams: { 
  category?: string;
  location?: string;
  remote?: string;
  search?: string;
  page?: string;
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'OPEN',
    deletedAt: null,
    OR: [
      { deadline: null },
      { deadline: { gte: new Date() } },
    ],
  };

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  if (searchParams.location) {
    where.OR = [
      { city: { contains: searchParams.location, mode: 'insensitive' } },
      { country: { contains: searchParams.location, mode: 'insensitive' } },
    ];
  }

  if (searchParams.remote === 'true') {
    where.isRemote = true;
  }

  if (searchParams.search) {
    where.AND = [
      {
        OR: [
          { title: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            country: true,
            sport: true,
            teamType: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isUrgent: 'desc' },
        { publishedAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.jobPosting.count({ where }),
  ]);

  const formattedJobs: JobListing[] = jobs.map(job => ({
    id: job.id,
    slug: job.slug,
    title: job.title,
    shortDescription: job.shortDescription,
    category: job.category,
    role: job.role,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    salaryPeriod: job.salaryPeriod,
    location: job.location,
    city: job.city,
    country: job.country,
    isRemote: job.isRemote,
    isHybrid: job.isHybrid,
    isUrgent: job.isUrgent,
    isFeatured: job.isFeatured,
    deadline: job.deadline?.toISOString() ?? null,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    applicationCount: job._count.applications,
    club: job.club,
  }));

  return {
    jobs: formattedJobs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async function getCategories() {
  const categories = await prisma.jobPosting.groupBy({
    by: ['category'],
    where: { status: 'OPEN', deletedAt: null },
    _count: true,
  });

  return categories.map(c => ({
    value: c.category,
    label: c.category.replace(/_/g, ' '),
    count: c._count,
  }));
}

// =============================================================================
// COMPONENTS
// =============================================================================

function formatSalary(job: JobListing): string | null {
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

function JobCard({ job }: { job: JobListing }) {
  const salary = formatSalary(job);
  const daysUntilDeadline = job.deadline 
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link 
      href={`/dashboard/jobs/${job.id}`}
      className="group block bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.club.logo ? (
              <img src={job.club.logo} alt={job.club.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {job.isFeatured && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {job.isUrgent && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Urgent
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-sm text-slate-400">{job.club.name}</p>
          </div>
        </div>

        {/* Description */}
        {job.shortDescription && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
            {job.shortDescription}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">
            {job.category.replace(/_/g, ' ')}
          </span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">
            {job.employmentType.replace(/_/g, ' ')}
          </span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">
            {job.experienceLevel}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          {(job.city || job.country || job.isRemote) && (
            <div className="flex items-center gap-1">
              {job.isRemote ? (
                <>
                  <Globe className="h-4 w-4" />
                  <span>Remote</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>{[job.city, job.country].filter(Boolean).join(', ')}</span>
                </>
              )}
            </div>
          )}
          {salary && (
            <div className="flex items-center gap-1">
              <Banknote className="h-4 w-4" />
              <span>{salary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30 rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {job.applicationCount} applicants
          </span>
          {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {daysUntilDeadline} days left
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}

function CategoryFilter({ 
  categories, 
  selected 
}: { 
  categories: Array<{ value: string; label: string; count: number }>;
  selected?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard/jobs"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selected
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        All Jobs
      </Link>
      {categories.map(cat => (
        <Link
          key={cat.value}
          href={`/dashboard/jobs?category=${cat.value}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === cat.value
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {cat.label} ({cat.count})
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Briefcase className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {hasFilters ? 'No jobs match your criteria' : 'No job openings yet'}
      </h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        {hasFilters 
          ? 'Try adjusting your filters or search terms to find more opportunities.'
          : 'Check back later for new opportunities, or set up job alerts to be notified.'}
      </p>
      {hasFilters && (
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Clear Filters
        </Link>
      )}
    </div>
  );
}

function Pagination({ 
  currentPage, 
  totalPages,
  searchParams,
}: { 
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `/dashboard/jobs?${params.toString()}`;
  };

  return (
    <div className="flex justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Previous
        </Link>
      )}
      
      <span className="px-4 py-2 text-slate-400">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { category?: string; location?: string; remote?: string; search?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const [{ jobs, total, page, totalPages }, categories] = await Promise.all([
    getJobs(searchParams),
    getCategories(),
  ]);

  const hasFilters = !!(searchParams.category || searchParams.location || searchParams.remote || searchParams.search);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-400" />
                Jobs Board
              </h1>
              <p className="text-slate-400 mt-2">
                Find your next opportunity in sports • {total} open positions
              </p>
            </div>
            
            {/* Search */}
            <form className="flex gap-3" action="/dashboard/jobs" method="GET">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search jobs..."
                  defaultValue={searchParams.search}
                  className="w-full lg:w-80 pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <CategoryFilter categories={categories} selected={searchParams.category} />
            
            <Link
              href={searchParams.remote === 'true' ? '/dashboard/jobs' : '/dashboard/jobs?remote=true'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchParams.remote === 'true'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Globe className="h-4 w-4" />
              Remote Only
            </Link>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            <Pagination 
              currentPage={page} 
              totalPages={totalPages}
              searchParams={searchParams as Record<string, string>}
            />
          </>
        ) : (
          <EmptyState hasFilters={hasFilters} />
        )}
      </div>
    </div>
  );
}