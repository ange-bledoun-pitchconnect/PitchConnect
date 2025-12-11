'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Loader2,
  Download,
  Search,
  Filter,
  Target,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Standing {
  id: string;
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

interface League {
  name: string;
  code: string;
  season: number;
}

export default function LeagueStandingsPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'points' | 'goalDifference' | 'goalsFor'>('position');

  useEffect(() => {
    fetchStandings();
  }, [leagueId]);

  const fetchStandings = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/standings`);
      if (!response.ok) throw new Error('Failed to fetch standings');

      const data = await response.json();
      setLeague(data.league);
      setStandings(data.standings);
    } catch (error) {
      console.error('Error fetching standings:', error);
      toast.error('Failed to load standings');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionChange = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-gold-500" />;
    if (position <= 3) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (position >= standings.length - 2) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-charcoal-400 dark:text-charcoal-600" />;
  };

  const getFormBadge = (result: string) => {
    switch (result) {
      case 'W':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">W</Badge>;
      case 'D':
        return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600">D</Badge>;
      case 'L':
        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600">L</Badge>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Position', 'Team', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'GD', 'Points'];
    const rows = standings.map((s) => [
      s.position,
      s.teamName,
      s.played,
      s.won,
      s.drawn,
      s.lost,
      s.goalsFor,
      s.goalsAgainst,
      s.goalDifference,
      s.points,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${league?.code}_standings_${league?.season}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Standings exported successfully!');
  };

  // Filter and sort standings
  const filteredStandings = standings
    .filter((standing) =>
      standing.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points || b.goalDifference - a.goalDifference;
        case 'goalDifference':
          return b.goalDifference - a.goalDifference;
        case 'goalsFor':
          return b.goalsFor - a.goalsFor;
        case 'position':
        default:
          return a.position - b.position;
      }
    });

  // Calculate statistics
  const totalGoals = standings.reduce((sum, s) => sum + s.goalsFor, 0);
  const avgGoalsPerTeam = standings.length > 0 ? (totalGoals / standings.length).toFixed(1) : '0';
  const topScorer = standings.reduce((max, s) => (s.goalsFor > max.goalsFor ? s : max), standings[0]);
  const maxMatches = Math.max(...standings.map((s) => s.played), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading standings...</p>
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

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>

              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">League Standings</h1>
                {league && (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-charcoal-600 dark:text-charcoal-400">{league.name}</p>
                    <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600">
                      {league.code}
                    </Badge>
                    <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                      {league.season}/{league.season + 1}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={exportToCSV} 
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {standings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Total Goals</p>
                    <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{totalGoals}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Avg Goals/Team</p>
                    <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{avgGoalsPerTeam}</p>
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
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">League Leader</p>
                    <p className="text-lg font-bold text-charcoal-900 dark:text-white truncate">
                      {standings[0]?.teamName}
                    </p>
                    <p className="text-sm text-gold-600 dark:text-gold-400 mt-1">
                      {standings[0]?.points} pts
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Top Scorer</p>
                    <p className="text-lg font-bold text-charcoal-900 dark:text-white truncate">
                      {topScorer?.teamName}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      {topScorer?.goalsFor} goals
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 dark:text-charcoal-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams..."
                  className="pl-10 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="position">Sort by Position</option>
                <option value="points">Sort by Points</option>
                <option value="goalDifference">Sort by Goal Difference</option>
                <option value="goalsFor">Sort by Goals Scored</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Standings Table */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Trophy className="w-5 h-5 text-gold-500" />
              Current Standings
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              {standings.length} teams • Updated after each match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No standings yet</h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">Add teams to generate league standings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200 dark:border-charcoal-700">
                      <th className="text-left py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        Pos
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        Team
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        P
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        W
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        D
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        L
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        GF
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        GA
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        GD
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        Pts
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700 dark:text-charcoal-300">
                        Form
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStandings.map((standing, index) => (
                      <tr
                        key={standing.id}
                        className={`border-b border-neutral-100 dark:border-charcoal-700 hover:bg-gold-50 dark:hover:bg-charcoal-700/50 transition-colors ${
                          index === 0
                            ? 'bg-gold-50 dark:bg-gold-900/10'
                            : index <= 2
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : index >= standings.length - 3
                            ? 'bg-red-50 dark:bg-red-900/10'
                            : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getPositionChange(standing.position)}
                            <span className="font-bold text-charcoal-900 dark:text-white text-lg">
                              {standing.position}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-charcoal-900 dark:text-white">
                            {standing.teamName}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.played}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.won}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.drawn}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.lost}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.goalsFor}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.goalsAgainst}
                        </td>
                        <td className="text-center py-4 px-4">
                          <span
                            className={`font-bold ${
                              standing.goalDifference > 0
                                ? 'text-green-600 dark:text-green-400'
                                : standing.goalDifference < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-charcoal-700 dark:text-charcoal-300'
                            }`}
                          >
                            {standing.goalDifference > 0 ? '+' : ''}
                            {standing.goalDifference}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="font-bold text-lg text-charcoal-900 dark:text-white">
                            {standing.points}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {standing.form.slice(-5).map((result, i) => (
                              <span key={i}>{getFormBadge(result)}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        {standings.length > 0 && (
          <Card className="mt-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-lg text-charcoal-900 dark:text-white">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold-50 dark:bg-gold-900/10 rounded border border-gold-200 dark:border-gold-700"></div>
                  <span className="text-sm text-charcoal-700 dark:text-charcoal-300">Champion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-700"></div>
                  <span className="text-sm text-charcoal-700 dark:text-charcoal-300">Promotion Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-700"></div>
                  <span className="text-sm text-charcoal-700 dark:text-charcoal-300">Relegation Zone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
