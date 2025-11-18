/**
 * Player Stats Page
 * Comprehensive performance tracking and analytics
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  Users,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
} from 'lucide-react';

export default function PlayerStatsPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Statistics & Performance</h1>
        <p className="text-charcoal-600">2024/25 Season • Arsenal FC</p>
      </div>

      {/* KEY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Appearances */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            {getTrendIcon('up')}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Appearances</h3>
          <p className="text-4xl font-bold text-blue-600">12</p>
          <p className="text-xs text-green-600 font-semibold mt-2">+2 this month</p>
        </div>

        {/* Goals */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-gold-600" />
            </div>
            {getTrendIcon('up')}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Goals</h3>
          <p className="text-4xl font-bold text-gold-600">5</p>
          <p className="text-xs text-charcoal-500 mt-2">0.42 per game</p>
        </div>

        {/* Assists */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            {getTrendIcon('up')}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Assists</h3>
          <p className="text-4xl font-bold text-purple-600">3</p>
          <p className="text-xs text-charcoal-500 mt-2">0.25 per game</p>
        </div>
      </div>

      {/* DETAILED STATS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ATTACKING STATS */}
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-gold-600" />
              Attacking
            </CardTitle>
            <CardDescription>Goal-scoring metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Shots */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Total Shots</span>
                <span className="font-bold text-charcoal-900">24</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-gold-500 to-orange-400 h-3 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Shots on Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Shots on Target</span>
                <span className="font-bold text-charcoal-900">8</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style={{ width: '33%' }} />
              </div>
            </div>

            {/* xG */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Expected Goals (xG)</span>
                <span className="font-bold text-charcoal-900">4.2</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>

            {/* Insight */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Trophy className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-medium">
                  Excellent conversion! Outperforming xG (4.2 vs 5 goals)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DEFENSIVE STATS */}
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Defensive
            </CardTitle>
            <CardDescription>Defensive contributions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Tackles */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Tackles Won</span>
                <span className="font-bold text-charcoal-900">45</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Interceptions */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Interceptions</span>
                <span className="font-bold text-charcoal-900">12</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Passing */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Passing Accuracy</span>
                <span className="font-bold text-charcoal-900">87.5%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{ width: '87.5%' }} />
              </div>
            </div>

            {/* Insight */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 font-medium">
                  Strong defensive presence with excellent passing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PHYSICAL PERFORMANCE */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-500" />
            Physical Performance
          </CardTitle>
          <CardDescription>Distance & speed metrics</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-transparent rounded-xl border border-orange-200">
            <p className="text-sm text-charcoal-600 font-semibold mb-3">Distance Per Match</p>
            <p className="text-4xl font-bold text-orange-500 mb-2">10.2 km</p>
            <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
              <ArrowUp className="w-3 h-3" />
              Above team average
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-transparent rounded-xl border border-purple-200">
            <p className="text-sm text-charcoal-600 font-semibold mb-3">Top Speed</p>
            <p className="text-4xl font-bold text-purple-600 mb-2">32.4 km/h</p>
            <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
              <ArrowUp className="w-3 h-3" />
              Excellent fitness
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-gold-50 to-transparent rounded-xl border border-gold-200">
            <p className="text-sm text-charcoal-600 font-semibold mb-3">Sprints Per Match</p>
            <p className="text-4xl font-bold text-gold-600 mb-2">18</p>
            <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
              <ArrowUp className="w-3 h-3" />
              High intensity
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEASON COMPARISON */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Season Comparison
          </CardTitle>
          <CardDescription>Year-over-year performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    2023/24
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    2024/25
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {[
                  { metric: 'Appearances', prev: 10, curr: 12, change: '+20%' },
                  { metric: 'Goals', prev: 3, curr: 5, change: '+67%' },
                  { metric: 'Assists', prev: 1, curr: 3, change: '+200%' },
                  { metric: 'Avg Rating', prev: 6.8, curr: 7.2, change: '+5.9%' },
                ].map((stat) => (
                  <tr key={stat.metric} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-charcoal-900">{stat.metric}</td>
                    <td className="px-4 py-4 text-center text-charcoal-600">{stat.prev}</td>
                    <td className="px-4 py-4 text-center font-bold text-purple-600">{stat.curr}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center justify-center gap-1 inline-flex">
                        <ArrowUp className="w-3 h-3" />
                        {stat.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
