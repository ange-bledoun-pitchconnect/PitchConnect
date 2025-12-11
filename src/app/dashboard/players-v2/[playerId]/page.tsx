'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, Edit, Heart, TrendingUp, Calendar, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlayerStats {
  season: string;
  rating: number;
  appearances: number;
  goals?: number;
  assists?: number;
  wins?: number;
}

interface Injury {
  id: string;
  type: string;
  date: string;
  recoveryDate?: string;
  severity: 'minor' | 'moderate' | 'severe';
}

interface Contract {
  id: string;
  startDate: string;
  endDate: string;
  salary?: number;
  role?: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  number?: number;
  sport: string;
  status: 'active' | 'injured' | 'inactive';
  dateOfBirth?: string;
  nationality?: string;
  height?: number;
  weight?: number;
  stats?: PlayerStats[];
  injuries?: Injury[];
  contract?: Contract;
}

const severityColors: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  severe: 'bg-red-100 text-red-800',
};

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;

  const { data: player, isLoading, error } = useQuery<Player>({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const response = await axios.get(`/api/players/${playerId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  if (error || !player) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load player details</p>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/players-v2')}
          className="mt-4"
        >
          Back to Players
        </Button>
      </div>
    );
  }

  const age = player.dateOfBirth
    ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()
    : null;

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Back Button */}
        <Link href="/dashboard/players-v2">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            Back to Players
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {player.firstName} {player.lastName}
              </h1>
              <p className="text-xl text-gray-600 mt-2">{player.position}</p>
            </div>
            <Link href={`/dashboard/players-v2/${playerId}/edit`}>
              <Button variant="primary" className="flex items-center gap-2">
                <Edit size={20} />
                Edit Player
              </Button>
            </Link>
          </div>

          {/* Player Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {player.number && (
              <div>
                <p className="text-sm text-gray-600">Jersey Number</p>
                <p className="text-2xl font-bold text-gray-900">#{player.number}</p>
              </div>
            )}
            {age && (
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="text-2xl font-bold text-gray-900">{age}</p>
              </div>
            )}
            {player.height && (
              <div>
                <p className="text-sm text-gray-600">Height</p>
                <p className="text-2xl font-bold text-gray-900">{player.height}cm</p>
              </div>
            )}
            {player.weight && (
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="text-2xl font-bold text-gray-900">{player.weight}kg</p>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mt-6">
            <Badge
              variant="secondary"
              className={
                player.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : player.status === 'injured'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
              }
            >
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </Badge>
            <Badge variant="primary" className="capitalize">
              {player.sport}
            </Badge>
          </div>
        </Card>

        {/* Statistics */}
        {player.stats && player.stats.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={24} />
              Statistics
            </h2>

            <div className="space-y-4">
              {player.stats.slice(0, 3).map((stat, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {stat.season}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="text-lg font-bold text-gray-900">
                        {stat.rating.toFixed(1)}/10
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Appearances</p>
                      <p className="text-lg font-bold text-gray-900">
                        {stat.appearances}
                      </p>
                    </div>
                    {stat.goals !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600">Goals</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stat.goals}
                        </p>
                      </div>
                    )}
                    {stat.assists !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600">Assists</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stat.assists}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Injuries */}
        {player.injuries && player.injuries.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart size={24} className="text-red-600" />
              Injury History
            </h2>

            <div className="space-y-4">
              {player.injuries.map((injury) => (
                <div
                  key={injury.id}
                  className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{injury.type}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(injury.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={severityColors[injury.severity]}
                    >
                      {injury.severity}
                    </Badge>
                  </div>
                  {injury.recoveryDate && (
                    <p className="text-sm text-green-700 mt-2">
                      ✓ Recovered: {new Date(injury.recoveryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Contract */}
        {player.contract && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award size={24} />
              Contract Details
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Start Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(player.contract.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">End Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(player.contract.endDate).toLocaleDateString()}
                </p>
              </div>
              {player.contract.salary && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Salary</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${(player.contract.salary / 1000).toFixed(0)}K
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
