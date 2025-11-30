/**
 * Manager Analytics Page
 * Comprehensive club and performance analytics
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  Trophy,
  AlertCircle,
  Award,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function ManagerAnalyticsPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Club Analytics</h1>
        <p className="text-charcoal-600">Performance metrics and insights across all clubs</p>
      </div>

      {/* KEY METRICS */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Win Rate</h3>
          <p className="text-4xl font-bold text-green-600">68%</p>
          <p className="text-xs text-charcoal-500 mt-2">+5% vs last month</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-gold-600" />
            </div>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Goals Per Match</h3>
          <p className="text-4xl font-bold text-gold-600">2.4</p>
          <p className="text-xs text-charcoal-500 mt-2">Average across clubs</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowDown className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Injuries</h3>
          <p className="text-4xl font-bold text-orange-500">8</p>
          <p className="text-xs text-charcoal-500 mt-2">Current</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Titles Won</h3>
          <p className="text-4xl font-bold text-blue-600">7</p>
          <p className="text-xs text-charcoal-500 mt-2">This season</p>
        </div>
      </div>

      {/* DETAILED ANALYTICS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* CLUB PERFORMANCE */}
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gold-600" />
              Club Performance
            </CardTitle>
            <CardDescription>Ranking and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Arsenal FC', wins: 18, draws: 3, losses: 2, points: 57 },
                { name: 'Manchester United', wins: 16, draws: 4, losses: 3, points: 52 },
                { name: 'Liverpool Youth', wins: 15, draws: 5, losses: 3, points: 50 },
              ].map((club, idx) => (
                <div key={club.name} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center font-bold text-white text-sm">
                        {idx + 1}
                      </div>
                      <p className="font-bold text-charcoal-900">{club.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gold-600">{club.points}</p>
                      <p className="text-xs text-charcoal-600">points</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-charcoal-600">
                    <span>W: <span className="font-bold text-green-600">{club.wins}</span></span>
                    <span>D: <span className="font-bold text-yellow-600">{club.draws}</span></span>
                    <span>L: <span className="font-bold text-red-600">{club.losses}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PLAYER PERFORMANCE */}
        <Card className="bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              Top Performers
            </CardTitle>
            <CardDescription>Best players this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'John Smith', club: 'Arsenal', goals: 12, assists: 8 },
                { name: 'Marcus Johnson', club: 'Man Utd', goals: 15, assists: 5 },
                { name: 'Emma Taylor', club: 'Liverpool', goals: 11, assists: 9 },
              ].map((player, idx) => (
                <div key={player.name} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-charcoal-900">{player.name}</p>
                      <p className="text-xs text-charcoal-600">{player.club}</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-charcoal-700">
                      ⚽ <span className="font-bold text-gold-600">{player.goals} goals</span>
                    </span>
                    <span className="text-charcoal-700">
                      🎯 <span className="font-bold text-purple-600">{player.assists} assists</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TEAM STATISTICS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Team Statistics
          </CardTitle>
          <CardDescription>Overall performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {[
                  { metric: 'Matches Played', total: 92, avg: 30.7 },
                  { metric: 'Goals Scored', total: 218, avg: 2.4 },
                  { metric: 'Goals Conceded', total: 87, avg: 0.9 },
                  { metric: 'Clean Sheets', total: 34, avg: 37 },
                  { metric: 'Cards Received', total: 156, avg: 1.7 },
                ].map((stat) => (
                  <tr key={stat.metric} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-charcoal-900">{stat.metric}</td>
                    <td className="px-4 py-4 text-right font-bold text-blue-600">{stat.total}</td>
                    <td className="px-4 py-4 text-right font-bold text-charcoal-700">{stat.avg}</td>
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
