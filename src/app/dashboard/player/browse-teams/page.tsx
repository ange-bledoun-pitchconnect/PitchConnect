/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Browse Teams v7.5.0 (Enterprise Multi-Sport)
 * Path: src/app/dashboard/player/browse-teams/page.tsx
 * ============================================================================
 *
 * FEATURES:
 * ✅ All 12 sports support
 * ✅ Advanced filtering (sport, age group, gender, location)
 * ✅ Join request management
 * ✅ Club-level and team-level browsing
 * ✅ Real-time membership status
 * ✅ Toast notifications
 * ✅ Dark mode support
 *
 * AFFECTED USER TYPES:
 * - PLAYER: Can browse and request to join teams
 * - PARENT: Can browse teams for children
 *
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  MapPin,
  Shield,
  Loader2,
  UserPlus,
  CheckCircle,
  Clock,
  Trophy,
  X,
  Check,
  Info,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  Filter,
  ChevronDown,
  Star,
  Calendar,
} from 'lucide-react';
import { Sport, SPORT_CONFIGS } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface Team {
  id: string;
  name: string;
  ageGroup: string | null;
  gender: string | null;
  status: string;
  club: {
    id: string;
    name: string;
    shortName: string | null;
    city: string | null;
    country: string;
    logo: string | null;
    sport: Sport;
    primaryColor: string | null;
  };
  _count: { players: number };
  hasJoinRequest?: boolean;
  isMember?: boolean;
}

