// ============================================================================
// src/components/dashboard/PerformanceChart.tsx
// Performance Chart Component with Line & Bar Charts
// ============================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChartData {
  week: string;
  [key: string]: string | number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((d) => Object.values(d).filter((v) => typeof v === 'number') as number[]),
  );

  const getColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  // Get keys for series (exclude 'week')
  const seriesKeys = Object.keys(data || {}).filter((k) => k !== 'week');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>Weekly performance comparison</CardDescription>
      </CardHeader>
      <CardContent>
        {/* LEGEND */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {seriesKeys.map((key, idx) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getColor(idx)}`} />
              <span className="text-sm text-charcoal-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
            </div>
          ))}
        </div>

        {/* CHART */}
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm font-medium text-charcoal-600 w-10">{item.week}</span>
              <div className="flex-1 flex gap-1 h-12">
                {seriesKeys.map((key, keyIdx) => {
                  const value = (item[key] as number) || 0;
                  const heightPercent = (value / maxValue) * 100;

                  return (
                    <div
                      key={`${idx}-${keyIdx}`}
                      className={`flex-1 rounded-t ${getColor(keyIdx)} transition-all relative group`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {value.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* INFO */}
        <div className="mt-6 pt-4 border-t border-neutral-200 text-xs text-charcoal-600">
          <p>Hover over bars to see exact values</p>
        </div>
      </CardContent>
    </Card>
  );
}
