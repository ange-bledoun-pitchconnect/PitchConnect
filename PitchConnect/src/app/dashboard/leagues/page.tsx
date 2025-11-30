'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  Target,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  MapPin,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  season: number;
  status: string;
  format: string;
  visibility: string;
  teams: Array<{ id: string }>;
  fixtures: Array<{ id: string }>;
  standings: Array<{ id: string }>;
  _count?: {
    teams: number;
    fixtures: number;
    standings: number;
  };
}

export default function LeaguesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm('Are you sure you want to delete this league?')) return;

    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete league');
      setLeagues(leagues.filter((l) => l.id !== leagueId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete league');
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

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'ROUND_ROBIN':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'KNOCKOUT':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'GROUP_KNOCKOUT':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      case 'PRIVATE':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  // Calculate stats
  const totalLeagues = leagues.length;
  const activeLeagues = leagues.filter((l) => l.status === 'ACTIVE').length;
  const totalTeams = leagues.reduce((acc, l) => acc + (l._count?.teams || 0), 0);
  const totalFixtures = leagues.reduce((acc, l) => acc + (l._count?.fixtures || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
              🏆 My Leagues
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              Manage all your leagues, teams, and fixtures
            </p>
          </div>
          <Link href="/dashboard/leagues/create">
            <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Create League
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Leagues */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">
                    Total Leagues
                  </p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white mt-2">
                    {totalLeagues}
                  </p>
                </div>
                <div className="bg-gold-100 dark:bg-gold-900/30 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Leagues */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">
                    Active
                  </p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white mt-2">
                    {activeLeagues}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Teams */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">
                    Total Teams
                  </p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white mt-2">
                    {totalTeams}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Fixtures */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">
                    Fixtures
                  </p>
                  <p className="text-3xl font-bold text-charcoal-900 dark:text-white mt-2">
                    {totalFixtures}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-200 dark:border-gold-800 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-charcoal-600 dark:text-charcoal-400 font-semibold">
                Loading leagues...
              </p>
            </div>
          </div>
        ) : leagues.length === 0 ? (
          /* Empty State */
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-neutral-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">
                No Leagues Yet
              </h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
                Create your first league to get started managing teams, fixtures, and standings.
              </p>
              <Link href="/dashboard/leagues/create">
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First League
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Leagues Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {leagues.map((league) => (
              <Card
                key={league.id}
                className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 hover:shadow-lg dark:hover:shadow-charcoal-900/30 transition-shadow"
              >
                <CardHeader className="border-b border-neutral-200 dark:border-charcoal-700 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-charcoal-900 dark:text-white">
                          {league.name}
                        </h3>
                        <Badge className={getStatusColor(league.status)}>
                          {league.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        {league.sport} • Season {league.season}
                      </p>
                    </div>
                    {/* Actions Dropdown */}
                    <div className="relative group">
                      <button className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-charcoal-800 rounded-lg shadow-xl border border-neutral-200 dark:border-charcoal-700 z-10 hidden group-hover:block">
                        <Link href={`/dashboard/leagues/${league.id}`}>
                          <button className="w-full text-left px-4 py-2 text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </Link>
                        <Link href={`/dashboard/leagues/${league.id}/edit`}>
                          <button className="w-full text-left px-4 py-2 text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteLeague(league.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* League Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Format */}
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium mb-1">
                        Format
                      </p>
                      <Badge className={getFormatBadgeColor(league.format)}>
                        {league.format.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    {/* Visibility */}
                    <div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium mb-1">
                        Visibility
                      </p>
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(league.visibility)}
                        <span className="text-sm text-charcoal-700 dark:text-charcoal-300">
                          {league.visibility}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 dark:bg-charcoal-700/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">
                        {league._count?.teams || 0}
                      </p>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                        Teams
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {league._count?.fixtures || 0}
                      </p>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                        Fixtures
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {league.code}
                      </p>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                        Code
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="border-t border-neutral-200 dark:border-charcoal-700 p-4 flex gap-2">
                  <Link href={`/dashboard/leagues/${league.id}/teams`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-neutral-200 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Teams
                    </Button>
                  </Link>
                  <Link href={`/dashboard/leagues/${league.id}/standings`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-neutral-200 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Standings
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
