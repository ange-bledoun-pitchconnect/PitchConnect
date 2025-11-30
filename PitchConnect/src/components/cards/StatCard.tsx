/**
 * Stat Card Component
 * Displays key metrics with icons and trends
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    label?: string;
  };
  color?: 'blue' | 'gold' | 'purple' | 'green' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  size = 'md',
  onClick,
}: StatCardProps) {
  const colorMap = {
    blue: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    gold: { bg: 'from-gold-100 to-orange-100', text: 'text-gold-600', badge: 'bg-gold-50 text-gold-700' },
    purple: { bg: 'from-purple-100 to-purple-200', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    green: { bg: 'from-green-100 to-green-200', text: 'text-green-600', badge: 'bg-green-50 text-green-700' },
    orange: { bg: 'from-orange-100 to-orange-200', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700' },
    red: { bg: 'from-red-100 to-red-200', text: 'text-red-600', badge: 'bg-red-50 text-red-700' },
  };

  const sizeMap = {
    sm: { icon: 'w-10 h-10', title: 'text-sm', value: 'text-2xl', padding: 'p-4' },
    md: { icon: 'w-12 h-12', title: 'text-base', value: 'text-3xl', padding: 'p-6' },
    lg: { icon: 'w-14 h-14', title: 'text-lg', value: 'text-4xl', padding: 'p-8' },
  };

  const { bg, text, badge } = colorMap[color];
  const { icon: iconSize, title: titleSize, value: valueSize, padding } = sizeMap[size];

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 border-neutral-200 rounded-xl ${padding} hover:shadow-lg hover:border-${color}-300 transition-all transform hover:scale-102 cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-${iconSize.split('-')[1]} h-${iconSize.split('-')[1]} bg-gradient-to-br ${bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <div className={`${text}`}>{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${badge}`}>
            {getTrendIcon()}
            {trend.direction === 'up' || trend.direction === 'down' ? (
              <span>{Math.abs(trend.percentage)}%</span>
            ) : (
              <span>{trend.percentage}%</span>
            )}
          </div>
        )}
      </div>

      <p className={`text-charcoal-600 font-medium mb-1 ${titleSize}`}>{title}</p>
      <p className={`font-bold text-charcoal-900 ${valueSize}`}>{value}</p>

      {subtitle && <p className="text-xs text-charcoal-500 mt-2">{subtitle}</p>}
    </div>
  );
}
