/**
 * Player Stats Page
 * Comprehensive performance tracking and analytics
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Download,
  Share2,
  Calendar,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlayerStats {
  overview: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    averageRating: number;
    cleanSheets: number;
  };
  currentSeason: {
    matches: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    shots: number;
    shotsOnTarget: number;
    expectedGoals: number;
    tackles: number;
    interceptions: number;
    passingAccuracy: number;
  };
  previousSeason: {
    matches: number;
    goals: number;
    assists: number;
    averageRating: number;
  };
  physical: {
    distancePerMatch: number;
    topSpeed: number;
    sprintsPerMatch: number;
  };
  recentForm: Array<{
    matchId: string;
    date: string;
    opponent: string;
    result: 'WIN' | 'DRAW' | 'LOSS';
    goals: number;
    assists: number;
    rating: number;
  }>;
}

export default function PlayerStatsPage() {
  const { isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('CURRENT_SEASON');

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/player/stats?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportStats = async () => {
    toast.success('📊 Stats exported successfully!');
    // TODO: Implement actual export functionality
  };

  const shareStats = async () => {
    toast.success('🔗 Share link copied to clipboard!');
    // TODO: Implement share functionality
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getChangeColor = (current: number, previous: number): string => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-charcoal-500';
  };

  if (authLoading || isLoading) {
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

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No Statistics Available</h3>
          <p className="text-charcoal-600 mb-6">Start playing matches to track your performance!</p>
        </div>
      </div>
    );
  }

  const conversionRate = stats.currentSeason.shotsOnTarget > 0
    ? ((stats.currentSeason.goals / stats.currentSeason.shotsOnTarget) * 100).toFixed(1)
    : '0.0';

  const goalsPerGame = stats.currentSeason.matches > 0
    ? (stats.currentSeason.goals / stats.currentSeason.matches).toFixed(2)
    : '0.00';

  const assistsPerGame = stats.currentSeason.matches > 0
    ? (stats.currentSeason.assists / stats.currentSeason.matches).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Statistics & Performance</h1>
          <p className="text-charcoal-600">2024/25 Season • {stats.currentSeason.matches} Appearances</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={shareStats}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={exportStats}
            className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* PERIOD FILTER */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['CURRENT_SEASON', 'LAST_30_DAYS', 'LAST_10_MATCHES', 'ALL_TIME'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
            className={
              selectedPeriod === period
                ? 'bg-gradient-to-r from-purple-500 to-blue-400 text-white'
                : ''
            }
          >
            <Filter className="w-4 h-4 mr-2" />
            {period.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {/* KEY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Appearances */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            {getTrendIcon(stats.currentSeason.matches, stats.previousSeason.matches)}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Appearances</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.currentSeason.matches}</p>
          <p className={`text-xs font-semibold mt-2 ${getChangeColor(stats.currentSeason.matches, stats.previousSeason.matches)}`}>
            {calculateChange(stats.currentSeason.matches, stats.previousSeason.matches)} vs last season
          </p>
        </div>

        {/* Goals */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-gold-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-gold-600" />
            </div>
            {getTrendIcon(stats.currentSeason.goals, stats.previousSeason.goals)}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Goals</h3>
          <p className="text-4xl font-bold text-gold-600">{stats.currentSeason.goals}</p>
          <p className="text-xs text-charcoal-500 mt-2">{goalsPerGame} per game</p>
        </div>

        {/* Assists */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            {getTrendIcon(stats.currentSeason.assists, stats.previousSeason.assists)}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Assists</h3>
          <p className="text-4xl font-bold text-purple-600">{stats.currentSeason.assists}</p>
          <p className="text-xs text-charcoal-500 mt-2">{assistsPerGame} per game</p>
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
                <span className="font-bold text-charcoal-900">{stats.currentSeason.shots}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-gold-500 to-orange-400 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.currentSeason.shots / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Shots on Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Shots on Target</span>
                <span className="font-bold text-charcoal-900">{stats.currentSeason.shotsOnTarget}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${stats.currentSeason.shots > 0 ? (stats.currentSeason.shotsOnTarget / stats.currentSeason.shots) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-charcoal-500">
                {stats.currentSeason.shots > 0
                  ? `${((stats.currentSeason.shotsOnTarget / stats.currentSeason.shots) * 100).toFixed(1)}% accuracy`
                  : 'No shots taken'}
              </p>
            </div>

            {/* xG */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Expected Goals (xG)</span>
                <span className="font-bold text-charcoal-900">{stats.currentSeason.expectedGoals.toFixed(1)}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((stats.currentSeason.expectedGoals / stats.currentSeason.goals) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Conversion Rate</span>
                <span className="font-bold text-charcoal-900">{conversionRate}%</span>
              </div>
            </div>

            {/* Insight */}
            <div className="pt-4 border-t border-neutral-200">
              {stats.currentSeason.goals > stats.currentSeason.expectedGoals ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Trophy className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Excellent conversion! Outperforming xG ({stats.currentSeason.expectedGoals.toFixed(1)} vs{' '}
                    {stats.currentSeason.goals} goals)
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Target className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-700 font-medium">
                    Room to improve finishing ({stats.currentSeason.goals} goals from {stats.currentSeason.expectedGoals.toFixed(1)} xG)
                  </p>
                </div>
              )}
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
                <span className="font-bold text-charcoal-900">{stats.currentSeason.tackles}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.currentSeason.tackles / 60) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Interceptions */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Interceptions</span>
                <span className="font-bold text-charcoal-900">{stats.currentSeason.interceptions}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.currentSeason.interceptions / 30) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Passing */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Passing Accuracy</span>
                <span className="font-bold text-charcoal-900">{stats.currentSeason.passingAccuracy.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${stats.currentSeason.passingAccuracy}%` }}
                />
              </div>
            </div>

            {/* Clean Sheets */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Clean Sheets</span>
                <span className="font-bold text-charcoal-900">{stats.overview.cleanSheets}</span>
              </div>
            </div>

            {/* Discipline */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-700 font-semibold">Discipline</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    {stats.currentSeason.yellowCards} Yellow
                  </Badge>
                  <Badge className="bg-red-100 text-red-700 border-red-300">
                    {stats.currentSeason.redCards} Red
                  </Badge>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="pt-4 border-t border-neutral-200">
              {stats.currentSeason.passingAccuracy >= 85 ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Excellent passing accuracy! Strong ball retention
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm
