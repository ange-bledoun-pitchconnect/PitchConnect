'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveStandings } from '@/components/dashboard/live-standings';
import { LiveMatches } from '@/components/dashboard/live-matches';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Activity, RefreshCw } from 'lucide-react';

interface LeagueOption {
  id: string;
  name: string;
  season: number;
}

/**
 * Live Dashboard Page
 * Real-time league standings and match updates
 */
export default function LiveDashboard() {
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch user's leagues
  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['leagues', 'user'],
    queryFn: async () => {
      const response = await axios.get('/api/leagues?limit=50');
      return response.data.data;
    },
  });

  // Set default league
  if (leagues && !selectedLeague && leagues.length > 0) {
    setSelectedLeague(leagues.id);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Activity className="h-8 w-8 text-red-600" />
            Live Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Real-time league standings and match updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="primary" className="bg-red-600 text-white">
            <Activity className="mr-1 h-3 w-3 animate-pulse" />
            LIVE
          </Badge>
        </div>
      </div>

      {/* League Selector */}
      {leaguesLoading ? (
        <LoadingSpinner />
      ) : (
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="font-semibold text-gray-700">Select League:</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Choose a league...</option>
              {leagues?.map((league: LeagueOption) => (
                <option key={league.id} value={league.id}>
                  {league.name} - Season {league.season}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {selectedLeague && (
        <Tabs defaultValue="standings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standings">
              Standings
            </TabsTrigger>
            <TabsTrigger value="matches">
              Matches
            </TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <LiveStandings
              leagueId={selectedLeague}
              showTrends={true}
              maxRows={20}
            />
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <LiveMatches
              leagueId={selectedLeague}
              limit={10}
            />
          </TabsContent>
        </Tabs>
      )}

      {!selectedLeague && (
        <Card className="border-blue-200 bg-blue-50 p-8 text-center">
          <p className="text-lg text-blue-900">
            Select a league to view live standings and matches
          </p>
        </Card>
      )}
    </div>
  );
}
