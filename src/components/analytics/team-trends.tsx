'use client';

import { useTeamTrend } from '@/hooks/useAdvancedAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Shield, Zap } from 'lucide-react';

interface TeamTrendsProps {
  clubId: string;
  clubName?: string;
  timeRange?: 'week' | 'month' | 'season';
  className?: string;
}

const getFormColor = (form: string) => {
  switch (form) {
    case 'excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'average':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getMomentumColor = (momentum: number) => {
  if (momentum > 20) return '#10b981'; // Green
  if (momentum > 0) return '#3b82f6'; // Blue
  if (momentum > -20) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
};

/**
 * Team Trends Component
 * Displays team performance trends and momentum
 */
export function TeamTrends({
  clubId,
  clubName = 'Team',
  timeRange = 'season',
  className = '',
}: TeamTrendsProps) {
  const { data, isLoading, error } = useTeamTrend(clubId, timeRange);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Failed to load team trend data</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const trends = data?.trends || [];
  const stats = data?.stats || {};

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {clubName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Team Trends & Momentum</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Form Badge */}
            <Badge className={getFormColor(stats.form)}>
              {stats.form?.toUpperCase() || 'UNKNOWN'}
            </Badge>

            {/* Momentum Score */}
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div
                className="text-3xl font-bold"
                style={{ color: getMomentumColor(stats.momentum) }}
              >
                {stats.momentum > 0 ? '+' : ''}
                {stats.momentum}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Momentum</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Win Rate', value: `${stats.winRate}%`, icon: '✅' },
          { label: 'Goals For', value: stats.goalsFor || 0, icon: '⚽' },
          { label: 'Goals Against', value: stats.goalsAgainst || 0, icon: '🛡️' },
          { label: 'Consistency', value: `${stats.consistency}%`, icon: '📊' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Points/Ratings Trend */}
      {trends.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Performance Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRating)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Attack vs Defense */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Attack vs Defense Efficiency
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Attack Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Goals per Match
              </span>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(stats.goalsFor / Math.max(1, stats.matches || 1)).toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Shots per Match
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(stats.shotsPerGame || 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Defense Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Clean Sheets
              </span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.cleanSheets || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Goals Against per Match
              </span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {(stats.goalsAgainst / Math.max(1, stats.matches || 1)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Record Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Match Record ({timeRange})
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.wins || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wins</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.draws || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Draws</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.losses || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Losses</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          {stats.total && (
            <>
              <div
                className="bg-green-500 h-2 rounded-l-full"
                style={{
                  width: `${(stats.wins / stats.total) * 100}%`,
                }}
              />
              <div
                className="bg-yellow-500 h-2"
                style={{
                  width: `${(stats.draws / stats.total) * 100}%`,
                }}
              />
              <div
                className="bg-red-500 h-2 rounded-r-full"
                style={{
                  width: `${(stats.losses / stats.total) * 100}%`,
                }}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
