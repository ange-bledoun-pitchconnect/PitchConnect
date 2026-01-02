/**
 * ============================================================================
 * Chart & KPI Components
 * ============================================================================
 * 
 * Enterprise-grade visualization components.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All dashboard users
 * - ANALYST: Data visualization
 * - COACH: Performance tracking
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// KPI CARD
// =============================================================================

export interface KPICardProps {
  /** KPI label */
  label: string;
  /** KPI value */
  value: string | number;
  /** Unit (%, pts, etc.) */
  unit?: string;
  /** Trend information */
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    label?: string;
  };
  /** Icon */
  icon?: React.ReactNode;
  /** Background color class */
  backgroundColor?: string;
  /** Loading state */
  loading?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Sparkline data */
  sparklineData?: number[];
  /** Custom class name */
  className?: string;
}

export function KPICard({
  label,
  value,
  unit = '',
  trend,
  icon,
  backgroundColor = 'bg-gradient-to-br from-primary/5 to-primary/10',
  loading = false,
  size = 'md',
  sparklineData,
  className,
}: KPICardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw sparkline
  useEffect(() => {
    if (!canvasRef.current || !sparklineData || sparklineData.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Calculate points
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((val, i) => ({
      x: padding + ((width - 2 * padding) * i) / (sparklineData.length - 1),
      y: padding + ((height - 2 * padding) * (1 - (val - min) / range)),
    }));

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = trend?.direction === 'up' ? '#22c55e' : trend?.direction === 'down' ? '#ef4444' : '#6b7280';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }, [sparklineData, trend?.direction]);

  if (loading) {
    return (
      <div className={cn(backgroundColor, 'rounded-lg p-6 border border-gray-200 dark:border-gray-700', className)}>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        </div>
      </div>
    );
  }

  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueStyles = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div
      className={cn(
        backgroundColor,
        'rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow',
        sizeStyles[size],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={cn('font-bold text-gray-900 dark:text-white', valueStyles[size])}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3">
          <canvas
            ref={canvasRef}
            width={100}
            height={30}
            className="w-full"
          />
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div className={cn('mt-4 flex items-center gap-2', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {Math.abs(trend.value)}%{' '}
            {trend.label || (trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'no change')}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LINE CHART
// =============================================================================

export interface LineChartDataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  /** Chart data */
  data: LineChartDataPoint[];
  /** Chart height */
  height?: number;
  /** Line color */
  color?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Show labels */
  showLabels?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
}

export function LineChart({
  data,
  height = 200,
  color = '#3b82f6',
  showGrid = true,
  showLabels = true,
  loading = false,
  className,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = canvas.offsetWidth - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min/max
    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values) * 1.1;
    const minValue = Math.min(...values) * 0.9;
    const range = maxValue - minValue || 1;

    // Clear
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.offsetWidth, height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * i) / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.offsetWidth - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        if (showLabels) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          const labelValue = maxValue - (range * i) / 5;
          ctx.fillText(labelValue.toFixed(0), padding.left - 10, y + 4);
        }
      }
    }

    // Calculate points
    const points = data.map((point, i) => ({
      x: padding.left + (chartWidth * i) / (data.length - 1 || 1),
      y: padding.top + chartHeight - ((point.value - minValue) / range) * chartHeight,
    }));

    // Draw area gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw points
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels
    if (showLabels) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      data.forEach((point, i) => {
        if (data.length <= 7 || i % Math.ceil(data.length / 7) === 0) {
          const x = padding.left + (chartWidth * i) / (data.length - 1 || 1);
          ctx.fillText(point.label, x, height - 10);
        }
      });
    }
  }, [data, height, color, showGrid, showLabels, loading]);

  if (loading) {
    return (
      <div
        style={{ height }}
        className={cn(
          'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse',
          className
        )}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className={cn(
          'w-full rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center',
          className
        )}
      >
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        style={{ height, width: '100%' }}
      />
    </div>
  );
}

// =============================================================================
// PERFORMANCE CHART
// =============================================================================

export interface PerformanceChartData {
  week: string;
  [key: string]: string | number;
}

export interface PerformanceChartProps {
  /** Chart data */
  data: PerformanceChartData[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Custom class name */
  className?: string;
}

export function PerformanceChart({
  data,
  title = 'Performance Trend',
  description = 'Weekly performance comparison',
  className,
}: PerformanceChartProps) {
  // Get series keys (exclude 'week')
  const seriesKeys = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter((k) => k !== 'week');
  }, [data]);

  // Find max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(
      ...data.flatMap((d) =>
        seriesKeys.map((k) => (typeof d[k] === 'number' ? d[k] : 0) as number)
      ),
      1
    );
  }, [data, seriesKeys]);

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
  const colorLabels = ['text-blue-600', 'text-green-600', 'text-orange-600', 'text-purple-600', 'text-pink-600'];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {seriesKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', colors[idx % colors.length])} />
              <span className={cn('text-sm capitalize', colorLabels[idx % colorLabels.length])}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                {item.week}
              </span>
              <div className="flex-1 flex gap-1 h-10 items-end">
                {seriesKeys.map((key, keyIdx) => {
                  const value = (typeof item[key] === 'number' ? item[key] : 0) as number;
                  const heightPercent = (value / maxValue) * 100;

                  return (
                    <div
                      key={`${idx}-${keyIdx}`}
                      className={cn(
                        'flex-1 rounded-t transition-all relative group cursor-pointer',
                        colors[keyIdx % colors.length]
                      )}
                      style={{ height: `${heightPercent}%`, minHeight: value > 0 ? '4px' : '0' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          Hover over bars to see exact values
        </p>
      </CardContent>
    </Card>
  );
}

KPICard.displayName = 'KPICard';
LineChart.displayName = 'LineChart';
PerformanceChart.displayName = 'PerformanceChart';

export default { KPICard, LineChart, PerformanceChart };
