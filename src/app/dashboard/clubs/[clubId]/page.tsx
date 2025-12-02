'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Club, Player, Match } from '@/types';

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const clubId = params.clubId as string;

  // ✅ State Management
  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ Memoized API endpoints
  const endpoints = useMemo(
    () => ({
      club: `/api/clubs/${clubId}`,
      players: `/api/clubs/${clubId}/players`,
      matches: `/api/clubs/${clubId}/matches`,
      update: `/api/clubs/${clubId}`,
    }),
    [clubId]
  );

  // ✅ Fetch club details
  const fetchClubDetails = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      const [clubRes, playersRes, matchesRes] = await Promise.all([
        fetch(endpoints.club, { signal: abortControllerRef.current.signal }),
        fetch(endpoints.players, { signal: abortControllerRef.current.signal }),
        fetch(endpoints.matches, { signal: abortControllerRef.current.signal }),
      ]);

      if (!clubRes.ok || !playersRes.ok || !matchesRes.ok) {
        throw new Error('Failed to fetch club data');
      }

      const clubData = await clubRes.json();
      const playersData = await playersRes.json();
      const matchesData = await matchesRes.json();

      setClub(clubData);
      setPlayers(playersData);
      setMatches(matchesData);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch cancelled');
        return;
      }
      console.error('❌ Error fetching club:', error);
      toast({
        title: 'Error',
        description: 'Failed to load club details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoints, toast]);

  // ✅ Initial load and subscription setup
  useEffect(() => {
    if (!clubId) {
      router.push('/dashboard/clubs');
      return;
    }

    fetchClubDetails();

    // ✅ Cleanup function
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [clubId, fetchClubDetails, router]);

  // ✅ Handle club update
  const handleUpdateClub = useCallback(
    async (updatedData: Partial<Club>) => {
      try {
        const response = await fetch(endpoints.update, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          throw new Error('Failed to update club');
        }

        const updatedClub = await response.json();
        setClub(updatedClub);
        setIsEditing(false);

        toast({
          title: 'Success',
          description: 'Club updated successfully',
        });
      } catch (error) {
        console.error('❌ Error updating club:', error);
        toast({
          title: 'Error',
          description: 'Failed to update club',
          variant: 'destructive',
        });
      }
    },
    [endpoints.update, toast]
  );

  // ✅ Handle player removal
  const handleRemovePlayer = useCallback(
    async (playerId: string) => {
      try {
        const response = await fetch(`/api/clubs/${clubId}/players/${playerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove player');
        }

        setPlayers(prev => prev.filter(p => p.id !== playerId));
        toast({
          title: 'Success',
          description: 'Player removed from club',
        });
      } catch (error) {
        console.error('❌ Error removing player:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove player',
          variant: 'destructive',
        });
      }
    },
    [clubId, toast]
  );

  // ✅ Can edit check
  const canEdit = useMemo(() => {
    return session?.user?.id === club?.managerId || session?.user?.role === 'ADMIN';
  }, [session, club]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // ✅ Not found state
  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Club Not Found</h1>
        <Button onClick={() => router.push('/dashboard/clubs')}>Back to Clubs</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ Header Section */}
      <div className="border-b bg-card p-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold">{club.name}</h1>
              <Badge>{club.tier || 'Amateur'}</Badge>
            </div>
            <p className="text-muted-foreground">{club.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span>📍 {club.city || 'Location Unknown'}</span>
              <span>👥 {players.length} Players</span>
              <span>🏆 {club.trophies || 0} Trophies</span>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button onClick={() => router.push(`/dashboard/clubs/${clubId}/settings`)}>
                Settings
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="squad">Squad</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* ✅ Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Club Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Founded</label>
                    <p className="text-muted-foreground">
                      {club.foundedYear || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Manager</label>
                    <p className="text-muted-foreground">
                      {club.manager?.name || 'No Manager'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Stadium</label>
                    <p className="text-muted-foreground">
                      {club.stadium || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Season Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Wins</span>
                    <span className="font-bold">{club.stats?.wins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Draws</span>
                    <span className="font-bold">{club.stats?.draws || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Losses</span>
                    <span className="font-bold">{club.stats?.losses || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ✅ Squad Tab */}
          <TabsContent value="squad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Squad Management</CardTitle>
                <CardDescription>{players.length} players in squad</CardDescription>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No players in squad
                  </p>
                ) : (
                  <div className="space-y-2">
                    {players.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.position}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemovePlayer(player.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
                <CardDescription>{matches.length} matches this season</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No matches scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {matches.map(match => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {match.homeTeam?.name} vs {match.awayTeam?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(match.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                        {match.result && (
                          <Badge variant="secondary">
                            {match.result.homeGoals} - {match.result.awayGoals}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Club Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Goals Scored</p>
                    <p className="text-2xl font-bold">{club.stats?.goalsFor || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Goals Conceded</p>
                    <p className="text-2xl font-bold">{club.stats?.goalsAgainst || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-2xl font-bold">{club.stats?.points || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Goal Difference</p>
                    <p className="text-2xl font-bold">
                      {(club.stats?.goalsFor || 0) - (club.stats?.goalsAgainst || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
