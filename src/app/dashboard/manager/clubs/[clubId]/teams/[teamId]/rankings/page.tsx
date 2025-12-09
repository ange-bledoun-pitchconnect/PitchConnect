'use client';

/**
 * Team Rankings & Statistics Page
 * Path: /dashboard/manager/clubs/[clubId]/teams/[teamId]/rankings
 * 
 * Core Features:
 * - Top scorers leaderboard with medal showcase
 * - Top assists leaderboard
 * - Disciplinary records (yellow/red cards)
 * - Player statistics visualization
 * - Season rankings and performance metrics
 * - Real-time data updates
 * 
 * Schema Aligned: Player, Ranking, Match, PlayerMatch models from Prisma
 * Analytics Data: Goals, assists, disciplinary records (yellow/red cards)
 * 
 * Business Logic:
 * - Display top 3 scorers with medal showcase (gold/silver/bronze)
 * - Show assists leaders
 * - Track disciplinary records
 * - Calculate weighted discipline points (yellow=1, red=3)
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trophy,
  Goal,
  Zap,
  AlertTriangle,
  TrendingUp,
  Award,
  Flame,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface RankingPlayer {
  playerId: string;
  playerName: string;
  position: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' | 'WINGER' | 'STRIKER' | null;
  jerseyNumber?: number;
}

interface ScorerRanking extends RankingPlayer {
  value: number;
  goals: number;
  rank?: number;
}

interface AssistsRanking extends RankingPlayer {
  value: number;
  assists: number;
  rank?: number;
}

interface DisciplinaryRanking extends RankingPlayer {
  value: number;
  yellowCards: number;
  redCards: number;
  rank?: number;
  disciplinaryPoints: number;
}

interface Ranking {
  playerId: string;
  playerName: string;
  position: string;
  jerseyNumber?: number;
  value: number;
  rank?: number;
  yellowCards?: number;
  redCards?: number;
  disciplinaryPoints?: number;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  _count?: {
    players: number;
    matches: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// CONSTANTS - Schema Aligned
// ============================================================================

const MEDAL_COLORS = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
} as const;

const MEDAL_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
} as const;

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'Goalkeeper',
  DEFENDER: 'Defender',
  MIDFIELDER: 'Midfielder',
  FORWARD: 'Forward',
  WINGER: 'Winger',
  STRIKER: 'Striker',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get medal icon based on position
 */
const getMedalIcon = (position: number): string => {
  return MEDAL_ICONS[position as keyof typeof MEDAL_ICONS] || `#${position}`;
};

/**
 * Get position label from enum
 */
const getPositionLabel = (position: string | null): string => {
  if (!position) return 'N/A';
  return POSITION_LABELS[position] || position;
};

/**
 * Calculate disciplinary points (yellow=1, red=3)
 */
