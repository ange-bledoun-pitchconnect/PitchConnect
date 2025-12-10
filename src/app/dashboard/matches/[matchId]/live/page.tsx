// ============================================================================
// src/app/dashboard/matches/[matchId]/live/page.tsx
// Live Match Tracking Dashboard - Real-time Match Management
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Play,
  Pause,
  Clock,
  Activity,
  Target,
  Users,
  AlertCircle,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EventLogger } from '@/components/dashboard/EventLogger';
import { LiveStats } from '@/components/dashboard/LiveStats';
import { EventTimeline } from '@/components/dashboard/EventTimeline';
import { ScoreBoard } from '@/components/dashboard/ScoreBoard';

interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'injury' | 'corner' | 'foul' | 'possession';
  team: 'home' | 'away';
  player?: { id: string; name: string; number: number };
  replacePlayer?: { id: string; name: string; number: number };
  minute: number;
  injuryTime?: number;
  notes?: string;
  timestamp: string;
  isOwn?: boolean;
  isPenalty?: boolean;
}

interface LiveMatchStats {
  homeTeam: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    completedPasses: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    corners: number;
    offsides: number;
  };
  awayTeam: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    completedPasses: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    corners: number;
    offsides: number;
  };
}

interface LiveMatch {
  id: string;
  homeTeam: { id: string; name: string; logo?: string };
  awayTeam: { id: string; name: string; logo?: string };
  status: 'live' | 'paused' | 'finished' | 'halftime';
  currentMinute: number;
  injuryTime: number;
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  stats: LiveMatchStats;
  possession: { home: number; away: number };
  startTime: string;
  lastUpdated: string;
  venue?: string;
  attendance?: number;
}

const generateMockLiveMatch = (): LiveMatch => {
  const events: MatchEvent[] = [
    {
      id: '1',
      matchId: '1',
      type: 'goal',
      team: 'home',
      player: { id: 'p1', name: 'Kai Havertz', number: 29 },
      minute: 12,
      timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      matchId: '1',
      type: 'yellow',
      team: 'away',
      player: { id: 'p2', name: 'Kyle Walker', number: 2 },
      minute: 18,
      timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      matchId: '1',
      type: 'corner',
      team: 'away',
      minute: 25,
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      matchId: '1',
      type: 'goal',
      team: 'away',
      player: { id: 'p3', name: 'Erling Haaland', number: 9 },
      minute: 31,
      timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    },
  ];

  return {
    id: '1',
    homeTeam: { id: 'h1', name: 'Arsenal' },
    awayTeam: { id: 'a1', name: 'Manchester City' },
    status: 'live',
    currentMinute: 60,
    injuryTime: 0,
    homeGoals: 1,
    awayGoals: 1,
    events,
    stats: {
      homeTeam: {
        possession: 48,
        shots: 8,
        shotsOnTarget: 4,
        passes: 342,
        completedPasses: 301,
        fouls: 4,
        yellowCards: 0,
        redCards: 0,
        corners: 3,
        offsides: 1,
      },
      awayTeam: {
        possession: 52,
        shots: 9,
        shotsOnTarget: 5,
        passes: 365,
        completedPasses: 324,
        fouls: 3,
        yellowCards: 1,
        redCards: 0,
        corners: 4,
        offsides: 0,
      },
    },
    possession: { home: 48, away: 52 },
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date().toISOString(),
    venue: 'Emirates Stadium',
    attendance: 60361,
  };
};

