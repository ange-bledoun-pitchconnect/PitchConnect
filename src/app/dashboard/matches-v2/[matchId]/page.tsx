'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Target,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlayerPerformance {
  playerId: string;
  playerName: string;
  rating: number;
  goals?: number;
  assists?: number;
  minutesPlayed: number;
}

interface MatchStats {
  homeTeamGoals: number;
  awayTeamGoals: number;
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
  passes?: number;
  passAccuracy?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed';
  sport: string;
  competition?: string;
  formation?: string;
  stats?: MatchStats;
  playerPerformances?: PlayerPerformance[];
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const { data: match, isLoading, error } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await axios.get(`/api/matches/${matchId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  if (error || !match) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load match details</p>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/matches-v2')}
          className="mt-4"
        >
          Back to Matches
        </Button>
      </div>
    );
  }

  const statusColor =
    match.status === 'completed'
      ? 'bg-green-100 text-green-800'
      : match.status === 'live'
        ? 'bg-red-100 text-red-800'
        : 'bg-blue-100 text-blue-800';

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Back Button */}
        <Link href="/dashboard/matches-v2">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            Back to Matches
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">
                {match.homeTeam} vs {match.awayTeam}
              </h1>
              {match.competition && (
                <p className="text-lg text-gray-600 mt-2">{match.competition}</p>
              )}
            </div>
            <Link href={`/dashboard/matches-v2/${matchId}/edit`}>
              <Button variant="primary" className="flex items-center gap-2">
                <Edit size={20} />
                Edit Match
              </Button>
            </Link>
          </div>

          {/* Score Display */}
          {match.status === 'completed' && match.stats ? (
            <div className="mb-6 text-center py-8 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-8">
                <div>
                  <p className="text-6xl font-bold text-gray-900">
                    {match.stats.homeTeamGoals}
                  </p>
                  <p className="text-lg text-gray-600 mt-2">{match.homeTeam}</p>
                </div>
                <p className="text-4xl text-gray-400">-</p>
                <div>
                  <p className="text-6xl font-bold text-gray-900">
                    {match.stats.awayTeamGoals}
                  </p>
                  <p className="text-lg text-gray-600 mt-2">{match.awayTeam}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 py-4 text-center">
              <p className="text-lg text-gray-600">
                {new Date(match.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {match.venue && (
                <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
                  <MapPin size={16} />
                  {match.venue}
                </p>
              )}
            </div>
          )}

          {/* Match Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Formation</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {match.formation || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sport</p>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {match.sport}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex gap-2 mt-6">
            <Badge variant="secondary" className={statusColor}>
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </Badge>
          </div>
        </Card>

        {/* Match Statistics */}
        {match.status === 'completed' && match.stats && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target size={24} />
              Match Statistics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {match.stats.possession !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Possession</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {match.stats.possession}%
                  </p>
                </div>
              )}
              {match.stats.shots !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Shots</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {match.stats.shots}
                  </p>
                </div>
              )}
              {match.stats.shotsOnTarget !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Shots on Target</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {match.stats.shotsOnTarget}
                  </p>
                </div>
              )}
              {match.stats.passAccuracy !== undefined && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Pass Accuracy</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {match.stats.passAccuracy}%
                  </p>
                </div>
              )}
              {match.stats.fouls !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Fouls</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {match.stats.fouls}
                  </p>
                </div>
              )}
              {match.stats.yellowCards !== undefined && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Yellow Cards</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {match.stats.yellowCards}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Player Performance */}
        {match.playerPerformances && match.playerPerformances.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users size={24} />
              Player Performance
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Player
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Rating
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Goals
                    </th>
                    {match.playerPerformances.some((p) => p.assists !== undefined) && (
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">
                        Assists
                      </th>
                    )}
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Minutes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {match.playerPerformances.map((perf) => (
                    <tr
                      key={perf.playerId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {perf.playerName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-blue-600">
                          {perf.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {perf.goals || '-'}
                      </td>
                      {match.playerPerformances.some(
                        (p) => p.assists !== undefined,
                      ) && (
                        <td className="py-3 px-4 text-center">
                          {perf.assists || '-'}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        {perf.minutesPlayed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