const calculateDisciplinaryPoints = (yellowCards: number, redCards: number): number => {
  return yellowCards * 1 + redCards * 3;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function RankingsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [scorers, setScorers] = useState<ScorerRanking[]>([]);
  const [assists, setAssists] = useState<AssistsRanking[]>([]);
  const [discipline, setDiscipline] = useState<DisciplinaryRanking[]>([]);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (clubId && teamId) {
      fetchRankings();
    }
  }, [clubId, teamId]);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  /**
   * Fetch all rankings data from API
   */
  const fetchRankings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [teamRes, scorersRes, assistsRes, disciplineRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/scorers`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/assists`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/discipline`),
      ]);

      if (!teamRes.ok) {
        throw new Error(`Failed to fetch team: ${teamRes.statusText}`);
      }
      if (!scorersRes.ok) {
        throw new Error(`Failed to fetch scorers: ${scorersRes.statusText}`);
      }
      if (!assistsRes.ok) {
        throw new Error(`Failed to fetch assists: ${assistsRes.statusText}`);
      }
      if (!disciplineRes.ok) {
        throw new Error(`Failed to fetch discipline data: ${disciplineRes.statusText}`);
      }

      const [teamData, scorersData, assistsData, disciplineData] = await Promise.all([
        teamRes.json(),
        scorersRes.json(),
        assistsRes.json(),
        disciplineRes.json(),
      ]);

      // Handle both wrapped and direct responses
      const team = (teamData as ApiResponse<Team>)?.data || (teamData as Team);

      const scorersArray = Array.isArray(scorersData)
        ? scorersData
        : (scorersData as ApiResponse<ScorerRanking[]>)?.data || [];

      const assistsArray = Array.isArray(assistsData)
        ? assistsData
        : (assistsData as ApiResponse<AssistsRanking[]>)?.data || [];

      const disciplineArray = Array.isArray(disciplineData)
        ? disciplineData
        : (disciplineData as ApiResponse<DisciplinaryRanking[]>)?.data || [];

      // Map rankings with rank index
      const mappedScorers: ScorerRanking[] = scorersArray.map((s: any, idx: number) => ({
        playerId: s.playerId,
        playerName: s.playerName || s.player?.user?.firstName + ' ' + s.player?.user?.lastName || 'Unknown',
        position: s.position || s.player?.position || null,
        jerseyNumber: s.jerseyNumber || s.player?.jerseyNumber,
        value: s.goals || s.value || 0,
        goals: s.goals || s.value || 0,
        rank: idx + 1,
      }));

      const mappedAssists: AssistsRanking[] = assistsArray.map((a: any, idx: number) => ({
        playerId: a.playerId,
        playerName: a.playerName || a.player?.user?.firstName + ' ' + a.player?.user?.lastName || 'Unknown',
        position: a.position || a.player?.position || null,
        jerseyNumber: a.jerseyNumber || a.player?.jerseyNumber,
        value: a.assists || a.value || 0,
        assists: a.assists || a.value || 0,
        rank: idx + 1,
      }));

      const mappedDiscipline: DisciplinaryRanking[] = disciplineArray.map((d: any, idx: number) => {
        const yellowCards = d.yellowCards || 0;
        const redCards = d.redCards || 0;
        const disciplinaryPoints = calculateDisciplinaryPoints(yellowCards, redCards);

        return {
          playerId: d.playerId,
          playerName: d.playerName || d.player?.user?.firstName + ' ' + d.player?.user?.lastName || 'Unknown',
          position: d.position || d.player?.position || null,
          jerseyNumber: d.jerseyNumber || d.player?.jerseyNumber,
          value: disciplinaryPoints,
          yellowCards,
          redCards,
          disciplinaryPoints,
          rank: idx + 1,
        };
      });

      setTeam(team);
      setScorers(mappedScorers);
      setAssists(mappedAssists);
      setDiscipline(mappedDiscipline);

      console.log('✅ Rankings loaded:', {
        team: team.name,
        scorers: mappedScorers.length,
        assists: mappedAssists.length,
        discipline: mappedDiscipline.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rankings';
      console.error('❌ Error fetching rankings:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId]);

  /**
   * Refresh rankings data
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRankings();
    setIsRefreshing(false);
    toast.success('Rankings refreshed');
  }, [fetchRankings]);

  /**
   * Export rankings as CSV
   */
  const handleExport = useCallback(() => {
    try {
      let csv = 'Player Rankings Report\n\n';

      // Scorers
      csv += 'Top Scorers\n';
      csv += 'Rank,Player,Position,Jersey,Goals\n';
      scorers.forEach((s) => {
        csv += `${s.rank},${s.playerName},${getPositionLabel(s.position)},${s.jerseyNumber || '-'},${s.value}\n`;
      });

      csv += '\n\nTop Assists\n';
      csv += 'Rank,Player,Position,Jersey,Assists\n';
      assists.forEach((a) => {
        csv += `${a.rank},${a.playerName},${getPositionLabel(a.position)},${a.jerseyNumber || '-'},${a.value}\n`;
      });

      csv += '\n\nDisciplinary Records\n';
      csv += 'Rank,Player,Position,Jersey,Yellow Cards,Red Cards,Points\n';
      discipline.forEach((d) => {
        csv += `${d.rank},${d.playerName},${getPositionLabel(d.position)},${d.jerseyNumber || '-'},${d.yellowCards},${d.redCards},${d.value}\n`;
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team?.name}-rankings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Rankings exported');
      console.log('✅ Rankings exported');
    } catch (err) {
      console.error('❌ Error exporting:', err);
      toast.error('Failed to export rankings');
    }
  }, [scorers, assists, discipline, team?.name]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-yellow-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-200 dark:border-yellow-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-orange-400 dark:border-t-yellow-400 dark:border-r-orange-300 animate-spin" />
            </div>
          </div>
          <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">
            Loading rankings...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && (!scorers.length && !assists.length && !discipline.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <Card className="bg-white dark:bg-charcoal-800 border-red-200 dark:border-red-900/30 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-charcoal-900 dark:text-white mb-1">
                    Error Loading Rankings
                  </h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-4">{error}</p>
                  <Button
                    onClick={handleRefresh}
                    className="bg-gold-500 hover:bg-gold-600 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-yellow-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
                  {team?.name} - Season Rankings
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  Player statistics and leaderboards
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-charcoal-700 dark:text-charcoal-300"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-charcoal-700 dark:text-charcoal-300"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* TOP 3 SCORERS SHOWCASE */}
        {scorers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
              <Goal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              Top Scorers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {scorers.slice(0, 3).map((scorer, idx) => {
                const position = idx + 1;
                const medalColor = MEDAL_COLORS[position as keyof typeof MEDAL_COLORS] || 'from-gray-400 to-gray-600';

                return (
                  <div
                    key={scorer.playerId}
                    className={`relative h-40 rounded-2xl bg-gradient-to-br ${medalColor} shadow-xl overflow-hidden group hover:shadow-2xl transition-all ${
                      position === 1 ? 'md:scale-105' : ''
                    }`}
                  >
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-10">
                      <Goal className="w-40 h-40 absolute -top-6 -right-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                      <div className="text-5xl font-bold mb-2">{getMedalIcon(position)}</div>
                      <p className="text-lg font-bold text-center line-clamp-2 mb-2">
                        {scorer.playerName}
                      </p>
                      <p className="text-xs opacity-75 mb-4">{getPositionLabel(scorer.position)}</p>
                      <div className="mt-auto text-center">
                        <p className="text-4xl font-black">{scorer.value}</p>
                        <p className="text-xs opacity-90">Goals</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Scorers Leaderboard */}
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">
                  All Scorers ({scorers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scorers.map((scorer, idx) => (
                    <div
                      key={scorer.playerId}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-900 dark:text-white truncate">
                            {scorer.playerName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {getPositionLabel(scorer.position)}
                            {scorer.jerseyNumber && ` • #${scorer.jerseyNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                          {scorer.value}
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">Goals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TOP ASSISTS & DISCIPLINARY RECORDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Assists */}
          {assists.length > 0 && (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent pb-4">
                <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Top Assists ({assists.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assists.slice(0, 5).map((assist, idx) => (
                    <div
                      key={assist.playerId}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-bold text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-900 dark:text-white truncate">
                            {assist.playerName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {getPositionLabel(assist.position)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                          {assist.value}
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">Assists</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disciplinary Records */}
          {discipline.length > 0 && (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 dark:to-transparent pb-4">
                <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Disciplinary Records ({discipline.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {discipline.slice(0, 5).map((player, idx) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-rose-400 text-white font-bold text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-900 dark:text-white truncate">
                            {player.playerName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {player.yellowCards > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded font-semibold">
                                🟨 {player.yellowCards}
                              </span>
                            )}
                            {player.redCards > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-semibold">
                                🟥 {player.redCards}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xl font-black text-red-600 dark:text-red-400">
                          {player.value}
                        </p>
                        <p className="text-xs text-charcoal-600 dark:text-charcoal-400">Points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* STATS SUMMARY */}
        {(scorers.length > 0 || assists.length > 0 || discipline.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scorers.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-500 to-orange-400 border-0 shadow-lg overflow-hidden text-white">
                <CardContent className="pt-6">
                  <Goal className="w-8 h-8 opacity-30 mb-4" />
                  <p className="text-sm opacity-90 mb-1">Top Scorer</p>
                  <p className="text-lg font-bold mb-2 line-clamp-1">{scorers[0]?.playerName || 'N/A'}</p>
                  <p className="text-sm opacity-80">{scorers[0]?.value || 0} Goals</p>
                </CardContent>
              </Card>
            )}

            {assists.length > 0 && (
              <Card className="bg-gradient-to-br from-blue-500 to-cyan-400 border-0 shadow-lg overflow-hidden text-white">
                <CardContent className="pt-6">
                  <Zap className="w-8 h-8 opacity-30 mb-4" />
                  <p className="text-sm opacity-90 mb-1">Most Assists</p>
                  <p className="text-lg font-bold mb-2 line-clamp-1">{assists[0]?.playerName || 'N/A'}</p>
                  <p className="text-sm opacity-80">{assists[0]?.value || 0} Assists</p>
                </CardContent>
              </Card>
            )}

            {discipline.length > 0 && (
              <Card className="bg-gradient-to-br from-red-500 to-rose-400 border-0 shadow-lg overflow-hidden text-white">
                <CardContent className="pt-6">
                  <AlertTriangle className="w-8 h-8 opacity-30 mb-4" />
                  <p className="text-sm opacity-90 mb-1">Most Disciplined</p>
                  <p className="text-lg font-bold mb-2 line-clamp-1">{discipline[0]?.playerName || 'N/A'}</p>
                  <p className="text-sm opacity-80">
                    {discipline[0]?.yellowCards || 0}🟨 {discipline[0]?.redCards || 0}🟥
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

RankingsPage.displayName = 'RankingsPage';
