// =============================================================================
// 🏆 PITCHCONNECT - JOBS BOARD v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/jobs
// Access: All authenticated users
//
// FEATURES:
// ✅ Sport filtering (Filter by Football, Rugby, Cricket, etc.)
// ✅ Sport-specific job categories (e.g., "Wicket-keeper Coach" for Cricket)
// ✅ Full-text search
// ✅ Location/remote filtering
// ✅ Employment type filtering
// ✅ Experience level filtering
// ✅ Salary range display
// ✅ Featured and urgent badges
// ✅ Application count and deadline tracking
// ✅ Schema-aligned with JobPosting, Club
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Clock,
  Banknote,
  Globe,
  Building2,
  Filter,
  X,
  ChevronDown,
  Star,
  Zap,
  Users,
  Briefcase,
  CheckCircle2,
  Loader2,
  Calendar,
  ArrowRight,
  Heart,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP' | 'VOLUNTEER';
type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE';

interface JobListing {
  id: string;
  title: string;
  category: string;
  description: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string | null;
  currency: string | null;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  deadline: string | null;
  createdAt: string;
  applicationCount: number;
  club: {
    id: string;
    name: string;
    logo: string | null;
    sport: Sport;
    isVerified: boolean;
  };
  hasApplied: boolean;
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

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
// SPORT-SPECIFIC JOB CATEGORIES
// =============================================================================

const UNIVERSAL_CATEGORIES = [
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'FITNESS_COACH',
  'PERFORMANCE_COACH',
  'YOUTH_COACH',
  'ANALYST',
  'SCOUT',
  'PHYSIOTHERAPIST',
  'SPORTS_SCIENTIST',
  'NUTRITIONIST',
  'TEAM_MANAGER',
  'OPERATIONS_MANAGER',
  'MEDIA_OFFICER',
  'MARKETING_MANAGER',
  'GROUNDS_STAFF',
  'KIT_MANAGER',
  'ADMINISTRATOR',
];

const SPORT_SPECIFIC_CATEGORIES: Partial<Record<Sport, string[]>> = {
  FOOTBALL: ['GOALKEEPING_COACH', 'SET_PIECE_COACH', 'TECHNICAL_DIRECTOR', 'FIRST_TEAM_COACH'],
  RUGBY: ['SCRUM_COACH', 'LINEOUT_COACH', 'DEFENCE_COACH', 'KICKING_COACH', 'ATTACK_COACH'],
  CRICKET: ['BATTING_COACH', 'BOWLING_COACH', 'WICKETKEEPING_COACH', 'FIELDING_COACH', 'SPIN_BOWLING_COACH'],
  BASKETBALL: ['SHOOTING_COACH', 'DEFENSE_COACH', 'PLAYER_DEVELOPMENT_COACH'],
  AMERICAN_FOOTBALL: ['OFFENSIVE_COORDINATOR', 'DEFENSIVE_COORDINATOR', 'SPECIAL_TEAMS_COACH', 'QUARTERBACK_COACH', 'RUNNING_BACKS_COACH', 'WIDE_RECEIVERS_COACH', 'LINEBACKERS_COACH'],
  HOCKEY: ['PENALTY_CORNER_COACH', 'DRAG_FLICK_SPECIALIST'],
  NETBALL: ['SHOOTING_COACH', 'CENTRE_COURT_COACH', 'DEFENCE_SPECIALIST'],
  LACROSSE: ['ATTACK_COACH', 'DEFENSE_COACH', 'FACEOFF_SPECIALIST', 'GOALIE_COACH'],
};

const getCategoriesForSport = (sport: Sport | 'ALL'): string[] => {
  if (sport === 'ALL') {
    const allSpecific = Object.values(SPORT_SPECIFIC_CATEGORIES).flat();
    return [...new Set([...UNIVERSAL_CATEGORIES, ...allSpecific])].sort();
  }
  const specific = SPORT_SPECIFIC_CATEGORIES[sport] || [];
  return [...UNIVERSAL_CATEGORIES, ...specific].sort();
};

const formatCategory = (cat: string) => cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JobsBoardPage() {
  // State
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<Sport | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [employmentFilter, setEmploymentFilter] = useState<string>('ALL');
  const [experienceFilter, setExperienceFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL'); // ALL, REMOTE, ONSITE, HYBRID
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (sportFilter !== 'ALL') params.set('sport', sportFilter);
        if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
        if (employmentFilter !== 'ALL') params.set('employmentType', employmentFilter);
        if (experienceFilter !== 'ALL') params.set('experienceLevel', experienceFilter);
        if (locationFilter === 'REMOTE') params.set('isRemote', 'true');
        if (locationFilter === 'HYBRID') params.set('isHybrid', 'true');

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setJobs(data.data || []);
        } else {
          setError(data.message || 'Failed to load jobs');
        }
      } catch {
        setError('Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchJobs, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, sportFilter, categoryFilter, employmentFilter, experienceFilter, locationFilter]);

  // Available categories based on sport filter
  const availableCategories = useMemo(() => getCategoriesForSport(sportFilter), [sportFilter]);

  // Reset category when sport changes
  useEffect(() => {
    if (categoryFilter !== 'ALL' && !availableCategories.includes(categoryFilter)) {
      setCategoryFilter('ALL');
    }
  }, [sportFilter, categoryFilter, availableCategories]);

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    featured: jobs.filter(j => j.isFeatured).length,
    remote: jobs.filter(j => j.isRemote).length,
    urgent: jobs.filter(j => j.isUrgent).length,
  }), [jobs]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSportFilter('ALL');
    setCategoryFilter('ALL');
    setEmploymentFilter('ALL');
    setExperienceFilter('ALL');
    setLocationFilter('ALL');
  };

  const hasActiveFilters = searchQuery || sportFilter !== 'ALL' || categoryFilter !== 'ALL' || employmentFilter !== 'ALL' || experienceFilter !== 'ALL' || locationFilter !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs Board</h1>
            <p className="text-slate-600 dark:text-slate-400">Find your next opportunity in sports</p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
            {stats.total} jobs
          </span>
          {stats.featured > 0 && (
            <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium flex items-center gap-1">
              <Star className="w-3 h-3" /> {stats.featured} featured
            </span>
          )}
          {stats.remote > 0 && (
            <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-1">
              <Globe className="w-3 h-3" /> {stats.remote} remote
            </span>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, clubs, locations..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sport Filter - Primary */}
          <div className="relative min-w-[180px]">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value as Sport | 'ALL')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sports</option>
              {Object.entries(SPORT_CONFIG).map(([sport, cfg]) => (
                <option key={sport} value={sport}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category - Sport-specific */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{formatCategory(cat)}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment</label>
                <select
                  value={employmentFilter}
                  onChange={(e) => setEmploymentFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="VOLUNTEER">Volunteer</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Experience</label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="ALL">All Levels</option>
                  <option value="ENTRY">Entry Level</option>
                  <option value="MID">Mid Level</option>
                  <option value="SENIOR">Senior Level</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>

              {/* Location Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="ALL">All Locations</option>
                  <option value="REMOTE">Remote Only</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site Only</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {jobs.length} results found
                </p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sport Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSportFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sportFilter === 'ALL'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
          }`}
        >
          All Sports
        </button>
        {Object.entries(SPORT_CONFIG).map(([sport, cfg]) => (
          <button
            key={sport}
            onClick={() => setSportFilter(sport as Sport)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              sportFilter === sport
                ? `bg-gradient-to-r ${cfg.color} text-white shadow-md`
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <span>{cfg.icon}</span>
            <span className="hidden sm:inline">{cfg.label}</span>
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No jobs found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Try adjusting your filters or search query</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-blue-600 dark:text-blue-400 hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Featured Jobs First */}
          {jobs.filter(j => j.isFeatured).map(job => (
            <JobCard key={job.id} job={job} featured />
          ))}
          {/* Regular Jobs */}
          {jobs.filter(j => !j.isFeatured).map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// JOB CARD COMPONENT
// =============================================================================

function JobCard({ job, featured = false }: { job: JobListing; featured?: boolean }) {
  const sportConfig = SPORT_CONFIG[job.club.sport];
  const daysUntilDeadline = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: job.currency || 'GBP', maximumFractionDigits: 0 });
    let salary = job.salaryMin && job.salaryMax
      ? `${fmt.format(job.salaryMin)} - ${fmt.format(job.salaryMax)}`
      : job.salaryMin ? `From ${fmt.format(job.salaryMin)}` : `Up to ${fmt.format(job.salaryMax!)}`;
    if (job.salaryPeriod) salary += ` ${job.salaryPeriod.toLowerCase()}`;
    return salary;
  };

  const salary = formatSalary();

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className={`block bg-white dark:bg-slate-800 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5 group ${
        featured
          ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800'
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Club Logo */}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${sportConfig ? `bg-gradient-to-br ${sportConfig.color}` : 'bg-slate-200 dark:bg-slate-700'}`}>
            {job.club.logo ? (
              <img src={job.club.logo} alt={job.club.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{sportConfig?.icon || '🏆'}</span>
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {featured && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {job.isUrgent && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Urgent
                </span>
              )}
              {job.hasApplied && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Applied
                </span>
              )}
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {sportConfig?.icon} {sportConfig?.label}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
              {job.title}
            </h3>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <span className="font-medium text-slate-900 dark:text-white">{job.club.name}</span>
              {job.club.isVerified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                {job.isRemote ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                {job.isRemote ? 'Remote' : [job.city, job.country].filter(Boolean).join(', ') || 'Location TBD'}
                {job.isHybrid && ' (Hybrid)'}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.employmentType.replace(/_/g, ' ')}
              </span>
              {salary && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  {salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job.applicationCount} applicants
              </span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
            {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                daysUntilDeadline <= 3
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : daysUntilDeadline <= 7
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                <Clock className="h-3 w-3 inline mr-1" />
                {daysUntilDeadline}d left
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden sm:block" />
          </div>
        </div>
      </div>
    </Link>
  );
}