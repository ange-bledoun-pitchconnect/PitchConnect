'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  location: string | null;
  focus: string;
  status: string;
  team: {
    name: string;
    club: {
      name: string;
    };
  };
  attendance: {
    present: number;
    absent: number;
    pending: number;
  };
  drillCount: number;
}

export default function TrainingSessionsListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, statusFilter, sessions]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/training/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.sessions);
      setFilteredSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load training sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.focus.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((session) => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: TrainingSession[] } = {};

    filteredSessions.forEach((session) => {
      const date = new Date(session.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });

    return grouped;
  };

  const groupedSessions = groupSessionsByDate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading training sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-charcoal-900">Training Sessions</h1>
                <p className="text-charcoal-600">
                  {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            </div>

            <Link href="/dashboard/training/create">
              <Button className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Session
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
                  placeholder="Search teams, focus, or location..."
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALL">All Sessions</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {Object.keys(groupedSessions).length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Zap className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No training sessions found
                </h3>
                <p className="text-charcoal-600 mb-6">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Try adjusting your filters'
                    : 'Create your first training session to get started'}
                </p>
                <Link href="/dashboard/training/create">
                  <Button className="bg-gradient-to-r from-green-500 to-blue-400 hover:from-green-600 hover:to-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSessions).map(([date, daySessions]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-charcoal-900 mb-4">{date}</h2>
                <div className="space-y-4">
                  {daySessions.map((session) => {
                    const sessionDate = new Date(session.date);

                    return (
                      <Link key={session.id} href={`/dashboard/training/${session.id}`}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer">
                          <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              {/* Session Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-1">
                                      {session.focus}
                                    </h3>
                                    <p className="text-charcoal-600">
                                      {session.team.name} • {session.team.club.name}
                                    </p>
                                  </div>
                                  {getStatusBadge(session.status)}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600 mt-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {sessionDate.toLocaleTimeString('en-GB', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-4 h-4" />
                                    {session.duration} min
                                  </span>
                                  {session.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {session.location}
                                    </span>
                                  )}
                                  <Badge variant="outline">{session.drillCount} drills</Badge>
                                </div>
                              </div>

                              {/* Attendance Stats */}
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-600">
                                    {session.attendance.present}
                                  </p>
                                  <p className="text-xs text-charcoal-600">Present</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-orange-600">
                                    {session.attendance.pending}
                                  </p>
                                  <p className="text-xs text-charcoal-600">Pending</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-red-600">
                                    {session.attendance.absent}
                                  </p>
                                  <p className="text-xs text-charcoal-600">Absent</p>
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
