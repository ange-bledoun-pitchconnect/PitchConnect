'use client';

/**
 * PitchConnect League Analytics Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/analytics/page.tsx
 * 
 * Features:
 * ✅ Comprehensive league analytics dashboard
 * ✅ Key metrics: total matches, goals/match, possession, pass accuracy
 * ✅ Trend analysis: scoring trend, competitiveness tracking
 * ✅ Top performers: scorers and assisters leaderboards
 * ✅ Team rankings: best offenses and defenses
 * ✅ League parity statistics
 * ✅ JSON export functionality
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Loading and empty states
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  Users,
  Zap,
  Trophy,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  Shield,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface LeagueAnalytics {
  totalMatches: number;
  goalsPerMatch: number;
  averagePossession: number;
  averagePassAccuracy: number;
  topScorerGoals: number;
  topAssisterAssists: number;
  averageAttendance: number;
  offensiveRanking: Array<{
    teamId: string;
    teamName: string;
    goals: number;
    rating: number;
  }>;
  defensiveRanking: Array<{
    teamId: string;
    teamName: string;
    goalsConceded: number;
    rating: number;
  }>;
  topScorers: Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    goals: number;
  }>;
  topAssisters: Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    assists: number;
  }>;
  leagueParity: number;
  scoringTrend: string;
  competitivenessTrend: string;
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
    success: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
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
// METRIC CARD COMPONENT
// ============================================================================

const MetricCard = ({
  label,
  value,
  suffix = '',
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ElementType;
  color: 'blue' | 'orange' | 'purple' | 'green';
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-charcoal-600 dark:text-charcoal-400">
            {label}
          </p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
            {value}
            {suffix}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TREND CARD COMPONENT
// ============================================================================

const TrendCard = ({
  title,
  trend,
  metric,
  description,
}: {
  title: string;
  trend: string;
  metric: string;
  description: string;
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'DECREASING':
        return <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return 'text-green-600 dark:text-green-400';
      case 'DECREASING':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-orange-600 dark:text-orange-400';
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
        <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
          {getTrendIcon(trend || 'STABLE')}
          {title}
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span
            className={`text-lg font-bold ${getTrendColor(trend || 'STABLE')}`}
          >
            {(trend || 'STABLE').replace(/_/g, ' ')}
          </span>
          <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-900/30 dark:text-gold-300">
            {metric}
          </span>
        </div>
        <p className="mt-3 text-sm text-charcoal-600 dark:text-charcoal-400">
          {description}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// PERFORMER LIST COMPONENT
// ============================================================================

const PerformerList = ({
  title,
  icon: Icon,
  items,
  type,
}: {
  title: string;
  icon: React.ElementType;
  items: Array<{
    playerId: string;
    playerName: string;
    teamName: string;
    goals?: number;
    assists?: number;
  }>;
  type: 'scorer' | 'assister';
}) => {
  const badgeColor = type === 'scorer' ? 'gold' : 'blue';
  const statLabel = type === 'scorer' ? 'goals' : 'assists';

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
        <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
          <Icon className={`h-5 w-5 ${type === 'scorer' ? 'text-gold-500' : 'text-blue-500'}`} />
          {title}
        </h2>
      </div>
      <div className="p-6">
        {items && items.length > 0 ? (
          <div className="space-y-3">
            {items.slice(0, 5).map((performer, index) => (
              <div
                key={performer.playerId}
                className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-charcoal-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      type === 'scorer'
                        ? 'bg-gold-100 dark:bg-gold-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        type === 'scorer'
                          ? 'text-gold-600 dark:text-gold-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-white">
                      {performer.playerName}
                    </p>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                      {performer.teamName}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    type === 'scorer'
                      ? 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  {performer.goals || performer.assists} {statLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-charcoal-600 dark:text-charcoal-400">
            No {type} data available
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RANKING CARD COMPONENT
// ============================================================================

const RankingCard = ({
  title,
  icon: Icon,
  teams,
  type,
}: {
  title: string;
  icon: React.ElementType;
  teams: Array<{
    teamId: string;
    teamName: string;
    goals?: number;
    goalsConceded?: number;
    rating: number;
  }>;
  type: 'offensive' | 'defensive';
}) => {
  const color = type === 'offensive' ? 'green' : 'blue';

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
        <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
          <Icon
            className={`h-5 w-5 ${
              type === 'offensive'
                ? 'text-green-500'
                : 'text-blue-500'
            }`}
          />
          {title}
        </h2>
      </div>
      <div className="p-6">
        {teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.slice(0, 5).map((team, index) => (
              <div
                key={team.teamId}
                className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-charcoal-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      type === 'offensive'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        type === 'offensive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    {team.teamName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      type === 'offensive'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {type === 'offensive'
                      ? `${team.goals} goals`
                      : `${team.goalsConceded} conceded`}
                  </span>
                  <span className="text-sm font-bold text-charcoal-600 dark:text-charcoal-400">
                    {team.rating.toFixed(1)}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-charcoal-600 dark:text-charcoal-400">
            No ranking data available
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LeagueAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [analytics, setAnalytics] = useState<LeagueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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
    fetchAnalytics();
  }, [leagueId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to load analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // EXPORT HANDLER
  // ========================================================================

  const handleExportAnalytics = async () => {
    if (!analytics) return;

    setIsExporting(true);
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        summary: {
          totalMatches: analytics.totalMatches,
          goalsPerMatch: analytics.goalsPerMatch.toFixed(2),
          averagePossession: analytics.averagePossession.toFixed(1),
          averagePassAccuracy: analytics.averagePassAccuracy.toFixed(1),
          leagueParity: (analytics.leagueParity * 100).toFixed(0),
        },
        trends: {
          scoringTrend: analytics.scoringTrend,
          competitivenessTrend: analytics.competitivenessTrend,
        },
        topPerformers: {
          topScorerGoals: analytics.topScorerGoals,
          topAssisterAssists: analytics.topAssisterAssists,
          topScorers: analytics.topScorers.slice(0, 5),
          topAssisters: analytics.topAssisters.slice(0, 5),
        },
        rankings: {
          offensiveRanking: analytics.offensiveRanking.slice(0, 5),
          defensiveRanking: analytics.defensiveRanking.slice(0, 5),
        },
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `league-analytics-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('📊 Analytics exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export analytics', 'error');
    } finally {
      setIsExporting(false);
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
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // EMPTY STATE
  // ========================================================================

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
          <p className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
            No analytics available
          </p>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Add teams and fixtures to generate analytics
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to League
            </button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-2 text-4xl font-bold text-charcoal-900 dark:text-white">
                  League Analytics
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Comprehensive statistics and insights
                </p>
              </div>
            </div>

            <button
              onClick={handleExportAnalytics}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Matches"
            value={analytics.totalMatches}
            icon={Calendar}
            color="blue"
          />
          <MetricCard
            label="Goals Per Match"
            value={analytics.goalsPerMatch?.toFixed(2) || '0.00'}
            icon={Zap}
            color="orange"
          />
          <MetricCard
            label="Avg Possession"
            value={analytics.averagePossession?.toFixed(1) || '0'}
            suffix="%"
            icon={Target}
            color="purple"
          />
          <MetricCard
            label="Pass Accuracy"
            value={analytics.averagePassAccuracy?.toFixed(1) || '0'}
            suffix="%"
            icon={Shield}
            color="green"
          />
        </div>

        {/* TRENDS */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <TrendCard
            title="Scoring Trend"
            trend={analytics.scoringTrend || 'STABLE'}
            metric={`${analytics.goalsPerMatch?.toFixed(2)} goals/match`}
            description="Average goals per match across all fixtures"
          />
          <TrendCard
            title="Competitiveness"
            trend={analytics.competitivenessTrend || 'STABLE'}
            metric={`Parity: ${(analytics.leagueParity * 100)?.toFixed(0)}%`}
            description="How close teams are in ability (100% = perfectly balanced)"
          />
        </div>

        {/* TOP PERFORMERS */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PerformerList
            title="Top Scorers"
            icon={Trophy}
            items={analytics.topScorers}
            type="scorer"
          />
          <PerformerList
            title="Top Assisters"
            icon={Zap}
            items={analytics.topAssisters}
            type="assister"
          />
        </div>

        {/* TEAM RANKINGS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RankingCard
            title="Best Offenses"
            icon={TrendingUp}
            teams={analytics.offensiveRanking}
            type="offensive"
          />
          <RankingCard
            title="Best Defenses"
            icon={Shield}
            teams={analytics.defensiveRanking}
            type="defensive"
          />
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
