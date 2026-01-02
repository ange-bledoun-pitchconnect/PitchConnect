/**
 * ============================================================================
 * Job Board Component
 * ============================================================================
 * 
 * Enterprise-grade job listing board with multi-sport support, department
 * categorization, and comprehensive filtering.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/job/JobBoard.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 schema sports)
 * - Department categorization (10 departments)
 * - Advanced search and filtering
 * - Location and remote work filters
 * - Salary range display
 * - Experience level filtering
 * - Application deadline tracking
 * - Pagination
 * - Loading skeletons
 * - Empty states
 * - Mobile responsive
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - All authenticated users can view jobs
 * - CLUB_MANAGER, CLUB_OWNER: Can post jobs
 * - ADMIN, SUPERADMIN: Full job management
 * 
 * ============================================================================
 */

'use client';

import { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Briefcase,
  Building2,
  DollarSign,
  Users,
  ChevronRight,
  Loader2,
  X,
  SlidersHorizontal,
  Globe,
  Calendar,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  type Sport,
  SPORT_CONFIG,
  ALL_SPORTS,
} from '@/config/sport-dashboard-config';
import {
  type JobType,
  type JobDepartment,
  type ExperienceLevel,
  JOB_TYPE_CONFIG,
  JOB_DEPARTMENT_CONFIG,
  EXPERIENCE_LEVEL_CONFIG,
  ALL_JOB_TYPES,
  ALL_JOB_DEPARTMENTS,
  ALL_EXPERIENCE_LEVELS,
} from '@/config/user-roles-config';

// =============================================================================
// TYPES
// =============================================================================

export interface JobClub {
  id: string;
  name: string;
  logo?: string | null;
  sport: Sport;
  location?: string;
  verified?: boolean;
}

export interface JobPosting {
  id: string;
  slug: string;
  title: string;
  club: JobClub;
  department: JobDepartment;
  type: JobType;
  experienceLevel?: ExperienceLevel;
  location?: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  currency?: string;
  showSalary: boolean;
  description?: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
  };
  isSaved?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
}

export interface JobFilters {
  search?: string;
  sport?: Sport[];
  department?: JobDepartment[];
  type?: JobType[];
  experienceLevel?: ExperienceLevel[];
  isRemote?: boolean;
  location?: string;
  clubId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EXPIRED';
}

