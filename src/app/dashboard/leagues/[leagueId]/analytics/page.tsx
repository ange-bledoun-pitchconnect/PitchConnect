'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LeagueAnalytics {
  totalMatches: number;
  goalsPerMatch: number;
  averagePossession: number;
  averagePassAccuracy: number;
  topScorerGoals: number;
  topAssisterAssists: number;
  averageAttendance: number;
  offensiveRanking: Array<{ teamId: string; teamName: string; goals: number; rating: number }>;
  defensiveRanking: Array<{ teamId: string; teamName: string; goalsConceded: number; rating: number }>;
  topScorers: Array<{ playerId: string; playerName: string; teamName: string; goals: number }>;
  topAssisters: Array<{ playerId: string; playerName: string; teamName: string; assists: number }>;
  leagueParity: number;
  scoringTrend: string;
  competitivenessTrend: string;
}

interface Team {
  id: string;
  name: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export default function LeagueAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [analytics, setAnalytics] = useState<LeagueAnalytics | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'offensive' | 'defensive' | 'goals'>('offensive');

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
      
      // Fetch league data for team statistics
      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      if (leagueRes.ok) {
        const leagueData = await leagueRes.json();
        setTeams(leagueData.standings || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const data = {
      summary: {
        totalMatches: analytics.totalMatches,
        goalsPerMatch: analytics.goalsPerMatch,
        averagePossession: analytics.averagePossession,
        averagePassAccuracy: analytics.averagePassAccuracy,
        leagueParity: analytics.leagueParity,
      },
      trends: {
        scoringTrend: analytics.scoringTrend,
        competitivenessTrend: analytics.competitivenessTrend,
      },
      topPerformers: {
        topScorerGoals: analytics.topScorerGoals,
        topAssisterAssists: analytics.topAssisterAssists,
      },
    };

    const csv = JSON.stringify(data, null, 2);
    const blob = new Blob([csv], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `league-analytics-${new Date().toISOString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Analytics exported successfully!');
  };

  const getTrendIndicator = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'DECREASING':
        return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No analytics available</p>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Add teams and fixtures to generate analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leagues/${leagueId}`)}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">League Analytics</h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">Comprehensive statistics and insights</p>
              </div>
            </div>

            <Button 
              onClick={exportAnalytics} 
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Total Matches</p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{analytics.totalMatches}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Goals Per Match</p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                    {analytics.goalsPerMatch?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Avg Possession</p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                    {analytics.averagePossession?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Pass Accuracy</p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                    {analytics.averagePassAccuracy?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                {getTrendIndicator(analytics.scoringTrend || 'STABLE')}
                Scoring Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${getTrendColor(analytics.scoringTrend || 'STABLE')}`}>
                  {(analytics.scoringTrend || 'STABLE').replace(/_/g, ' ')}
                </span>
                <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">
                  {analytics.goalsPerMatch?.toFixed(2)} goals/match
                </Badge>
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-3">
                Average goals per match across all fixtures
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                {getTrendIndicator(analytics.competitivenessTrend || 'STABLE')}
                Competitiveness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${getTrendColor(analytics.competitivenessTrend || 'STABLE')}`}>
                  {(analytics.competitivenessTrend || 'STABLE').replace(/_/g, ' ')}
                </span>
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  Parity: {(analytics.leagueParity * 100)?.toFixed(0)}%
                </Badge>
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-3">
                How close teams are in ability (100% = perfectly balanced)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Trophy className="w-5 h-5 text-gold-500" />
                Top Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topScorers && analytics.topScorers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topScorers.slice(0, 5).map((scorer, index) => (
                    <div key={scorer.playerId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gold-100 dark:bg-gold-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gold-600 dark:text-gold-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal-900 dark:text-white">{scorer.playerName}</p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">{scorer.teamName}</p>
                        </div>
                      </div>
                      <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">
                        {scorer.goals} goals
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-charcoal-600 dark:text-charcoal-400">No scorer data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Zap className="w-5 h-5 text-blue-500" />
                Top Assisters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topAssisters && analytics.topAssisters.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topAssisters.slice(0, 5).map((assister, index) => (
                    <div key={assister.playerId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal-900 dark:text-white">{assister.playerName}</p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">{assister.teamName}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {assister.assists} assists
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-charcoal-600 dark:text-charcoal-400">No assist data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Best Offenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.offensiveRanking && analytics.offensiveRanking.length > 0 ? (
                <div className="space-y-3">
                  {analytics.offensiveRanking.slice(0, 5).map((team, index) => (
                    <div key={team.teamId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">#{index + 1}</span>
                        </div>
                        <p className="font-semibold text-charcoal-900 dark:text-white">{team.teamName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          {team.goals} goals
                        </Badge>
                        <span className="text-sm font-bold text-charcoal-600 dark:text-charcoal-400">
                          {team.rating.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-charcoal-600 dark:text-charcoal-400">No ranking data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Shield className="w-5 h-5 text-blue-500" />
                Best Defenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.defensiveRanking && analytics.defensiveRanking.length > 0 ? (
                <div className="space-y-3">
                  {analytics.defensiveRanking.slice(0, 5).map((team, index) => (
                    <div key={team.teamId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                        </div>
                        <p className="font-semibold text-charcoal-900 dark:text-white">{team.teamName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {team.goalsConceded} conceded
                        </Badge>
                        <span className="text-sm font-bold text-charcoal-600 dark:text-charcoal-400">
                          {team.rating.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-charcoal-600 dark:text-charcoal-400">No ranking data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
