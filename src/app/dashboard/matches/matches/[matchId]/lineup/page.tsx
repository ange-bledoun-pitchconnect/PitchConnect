// ============================================================================
// 👥 LINEUP MANAGEMENT PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId]/lineup - Manage team lineups and formations
// ============================================================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Users,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  Check,
  GripVertical,
  Star,
  UserPlus,
  UserMinus,
  ArrowRight,
  RotateCcw,
  Shirt,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { useRealTimeMatch } from '@/hooks/useRealTimeMatch';
import {
  getSportConfig,
  getSportFormations,
  getSportPositions,
  getFormationDisplay,
  getPositionDisplay,
  getPositionFullName,
} from '@/lib/config/sports';
import type { FormationType, Position, MatchAttendanceStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface Player {
  id: string;
  jerseyNumber: number | null;
  primaryPosition: Position | null;
  secondaryPosition: Position | null;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface SquadPlayer {
  id: string;
  playerId: string;
  teamId: string;
  lineupPosition: number | null;
  shirtNumber: number | null;
  position: Position | null;
  status: MatchAttendanceStatus;
  isCaptain: boolean;
  player: Player;
}

interface TeamPlayer {
  id: string;
  playerId: string;
  player: Player;
  jerseyNumber: number | null;
  position: Position | null;
  isActive: boolean;
  isCaptain: boolean;
}

interface LineupState {
  starters: SquadPlayer[];
  substitutes: SquadPlayer[];
  captain: string | null;
  formation: FormationType | null;
}

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

interface PlayerCardProps {
  player: SquadPlayer | TeamPlayer;
  isSelected: boolean;
  isCaptain: boolean;
  onToggle: () => void;
  onSetCaptain: () => void;
  showCaptainButton?: boolean;
  variant?: 'starter' | 'substitute' | 'available';
}

function PlayerCard({
  player,
  isSelected,
  isCaptain,
  onToggle,
  onSetCaptain,
  showCaptainButton = false,
  variant = 'available',
}: PlayerCardProps) {
  const playerData = 'player' in player ? player.player : player;
  const shirtNumber = 'shirtNumber' in player ? player.shirtNumber : player.jerseyNumber;
  const position = 'position' in player && player.position ? player.position : playerData.primaryPosition;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected
          ? variant === 'starter'
            ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800'
            : 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800'
          : 'hover:bg-muted/50'
        }
        ${isCaptain ? 'ring-2 ring-yellow-400' : ''}
      `}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      {/* Drag Handle or Number */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
        {shirtNumber || '-'}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {playerData.user.firstName} {playerData.user.lastName}
          </p>
          {isCaptain && (
            <Badge className="bg-yellow-500 text-yellow-900 text-xs">C</Badge>
          )}
        </div>
        {position && (
          <p className="text-xs text-muted-foreground">
            {getPositionFullName(position)}
          </p>
        )}
      </div>

      {/* Position Badge */}
      {position && (
        <Badge variant="outline" className="text-xs">
          {getPositionDisplay(position)}
        </Badge>
      )}

      {/* Captain Button */}
      {showCaptainButton && isSelected && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isCaptain ? 'text-yellow-500' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSetCaptain();
          }}
        >
          <Star className={`h-4 w-4 ${isCaptain ? 'fill-current' : ''}`} />
          <span className="sr-only">Set as captain</span>
        </Button>
      )}

      {/* Selection Indicator */}
      <div
        className={`h-4 w-4 rounded-full border-2 ${
          isSelected
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/50'
        }`}
      />
    </div>
  );
}

// ============================================================================
// FORMATION PREVIEW
// ============================================================================

interface FormationPreviewProps {
  formation: FormationType | null;
  starters: SquadPlayer[];
  sport: string;
}

function FormationPreview({ formation, starters, sport }: FormationPreviewProps) {
  if (!formation || sport !== 'FOOTBALL') {
    return null;
  }

  // Simple visual representation
  const formationString = getFormationDisplay(formation);
  const lines = formationString.split('-').map(Number);

  return (
    <div className="relative w-full aspect-[3/4] bg-green-700 dark:bg-green-900 rounded-lg overflow-hidden">
      {/* Pitch markings */}
      <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 transform -translate-x-1/2" />
      <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

      {/* Formation text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <Badge variant="secondary" className="text-lg font-mono">
          {formationString}
        </Badge>
      </div>

      {/* Formation display message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/70 text-center">
        <Shirt className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">{starters.length} / 11 selected</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LineupPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  // State
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [homeLineup, setHomeLineup] = useState<LineupState>({
    starters: [],
    substitutes: [],
    captain: null,
    formation: null,
  });
  const [awayLineup, setAwayLineup] = useState<LineupState>({
    starters: [],
    substitutes: [],
    captain: null,
    formation: null,
  });
  const [availablePlayers, setAvailablePlayers] = useState<Record<string, TeamPlayer[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch match data
  const { match, refresh, isLoading } = useRealTimeMatch({
    matchId,
    enabled: true,
  });

  // Initialize lineups from match data
  useEffect(() => {
    if (!match) return;

    const squads = match.squads || [];
    const homeSquad = squads.filter((s) => s.teamId === match.homeTeamId);
    const awaySquad = squads.filter((s) => s.teamId === match.awayTeamId);

    setHomeLineup({
      starters: homeSquad.filter((s) => s.status === 'STARTING_LINEUP'),
      substitutes: homeSquad.filter((s) => s.status === 'SUBSTITUTE'),
      captain: homeSquad.find((s) => s.isCaptain)?.playerId || null,
      formation: match.homeFormation,
    });

    setAwayLineup({
      starters: awaySquad.filter((s) => s.status === 'STARTING_LINEUP'),
      substitutes: awaySquad.filter((s) => s.status === 'SUBSTITUTE'),
      captain: awaySquad.find((s) => s.isCaptain)?.playerId || null,
      formation: match.awayFormation,
    });
  }, [match]);

  // Fetch available players for both teams
  useEffect(() => {
    if (!match) return;

    const fetchPlayers = async () => {
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/teams/${match.homeTeamId}/players`),
          fetch(`/api/teams/${match.awayTeamId}/players`),
        ]);

        if (homeRes.ok && awayRes.ok) {
          const homeData = await homeRes.json();
          const awayData = await awayRes.json();
          setAvailablePlayers({
            [match.homeTeamId]: homeData.players || [],
            [match.awayTeamId]: awayData.players || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };

    fetchPlayers();
  }, [match]);

  const sport = match?.homeClub?.sport || 'FOOTBALL';
  const sportConfig = getSportConfig(sport);
  const formations = getSportFormations(sport);
  
  const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup;
  const setCurrentLineup = activeTeam === 'home' ? setHomeLineup : setAwayLineup;
  const currentTeamId = activeTeam === 'home' ? match?.homeTeamId : match?.awayTeamId;
  const currentTeamPlayers = currentTeamId ? availablePlayers[currentTeamId] || [] : [];

  // Get player IDs already in lineup
  const selectedPlayerIds = useMemo(() => {
    return new Set([
      ...currentLineup.starters.map((s) => s.playerId),
      ...currentLineup.substitutes.map((s) => s.playerId),
    ]);
  }, [currentLineup]);

  // Toggle player in starters
  const toggleStarter = useCallback((playerId: string, player: Player) => {
    setCurrentLineup((prev) => {
      const isInStarters = prev.starters.some((s) => s.playerId === playerId);
      
      if (isInStarters) {
        // Remove from starters
        return {
          ...prev,
          starters: prev.starters.filter((s) => s.playerId !== playerId),
          captain: prev.captain === playerId ? null : prev.captain,
        };
      } else {
        // Add to starters (if not full)
        if (prev.starters.length >= 11) {
          setError('Maximum 11 starters allowed');
          setTimeout(() => setError(null), 3000);
          return prev;
        }

        // Remove from subs if there
        const newSubs = prev.substitutes.filter((s) => s.playerId !== playerId);

        const newSquadPlayer: SquadPlayer = {
          id: `temp-${playerId}`,
          playerId,
          teamId: currentTeamId!,
          lineupPosition: prev.starters.length + 1,
          shirtNumber: player.jerseyNumber,
          position: player.primaryPosition,
          status: 'STARTING_LINEUP',
          isCaptain: false,
          player,
        };

        return {
          ...prev,
          starters: [...prev.starters, newSquadPlayer],
          substitutes: newSubs,
        };
      }
    });
    setHasChanges(true);
  }, [currentTeamId, setCurrentLineup]);

  // Toggle player in substitutes
  const toggleSubstitute = useCallback((playerId: string, player: Player) => {
    setCurrentLineup((prev) => {
      const isInSubs = prev.substitutes.some((s) => s.playerId === playerId);
      
      if (isInSubs) {
        // Remove from subs
        return {
          ...prev,
          substitutes: prev.substitutes.filter((s) => s.playerId !== playerId),
        };
      } else {
        // Remove from starters if there
        const newStarters = prev.starters.filter((s) => s.playerId !== playerId);
        const wasCaptain = prev.captain === playerId;

        const newSquadPlayer: SquadPlayer = {
          id: `temp-${playerId}`,
          playerId,
          teamId: currentTeamId!,
          lineupPosition: null,
          shirtNumber: player.jerseyNumber,
          position: player.primaryPosition,
          status: 'SUBSTITUTE',
          isCaptain: false,
          player,
        };

        return {
          ...prev,
          starters: newStarters,
          substitutes: [...prev.substitutes, newSquadPlayer],
          captain: wasCaptain ? null : prev.captain,
        };
      }
    });
    setHasChanges(true);
  }, [currentTeamId, setCurrentLineup]);

  // Set captain
  const setCaptain = useCallback((playerId: string) => {
    setCurrentLineup((prev) => ({
      ...prev,
      captain: prev.captain === playerId ? null : playerId,
    }));
    setHasChanges(true);
  }, [setCurrentLineup]);

  // Set formation
  const setFormation = useCallback((formation: FormationType | null) => {
    setCurrentLineup((prev) => ({
      ...prev,
      formation,
    }));
    setHasChanges(true);
  }, [setCurrentLineup]);

  // Reset lineup
  const resetLineup = useCallback(() => {
    setCurrentLineup({
      starters: [],
      substitutes: [],
      captain: null,
      formation: null,
    });
    setHasChanges(true);
  }, [setCurrentLineup]);

  // Save lineup
  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        homeLineup: {
          starters: homeLineup.starters.map((s) => ({
            playerId: s.playerId,
            position: s.position,
            shirtNumber: s.shirtNumber,
            lineupPosition: s.lineupPosition,
          })),
          substitutes: homeLineup.substitutes.map((s) => ({
            playerId: s.playerId,
            position: s.position,
            shirtNumber: s.shirtNumber,
          })),
          captain: homeLineup.captain,
          formation: homeLineup.formation,
        },
        awayLineup: {
          starters: awayLineup.starters.map((s) => ({
            playerId: s.playerId,
            position: s.position,
            shirtNumber: s.shirtNumber,
            lineupPosition: s.lineupPosition,
          })),
          substitutes: awayLineup.substitutes.map((s) => ({
            playerId: s.playerId,
            position: s.position,
            shirtNumber: s.shirtNumber,
          })),
          captain: awayLineup.captain,
          formation: awayLineup.formation,
        },
      };

      const response = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save lineup');
      }

      setSuccess('Lineups saved successfully');
      setHasChanges(false);
      refresh();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !match) {
    return (
      <main className="container py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="container py-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Match Not Found</h2>
          <Button asChild>
            <Link href="/dashboard/matches">Back to Matches</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/matches/${matchId}`} className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Match
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Lineups
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Lineup Management</h1>
        <p className="text-muted-foreground">
          Set the starting lineup and substitutes for both teams
        </p>
      </div>

      {/* Team Selector */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={activeTeam === 'home' ? 'default' : 'outline'}
          className={`h-auto py-4 ${activeTeam === 'home' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          onClick={() => setActiveTeam('home')}
        >
          <div className="flex items-center gap-3">
            {match.homeClub?.logo ? (
              <img src={match.homeClub.logo} alt="" className="h-8 w-8 rounded" />
            ) : (
              <Shield className="h-8 w-8" />
            )}
            <div className="text-left">
              <p className="font-bold">{match.homeClub?.shortName || match.homeClub?.name}</p>
              <p className="text-xs opacity-80">
                {homeLineup.starters.length}/11 starters • {homeLineup.substitutes.length} subs
              </p>
            </div>
          </div>
        </Button>

        <Button
          variant={activeTeam === 'away' ? 'default' : 'outline'}
          className={`h-auto py-4 ${activeTeam === 'away' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          onClick={() => setActiveTeam('away')}
        >
          <div className="flex items-center gap-3">
            {match.awayClub?.logo ? (
              <img src={match.awayClub.logo} alt="" className="h-8 w-8 rounded" />
            ) : (
              <Shield className="h-8 w-8" />
            )}
            <div className="text-left">
              <p className="font-bold">{match.awayClub?.shortName || match.awayClub?.name}</p>
              <p className="text-xs opacity-80">
                {awayLineup.starters.length}/11 starters • {awayLineup.substitutes.length} subs
              </p>
            </div>
          </div>
        </Button>
      </div>

      {/* Formation Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Formation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={currentLineup.formation || ''}
              onValueChange={(value) => setFormation(value as FormationType || null)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select formation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No formation</SelectItem>
                {formations.map((f) => (
                  <SelectItem key={f} value={f}>
                    {getFormationDisplay(f)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={resetLineup}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Starters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Starting XI
              </span>
              <Badge variant="outline">
                {currentLineup.starters.length}/11
              </Badge>
            </CardTitle>
            <CardDescription>
              Click to add or remove players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {currentLineup.starters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No starters selected</p>
                  </div>
                ) : (
                  currentLineup.starters.map((squad) => (
                    <PlayerCard
                      key={squad.playerId}
                      player={squad}
                      isSelected={true}
                      isCaptain={currentLineup.captain === squad.playerId}
                      onToggle={() => toggleStarter(squad.playerId, squad.player)}
                      onSetCaptain={() => setCaptain(squad.playerId)}
                      showCaptainButton
                      variant="starter"
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Substitutes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Substitutes
              </span>
              <Badge variant="outline">
                {currentLineup.substitutes.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Bench players for this match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {currentLineup.substitutes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No substitutes selected</p>
                  </div>
                ) : (
                  currentLineup.substitutes.map((squad) => (
                    <PlayerCard
                      key={squad.playerId}
                      player={squad}
                      isSelected={true}
                      isCaptain={false}
                      onToggle={() => toggleSubstitute(squad.playerId, squad.player)}
                      onSetCaptain={() => {}}
                      variant="substitute"
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Available Players */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available
              </span>
              <Badge variant="outline">
                {currentTeamPlayers.filter((p) => !selectedPlayerIds.has(p.playerId)).length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Select players to add to lineup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {currentTeamPlayers
                  .filter((p) => !selectedPlayerIds.has(p.playerId) && p.isActive)
                  .map((teamPlayer) => (
                    <div
                      key={teamPlayer.playerId}
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                        {teamPlayer.jerseyNumber || '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {teamPlayer.player.user.firstName} {teamPlayer.player.user.lastName}
                        </p>
                        {teamPlayer.position && (
                          <p className="text-xs text-muted-foreground">
                            {getPositionFullName(teamPlayer.position)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStarter(teamPlayer.playerId, teamPlayer.player)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSubstitute(teamPlayer.playerId, teamPlayer.player)}
                        >
                          Sub
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
