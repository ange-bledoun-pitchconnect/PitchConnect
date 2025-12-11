'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeagueLayoutProps {
  children: React.ReactNode;
  params: {
    leagueId: string;
  };
}

export default function LeagueLayout({ children, params }: LeagueLayoutProps) {
  const { leagueId } = params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [leagueData, setLeagueData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/leagues/${leagueId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch league: ${response.statusText}`);
        }

        const data = await response.json();
        setLeagueData(data);
      } catch (err) {
        console.error('Error fetching league:', err);
        setError(err instanceof Error ? err.message : 'Failed to load league');
      } finally {
        setIsLoading(false);
      }
    };

    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading league...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <h2 className="font-semibold text-destructive">Error Loading League</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{leagueData?.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Season {leagueData?.season} • {leagueData?.sport || 'FOOTBALL'}
            </p>
          </div>
          {leagueData?.logo && (
            <img
              src={leagueData.logo}
              alt={leagueData.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <Link href={`/dashboard/leagues/${leagueId}`}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="standings">
            <Link href={`/dashboard/leagues/${leagueId}/standings`}>Standings</Link>
          </TabsTrigger>
          <TabsTrigger value="fixtures">
            <Link href={`/dashboard/leagues/${leagueId}/fixtures`}>Fixtures</Link>
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Link href={`/dashboard/leagues/${leagueId}/teams`}>Teams</Link>
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Link href={`/dashboard/leagues/${leagueId}/analytics`}>Analytics</Link>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Link href={`/dashboard/leagues/${leagueId}/settings`}>Settings</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
