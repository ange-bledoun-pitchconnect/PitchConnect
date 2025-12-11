'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  TrendingUp,
  Award,
  Heart,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface PlayerStats {
  rating: number;
  appearances: number;
  goals?: number;
  assists?: number;
  wins?: number;
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
  stats?: PlayerStats;
  contract?: {
    endDate: string;
  };
}

interface PlayersResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
}

const statusColors: Record<Player['status'], string> = {
  active: 'bg-green-100 text-green-800',
  injured: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<Player['status'], string> = {
  active: 'Active',
  injured: 'Injured',
  inactive: 'Inactive',
};

export default function PlayersDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sport, setSport] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [position, setPosition] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch players
  const { data, isLoading, error } = useQuery<PlayersResponse>({
    queryKey: ['players', searchTerm, sport, status, position, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        sport: sport !== 'all' ? sport : '',
        status: status !== 'all' ? status : '',
        position: position !== 'all' ? position : '',
        page: page.toString(),
        pageSize: '10',
      });

      const response = await axios.get(`/api/players?${params}`, {
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

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load players</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Players</h1>
            <p className="text-gray-600">Manage your squad and player development</p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={20} />
            Add Player
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={handleSearch}
                prefix={<Search size={18} className="text-gray-400" />}
              />
            </div>

            {/* Sport Filter */}
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sports</option>
              <option value="football">Football</option>
              <option value="netball">Netball</option>
              <option value="rugby">Rugby</option>
            </select>

            {/* Position Filter */}
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="injured">Injured</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        {/* Players Grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data?.players && data.players.length > 0 ? (
              data.players.map((player) => (
                <Card
                  key={player.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {player.firstName} {player.lastName}
                        </h3>
                        {player.number && (
                          <Badge variant="secondary">#{player.number}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {player.position}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={18} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Stats */}
                  {player.stats && (
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rating</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(player.stats.rating / 10) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {player.stats.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {player.stats.appearances} appearances
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status & Badge */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={statusColors[player.status]}
                    >
                      {statusLabels[player.status]}
                    </Badge>
                    <Badge variant="primary" className="capitalize">
                      {player.sport}
                    </Badge>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 col-span-full text-center">
                <p className="text-gray-500">No players found</p>
              </Card>
            )}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {data.players.length} of {data.total} players
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
                disabled={!data.players || data.players.length < 10}
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
