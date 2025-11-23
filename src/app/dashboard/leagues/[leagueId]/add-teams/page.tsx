'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Search,
  Loader2,
  Plus,
  CheckCircle,
  Shield,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  club: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  isInLeague: boolean;
}

export default function AddTeamsToLeaguePage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingTeamId, setAddingTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableTeams();
  }, [leagueId]);

  const fetchAvailableTeams = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/available-teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');

      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = async (teamId: string, teamName: string) => {
    setAddingTeamId(teamId);

    try {
      const response = await fetch(`/api/leagues/${leagueId}/add-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team');
      }

      toast.success(`✅ ${teamName} added to league!`);
      fetchAvailableTeams();
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add team');
    } finally {
      setAddingTeamId(null);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableTeams = filteredTeams.filter((t) => !t.isInLeague);
  const teamsInLeague = filteredTeams.filter((t) => t.isInLeague);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading teams...</p>
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

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Add Teams to League</h1>
              <p className="text-charcoal-600">Select teams to join the league</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name, club, or city..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Teams in League</p>
                <p className="text-3xl font-bold text-purple-600">{teamsInLeague.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Available Teams</p>
                <p className="text-3xl font-bold text-blue-600">{availableTeams.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 mb-1">Total Teams</p>
                <p className="text-3xl font-bold text-charcoal-900">{teams.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Teams */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-500" />
              Available Teams
            </CardTitle>
            <CardDescription>Teams that can be added to this league</CardDescription>
          </CardHeader>
          <CardContent>
            {availableTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No available teams
                </h3>
                <p className="text-charcoal-600">All teams have been added to the league</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="hover:shadow-lg transition-all border-2 hover:border-purple-300"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900">{team.name}</p>
                            <p className="text-sm text-charcoal-600">{team.club.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-charcoal-500" />
                        <span className="text-sm text-charcoal-600">
                          {team.club.city}, {team.club.country}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          {team.ageGroup}
                        </Badge>
                        <Badge variant="outline">{team.category.replace('_', ' ')}</Badge>
                      </div>

                      <Button
                        onClick={() => handleAddTeam(team.id, team.name)}
                        disabled={addingTeamId === team.id}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white"
                      >
                        {addingTeamId === team.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add to League
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams Already in League */}
        {teamsInLeague.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Teams in League
              </CardTitle>
              <CardDescription>Teams already participating in this league</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamsInLeague.map((team) => (
                  <Card key={team.id} className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-charcoal-900">{team.name}</p>
                            <p className="text-sm text-charcoal-600">{team.club.name}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-charcoal-500" />
                        <span className="text-sm text-charcoal-600">
                          {team.club.city}, {team.club.country}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          {team.ageGroup}
                        </Badge>
                        <Badge variant="outline">{team.category.replace('_', ' ')}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