export interface JobBoardProps {
  /** Initial jobs to display */
  initialJobs?: JobPosting[];
  /** Initial total count */
  initialTotal?: number;
  /** Filter by club ID */
  clubId?: string;
  /** Show filter panel */
  showFilters?: boolean;
  /** Show saved jobs toggle */
  showSavedToggle?: boolean;
  /** On save job callback */
  onSaveJob?: (jobId: string, saved: boolean) => Promise<void>;
  /** Fetch jobs function */
  fetchJobs?: (filters: JobFilters, pagination: { page: number; limit: number }) => Promise<{
    success: boolean;
    data?: { data: JobPosting[]; pagination: { total: number } };
  }>;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// SALARY FORMATTER
// =============================================================================

function formatSalary(
  min?: number,
  max?: number,
  type?: string,
  currency = 'GBP',
  show = true
): string {
  if (!show || (!min && !max)) return 'Competitive';

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const period = type === 'HOURLY' ? '/hr' : type === 'YEARLY' ? '/yr' : '';

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}${period}`;
  }
  if (min) {
    return `From ${formatter.format(min)}${period}`;
  }
  if (max) {
    return `Up to ${formatter.format(max)}${period}`;
  }

  return 'Competitive';
}

// =============================================================================
// JOB CARD SKELETON
// =============================================================================

function JobCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// JOB CARD COMPONENT
// =============================================================================

interface JobCardProps {
  job: JobPosting;
  onSave?: (jobId: string, saved: boolean) => Promise<void>;
}

function JobCard({ job, onSave }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(job.isSaved || false);

  const sportConfig = SPORT_CONFIG[job.club.sport];
  const typeConfig = JOB_TYPE_CONFIG[job.type];
  const departmentConfig = JOB_DEPARTMENT_CONFIG[job.department];
  const levelConfig = job.experienceLevel ? EXPERIENCE_LEVEL_CONFIG[job.experienceLevel] : null;

  const isDeadlineSoon = job.applicationDeadline
    ? new Date(job.applicationDeadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const isExpired = job.applicationDeadline ? isPast(new Date(job.applicationDeadline)) : false;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(job.id, !saved);
      setSaved(!saved);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Link href={`/jobs/${job.slug}`}>
      <Card
        className={cn(
          'transition-all duration-200 cursor-pointer',
          'hover:border-primary/50 hover:shadow-md',
          job.isFeatured && 'border-primary/30 bg-primary/5 dark:bg-primary/10',
          isExpired && 'opacity-60'
        )}
      >
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Club Logo */}
            <Avatar className="h-14 w-14 rounded-lg flex-shrink-0">
              <AvatarImage src={job.club.logo || undefined} alt={job.club.name} />
              <AvatarFallback className="rounded-lg text-lg bg-neutral-100 dark:bg-charcoal-700">
                {sportConfig?.icon || job.club.name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-charcoal-900 dark:text-white truncate hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    {job.isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                    {job.isFeatured && (
                      <Badge className="bg-amber-500 text-white text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1 mt-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.club.name}
                    {job.club.verified && (
                      <span className="text-primary" title="Verified Club">
                        ✓
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onSave && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
                      title={saved ? 'Remove from saved' : 'Save job'}
                    >
                      {isSaving ? (
                        <Loader2 className="h-5 w-5 animate-spin text-charcoal-400" />
                      ) : saved ? (
                        <BookmarkCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <Bookmark className="h-5 w-5 text-charcoal-400 hover:text-primary" />
                      )}
                    </button>
                  )}
                  <ChevronRight className="h-5 w-5 text-charcoal-400 flex-shrink-0" />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Sport */}
                <Badge variant="outline" className="gap-1">
                  <span>{sportConfig?.icon}</span>
                  {sportConfig?.name}
                </Badge>

                {/* Job Type */}
                <Badge className={cn(typeConfig.bgColor, typeConfig.textColor)}>
                  {typeConfig.label}
                </Badge>

                {/* Department */}
                <Badge variant="outline" className={cn(departmentConfig.textColor)}>
                  {departmentConfig.emoji} {departmentConfig.label}
                </Badge>

                {/* Experience Level */}
                {levelConfig && (
                  <Badge variant="outline">{levelConfig.label}</Badge>
                )}

                {/* Remote */}
                {job.isRemote && (
                  <Badge variant="outline" className="gap-1 text-blue-600 dark:text-blue-400">
                    <Globe className="h-3 w-3" />
                    Remote
                  </Badge>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-charcoal-600 dark:text-charcoal-400">
                {/* Location */}
                {(job.location || job.isRemote) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.isRemote ? (job.location ? `${job.location} (Remote)` : 'Remote') : job.location}
                  </span>
                )}

                {/* Salary */}
                {job.showSalary && (job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1 font-medium text-charcoal-900 dark:text-white">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatSalary(
                      job.salaryMin,
                      job.salaryMax,
                      job.salaryType,
                      job.currency,
                      job.showSalary
                    )}
                  </span>
                )}

                {/* Deadline */}
                {job.applicationDeadline && (
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      isExpired && 'text-red-600 dark:text-red-400',
                      isDeadlineSoon && !isExpired && 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {isExpired
                      ? 'Expired'
                      : `Apply by ${format(new Date(job.applicationDeadline), 'MMM d')}`}
                  </span>
                )}

                {/* Applications */}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Posted Time */}
              <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-3">
                Posted {formatDistanceToNow(new Date(job.createdAt))} ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function JobBoard({
  initialJobs = [],
  initialTotal = 0,
  clubId,
  showFilters = true,
  showSavedToggle = false,
  onSaveJob,
  fetchJobs,
  className,
}: JobBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Filter state
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<JobDepartment[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<JobType[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<ExperienceLevel[]>([]);
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [location, setLocation] = useState('');

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSports.length) count++;
    if (selectedDepartments.length) count++;
    if (selectedTypes.length) count++;
    if (selectedLevels.length) count++;
    if (isRemote !== undefined) count++;
    if (location) count++;
    return count;
  }, [selectedSports, selectedDepartments, selectedTypes, selectedLevels, isRemote, location]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load jobs when filters change
  useEffect(() => {
    if (!fetchJobs) return;

    startTransition(async () => {
      const filters: JobFilters = {
        search: debouncedSearch || undefined,
        sport: selectedSports.length > 0 ? selectedSports : undefined,
        department: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
        experienceLevel: selectedLevels.length > 0 ? selectedLevels : undefined,
        isRemote,
        location: location || undefined,
        status: 'PUBLISHED',
      };

      if (clubId) {
        filters.clubId = clubId;
      }

      const result = await fetchJobs(filters, { page, limit });

      if (result.success && result.data) {
        setJobs(result.data.data);
        setTotal(result.data.pagination.total);
      }
    });
  }, [
    debouncedSearch,
    selectedSports,
    selectedDepartments,
    selectedTypes,
    selectedLevels,
    isRemote,
    location,
    page,
    clubId,
    fetchJobs,
  ]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedSports([]);
    setSelectedDepartments([]);
    setSelectedTypes([]);
    setSelectedLevels([]);
    setIsRemote(undefined);
    setLocation('');
    setPage(1);
  }, []);

  // Toggle helpers
  const toggleSport = (sport: Sport) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
    setPage(1);
  };

  const toggleDepartment = (dept: JobDepartment) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
    setPage(1);
  };

  const toggleType = (type: JobType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(1);
  };

  const toggleLevel = (level: ExperienceLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
    setPage(1);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-400" />
          <Input
            type="text"
            placeholder="Search jobs, clubs, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && (
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 h-12 px-4">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 bg-primary text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>
                  Narrow down your job search with filters
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Sport Filter */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Sport</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ALL_SPORTS.map((sport) => {
                      const config = SPORT_CONFIG[sport];
                      const isSelected = selectedSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          onClick={() => toggleSport(sport)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            isSelected
                              ? 'bg-primary/20 text-primary ring-2 ring-primary'
                              : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                          )}
                        >
                          <span>{config.icon}</span>
                          <span className="truncate">{config.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Department Filter */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Department</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ALL_JOB_DEPARTMENTS.map((dept) => {
                      const config = JOB_DEPARTMENT_CONFIG[dept];
                      const isSelected = selectedDepartments.includes(dept);
                      return (
                        <button
                          key={dept}
                          onClick={() => toggleDepartment(dept)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            isSelected
                              ? 'bg-primary/20 text-primary ring-2 ring-primary'
                              : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                          )}
                        >
                          <span>{config.emoji}</span>
                          <span className="truncate">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Job Type Filter */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Job Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_JOB_TYPES.map((type) => {
                      const config = JOB_TYPE_CONFIG[type];
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            isSelected
                              ? cn(config.bgColor, config.textColor, 'ring-2 ring-current')
                              : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                          )}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Experience Level Filter */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Experience Level</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_EXPERIENCE_LEVELS.map((level) => {
                      const config = EXPERIENCE_LEVEL_CONFIG[level];
                      const isSelected = selectedLevels.includes(level);
                      return (
                        <button
                          key={level}
                          onClick={() => toggleLevel(level)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                            isSelected
                              ? 'bg-primary/20 text-primary ring-2 ring-primary'
                              : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                          )}
                        >
                          <div>{config.label}</div>
                          <div className="text-xs opacity-60">{config.yearsRange}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Remote Filter */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Work Type</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRemote(isRemote === true ? undefined : true)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                        isRemote === true
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500'
                          : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      Remote Only
                    </button>
                    <button
                      onClick={() => setIsRemote(isRemote === false ? undefined : false)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                        isRemote === false
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500'
                          : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                      On-site Only
                    </button>
                  </div>
                </div>

                {/* Location Input */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Location</Label>
                  <Input
                    type="text"
                    placeholder="City, region, or country..."
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <SheetFooter className="flex gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    Clear All
                  </Button>
                )}
                <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Active:</span>

          {selectedSports.map((sport) => (
            <Badge key={sport} variant="secondary" className="gap-1 pl-2">
              {SPORT_CONFIG[sport].icon} {SPORT_CONFIG[sport].name}
              <button onClick={() => toggleSport(sport)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedDepartments.map((dept) => (
            <Badge key={dept} variant="secondary" className="gap-1">
              {JOB_DEPARTMENT_CONFIG[dept].emoji} {JOB_DEPARTMENT_CONFIG[dept].label}
              <button onClick={() => toggleDepartment(dept)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {JOB_TYPE_CONFIG[type].label}
              <button onClick={() => toggleType(type)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedLevels.map((level) => (
            <Badge key={level} variant="secondary" className="gap-1">
              {EXPERIENCE_LEVEL_CONFIG[level].label}
              <button onClick={() => toggleLevel(level)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {isRemote !== undefined && (
            <Badge variant="secondary" className="gap-1">
              {isRemote ? 'Remote Only' : 'On-site Only'}
              <button onClick={() => setIsRemote(undefined)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {location && (
            <Badge variant="secondary" className="gap-1">
              📍 {location}
              <button onClick={() => setLocation('')} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            `${total} job${total !== 1 ? 's' : ''} found`
          )}
        </p>
        <Select defaultValue="newest">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="deadline">Deadline (soonest)</SelectItem>
            <SelectItem value="salary-high">Salary: High to Low</SelectItem>
            <SelectItem value="salary-low">Salary: Low to High</SelectItem>
            <SelectItem value="applications">Most applications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-16 w-16 text-charcoal-300 dark:text-charcoal-600 mb-4" />
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 text-center max-w-md">
                {activeFilterCount > 0
                  ? 'Try adjusting your filters to see more results'
                  : 'Check back later for new opportunities'}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} onSave={onSaveJob} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isPending}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-charcoal-600 dark:text-charcoal-400 px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || isPending}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

JobBoard.displayName = 'JobBoard';

export default JobBoard;
