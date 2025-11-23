'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Settings,
  Plus,
  Loader2,
  Shield,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface League {
  id: string;
  name: string;
  code: string;
  country: string;
  season: number;
  status: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  teams: any[];
  standings: any[];
  fixtures: any[];
  stats: {
    totalTeams: number;
    totalMatches: number;
    matchesPlayed: number;
    matchesRemaining: number;
  };
}

export default function LeagueDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  const fetchLeagueData = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch league');

      const data = await response.json();
      setLeague(data.league);
    } catch (error) {
      console.error('Error fetching league:', error);
      toast.error('Failed to load league data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading league...</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 mb-2">League not found</p>
          <p className="text-charcoal-600 mb-6">The league you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
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
            onClick={() => router.push('/dashboard')}
            className="mb-4 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900">
                    {league.name}
                  </h1>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                    {league.code}
                  </Badge>
                  <Badge variant="outline">
                    {league.season}/{league.season + 1}
                  </Badge>
                  <Badge
                    className={
                      league.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : ''
                    }
                  >
                    {league.status}
                  </Badge>
                </div>
                <p className="text-charcoal-600">{league.country}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/dashboard/leagues/${leagueId}/add-teams`}>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teams
                </Button>
              </Link>
              <Button variant="outline" className="hover:bg-purple-50">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Teams</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {league.stats.totalTeams}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Total Matches</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {league.stats.totalMatches}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Played</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {league.stats.matchesPlayed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {league.stats.matchesRemaining}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Points System */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              Points System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  Win: {league.pointsWin} pts
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                  Draw: {league.pointsDraw} pts
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  Loss: {league.pointsLoss} pts
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* League Standings */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  League Standings
                </CardTitle>
                <CardDescription>Current league table</CardDescription>
              </div>
              <Link href={`/dashboard/leagues/${leagueId}/standings`}>
                <Button variant="outline">View Full Table</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {league.standings.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No standings yet
                </h3>
                <p className="text-charcoal-600 mb-6">Add teams to generate league standings</p>
                <Link href={`/dashboard/leagues/${leagueId}/add-teams`}>
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teams
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">
                        Pos
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700">
                        Team
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        P
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        W
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        D
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        L
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        GD
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {league.standings.slice(0, 10).map((standing, index) => (
                      <tr key={standing.id} className="border-b border-neutral-100 hover:bg-purple-50">
                        <td className="py-3 px-4 font-bold text-charcoal-900">
                          {standing.position}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-charcoal-900">
                            {standing.teamName}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700">
                          {standing.played}
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700">
                          {standing.won}
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700">
                          {standing.drawn}
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700">
                          {standing.lost}
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700">
                          {standing.goalDifference > 0 ? '+' : ''}
                          {standing.goalDifference}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-charcoal-900">
                          {standing.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams in League */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Teams
                </CardTitle>
                <CardDescription>Teams participating in this league</CardDescription>
              </div>
              <Link href={`/dashboard/leagues/${leagueId}/add-teams`}>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teams
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {league.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No teams yet</h3>
                <p className="text-charcoal-600 mb-6">
                  Add teams to start your league competition
                </p>
                <Link href={`/dashboard/leagues/${leagueId}/add-teams`}>
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teams
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {league.teams.map((team) => (
                  <Card key={team.id} className="hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900">{team.name}</p>
                          <p className="text-sm text-charcoal-600">{team.clubName}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{team.ageGroup}</Badge>
                        <span className="text-charcoal-600">
                          Joined {new Date(team.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
