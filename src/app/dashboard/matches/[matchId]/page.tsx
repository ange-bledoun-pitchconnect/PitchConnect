'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  Edit,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
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
  attendanceDeadline: string | null;
  homeTeam: {
    id: string;
    name: string;
    club: {
      name: string;
    };
  };
  awayTeam: {
    id: string;
    name: string;
    club: {
      name: string;
    };
  };
  attendance: {
    available: number;
    unavailable: number;
    pending: number;
  };
  events: any[];
}

export default function MatchDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');

      const data = await response.json();
      setMatch(data.match);
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 mb-2">Match not found</p>
          <p className="text-charcoal-600 mb-6">The match you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/dashboard/matches')}>Back to Matches</Button>
        </div>
      </div>
    );
  }

  const matchDate = new Date(match.date);
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/matches')}
            className="mb-4 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900">
                  Match Details
                </h1>
                {getStatusBadge(match.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-charcoal-600">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {matchDate.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {matchDate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {match.venue && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {match.venue}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isFinished && (
                <Link href={`/dashboard/matches/${matchId}/record-result`}>
                  <Button className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Record Result
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Match Score */}
        <Card className="mb-8">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Home Team */}
              <div className="text-center flex-1">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h2 className="text-2xl font-bold text-charcoal-900 mb-1">
                  {match.homeTeam.name}
                </h2>
                <p className="text-sm text-charcoal-600">{match.homeTeam.club.name}</p>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300 mt-3">HOME</Badge>
              </div>

              {/* Score */}
              <div className="px-8 text-center">
                {isFinished ? (
                  <div className="flex items-center gap-4">
                    <span className="text-6xl font-bold text-charcoal-900">
                      {match.homeGoals ?? 0}
                    </span>
                    <span className="text-4xl font-bold text-charcoal-400">-</span>
                    <span className="text-6xl font-bold text-charcoal-900">
                      {match.awayGoals ?? 0}
                    </span>
                  </div>
                ) : isLive ? (
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-5xl font-bold text-charcoal-900">
                        {match.homeGoals ?? 0}
                      </span>
                      <span className="text-3xl font-bold text-charcoal-400">-</span>
                      <span className="text-5xl font-bold text-charcoal-900">
                        {match.awayGoals ?? 0}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300 animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <p className="text-5xl font-bold text-charcoal-900 mb-2">VS</p>
                    <p className="text-sm text-charcoal-600">Not started</p>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center flex-1">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✈️</span>
                </div>
                <h2 className="text-2xl font-bold text-charcoal-900 mb-1">
                  {match.awayTeam.name}
                </h2>
                <p className="text-sm text-charcoal-600">{match.awayTeam.club.name}</p>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300 mt-3">
                  AWAY
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Available</p>
                  <p className="text-3xl font-bold text-green-600">
                    {match.attendance.available}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Unavailable</p>
                  <p className="text-3xl font-bold text-red-600">
                    {match.attendance.unavailable}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-charcoal-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {match.attendance.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Match Events
            </CardTitle>
            <CardDescription>Goals, cards, and substitutions</CardDescription>
          </CardHeader>
          <CardContent>
            {match.events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No events yet</h3>
                <p className="text-charcoal-600">Match events will appear here once recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {match.events.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
                  >
                    <Badge variant="outline">{event.minute}'</Badge>
                    <span className="text-2xl">{event.icon}</span>
                    <div>
                      <p className="font-semibold text-charcoal-900">{event.type}</p>
                      <p className="text-sm text-charcoal-600">{event.player}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player Attendance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Player Attendance
                </CardTitle>
                <CardDescription>Player availability for this match</CardDescription>
              </div>
              <Link href={`/dashboard/matches/${matchId}/attendance`}>
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-charcoal-600">
              Track player availability and confirm lineups for the match
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