export default function LiveMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'events' | 'stats' | 'timeline'>('events');
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLiveMatch();
  }, [matchId]);

  // Auto-refresh live data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLiveMatch();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, matchId]);

  // Update match timer
  useEffect(() => {
    if (!isRunning || !liveMatch || liveMatch.status !== 'live') return;

    const interval = setInterval(() => {
      setLiveMatch((prev) => {
        if (!prev || prev.currentMinute >= 90) return prev;
        return { ...prev, currentMinute: prev.currentMinute + 1 };
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isRunning, liveMatch]);

  const fetchLiveMatch = async () => {
    try {
      // In production, replace with real API call
      // const response = await fetch(`/api/matches/${matchId}/live`);
      // const data = await response.json();

      // Mock data
      setLiveMatch(generateMockLiveMatch());
    } catch (error) {
      console.error('Error fetching live match:', error);
      toast.error('Failed to fetch live match data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = (event: MatchEvent) => {
    if (!liveMatch) return;

    const updatedMatch = {
      ...liveMatch,
      events: [...liveMatch.events, event],
      ...(event.type === 'goal' && event.team === 'home'
        ? { homeGoals: liveMatch.homeGoals + 1 }
        : event.type === 'goal' && event.team === 'away'
          ? { awayGoals: liveMatch.awayGoals + 1 }
          : {}),
      lastUpdated: new Date().toISOString(),
    };

    setLiveMatch(updatedMatch);
    toast.success(`${event.type.toUpperCase()} logged`);
  };

  const handleToggleMatch = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      toast.success('Match resumed');
    } else {
      toast.info('Match paused');
    }
  };

  const handleExportStats = () => {
    if (!liveMatch) return;

    const statsData = JSON.stringify(liveMatch, null, 2);
    const blob = new Blob([statsData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-match-${matchId}-${new Date().toISOString().split('T')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Stats exported');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading live match...</p>
        </div>
      </div>
    );
  }

  if (!liveMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900">Match not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isFinished = liveMatch.status === 'finished';
  const isHalftime = liveMatch.status === 'halftime';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/matches/${matchId}`}>
            <Button variant="ghost" className="mb-4 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Match
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-charcoal-900">Live Match</h1>
                {liveMatch.status === 'live' && (
                  <Badge className="bg-red-100 text-red-700 animate-pulse flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-charcoal-600">
                {liveMatch.homeTeam.name} vs {liveMatch.awayTeam.name}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleToggleMatch}
                disabled={isFinished}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={fetchLiveMatch}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExportStats}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* SCOREBOARD */}
        <div className="mb-8">
          <ScoreBoard
            homeTeam={liveMatch.homeTeam}
            awayTeam={liveMatch.awayTeam}
            homeGoals={liveMatch.homeGoals}
            awayGoals={liveMatch.awayGoals}
            currentMinute={liveMatch.currentMinute}
            status={liveMatch.status}
            injuryTime={liveMatch.injuryTime}
            possession={liveMatch.possession}
          />
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> Total Shots
              </p>
              <p className="text-2xl font-bold text-charcoal-900">
                {liveMatch.stats.homeTeam.shots} - {liveMatch.stats.awayTeam.shots}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> On Target
              </p>
              <p className="text-2xl font-bold text-charcoal-900">
                {liveMatch.stats.homeTeam.shotsOnTarget} - {liveMatch.stats.awayTeam.shotsOnTarget}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Fouls
              </p>
              <p className="text-2xl font-bold text-charcoal-900">
                {liveMatch.stats.homeTeam.fouls} - {liveMatch.stats.awayTeam.fouls}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-charcoal-600 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Possession
              </p>
              <p className="text-2xl font-bold text-charcoal-900">
                {liveMatch.possession.home}% - {liveMatch.possession.away}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-neutral-200 mb-8">
          <button
            onClick={() => setSelectedTab('events')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Events
          </button>
          <button
            onClick={() => setSelectedTab('stats')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Statistics
          </button>
          <button
            onClick={() => setSelectedTab('timeline')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Timeline
          </button>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2">
            {selectedTab === 'events' && !isFinished && (
              <EventLogger onAddEvent={handleAddEvent} matchId={matchId} currentMinute={liveMatch.currentMinute} />
            )}
            {selectedTab === 'stats' && (
              <LiveStats stats={liveMatch.stats} />
            )}
            {selectedTab === 'timeline' && (
              <EventTimeline events={liveMatch.events} />
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* MATCH INFO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-charcoal-600">Venue</p>
                  <p className="font-semibold text-charcoal-900">{liveMatch.venue || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-charcoal-600">Attendance</p>
                  <p className="font-semibold text-charcoal-900">
                    {liveMatch.attendance?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-charcoal-600">Status</p>
                  <p className="font-semibold text-charcoal-900 capitalize">{liveMatch.status}</p>
                </div>
              </CardContent>
            </Card>

            {/* SETTINGS */}
            {showSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-charcoal-900">Auto Refresh</label>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
