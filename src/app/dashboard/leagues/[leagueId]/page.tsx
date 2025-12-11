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
  Edit,
  Trash2,
  Globe,
  Lock,
  EyeOff,
  Target,
  Star,
  Award,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  country: string;
  season: number;
  status: string;
  format: string;
  visibility: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  logo?: string;
  configuration?: {
    minTeams: number;
    maxTeams: number;
    registrationOpen: boolean;
    bonusPointsEnabled: boolean;
    bonusPointsForGoals: number;
  };
  seasons?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    isCurrent: boolean;
  }>;
  _count?: {
    teams: number;
    fixtures: number;
    standings: number;
    invitations: number;
  };
  teams: any[];
  standings: any[];
  fixtures: any[];
  admin: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function LeagueDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLeagueData();
  }, [id]);

  const fetchLeagueData = async () => {
    try {
      const response = await fetch(`/api/leagues/${id}`);
      if (!response.ok) throw new Error('Failed to fetch league');

      const data = await response.json();
      setLeague(data);
    } catch (error) {
      console.error('Error fetching league:', error);
      toast.error('Failed to load league data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLeague = async () => {
    if (!confirm(`Are you sure you want to delete "${league?.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leagues/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete league');

      toast.success('League deleted successfully');
      router.push('/dashboard/leagues');
    } catch (error) {
      console.error('Error deleting league:', error);
      toast.error('Failed to delete league');
    } finally {
      setIsDeleting(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />;
      case 'UNLISTED':
        return <EyeOff className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading league...</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">League not found</p>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">The league you're looking for doesn't exist</p>
          <Button 
            onClick={() => router.push('/dashboard/leagues')} 
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
          >
            Go to Leagues
          </Button>
        </div>
      </div>
    );
  }

  const totalTeams = league._count?.teams || league.teams.length || 0;
  const totalFixtures = league._count?.fixtures || league.fixtures.length || 0;
  const totalStandings = league._count?.standings || league.standings.length || 0;
  const pendingInvitations = league._count?.invitations || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/leagues')}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900 dark:text-white">
                    {league.name}
                  </h1>
                  <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600">
                    {league.code}
                  </Badge>
                  <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                    {league.season}/{league.season + 1}
                  </Badge>
                  <Badge className={getStatusColor(league.status)}>
                    {league.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2">
                    {getVisibilityIcon(league.visibility)}
                    {league.visibility}
                  </p>
                  <span className="text-charcoal-400 dark:text-charcoal-600">•</span>
                  <p className="text-charcoal-600 dark:text-charcoal-400">{league.sport}</p>
                  <span className="text-charcoal-400 dark:text-charcoal-600">•</span>
                  <p className="text-charcoal-600 dark:text-charcoal-400">{league.country}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/dashboard/leagues/${id}/teams`}>
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Teams
                </Button>
              </Link>
              <Link href={`/dashboard/leagues/${id}/edit`}>
                <Button 
                  variant="outline" 
                  className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDeleteLeague}
                disabled={isDeleting}
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards - ENHANCED */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Teams */}
          <Link href={`/dashboard/leagues/${id}/teams`}>
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 cursor-pointer hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-gold-300 dark:hover:border-gold-600 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Teams</p>
                    <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                      {totalTeams}
                    </p>
                    {league.configuration && (
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-1">
                        Max: {league.configuration.maxTeams || '∞'}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Total Fixtures */}
          <Link href={`/dashboard/leagues/${id}/fixtures`}>
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 cursor-pointer hover:shadow-lg dark:hover:shadow-charcoal-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Fixtures</p>
                    <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                      {totalFixtures}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* League Format */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Format</p>
                  <p className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {league.format.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Status */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Registration</p>
                  <p className="text-lg font-bold text-charcoal-900 dark:text-white">
                    {league.configuration?.registrationOpen ? 'Open' : 'Closed'}
                  </p>
                  {pendingInvitations > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      {pendingInvitations} pending
                    </p>
                  )}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    league.configuration?.registrationOpen
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  {league.configuration?.registrationOpen ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Points System */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Trophy className="w-5 h-5 text-gold-500" />
              Points System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{league.pointsWin}</span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Win</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{league.pointsDraw}</span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Draw</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">{league.pointsLoss}</span>
                </div>
                <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Loss</span>
              </div>
              {league.configuration?.bonusPointsEnabled && (
                <>
                  <span className="text-charcoal-400 dark:text-charcoal-600">•</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold-500" />
                    <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      +{league.configuration.bonusPointsForGoals} per goal (Bonus)
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* League Standings */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                  <TrendingUp className="w-5 h-5 text-gold-500" />
                  League Standings
                </CardTitle>
                <CardDescription className="text-charcoal-600 dark:text-charcoal-400">Current league table</CardDescription>
              </div>
              <Link href={`/dashboard/leagues/${id}/standings`}>
                <Button 
                  variant="outline" 
                  className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                >
                  View Full Table
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {league.standings.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">
                  No standings yet
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">Add teams to generate league standings</p>
                <Link href={`/dashboard/leagues/${id}/teams`}>
                  <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teams
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-charcoal-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">Pos</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">Team</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">P</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">W</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">D</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">L</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">GD</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {league.standings.slice(0, 10).map((standing: any, index: number) => (
                      <tr 
                        key={standing.id} 
                        className="border-b border-neutral-100 dark:border-charcoal-700 hover:bg-gold-50 dark:hover:bg-charcoal-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-charcoal-900 dark:text-white">
                          {standing.position}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-charcoal-900 dark:text-white">
                            {standing.teamName || `Team ${standing.teamId.slice(0, 8)}`}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-charcoal-700 dark:text-charcoal-300">{standing.played}</td>
                        <td className="text-center py-3 px-4 text-charcoal-700 dark:text-charcoal-300">{standing.won}</td>
                        <td className="text-center py-3 px-4 text-charcoal-700 dark:text-charcoal-300">{standing.drawn}</td>
                        <td className="text-center py-3 px-4 text-charcoal-700 dark:text-charcoal-300">{standing.lost}</td>
                        <td className="text-center py-3 px-4 text-charcoal-700 dark:text-charcoal-300">
                          {standing.goalDifference > 0 ? '+' : ''}
                          {standing.goalDifference}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-gold-600 dark:text-gold-400">
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
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                  <Users className="w-5 h-5 text-gold-500" />
                  Teams
                </CardTitle>
                <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                  Teams participating in this league
                </CardDescription>
              </div>
              <Link href={`/dashboard/leagues/${id}/teams`}>
                <Button 
                  variant="outline" 
                  className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Teams
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {league.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">No teams yet</h3>
                <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
                  Add teams to start your league competition
                </p>
                <Link href={`/dashboard/leagues/${id}/teams`}>
                  <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teams
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {league.teams.map((team: any) => (
                  <Card 
                    key={team.id} 
                    className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-200 dark:border-charcoal-600 hover:shadow-lg dark:hover:shadow-charcoal-900/30 transition-all"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{team.club?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Badge 
                          variant="outline" 
                          className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                        >
                          {team.ageGroup || team.category}
                        </Badge>
                        <span className="text-charcoal-600 dark:text-charcoal-400">
                          Joined {team.joinedAt ? new Date(team.joinedAt).toLocaleDateString() : 'N/A'}
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
