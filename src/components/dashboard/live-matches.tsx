'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Fixture, MatchResult } from '@/types';
import { Activity, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

interface LiveMatchesProps {
  leagueId?: string;
  limit?: number;
  className?: string;
}

interface MatchDisplayData extends Fixture {
  result?: MatchResult;
  statusColor: string;
  statusBg: string;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'LIVE':
      return {
        color: 'text-red-600',
        bg: 'bg-red-50',
        badge: 'bg-red-600 text-white animate-pulse',
        icon: <Activity className="h-4 w-4" />,
      };
    case 'COMPLETED':
      return {
        color: 'text-green-600',
        bg: 'bg-green-50',
        badge: 'bg-green-600 text-white',
        icon: <Trophy className="h-4 w-4" />,
      };
    case 'SCHEDULED':
      return {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        badge: 'bg-blue-600 text-white',
        icon: <Clock className="h-4 w-4" />,
      };
    case 'POSTPONED':
      return {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        badge: 'bg-yellow-600 text-white',
        icon: <Clock className="h-4 w-4" />,
      };
    case 'CANCELLED':
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        badge: 'bg-gray-600 text-white',
        icon: <Activity className="h-4 w-4" />,
      };
    default:
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        badge: 'bg-gray-600 text-white',
        icon: <Clock className="h-4 w-4" />,
      };
  }
};

const formatMatchTime = (date: string) => {
  const matchDate = new Date(date);
  const now = new Date();

  // If match is today
  if (matchDate.toDateString() === now.toDateString()) {
    return matchDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // If match is tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (matchDate.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return matchDate.toLocaleDateString('en-GB');
};

export function LiveMatches({
  leagueId,
  limit = 5,
  className = '',
}: LiveMatchesProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['matches', 'live', leagueId],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'LIVE,SCHEDULED,COMPLETED',
        limit: limit.toString(),
        orderBy: 'scheduledDate',
      });

      if (leagueId) {
        params.append('leagueId', leagueId);
      }

      const response = await axios.get(`/api/matches?${params.toString()}`);
      return response.data.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Failed to load matches</p>
      </Card>
    );
  }

  const matches = data || [];

  return (
    <Card className={className}>
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Live & Upcoming Matches</h2>
      </div>

      {isLoading && !matches.length ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : matches.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No matches found</p>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {matches.map((match: Fixture) => {
            const styles = getStatusStyles(match.status);

            return (
              <Link
                key={match.id}
                href={`/dashboard/matches-v2/${match.id}`}
                className="block"
              >
                <div
                  className={`rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md ${styles.bg}`}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary" className={styles.badge}>
                      <span className="mr-1">{styles.icon}</span>
                      {match.status}
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">
                      {formatMatchTime(match.scheduledDate)}
                    </span>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex flex-1 items-center gap-2">
                      {match.homeClub?.logoUrl && (
                        <img
                          src={match.homeClub.logoUrl}
                          alt={match.homeClub.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {match.homeClub?.shortName || match.homeClub?.name}
                        </p>
                        <p className="text-xs text-gray-500">Home</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="px-6 text-center">
                      {match.status === 'LIVE' ? (
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {match.result?.homeGoals || 0} -{' '}
                            {match.result?.awayGoals || 0}
                          </p>
                          <p className="text-xs text-red-600 font-semibold animate-pulse">
                            {match.scheduledDate}' ⏱️
                          </p>
                        </div>
                      ) : match.status === 'COMPLETED' ? (
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {match.result?.homeGoals || 0} -{' '}
                            {match.result?.awayGoals || 0}
                          </p>
                          <p className="text-xs text-green-600">Final</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-gray-600">vs</p>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-gray-900">
                          {match.awayClub?.shortName || match.awayClub?.name}
                        </p>
                        <p className="text-xs text-gray-500">Away</p>
                      </div>
                      {match.awayClub?.logoUrl && (
                        <img
                          src={match.awayClub.logoUrl}
                          alt={match.awayClub.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Stats (if live or completed) */}
                  {(match.status === 'LIVE' || match.status === 'COMPLETED') &&
                    match.result && (
                      <div className="mt-3 border-t border-gray-300 pt-3">
                        <div className="grid grid-cols-5 gap-2 text-center text-xs">
                          <div>
                            <p className="text-gray-600">Possession</p>
                            <p className="font-semibold text-gray-900">
                              {match.result.possession?.home || 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Shots</p>
                            <p className="font-semibold text-gray-900">
                              {match.result.shots?.home || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">SOT</p>
                            <p className="font-semibold text-gray-900">
                              {match.result.shotsOnTarget?.home || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Corners</p>
                            <p className="font-semibold text-gray-900">
                              {match.result.cornerKicks?.home || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Fouls</p>
                            <p className="font-semibold text-gray-900">
                              {match.result.fouls?.home || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
