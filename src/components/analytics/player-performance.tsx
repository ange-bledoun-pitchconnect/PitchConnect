'use client';

import { usePlayerPerformance } from '@/hooks/useAdvancedAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Trophy, Zap } from 'lucide-react';

interface PlayerPerformanceProps {
  playerId: string;
  playerName?: string;
  position?: string;
  className?: string;
}

const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return 'text-green-600 bg-green-50';
    case 'down':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4" />;
    case 'down':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

/**
 * Player Performance Analytics Component
 * Displays comprehensive player statistics with charts
 */
export function PlayerPerformanceAnalytics({
  playerId,
  playerName = 'Player',
  position = 'Unknown',
  className = '',
}: PlayerPerformanceProps) {
  const { data, isLoading, error } = usePlayerPerformance(playerId);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Failed to load player performance data</p>
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

  const stats = data?.stats || {};
  const performanceHistory = data?.history || [];
  const radarData = data?.radarChart || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {playerName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{position}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats.overallRating?.toFixed(1) || '-'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall</p>
            </div>

            {/* Trend Badge */}
            <div className={`p-3 rounded-lg ${getTrendColor(stats.trend)}`}>
              <div className="flex items-center gap-2">
                {getTrendIcon(stats.trend)}
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase">Trend</p>
                  <p className="text-lg font-bold">
                    {stats.trendPercentage > 0 ? '+' : ''}
                    {stats.trendPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Goals', value: stats.goals, icon: '⚽' },
          { label: 'Assists', value: stats.assists, icon: '🎯' },
          { label: 'Appearances', value: stats.appearances, icon: '📋' },
          { label: 'Pass Acc.', value: `${stats.passAccuracy}%`, icon: '⬅️' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Performance Trend Chart */}
      {performanceHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Radar Chart - Skills Assessment */}
      {radarData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Skills Assessment
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Rating"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Disciplinary Record */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Disciplinary Record
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.yellowCards || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yellow Cards
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.redCards || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Red Cards
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {(stats.foulsPerGame || 0).toFixed(1)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fouls/Game
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
