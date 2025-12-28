/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Browse Teams v2.0 (Multi-Sport)
 * Path: src/app/dashboard/player/browse-teams/page.tsx
 * ============================================================================
 * 
 * MULTI-SPORT FEATURES:
 * ✅ Sport filter (Football, Netball, Rugby, Basketball, etc.)
 * ✅ Sport-specific icons and colors
 * ✅ Age group filtering
 * ✅ Join request management
 * ✅ Dark mode support
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Users, MapPin, Shield, Loader2, UserPlus, CheckCircle, Clock,
  Trophy, X, Check, Info, AlertCircle, RotateCcw, ArrowLeft, Filter,
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
  };
  _count: { players: number };
  hasJoinRequest?: boolean;
  isMember?: boolean;
}

// ============================================================================
// TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info';
interface ToastMessage { id: string; type: ToastType; message: string }

const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
  const icons = { success: <Check className="w-5 h-5" />, error: <AlertCircle className="w-5 h-5" />, info: <Info className="w-5 h-5" /> };
  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      {icons[type]}<span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-4 h-4" /></button>
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const add = useCallback((message: string, type: ToastType) => {
    setToasts((p) => [...p, { id: `${Date.now()}`, message, type }]);
  }, []);
  const remove = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, success: (m: string) => add(m, 'success'), error: (m: string) => add(m, 'error'), remove };
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SPORTS: { value: Sport | 'ALL'; label: string; icon: string }[] = [
  { value: 'ALL', label: 'All Sports', icon: '🏅' },
  { value: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { value: 'NETBALL', label: 'Netball', icon: '🏐' },
  { value: 'RUGBY', label: 'Rugby', icon: '🏉' },
  { value: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { value: 'HOCKEY', label: 'Hockey', icon: '🏒' },
  { value: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { value: 'AMERICAN_FOOTBALL', label: 'American Football', icon: '🏈' },
  { value: 'GAELIC_FOOTBALL', label: 'Gaelic Football', icon: '🟢' },
];

const AGE_GROUPS = [
  { value: 'ALL', label: 'All Ages' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U14', label: 'Under 14' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BrowseTeamsPage() {
  const { toasts, success, error: showError, remove } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState<Sport | 'ALL'>('ALL');
  const [filterAgeGroup, setFilterAgeGroup] = useState('ALL');

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/player/browse-teams');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch {
      showError('Failed to load teams');
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
        throw new Error(err.error || 'Failed');
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
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.club.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesSport = filterSport === 'ALL' || team.club.sport === filterSport;
      const matchesAgeGroup = filterAgeGroup === 'ALL' || team.ageGroup === filterAgeGroup;
      return matchesSearch && matchesSport && matchesAgeGroup && team.status === 'ACTIVE';
    });
  }, [teams, searchQuery, filterSport, filterAgeGroup]);

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
        {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />)}
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/player" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700">
          <ArrowLeft className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white">Browse Teams</h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">Find and join teams across all sports</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-charcoal-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, clubs, cities..."
            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        {/* Sport Filter */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Sport
          </p>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.value}
                onClick={() => setFilterSport(sport.value)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  filterSport === sport.value
                    ? 'bg-gold-500 text-white'
                    : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                }`}
              >
                <span>{sport.icon}</span> {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age Group Filter */}
        <div>
          <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">Age Group</p>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((group) => (
              <button
                key={group.value}
                onClick={() => setFilterAgeGroup(group.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filterAgeGroup === group.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS INFO */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
          {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} found
          {(searchQuery || filterSport !== 'ALL' || filterAgeGroup !== 'ALL') && ' (filtered)'}
        </p>
        {(searchQuery || filterSport !== 'ALL' || filterAgeGroup !== 'ALL') && (
          <button onClick={handleResetFilters} className="text-sm text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> Clear Filters
          </button>
        )}
      </div>

      {/* TEAMS GRID */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 p-12 text-center">
          <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">No teams found</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Try adjusting your search filters</p>
          <button onClick={handleResetFilters} className="px-4 py-2 border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 mx-auto hover:bg-neutral-50 dark:hover:bg-charcoal-700">
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

function TeamCard({ team, onJoinRequest, isSubmitting }: {
  team: Team;
  onJoinRequest: (teamId: string, teamName: string) => void;
  isSubmitting: boolean;
}) {
  const sportConfig = SPORT_CONFIGS[team.club.sport] || SPORT_CONFIGS.FOOTBALL;

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl border border-neutral-200 dark:border-charcoal-700 shadow-sm overflow-hidden hover:shadow-lg hover:border-gold-300 dark:hover:border-gold-700 transition-all h-full flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md text-3xl">
            {sportConfig.icon}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="px-2 py-1 text-xs font-semibold rounded border bg-neutral-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-400 border-neutral-300 dark:border-charcoal-600">
              {sportConfig.name}
            </span>
            {team.ageGroup && (
              <span className="px-2 py-1 text-xs font-semibold rounded border bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                {team.ageGroup}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-3">{team.name}</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300">
            <Shield className="w-4 h-4 flex-shrink-0 text-gold-500" />
            <span className="font-semibold text-sm">{team.club.name}</span>
          </div>
          {team.club.city && (
            <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{team.club.city}, {team.club.country}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{team._count.players} members</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0 mt-auto">
        {team.isMember ? (
          <button disabled className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
            <CheckCircle className="w-4 h-4" /> Already a Member
          </button>
        ) : team.hasJoinRequest ? (
          <button disabled className="w-full py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
            <Clock className="w-4 h-4" /> Request Pending
          </button>
        ) : (
          <button
            onClick={() => onJoinRequest(team.id, team.name)}
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Request to Join</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}