'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerPerformanceAnalytics } from '@/components/analytics/player-performance';
import { TeamTrends } from '@/components/analytics/team-trends';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { TrendingUp, BarChart3, Users, Trophy } from 'lucide-react';

/**
 * Advanced Analytics Dashboard Page
 * AI-powered player & team performance analysis
 */
export default function AdvancedAnalyticsDashboard() {
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('season');

  // Fetch leagues
  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      const response = await axios.get('/api/leagues?limit=50');
      return response.data.data;
    },
  });

  // Fetch clubs based on selected league
  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs', selectedLeague],
    queryFn: async () => {
      if (!selectedLeague) return [];
      const response = await axios.get(
        `/api/leagues/${selectedLeague}/clubs?limit=50`,
      );
      return response.data.data;
    },
    enabled: !!selectedLeague,
  });

  // Fetch players based on selected club
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', selectedClub],
    queryFn: async () => {
      if (!selectedClub) return [];
      const response = await axios.get(
        `/api/clubs/${selectedClub}/players?limit=50`,
      );
      return response.data.data;
    },
    enabled: !!selectedClub,
  });

  if (leaguesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Advanced Analytics
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          AI-powered player & team performance insights
        </p>
      </div>

      {/* Selectors Card */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* League Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select League
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedClub('');
                setSelectedPlayer('');
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
            >
              <option value="">Choose a league...</option>
              {leagues?.map((league: any) => (
                <option key={league.id} value={league.id}>
                  {league.name} - Season {league.season}
                </option>
              ))}
            </select>
          </div>

          {/* Club Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Club
            </label>
            <select
              value={selectedClub}
              onChange={(e) => {
                setSelectedClub(e.target.value);
                setSelectedPlayer('');
              }}
              disabled={!selectedLeague}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Choose a club...</option>
              {clubs?.map((club: any) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="season">Season</option>
            </select>
          </div>
        </div>
      </Card>

      {!selectedLeague ? (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-8 text-center">
          <p className="text-lg text-blue-900 dark:text-blue-400">
            Select a league to view advanced analytics
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="team-trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team-trends" className="gap-2">
              <Trophy className="w-4 h-4" />
              Team Trends
            </TabsTrigger>
            <TabsTrigger value="player-performance" className="gap-2">
              <Users className="w-4 h-4" />
              Player Analysis
            </TabsTrigger>
          </TabsList>

          {/* Team Trends Tab */}
          <TabsContent value="team-trends">
            {!selectedClub ? (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-8 text-center">
                <p className="text-lg text-blue-900 dark:text-blue-400">
                  Select a club to view team trends
                </p>
              </Card>
            ) : (
              <TeamTrends
                clubId={selectedClub}
                clubName={
                  clubs?.find((c: any) => c.id === selectedClub)?.name || 'Team'
                }
                timeRange={timeRange}
              />
            )}
          </TabsContent>

          {/* Player Performance Tab */}
          <TabsContent value="player-performance">
            <div className="space-y-4">
              {selectedClub && !selectedPlayer && (
                <Card className="p-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Player
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose a player...</option>
                    {players?.map((player: any) => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName} - {player.position}
                      </option>
                    ))}
                  </select>
                </Card>
              )}

              {selectedPlayer && (
                <PlayerPerformanceAnalytics
                  playerId={selectedPlayer}
                  playerName={
                    players?.find((p: any) => p.id === selectedPlayer)
                      ? `${players.find((p: any) => p.id === selectedPlayer).firstName} ${players.find((p: any) => p.id === selectedPlayer).lastName}`
                      : 'Player'
                  }
                  position={
                    players?.find((p: any) => p.id === selectedPlayer)?.position ||
                    'Unknown'
                  }
                />
              )}

              {selectedClub && !selectedPlayer && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 p-8 text-center">
                  <p className="text-lg text-blue-900 dark:text-blue-400">
                    Select a player to view detailed performance analytics
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
