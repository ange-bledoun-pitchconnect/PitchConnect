'use client';

/**
 * Club Detail Page Component
 * Path: /dashboard/clubs/[clubId]
 * 
 * Features:
 * - Display club information and statistics
 * - Manage squad members
 * - View recent matches
 * - Edit club details (permission-based)
 * - Responsive tabbed interface
 * 
 * Schema Aligned: Club, Team, Player, Match models from Prisma
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface ClubStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface Club {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  foundedYear?: number;
  description?: string;
  stadiumName?: string;
  stadiumCapacity?: number;
  logoUrl?: string;
  coverUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  website?: string;
  socialLinks?: Record<string, string>;
  status: string;
  type: string;
  ownerId: string;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  stats?: ClubStats;
  teamsCount?: number;
  membersCount?: number;
}

interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  secondNationality?: string;
  height?: number;
  weight?: number;
  position: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  secondaryPosition?: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
  shirtNumber?: number;
  photo?: string;
  status: string;
  developmentNotes?: string;
  playerType: string;
}

interface MatchData {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  kickOffTime?: string;
  venue?: string;
  venueCity?: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'ABANDONED';
  homeGoals?: number;
  awayGoals?: number;
  attendance?: number;
  homeGoalsET?: number;
  awayGoalsET?: number;
  homePenalties?: number;
  awayPenalties?: number;
  notes?: string;
  highlights?: string;
  homeTeam?: {
    id: string;
    name: string;
  };
  awayTeam?: {
    id: string;
    name: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const clubId = params.clubId as string;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cleanup ref for fetch abort
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // MEMOIZED ENDPOINTS
  // ============================================================================

  const endpoints = useMemo(
    () => ({
      club: `/api/clubs/${clubId}`,
      players: `/api/clubs/${clubId}/players`,
      matches: `/api/clubs/${clubId}/matches`,
      update: `/api/clubs/${clubId}`,
    }),
    [clubId]
  );

  // ============================================================================
  // FETCH CLUB DETAILS
  // ============================================================================

  const fetchClubDetails = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      const [clubRes, playersRes, matchesRes] = await Promise.all([
        fetch(endpoints.club, { signal: abortControllerRef.current.signal }),
        fetch(endpoints.players, { signal: abortControllerRef.current.signal }),
        fetch(endpoints.matches, { signal: abortControllerRef.current.signal }),
      ]);

      if (!clubRes.ok) {
        throw new Error(`Failed to fetch club: ${clubRes.statusText}`);
      }

      const clubData: ApiResponse<Club> = await clubRes.json();
      const playersData: ApiResponse<Player[]> = await playersRes.json();
      const matchesData: ApiResponse<MatchData[]> = await matchesRes.json();

      // Extract data from response object
      setClub(clubData?.data || (clubData as any));
      setPlayers(
        Array.isArray(playersData?.data)
          ? playersData.data
          : Array.isArray(playersData)
          ? playersData
          : []
      );
      setMatches(
        Array.isArray(matchesData?.data)
          ? matchesData.data
          : Array.isArray(matchesData)
          ? matchesData
          : []
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('✅ Fetch cancelled');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error fetching club:', errorMessage);
      setError(errorMessage);

      toast({
        title: 'Error',
        description: 'Failed to load club details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoints, toast]);

  // ============================================================================
  // LIFECYCLE EFFECTS
  // ============================================================================

  useEffect(() => {
    if (!clubId) {
      router.push('/dashboard/clubs');
      return;
    }

    fetchClubDetails();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [clubId, fetchClubDetails, router]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Update club information
   */
  const handleUpdateClub = useCallback(
    async (updatedData: Partial<Club>) => {
      try {
        setIsSubmitting(true);

        const response = await fetch(endpoints.update, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          throw new Error(`Failed to update club: ${response.statusText}`);
        }

        const result: ApiResponse<Club> = await response.json();
        const updatedClub = result?.data || (result as any);

        setClub(updatedClub);
        setIsEditing(false);

        toast({
          title: 'Success',
          description: 'Club updated successfully',
        });

        console.log('✅ Club updated:', updatedClub.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error updating club:', errorMessage);

        toast({
          title: 'Error',
          description: 'Failed to update club',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [endpoints.update, toast]
  );

  /**
   * Remove player from club
   */
  const handleRemovePlayer = useCallback(
    async (playerId: string) => {
      if (!confirm('Are you sure you want to remove this player?')) {
        return;
      }

      try {
        const response = await fetch(`/api/clubs/${clubId}/players/${playerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to remove player: ${response.statusText}`);
        }

        setPlayers((prev) => prev.filter((p) => p.id !== playerId));

        toast({
          title: 'Success',
          description: 'Player removed from club',
        });

        console.log('✅ Player removed:', playerId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error removing player:', errorMessage);

        toast({
          title: 'Error',
          description: 'Failed to remove player',
          variant: 'destructive',
        });
      }
    },
    [clubId, toast]
  );

  // ============================================================================
  // PERMISSIONS CHECK
  // ============================================================================

  const canEdit = useMemo(() => {
    if (!session?.user?.id || !club) return false;

    // Owner can always edit
    if (session.user.id === club.ownerId) return true;

    // SuperAdmin can edit
    if (Array.isArray(session.user.roles)) {
      return session.user.roles.includes('SUPERADMIN');
    }

    return false;
  }, [session, club]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading club details...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && !club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Failed to Load Club</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
        <Button onClick={() => fetchClubDetails()}>Try Again</Button>
        <Button variant="outline" onClick={() => router.push('/dashboard/clubs')}>
          Back to Clubs
        </Button>
      </div>
    );
  }

  // ============================================================================
  // NOT FOUND STATE
  // ============================================================================

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Club Not Found</h1>
        <p className="text-muted-foreground">The club you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/dashboard/clubs')}>Back to Clubs</Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER SECTION */}
      <div className="border-b bg-card p-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <div className="flex-1">
            {/* Club Name and Badge */}
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <h1 className="text-4xl font-bold">{club.name}</h1>
              <Badge variant="outline">{club.type}</Badge>
              {club.status !== 'ACTIVE' && <Badge variant="destructive">{club.status}</Badge>}
            </div>

            {/* Club Description */}
            {club.description && (
              <p className="text-muted-foreground mb-4">{club.description}</p>
            )}

            {/* Club Details */}
            <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <span>📍</span>
                {club.city}, {club.country}
              </span>
              {club.teamsCount !== undefined && (
                <span className="flex items-center gap-1">
                  <span>🏟️</span>
                  {club.teamsCount} Teams
                </span>
              )}
              {club.membersCount !== undefined && (
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  {club.membersCount} Members
                </span>
              )}
              {club.stadiumName && (
                <span className="flex items-center gap-1">
                  <span>⚽</span>
                  {club.stadiumName}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={isSubmitting}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button onClick={() => router.push(`/dashboard/clubs/${clubId}/settings`)}>
                Settings
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* TAB TRIGGERS */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="squad">Squad ({players.length})</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
            <TabsTrigger value="statistics">Stats</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Club Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Club Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Club Code</label>
                    <p className="text-muted-foreground">{club.code}</p>
                  </div>
                  {club.foundedYear && (
                    <div>
                      <label className="text-sm font-medium">Founded</label>
                      <p className="text-muted-foreground">{club.foundedYear}</p>
                    </div>
                  )}
                  {club.stadiumName && (
                    <div>
                      <label className="text-sm font-medium">Stadium</label>
                      <p className="text-muted-foreground">
                        {club.stadiumName}
                        {club.stadiumCapacity && ` (Capacity: ${club.stadiumCapacity})`}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <p className="text-muted-foreground">
                      {club.city}, {club.country}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <p className="text-muted-foreground">{club.timezone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Season Performance Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Season Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {club.stats ? (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Wins</span>
                        <span className="text-lg font-bold text-green-600">{club.stats.wins}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Draws</span>
                        <span className="text-lg font-bold text-yellow-600">{club.stats.draws}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Losses</span>
                        <span className="text-lg font-bold text-red-600">{club.stats.losses}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Points</span>
                        <span className="text-lg font-bold">{club.stats.points}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Goal Difference</span>
                        <span className="text-lg font-bold">
                          {club.stats.goalsFor - club.stats.goalsAgainst > 0 ? '+' : ''}
                          {club.stats.goalsFor - club.stats.goalsAgainst}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No statistics available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SQUAD TAB */}
          <TabsContent value="squad" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Squad Management</CardTitle>
                <CardDescription>{players.length} players in squad</CardDescription>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No players in squad</p>
                ) : (
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {player.firstName} {player.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{player.position}</span>
                            {player.shirtNumber && <span>• #{player.shirtNumber}</span>}
                            {player.preferredFoot && <span>• {player.preferredFoot} foot</span>}
                          </div>
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

          {/* MATCHES TAB */}
          <TabsContent value="matches" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
                <CardDescription>{matches.length} matches</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No matches scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {match.homeTeam?.name || 'Home Team'} vs {match.awayTeam?.name || 'Away Team'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(match.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {match.venue && ` • ${match.venue}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {match.status === 'FINISHED' && match.homeGoals !== undefined ? (
                            <Badge className="text-base px-3 py-1">
                              {match.homeGoals} - {match.awayGoals}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{match.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTICS TAB */}
          <TabsContent value="statistics" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {club.stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Goals Scored</p>
                      <p className="text-3xl font-bold text-green-600">{club.stats.goalsFor}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Goals Conceded</p>
                      <p className="text-3xl font-bold text-red-600">{club.stats.goalsAgainst}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Goal Difference</p>
                      <p className="text-3xl font-bold">
                        {club.stats.goalsFor - club.stats.goalsAgainst > 0 ? '+' : ''}
                        {club.stats.goalsFor - club.stats.goalsAgainst}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Points</p>
                      <p className="text-3xl font-bold">{club.stats.points}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
