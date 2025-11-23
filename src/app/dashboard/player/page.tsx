'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Users,
  Trophy,
  Activity,
  Shield,
  MapPin,
  Loader2,
  Search,
  Clock,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: number | null;
  preferredFoot: string;
  nationality: string;
  teams: any[];
  pendingRequests: any[];
  stats: {
    totalTeams: number;
    totalMatches: number;
    totalGoals: number;
    pendingRequests: number;
  };
}

export default function PlayerDashboard() {
  const router = useRouter();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/player/dashboard');
      if (!response.ok) throw new Error('Failed to fetch player data');
      const data = await response.json();
      setPlayerData(data.player);
    } catch (err) {
      console.error('Error fetching player data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load player data');
      toast.error('Failed to load player data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <User className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
            Unable to load dashboard
          </h3>
          <p className="text-charcoal-600 mb-6">{error || 'Player profile not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900 mb-2">
                  {playerData.firstName} {playerData.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    {playerData.position.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">{playerData.preferredFoot} FOOTED</Badge>
                  {playerData.jerseyNumber && <Badge>#{playerData.jerseyNumber}</Badge>}
                </div>
              </div>
            </div>

            <Link href="/dashboard/player/profile">
              <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
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
                    {playerData.stats.totalTeams}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Matches</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {playerData.stats.totalMatches}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Goals</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {playerData.stats.totalGoals}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-charcoal-900">
                    {playerData.stats.pendingRequests}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/player/browse-teams">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gold-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center">
                    <Search className="w-7 h-7 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal-900 mb-1">Browse Teams</h3>
                    <p className="text-sm text-charcoal-600">Find and join teams in your area</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/player/profile">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gold-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal-900 mb-1">My Profile</h3>
                    <p className="text-sm text-charcoal-600">Update your player information</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Teams */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold-500" />
                  My Teams
                </CardTitle>
                <CardDescription>Teams you're currently playing for</CardDescription>
              </div>
              <Link href="/dashboard/player/browse-teams">
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Find More Teams
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {playerData.teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No teams yet</h3>
                <p className="text-charcoal-600 mb-6">
                  Browse and join teams to start playing
                </p>
                <Link href="/dashboard/player/browse-teams">
                  <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Teams
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerData.teams.map((tm) => (
                  <Link
                    key={tm.id}
                    href={`/dashboard/clubs/${tm.team.club.id}/teams/${tm.team.id}`}
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gold-300">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-charcoal-900 text-lg mb-1">
                              {tm.team.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-charcoal-600 mb-2">
                              <Shield className="w-4 h-4" />
                              <span className="font-semibold">{tm.team.club.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-charcoal-600">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {tm.team.club.city}, {tm.team.club.country}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                            {tm.role}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t">
                          <span className="text-charcoal-600">
                            {tm.team._count.members} members
                          </span>
                          <Badge variant="outline">{tm.team.ageGroup}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Join Requests */}
        {playerData.pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Join Requests
              </CardTitle>
              <CardDescription>Teams you've requested to join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerData.pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-charcoal-900">{req.team.name}</p>
                      <p className="text-sm text-charcoal-600">
                        {req.team.club.name} - {req.team.club.city}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                      PENDING
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
