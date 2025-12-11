'use client';

import { useParams } from 'next/navigation';
import { useRealTimeMatch } from '@/hooks/useRealTimeMatch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MatchEvents } from '@/components/match/match-events';
import { LiveStats } from '@/components/match/live-stats';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useEffect, useState } from 'react';
import { AlertCircle, Activity, Zap } from 'lucide-react';

export default function LiveMatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { liveData, events, isConnected, isLoading, emitEvent } =
    useRealTimeMatch(matchId);
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <LoadingSpinner />;

  const minutes = Math.floor(elapsed / 60);

  return (
    <div className="space-y-6 p-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-yellow-600" />
          <p className="text-yellow-800">
            Reconnecting to live match... Please wait
          </p>
        </div>
      )}

      {/* Live Score */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">
              {liveData.homeTeamGoals || 0}
            </p>
            <p className="text-lg text-gray-600 mt-2">{liveData.homeTeam}</p>
          </div>

          <div className="text-center">
            <p className="text-4xl text-gray-400 font-light">-</p>
            <div className="mt-2 flex items-center gap-2 justify-center">
              <Badge variant="primary" className="bg-red-100 text-red-800">
                LIVE
              </Badge>
              <span className="text-2xl font-bold text-gray-900">
                {minutes}'
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">
              {liveData.awayTeamGoals || 0}
            </p>
            <p className="text-lg text-gray-600 mt-2">{liveData.awayTeam}</p>
          </div>
        </div>
      </Card>

      {/* Match Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-600 animate-pulse" />
            <span className="font-semibold text-gray-900">
              Match in Progress
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {isConnected ? '✓ Connected' : '✗ Connecting...'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Pause/Resume logic
              }}
            >
              Pause
            </Button>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Timeline */}
        <div className="lg:col-span-2">
          <MatchEvents
            events={events}
            onEmitEvent={emitEvent}
          />
        </div>

        {/* Live Stats */}
        <div>
          <LiveStats
            possession={liveData.possession || 50}
            shots={liveData.shots || 0}
            passAccuracy={liveData.passAccuracy || 80}
          />
        </div>
      </div>
    </div>
  );
}
