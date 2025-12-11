'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Match {
  id: string;
  date: string;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  venue?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  sport: string;
  competition?: string;
  attendance?: number;
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  page: number;
  pageSize: number;
}

const statusColors: Record<Match['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<Match['status'], string> = {
  scheduled: 'Scheduled',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function MatchesDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sport, setSport] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch matches
  const { data, isLoading, error } = useQuery<MatchesResponse>({
    queryKey: ['matches', searchTerm, sport, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        sport: sport !== 'all' ? sport : '',
        status: status !== 'all' ? status : '',
        page: page.toString(),
        pageSize: '10',
      });

      const response = await axios.get(`/api/matches?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
    staleTime: 2000,
  });

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1);
    },
    [],
  );

  const handleSportFilter = useCallback((newSport: string) => {
    setSport(newSport);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

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
            <p className="text-gray-600">Manage and track all your matches</p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={20} />
            New Match
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search matches..."
                value={searchTerm}
                onChange={handleSearch}
                prefix={<Search size={18} className="text-gray-400" />}
              />
            </div>

            {/* Sport Filter */}
            <select
              value={sport}
              onChange={(e) => handleSportFilter(e.target.value)}
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
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Matches List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {data?.matches && data.matches.length > 0 ? (
              data.matches.map((match) => (
                <Card
                  key={match.id}
                  className="p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {/* Teams */}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </div>
                          {match.status === 'completed' && (
                            <div className="text-lg font-bold text-gray-900 mt-1">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(match.date).toLocaleDateString()}
                          </div>
                          {match.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              {match.venue}
                            </div>
                          )}
                          {match.attendance && (
                            <div className="flex items-center gap-2">
                              <Users size={16} />
                              {match.attendance.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant="secondary"
                          className={statusColors[match.status]}
                        >
                          {statusLabels[match.status]}
                        </Badge>

                        {/* Sport Badge */}
                        <Badge variant="primary" className="capitalize">
                          {match.sport}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={20} className="text-gray-400" />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No matches found</p>
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
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={!data.matches || data.matches.length < 10}
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
