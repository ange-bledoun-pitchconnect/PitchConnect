// ============================================================================
// 💼 JOB BOARD - PitchConnect v7.3.0
// ============================================================================
// Component for displaying and filtering job listings
// Supports search, filters, and pagination
// ============================================================================

'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
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

import { getJobPostings } from '@/actions/job.actions';
import { formatSalary } from '@/schemas/job.schema';
import type {
  JobPostingListItem,
  JobType,
  ExperienceLevel,
  JobPostingFilters,
} from '@/types/job.types';

// ============================================================================
// TYPES
// ============================================================================

interface JobBoardProps {
  initialJobs?: JobPostingListItem[];
  initialTotal?: number;
  clubId?: string;
  showFilters?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const JOB_TYPE_CONFIG: Record<JobType, { label: string; color: string }> = {
  FULL_TIME: { label: 'Full-time', color: 'bg-green-100 text-green-800' },
  PART_TIME: { label: 'Part-time', color: 'bg-blue-100 text-blue-800' },
  CONTRACT: { label: 'Contract', color: 'bg-purple-100 text-purple-800' },
  INTERNSHIP: { label: 'Internship', color: 'bg-orange-100 text-orange-800' },
  VOLUNTEER: { label: 'Volunteer', color: 'bg-pink-100 text-pink-800' },
  SEASONAL: { label: 'Seasonal', color: 'bg-amber-100 text-amber-800' },
  TEMPORARY: { label: 'Temporary', color: 'bg-gray-100 text-gray-800' },
};

const EXPERIENCE_LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'EXECUTIVE', label: 'Executive' },
];

const SPORT_ICONS: Record<string, string> = {
  FOOTBALL: '⚽',
  BASKETBALL: '🏀',
  RUGBY_UNION: '🏉',
  RUGBY_LEAGUE: '🏉',
  AMERICAN_FOOTBALL: '🏈',
  ICE_HOCKEY: '🏒',
  FIELD_HOCKEY: '🏑',
  VOLLEYBALL: '🏐',
  HANDBALL: '🤾',
  BASEBALL: '⚾',
  CRICKET: '🏏',
  LACROSSE: '🥍',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function JobBoard({
  initialJobs = [],
  initialTotal = 0,
  clubId,
  showFilters = true,
}: JobBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [jobs, setJobs] = useState<JobPostingListItem[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<JobType[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<ExperienceLevel[]>([]);
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [location, setLocation] = useState('');

  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = selectedTypes.length > 0 || selectedLevels.length > 0 || isRemote !== undefined || location !== '';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load jobs when filters change
  useEffect(() => {
    loadJobs();
  }, [debouncedSearch, selectedTypes, selectedLevels, isRemote, location, page]);

  const loadJobs = () => {
    startTransition(async () => {
      const filters: JobPostingFilters = {
        search: debouncedSearch || undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
        experienceLevel: selectedLevels.length > 0 ? selectedLevels : undefined,
        isRemote,
        location: location || undefined,
        status: 'PUBLISHED',
      };

      if (clubId) {
        filters.clubId = clubId;
      }

      const result = await getJobPostings(filters, { page, limit });

      if (result.success && result.data) {
        setJobs(result.data.data);
        setTotal(result.data.pagination.total);
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedLevels([]);
    setIsRemote(undefined);
    setLocation('');
    setPage(1);
  };

  // Toggle type filter
  const toggleType = (type: JobType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(1);
  };

  // Toggle level filter
  const toggleLevel = (level: ExperienceLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, description, or club..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showFilters && (
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTypes.length + selectedLevels.length + (isRemote !== undefined ? 1 : 0) + (location ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>
                  Narrow down your job search
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* Job Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Job Type</Label>
                  <div className="space-y-2">
                    {Object.entries(JOB_TYPE_CONFIG).map(([type, config]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type as JobType)}
                          onCheckedChange={() => toggleType(type as JobType)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm cursor-pointer"
                        >
                          {config.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Experience Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Experience Level</Label>
                  <div className="space-y-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <div key={level.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`level-${level.value}`}
                          checked={selectedLevels.includes(level.value)}
                          onCheckedChange={() => toggleLevel(level.value)}
                        />
                        <label
                          htmlFor={`level-${level.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {level.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Remote */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Work Location</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote-yes"
                        checked={isRemote === true}
                        onCheckedChange={(checked) =>
                          setIsRemote(checked ? true : undefined)
                        }
                      />
                      <label htmlFor="remote-yes" className="text-sm cursor-pointer">
                        Remote positions only
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    placeholder="City or region..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button onClick={() => setFiltersOpen(false)}>
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {JOB_TYPE_CONFIG[type].label}
              <button onClick={() => toggleType(type)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedLevels.map((level) => (
            <Badge key={level} variant="secondary" className="gap-1">
              {EXPERIENCE_LEVELS.find((l) => l.value === level)?.label}
              <button onClick={() => toggleLevel(level)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {isRemote && (
            <Badge variant="secondary" className="gap-1">
              Remote
              <button onClick={() => setIsRemote(undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {location && (
            <Badge variant="secondary" className="gap-1">
              {location}
              <button onClick={() => setLocation('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isPending ? 'Loading...' : `${total} job${total !== 1 ? 's' : ''} found`}
        </p>
        <Select
          defaultValue="newest"
          onValueChange={(value) => {
            // Handle sort change
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="salary-high">Salary: High to Low</SelectItem>
            <SelectItem value="salary-low">Salary: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {isPending ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Check back later for new opportunities'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Club Logo */}
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={job.club.logo || undefined} />
                      <AvatarFallback className="rounded-lg text-lg">
                        {SPORT_ICONS[job.club.sport] || job.club.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job.club.name}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge
                          variant="secondary"
                          className={JOB_TYPE_CONFIG[job.type].color}
                        >
                          {JOB_TYPE_CONFIG[job.type].label}
                        </Badge>
                        {job.experienceLevel && (
                          <Badge variant="outline">
                            {EXPERIENCE_LEVELS.find((l) => l.value === job.experienceLevel)?.label}
                          </Badge>
                        )}
                        {job.isRemote && (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Remote
                          </Badge>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        {(job.location || job.isRemote) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.isRemote ? 'Remote' : job.location}
                          </span>
                        )}
                        {(job.salaryMin || job.salaryMax) && job.showSalary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatSalary(
                              job.salaryMin,
                              job.salaryMax,
                              job.salaryType,
                              job.currency,
                              job.showSalary
                            )}
                          </span>
                        )}
                        {job.applicationDeadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Apply by {format(new Date(job.applicationDeadline), 'MMM d')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Posted Time */}
                      <p className="text-xs text-muted-foreground mt-3">
                        Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isPending}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
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

export default JobBoard;