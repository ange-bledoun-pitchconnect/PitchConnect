'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Plus,
  Search,
  Loader2,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Match {
  id: string;
  date: string;
  venue: string | null;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: {
    name: string;
    club: {
      name: string;
    };
  };
  awayTeam: {
    name: string;
    club: {
      name: string;
    };
  };
}

export default function MatchesListPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [searchQuery, statusFilter, matches]);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = await response.json();
      setMatches(data.matches);
      setFilteredMatches(data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMatches = () => {
    let filtered = matches;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (match) =>
          match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.venue?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((match) => match.status === statusFilter);
    }

    setFilteredMatches(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Scheduled</Badge>;
      case 'LIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-300 animate-pulse">Live</Badge>;
      case 'FINISHED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Finished</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      case 'POSTPONED':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Postponed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const groupMatchesByDate = () => {
    const grouped: { [key: string]: Match[] } = {};

    filteredMatches.forEach((match) => {
      const date = new Date(match.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(match);
    });

    return grouped;
  };

  const groupedMatches = groupMatchesByDate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900">Matches</h1>
                <p className="text-charcoal-600">
                  {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
                </p>
              </div>
            </div>

            <Link href="/dashboard/matches/create">
              <Button className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Match
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams or venue..."
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Matches</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="FINISHED">Finished</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="POSTPONED">Postponed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches List */}
        {Object.keys(groupedMatches).length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No matches found</h3>
                <p className="text-charcoal-600 mb-6">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Try adjusting your filters'
                    : 'Create your first match to get started'}
                </p>
                <Link href="/dashboard/matches/create">
                  <Button className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Match
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMatches).map(([date, dayMatches]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-charcoal-900 mb-4">{date}</h2>
                <div className="space-y-4">
                  {dayMatches.map((match) => {
                    const matchDate = new Date(match.date);
                    const isFinished = match.status === 'FINISHED';

                    return (
                      <Link key={match.id} href={`/dashboard/matches/${match.id}`}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              {/* Teams & Score */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  {/* Home Team */}
                                  <div className="flex-1">
                                    <p className="font-bold text-charcoal-900">
                                      {match.homeTeam.name}
                                    </p>
                                    <p className="text-sm text-charcoal-600">
                                      {match.homeTeam.club.name}
                                    </p>
                                  </div>

                                  {/* Score */}
                                  <div className="px-6 text-center">
                                    {isFinished ? (
                                      <p className="text-2xl font-bold text-charcoal-900">
                                        {match.homeGoals} - {match.awayGoals}
                                      </p>
                                    ) : (
                                      <p className="text-lg font-bold text-charcoal-400">VS</p>
                                    )}
                                  </div>

                                  {/* Away Team */}
                                  <div className="flex-1 text-right">
                                    <p className="font-bold text-charcoal-900">
                                      {match.awayTeam.name}
                                    </p>
                                    <p className="text-sm text-charcoal-600">
                                      {match.awayTeam.club.name}
                                    </p>
                                  </div>
                                </div>

                                {/* Match Info */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600 mt-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {matchDate.toLocaleTimeString('en-GB', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {match.venue && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {match.venue}
                                    </span>
                                  )}
                                  {getStatusBadge(match.status)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
