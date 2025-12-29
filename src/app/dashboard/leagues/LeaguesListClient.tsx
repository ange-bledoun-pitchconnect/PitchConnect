// =============================================================================
// 🏆 PITCHCONNECT - LEAGUES LIST CLIENT COMPONENT
// =============================================================================
// Interactive client component for leagues directory with advanced filters
// =============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Search,
  Filter,
  X,
  Globe,
  Lock,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type LeagueStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface LeagueListItem {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  status: LeagueStatus;
  format: string;
  visibility: string;
  logo: string | null;
  country: string;
  currentSeason: {
    id: string;
    name: string;
  } | null;
  stats: {
    teams: number;
    matches: number;
  };
  isAdmin: boolean;
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
}

interface LeaguesListClientProps {
  leagues: LeagueListItem[];
  stats: {
    total: number;
    active: number;
    totalTeams: number;
    totalMatches: number;
  };
  filterOptions: {
    sports: Sport[];
    statuses: LeagueStatus[];
    seasons: string[];
  };
  sportConfig: Record<Sport, SportConfig>;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function LeaguesListClient({
  leagues: initialLeagues,
  stats,
  filterOptions,
  sportConfig,
}: LeaguesListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<Sport | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<LeagueStatus | 'ALL'>('ALL');
  const [seasonFilter, setSeasonFilter] = useState<string | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState(initialLeagues);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Filter leagues
  const filteredLeagues = useMemo(() => {
    return leagues.filter(league => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        league.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        league.country.toLowerCase().includes(searchQuery.toLowerCase());

      // Sport filter
      const matchesSport = sportFilter === 'ALL' || league.sport === sportFilter;

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || league.status === statusFilter;

      // Season filter
      const matchesSeason = seasonFilter === 'ALL' || league.currentSeason?.name === seasonFilter;

      return matchesSearch && matchesSport && matchesStatus && matchesSeason;
    });
  }, [leagues, searchQuery, sportFilter, statusFilter, seasonFilter]);

  const activeFiltersCount = [sportFilter, statusFilter, seasonFilter].filter(f => f !== 'ALL').length;

  const clearFilters = () => {
    setSearchQuery('');
    setSportFilter('ALL');
    setStatusFilter('ALL');
    setSeasonFilter('ALL');
  };

  const handleDeleteLeague = async (leagueId: string, leagueName: string) => {
    if (!confirm(`Are you sure you want to delete "${leagueName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(leagueId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete league');

      setLeagues(prev => prev.filter(l => l.id !== leagueId));
      showToast(`${leagueName} deleted`, 'success');
    } catch (error) {
      showToast('Failed to delete league', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: LeagueStatus) => {
    const colors: Record<LeagueStatus, string> = {
      DRAFT: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      COMPLETED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[status] || colors.DRAFT;
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return <Globe className="w-4 h-4" />;
      case 'PRIVATE': return <Lock className="w-4 h-4" />;
      case 'UNLISTED': return <EyeOff className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              My Leagues
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your leagues, teams, and fixtures
            </p>
          </div>
          <Link
            href="/dashboard/leagues/create"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create League
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Leagues"
            value={stats.total}
            icon={<Trophy className="w-6 h-6 text-amber-500" />}
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            label="Total Teams"
            value={stats.totalTeams}
            icon={<Users className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            label="Total Matches"
            value={stats.totalMatches}
            icon={<Calendar className="w-6 h-6 text-purple-500" />}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leagues by name, code, or country..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {/* Sport Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Sport
                </label>
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value as Sport | 'ALL')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Sports</option>
                  {filterOptions.sports.map(sport => (
                    <option key={sport} value={sport}>
                      {sportConfig[sport].icon} {sportConfig[sport].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeagueStatus | 'ALL')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Statuses</option>
                  {filterOptions.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Season Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Season
                </label>
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Seasons</option>
                  {filterOptions.seasons.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {(searchQuery || activeFiltersCount > 0) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showing {filteredLeagues.length} of {leagues.length} leagues
          </p>
        )}

        {/* Leagues Grid */}
        {filteredLeagues.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || activeFiltersCount > 0 ? 'No leagues found' : 'No Leagues Yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery || activeFiltersCount > 0 
                ? 'Try adjusting your search or filters'
                : 'Create your first league to get started'
              }
            </p>
            {searchQuery || activeFiltersCount > 0 ? (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/dashboard/leagues/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First League
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLeagues.map(league => (
              <LeagueCard
                key={league.id}
                league={league}
                sportConfig={sportConfig[league.sport]}
                isDeleting={deletingId === league.id}
                onDelete={() => handleDeleteLeague(league.id, league.name)}
                getStatusColor={getStatusColor}
                getVisibilityIcon={getVisibilityIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function LeagueCard({
  league,
  sportConfig,
  isDeleting,
  onDelete,
  getStatusColor,
  getVisibilityIcon,
}: {
  league: LeagueListItem;
  sportConfig: { label: string; icon: string; color: string };
  isDeleting: boolean;
  onDelete: () => void;
  getStatusColor: (status: LeagueStatus) => string;
  getVisibilityIcon: (visibility: string) => React.ReactNode;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/30 transition-shadow overflow-hidden">
      {/* Sport Color Bar */}
      <div className={`h-1.5 bg-gradient-to-r ${sportConfig.color}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl">{sportConfig.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">{league.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(league.status)}`}>
                  {league.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {sportConfig.label} • {league.country}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {league.isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl z-20">
                    <Link
                      href={`/dashboard/leagues/${league.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    <Link
                      href={`/dashboard/leagues/${league.id}/settings`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      disabled={isDeleting}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Format</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {league.format.replace(/_/g, ' ')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Visibility</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {getVisibilityIcon(league.visibility)}
              {league.visibility}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{league.stats.teams}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Teams</p>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{league.stats.matches}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Matches</p>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{league.code}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Code</p>
          </div>
        </div>

        {/* Season */}
        {league.currentSeason && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Current Season: <span className="font-semibold text-slate-700 dark:text-slate-300">{league.currentSeason.name}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/leagues/${league.id}/teams`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            Teams
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}/standings`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Standings
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}`}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${sportConfig.color} text-white font-semibold rounded-lg transition-colors`}
          >
            <Eye className="w-4 h-4" />
            View
          </Link>
        </div>
      </div>
    </div>
  );
}