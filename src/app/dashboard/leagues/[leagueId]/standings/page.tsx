'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Loader2,
  Download,
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
    return <Minus className="w-5 h-5 text-charcoal-400" />;
  };

  const getFormBadge = (result: string) => {
    switch (result) {
      case 'W':
        return <Badge className="bg-green-100 text-green-700 border-green-300">W</Badge>;
      case 'D':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">D</Badge>;
      case 'L':
        return <Badge className="bg-red-100 text-red-700 border-red-300">L</Badge>;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leagues/${leagueId}`)}
            className="mb-4 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>

              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 mb-2">League Standings</h1>
                {league && (
                  <div className="flex items-center gap-3">
                    <p className="text-charcoal-600">{league.name}</p>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      {league.code}
                    </Badge>
                    <Badge variant="outline">
                      {league.season}/{league.season + 1}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={exportToCSV} variant="outline" className="hover:bg-purple-50">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Standings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              Current Standings
            </CardTitle>
            <CardDescription>
              {standings.length} teams • Updated after each match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standings.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No standings yet</h3>
                <p className="text-charcoal-600">Add teams to generate league standings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="text-left py-4 px-4 text-sm font-bold text-charcoal-700">
                        Pos
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-charcoal-700">
                        Team
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        P
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        W
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        D
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        L
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        GF
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        GA
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        GD
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        Pts
                      </th>
                      <th className="text-center py-4 px-4 text-sm font-bold text-charcoal-700">
                        Form
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr
                        key={standing.id}
                        className={`border-b border-neutral-100 hover:bg-purple-50 transition-colors ${
                          index === 0
                            ? 'bg-gold-50'
                            : index <= 2
                            ? 'bg-green-50'
                            : index >= standings.length - 3
                            ? 'bg-red-50'
                            : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getPositionChange(standing.position)}
                            <span className="font-bold text-charcoal-900 text-lg">
                              {standing.position}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-charcoal-900">
                            {standing.teamName}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.played}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.won}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.drawn}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.lost}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.goalsFor}
                        </td>
                        <td className="text-center py-4 px-4 text-charcoal-700">
                          {standing.goalsAgainst}
                        </td>
                        <td className="text-center py-4 px-4">
                          <span
                            className={`font-bold ${
                              standing.goalDifference > 0
                                ? 'text-green-600'
                                : standing.goalDifference < 0
                                ? 'text-red-600'
                                : 'text-charcoal-700'
                            }`}
                          >
                            {standing.goalDifference > 0 ? '+' : ''}
                            {standing.goalDifference}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="font-bold text-lg text-charcoal-900">
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold-50 rounded border border-gold-200"></div>
                  <span className="text-sm text-charcoal-700">Champion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded border border-green-200"></div>
                  <span className="text-sm text-charcoal-700">Promotion Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-50 rounded border border-red-200"></div>
                  <span className="text-sm text-charcoal-700">Relegation Zone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
