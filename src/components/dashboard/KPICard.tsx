'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  icon?: React.ReactNode;
  backgroundColor?: string;
  loading?: boolean;
}

export function KPICard({
  label,
  value,
  unit = '',
  trend,
  icon,
  backgroundColor = 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div className={`${backgroundColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`${backgroundColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex-1">
          {label}
        </h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {unit && <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
      </div>

      {trend && (
        <div className={`mt-4 flex items-center gap-2 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {Math.abs(trend.value)}% {trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'no change'}
          </span>
        </div>
      )}
    </div>
  );
}

export default KPICard;