// ============================================================================
// TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info';
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-success-500',
    error: 'bg-error-500',
    info: 'bg-info-500',
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up`}
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    setToasts((p) => [...p, { id: `${Date.now()}`, message, type }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    success: (m: string) => add(m, 'success'),
    error: (m: string) => add(m, 'error'),
    info: (m: string) => add(m, 'info'),
    remove,
  };
}

// ============================================================================
// CONSTANTS - All 12 Sports
// ============================================================================

const SPORTS: Array<{ value: Sport | 'ALL'; label: string; icon: string }> = [
  { value: 'ALL', label: 'All Sports', icon: '🏅' },
  { value: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { value: 'RUGBY', label: 'Rugby', icon: '🏉' },
  { value: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { value: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { value: 'AMERICAN_FOOTBALL', label: 'American Football', icon: '🏈' },
  { value: 'HOCKEY', label: 'Hockey', icon: '🏒' },
  { value: 'NETBALL', label: 'Netball', icon: '🏐' },
  { value: 'LACROSSE', label: 'Lacrosse', icon: '🥍' },
  { value: 'AUSTRALIAN_RULES', label: 'Australian Rules', icon: '🦘' },
  { value: 'GAELIC_FOOTBALL', label: 'Gaelic Football', icon: '🍀' },
  { value: 'FUTSAL', label: 'Futsal', icon: '⚽' },
  { value: 'BEACH_FOOTBALL', label: 'Beach Football', icon: '🏖️' },
];

const AGE_GROUPS = [
  { value: 'ALL', label: 'All Ages' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'U23', label: 'Under 23' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U10', label: 'Under 10' },
  { value: 'U8', label: 'Under 8' },
];

const GENDERS = [
  { value: 'ALL', label: 'All Genders' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'MIXED', label: 'Mixed' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BrowseTeamsPage() {
  const { toasts, success, error: showError, info, remove } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState<Sport | 'ALL'>('ALL');
  const [filterAgeGroup, setFilterAgeGroup] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/player/browse-teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      showError('Failed to load teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (teamId: string, teamName: string) => {
    try {
      setIsSubmitting(teamId);
      const res = await fetch('/api/player/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send join request');
      }

      success(`Join request sent to ${teamName}!`);
      await fetchTeams();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to send request');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterSport('ALL');
    setFilterAgeGroup('ALL');
    setFilterGender('ALL');
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.club.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesSport = filterSport === 'ALL' || team.club.sport === filterSport;
      const matchesAgeGroup = filterAgeGroup === 'ALL' || team.ageGroup === filterAgeGroup;
      const matchesGender = filterGender === 'ALL' || team.gender === filterGender;

      return matchesSearch && matchesSport && matchesAgeGroup && matchesGender && team.status === 'ACTIVE';
    });
  }, [teams, searchQuery, filterSport, filterAgeGroup, filterGender]);

  const hasActiveFilters = searchQuery || filterSport !== 'ALL' || filterAgeGroup !== 'ALL' || filterGender !== 'ALL';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/player"
          className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-gold">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">
              Browse Teams
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Find and join teams across all sports
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-charcoal-200 dark:border-charcoal-700">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams, clubs, cities..."
                className="w-full pl-10 pr-4 py-3 bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-gold-500 text-white border-gold-500'
                  : 'bg-charcoal-50 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 border-charcoal-200 dark:border-charcoal-600 hover:bg-charcoal-100 dark:hover:bg-charcoal-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="p-4 space-y-4 bg-charcoal-50 dark:bg-charcoal-800/50">
            {/* Sport Filter */}
            <div>
              <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2 flex items-center gap-2">
                🏅 Sport
              </p>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => setFilterSport(sport.value as Sport | 'ALL')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      filterSport === sport.value
                        ? 'bg-gold-500 text-white shadow-gold'
                        : 'bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-600 border border-charcoal-200 dark:border-charcoal-600'
                    }`}
                  >
                    <span>{sport.icon}</span> {sport.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group & Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age Group Filter */}
              <div>
                <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Age Group
                </p>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((group) => (
                    <button
                      key={group.value}
                      onClick={() => setFilterAgeGroup(group.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        filterAgeGroup === group.value
                          ? 'bg-info-500 text-white'
                          : 'bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-600 border border-charcoal-200 dark:border-charcoal-600'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gender
                </p>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((gender) => (
                    <button
                      key={gender.value}
                      onClick={() => setFilterGender(gender.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        filterGender === gender.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-white dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-600 border border-charcoal-200 dark:border-charcoal-600'
                      }`}
                    >
                      {gender.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
          <span className="font-semibold text-charcoal-900 dark:text-white">{filteredTeams.length}</span>{' '}
          {filteredTeams.length === 1 ? 'team' : 'teams'} found
          {hasActiveFilters && ' (filtered)'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-sm text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Clear Filters
          </button>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 p-12 text-center">
          <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No teams found</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Try adjusting your search filters</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-charcoal-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 mx-auto hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onJoinRequest={handleJoinRequest}
              isSubmitting={isSubmitting === team.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEAM CARD COMPONENT
// ============================================================================

function TeamCard({
  team,
  onJoinRequest,
  isSubmitting,
}: {
  team: Team;
  onJoinRequest: (teamId: string, teamName: string) => void;
  isSubmitting: boolean;
}) {
  const sportConfig = SPORT_CONFIGS[team.club.sport] || SPORT_CONFIGS.FOOTBALL;

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-200 dark:border-charcoal-700 shadow-sm overflow-hidden hover:shadow-lg hover:border-gold-300 dark:hover:border-gold-700 transition-all h-full flex flex-col group">
      {/* Header with primary color accent */}
      <div
        className="h-2"
        style={{
          background: team.club.primaryColor
            ? `linear-gradient(90deg, ${team.club.primaryColor}, ${team.club.primaryColor}88)`
            : 'linear-gradient(90deg, #D4AF37, #F59E0B)',
        }}
      />

      <div className="p-6 flex-1 flex flex-col">
        {/* Club & Sport Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md text-3xl">
            {sportConfig.icon}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="px-2 py-1 text-xs font-semibold rounded border bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 border-charcoal-300 dark:border-charcoal-600">
              {sportConfig.name}
            </span>
            {team.ageGroup && (
              <span className="px-2 py-1 text-xs font-semibold rounded border bg-info-100 dark:bg-info/20 text-info-700 dark:text-info-400 border-info-300 dark:border-info/30">
                {team.ageGroup}
              </span>
            )}
            {team.gender && team.gender !== 'MIXED' && (
              <span className="px-2 py-1 text-xs font-semibold rounded border bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30">
                {team.gender}
              </span>
            )}
          </div>
        </div>

        {/* Team Name */}
        <h3 className="text-xl font-bold text-charcoal-900 dark:text-white mb-3 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
          {team.name}
        </h3>

        {/* Club & Location Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300">
            <Shield className="w-4 h-4 flex-shrink-0 text-gold-500" />
            <span className="font-semibold text-sm truncate">{team.club.name}</span>
          </div>
          {team.club.city && (
            <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {team.club.city}, {team.club.country}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{team._count.players} members</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {team.isMember ? (
            <button
              disabled
              className="w-full py-3 bg-success-100 dark:bg-success/20 text-success-700 dark:text-success-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" /> Already a Member
            </button>
          ) : team.hasJoinRequest ? (
            <button
              disabled
              className="w-full py-3 bg-warning-100 dark:bg-warning/20 text-warning-700 dark:text-warning-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" /> Request Pending
            </button>
          ) : (
            <button
              onClick={() => onJoinRequest(team.id, team.name)}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-gold hover:shadow-gold-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Request to Join
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
