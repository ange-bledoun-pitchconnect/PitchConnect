'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Target,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MatchStats {
  homeTeamGoals: number;
  awayTeamGoals: number;
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
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
  stats?: MatchStats;
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  page: number;
  pageSize: number;
}

const statusColors: Record<Match['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  live: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels: Record<Match['status'], string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
};

export default function MatchesListPageV2() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sport, setSport] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<MatchesResponse>({
    queryKey: ['matches', searchTerm, sport, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        sport: sport !== 'all' ? sport : '',
        status: status !== 'all' ? status : '',
        page: page.toString(),
        pageSize: '12',
      });

      const response = await axios.get(`/api/matches?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data.data;
    },
    staleTime: 2000,
  });

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1);
    },
    [],
  );

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      await axios.delete(`/api/matches/${matchId}`);
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load matches</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
            <p className="text-gray-600">Manage fixtures and match results</p>
          </div>
          <Link href="/dashboard/matches-v2/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus size={20} />
              Schedule Match
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by opponent..."
                value={searchTerm}
                onChange={handleSearch}
                prefix={<Search size={18} className="text-gray-400" />}
              />
            </div>

            {/* Sport Filter */}
            <select
              value={sport}
              onChange={(e) => {
                setSport(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sports</option>
              <option value="football">Football</option>
              <option value="netball">Netball</option>
              <option value="rugby">Rugby</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Card>

        {/* Matches Grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data?.matches && data.matches.length > 0 ? (
              data.matches.map((match) => (
                <Card
                  key={match.id}
                  className="p-6 hover:shadow-lg transition-shadow flex flex-col"
                >
                  {/* Match Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {match.homeTeam} vs {match.awayTeam}
                      </h3>
                      {match.competition && (
                        <p className="text-sm text-gray-600 mt-1">
                          {match.competition}
                        </p>
                      )}
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={18} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Score/Status */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    {match.status === 'completed' && match.stats ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {match.stats.homeTeamGoals}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {match.homeTeam}
                          </p>
                        </div>
                        <p className="text-gray-400">-</p>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {match.stats.awayTeamGoals}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {match.awayTeam}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-600">
                          {new Date(match.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Stats Preview */}
                  {match.status === 'completed' && match.stats && (
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      {match.stats.possession && (
                        <div className="flex items-center justify-between">
                          <span>Possession</span>
                          <span className="font-semibold">
                            {match.stats.possession}%
                          </span>
                        </div>
                      )}
                      {match.stats.shots && (
                        <div className="flex items-center justify-between">
                          <span>Shots</span>
                          <span className="font-semibold">{match.stats.shots}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-4 flex gap-2">
                    <Badge
                      variant="secondary"
                      className={statusColors[match.status]}
                    >
                      {statusLabels[match.status]}
                    </Badge>
                    <Badge variant="primary" className="capitalize">
                      {match.sport}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/dashboard/matches-v2/${match.id}`} className="flex-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Target size={16} />
                        View
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(match.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 col-span-full text-center">
                <p className="text-gray-500">No matches found</p>
                <Link href="/dashboard/matches-v2/new">
                  <Button variant="primary" className="mt-4">
                    Schedule your first match
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {data.matches.length} of {data.total} matches
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data.matches || data.matches.length < 12}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
