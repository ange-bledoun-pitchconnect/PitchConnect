'use client';

/**
 * PitchConnect League Dashboard Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/page.tsx
 *
 * Features:
 * ✅ Comprehensive league overview dashboard
 * ✅ Quick stats: teams, fixtures, format, registration status
 * ✅ Points system display with bonus points
 * ✅ League standings table (top 10)
 * ✅ Teams grid with club information
 * ✅ Quick navigation to manage, analytics, teams
 * ✅ Delete league functionality with confirmation
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Empty states with call-to-action
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Loading and error states
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Settings,
  Plus,
  Loader2,
  Shield,
  TrendingUp,
  Globe,
  Lock,
  EyeOff,
  Target,
  Star,
  CheckCircle,
  XCircle,
  BarChart3,
  Trash2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  country: string;
  season: number;
  status: string;
  format: string;
  visibility: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  logo?: string;
  configuration?: {
    minTeams: number;
    maxTeams: number;
    registrationOpen: boolean;
    bonusPointsEnabled: boolean;
    bonusPointsForGoals: number;
  };
  seasons?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isCurrent: boolean;
  }>;
  _count?: {
    teams: number;
    fixtures: number;
    standings: number;
    invitations: number;
  };
  teams: Array<{
    id: string;
    name: string;
    ageGroup?: string;
    category?: string;
    joinedAt?: string;
    club?: {
      name: string;
    };
  }>;
  standings: Array<{
    id: string;
    position: number;
    teamId: string;
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalDifference: number;
    points: number;
  }>;
  fixtures: any[];
  admin: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// TOAST COMPONENT (No External Dependency)
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: 'gold' | 'blue' | 'purple' | 'green' | 'red';
  href?: string;
}) => {
  const colorMap = {
    gold: 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  const cardClasses =
    'rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 transition-all hover:shadow-md dark:hover:shadow-charcoal-900/30';

  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-sm text-charcoal-600 dark:text-charcoal-400">
          {label}
        </p>
        <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
          {value}
        </p>
        {subtext && (
          <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-500">
            {subtext}
          </p>
        )}
      </div>
      <div className={`rounded-xl p-3 ${colorMap[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <div className={cardClasses}>{content}</div>
      </Link>
    );
  }

  return <div className={cardClasses}>{content}</div>;
};

// ============================================================================
// STANDINGS TABLE COMPONENT
// ============================================================================

const StandingsTable = ({ standings }: { standings: League['standings'] }) => {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
        <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
          No standings yet
        </h3>
        <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
          Add teams to generate league standings
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-charcoal-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Pos
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Team
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              P
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              W
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              D
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              L
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              GD
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.slice(0, 10).map((standing) => (
            <tr
              key={standing.id}
              className="border-b border-neutral-100 transition-colors hover:bg-gold-50 dark:border-charcoal-700 dark:hover:bg-charcoal-700/50"
            >
              <td className="px-4 py-3 text-charcoal-900 dark:text-white font-bold">
                {standing.position}
              </td>
              <td className="px-4 py-3">
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {standing.teamName || `Team ${standing.teamId.slice(0, 8)}`}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.played}
              </td>
              <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.won}
              </td>
              <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.drawn}
              </td>
              <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.lost}
              </td>
              <td className="px-4 py-3 text-center text-charcoal-700 dark:text-charcoal-300">
                {standing.goalDifference > 0 ? '+' : ''}
                {standing.goalDifference}
              </td>
              <td className="px-4 py-3 text-center font-bold text-gold-600 dark:text-gold-400">
                {standing.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// TEAM CARD COMPONENT
// ============================================================================

const TeamCard = ({
  team,
}: {
  team: League['teams'][number];
}) => {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-700">
      <div className="p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30">
            <Shield className="h-6 w-6 text-gold-600 dark:text-gold-400" />
          </div>
          <div>
            <p className="font-bold text-charcoal-900 dark:text-white">
              {team.name}
            </p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              {team.club?.name || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-block rounded-full border border-neutral-300 bg-white px-3 py-1 text-charcoal-700 dark:border-charcoal-600 dark:bg-charcoal-600 dark:text-charcoal-300">
            {team.ageGroup || team.category || 'N/A'}
          </span>
          <span className="text-charcoal-600 dark:text-charcoal-400">
            {team.joinedAt
              ? new Date(team.joinedAt).toLocaleDateString('en-GB')
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LeagueDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  const fetchLeagueData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch league');

      const data = await response.json();
      setLeague(data);
    } catch (error) {
      console.error('Error fetching league:', error);
      showToast('Failed to load league data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleDeleteLeague = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${league?.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete league');

      showToast('✅ League deleted successfully', 'success');
      setTimeout(() => {
        router.push('/dashboard/leagues');
      }, 1000);
    } catch (error) {
      console.error('Error deleting league:', error);
      showToast('Failed to delete league', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4" />;
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />;
      case 'UNLISTED':
        return <EyeOff className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading league...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // EMPTY STATE
  // ========================================================================

  if (!league) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
          <p className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
            League not found
          </p>
          <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
            The league you're looking for doesn't exist
          </p>
          <button
            onClick={() => router.push('/dashboard/leagues')}
            className="rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
          >
            Go to Leagues
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // CALCULATIONS
  // ========================================================================

  const totalTeams = league._count?.teams || league.teams.length || 0;
  const totalFixtures = league._count?.fixtures || league.fixtures.length || 0;
  const pendingInvitations = league._count?.invitations || 0;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/dashboard/leagues">
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Leagues
            </button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
                <Trophy className="h-12 w-12 text-white" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                    {league.name}
                  </h1>
                  <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-900/30 dark:text-gold-300">
                    {league.code}
                  </span>
                  <span className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-charcoal-700 dark:border-charcoal-600 dark:text-charcoal-300">
                    {league.season}/{league.season + 1}
                  </span>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                      league.status
                    )}`}
                  >
                    {league.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400">
                    {getVisibilityIcon(league.visibility)}
                    {league.visibility}
                  </p>
                  <span className="text-charcoal-400 dark:text-charcoal-600">
                    •
                  </span>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    {league.sport}
                  </p>
                  <span className="text-charcoal-400 dark:text-charcoal-600">
                    •
                  </span>
                  <p className="text-charcoal-600 dark:text-charcoal-400">
                    {league.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/dashboard/leagues/${leagueId}/teams`}>
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600">
                  <Plus className="h-4 w-4" />
                  Manage Teams
                </button>
              </Link>
              <Link href={`/dashboard/leagues/${leagueId}/manage`}>
                <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                  <Settings className="h-4 w-4" />
                  Manage
                </button>
              </Link>
              <Link href={`/dashboard/leagues/${leagueId}/analytics`}>
                <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </button>
              </Link>
              <button
                onClick={handleDeleteLeague}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-charcoal-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            label="Teams"
            value={totalTeams}
            subtext={
              league.configuration
                ? `Max: ${league.configuration.maxTeams || '∞'}`
                : undefined
            }
            icon={Shield}
            color="gold"
            href={`/dashboard/leagues/${leagueId}/teams`}
          />
          <StatCard
            label="Fixtures"
            value={totalFixtures}
            icon={Calendar}
            color="blue"
            href={`/dashboard/leagues/${leagueId}/fixtures`}
          />
          <StatCard
            label="Format"
            value={league.format.replace(/_/g, ' ')}
            icon={Target}
            color="purple"
          />
          <StatCard
            label="Registration"
            value={league.configuration?.registrationOpen ? 'Open' : 'Closed'}
            subtext={
              pendingInvitations > 0
                ? `${pendingInvitations} pending`
                : undefined
            }
            icon={
              league.configuration?.registrationOpen
                ? CheckCircle
                : XCircle
            }
            color={
              league.configuration?.registrationOpen ? 'green' : 'red'
            }
          />
        </div>

        {/* POINTS SYSTEM */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Trophy className="h-5 w-5 text-gold-500" />
              Points System
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    {league.pointsWin}
                  </span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  Win
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {league.pointsDraw}
                  </span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  Draw
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    {league.pointsLoss}
                  </span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                  Loss
                </span>
              </div>
              {league.configuration?.bonusPointsEnabled && (
                <>
                  <span className="text-charcoal-400 dark:text-charcoal-600">
                    •
                  </span>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-gold-500" />
                    <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      +{league.configuration.bonusPointsForGoals} per goal
                      (Bonus)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STANDINGS */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-gold-500" />
                League Standings
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Current league table
              </p>
            </div>
            <Link href={`/dashboard/leagues/${leagueId}/standings`}>
              <button className="rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                View Full Table
              </button>
            </Link>
          </div>
          <div className="p-6">
            <StandingsTable standings={league.standings} />
          </div>
        </div>

        {/* TEAMS */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <Users className="h-5 w-5 text-gold-500" />
                Teams
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Teams participating in this league
              </p>
            </div>
            <Link href={`/dashboard/leagues/${leagueId}/teams`}>
              <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
                <Plus className="h-4 w-4" />
                Manage Teams
              </button>
            </Link>
          </div>
          <div className="p-6">
            {league.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
                  No teams yet
                </h3>
                <p className="mb-6 text-charcoal-600 dark:text-charcoal-400">
                  Add teams to start your league competition
                </p>
                <Link href={`/dashboard/leagues/${leagueId}/teams`}>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600">
                    <Plus className="h-4 w-4" />
                    Add Teams
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {league.teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
