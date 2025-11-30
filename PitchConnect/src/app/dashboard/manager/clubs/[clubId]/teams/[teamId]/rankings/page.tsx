'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Ranking {
  playerId: string;
  playerName: string;
  position: string;
  jerseyNumber?: number;
  value: number;
  trend?: number;
  percentage?: number;
}

interface Team {
  id: string;
  name: string;
}

const MEDAL_COLORS = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
};

const getMedalIcon = (position: number) => {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `#${position}`;
};

export default function RankingsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [scorers, setScorers] = useState<Ranking[]>([]);
  const [assists, setAssists] = useState<Ranking[]>([]);
  const [discipline, setDiscipline] = useState<Ranking[]>([]);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      const [teamRes, scorersRes, assistsRes, disciplineRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/scorers`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/assists`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/analytics/discipline`),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');
      if (!scorersRes.ok) throw new Error('Failed to fetch scorers');
      if (!assistsRes.ok) throw new Error('Failed to fetch assists');
      if (!disciplineRes.ok) throw new Error('Failed to fetch discipline');

      const [teamData, scorersData, assistsData, disciplineData] = await Promise.all([
        teamRes.json(),
        scorersRes.json(),
        assistsRes.json(),
        disciplineRes.json(),
      ]);

      setTeam(teamData);

      // Convert to rankings format
      setScorers(
        scorersData.map((s: any, idx: number) => ({
          playerId: s.playerId,
          playerName: s.playerName,
          position: s.position,
          jerseyNumber: s.jerseyNumber,
          value: s.goals,
          rank: idx + 1,
        }))
      );

      setAssists(
        assistsData.map((a: any, idx: number) => ({
          playerId: a.playerId,
          playerName: a.playerName,
          position: a.position,
          jerseyNumber: a.jerseyNumber,
          value: a.assists,
          rank: idx + 1,
        }))
      );

      setDiscipline(
        disciplineData.map((d: any, idx: number) => ({
          playerId: d.playerId,
          playerName: d.playerName,
          position: d.position,
          jerseyNumber: d.jerseyNumber,
          value: d.yellowCards + d.redCards * 2,
          yellowCards: d.yellowCards,
          redCards: d.redCards,
          rank: idx + 1,
        }))
      );
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast.error('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-yellow-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-yellow-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                {team?.name} - Season Rankings
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Player statistics and leaderboards
              </p>
            </div>
          </div>
        </div>

        {/* Top 3 Scorers Showcase */}
        {scorers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
              <Goal className="w-6 h-6" />
              Top Scorers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {scorers.slice(0, 3).map((scorer, idx) => {
                const position = idx + 1;
                const medalColor =
                  MEDAL_COLORS[position as keyof typeof MEDAL_COLORS] || 'from-gray-400 to-gray-600';

                return (
                  <div
                    key={scorer.playerId}
                    className={`relative h-32 rounded-2xl bg-gradient-to-br ${medalColor} shadow-xl overflow-hidden group ${
                      position === 1 ? 'md:scale-105 md:col-span-1' : ''
                    }`}
                  >
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-10">
                      <Goal className="w-32 h-32 absolute -top-4 -right-4 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                      <div className="text-4xl font-bold mb-2">{getMedalIcon(position)}</div>
                      <p className="text-lg font-bold text-center line-clamp-2">{scorer.playerName}</p>
                      <div className="mt-auto text-center">
                        <p className="text-3xl font-black">{scorer.value}</p>
                        <p className="text-xs opacity-90">Goals</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Scorers Leaderboard */}
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">All Scorers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scorers.map((scorer, idx) => (
                    <div
                      key={scorer.playerId}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-charcoal-900 dark:text-white">
                            {scorer.playerName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {scorer.position}
                            {scorer.jerseyNumber && ` • #${scorer.jerseyNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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

        {/* Top Assists & Discipline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Assists */}
          {assists.length > 0 && (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Top Assists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assists.slice(0, 5).map((assist, idx) => (
                    <div
                      key={assist.playerId}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-900 dark:text-white truncate">
                            {assist.playerName}
                          </p>
                          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                            {assist.position}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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

          {/* Disciplinary Leaders */}
          {discipline.length > 0 && (
            <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Disciplinary Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discipline.slice(0, 5).map((player, idx) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-rose-400 text-white font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-900 dark:text-white truncate">
                            {player.playerName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {player.yellowCards > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                                🟨 {player.yellowCards}
                              </span>
                            )}
                            {player.redCards > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                                🟥 {player.redCards}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
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

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            {
              label: 'Top Scorer',
              value: scorers[0]?.playerName || 'N/A',
              stat: `${scorers[0]?.value || 0} Goals`,
              icon: Goal,
              color: 'from-yellow-500 to-orange-400',
            },
            {
              label: 'Most Assists',
              value: assists[0]?.playerName || 'N/A',
              stat: `${assists[0]?.value || 0} Assists`,
              icon: Zap,
              color: 'from-blue-500 to-cyan-400',
            },
            {
              label: 'Most Disciplined',
              value: discipline[0]?.playerName || 'N/A',
              stat: `${discipline[0]?.yellowCards || 0}🟨 ${discipline[0]?.redCards || 0}🟥`,
              icon: AlertTriangle,
              color: 'from-red-500 to-rose-400',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                className={`bg-gradient-to-br ${stat.color} border-0 shadow-lg overflow-hidden`}
              >
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-white opacity-30 mb-4" />
                  <p className="text-white text-sm opacity-90 mb-1">{stat.label}</p>
                  <p className="text-white text-lg font-bold mb-2">{stat.value}</p>
                  <p className="text-white text-sm opacity-80">{stat.stat}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
