/**
 * Match Management Page
 * Create matches, set lineups, track events (goals, cards, substitutions)
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Edit2,
  Play,
  Flag,
  Zap,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Trophy,
  Calendar,
  MapPin,
} from 'lucide-react';

interface MatchEvent {
  minute: number;
  player: string;
  event: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'INJURY';
  team: 'home' | 'away';
  details?: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location?: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  homeGoals?: number;
  awayGoals?: number;
  minute?: number;
  events: MatchEvent[];
  attendance?: number;
}

export default function MatchManagementPage() {
  const { isLoading } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<string>('2');

  const matches: Match[] = [
    {
      id: '1',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Manchester City',
      date: '2025-11-19',
      time: '15:00',
      location: 'Emirates Stadium',
      status: 'UPCOMING',
      events: [],
    },
    {
      id: '2',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Tottenham Hotspur',
      date: '2025-11-12',
      time: '19:00',
      location: 'Tottenham Hotspur Stadium',
      status: 'LIVE',
      homeGoals: 2,
      awayGoals: 1,
      minute: 65,
      attendance: 61_500,
      events: [
        { minute: 12, player: 'John Smith', event: 'GOAL', team: 'home' },
        { minute: 28, player: 'Marcus Johnson', event: 'YELLOW_CARD', team: 'away' },
        { minute: 45, player: 'Alex Williams', event: 'GOAL', team: 'home' },
      ],
    },
    {
      id: '3',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Liverpool FC',
      date: '2025-11-05',
      time: '20:00',
      location: 'Emirates Stadium',
      status: 'FINISHED',
      homeGoals: 3,
      awayGoals: 2,
      attendance: 60_000,
      events: [
        { minute: 18, player: 'Emma Taylor', event: 'GOAL', team: 'home' },
        { minute: 34, player: 'James Wilson', event: 'YELLOW_CARD', team: 'home' },
        { minute: 52, player: 'John Smith', event: 'GOAL', team: 'home' },
        { minute: 67, player: 'Sarah Brown', event: 'RED_CARD', team: 'away' },
        { minute: 78, player: 'Marcus Johnson', event: 'GOAL', team: 'away' },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);
  const liveMatches = matches.filter((m) => m.status === 'LIVE').length;
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING').length;
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'text-red-600 bg-red-100';
      case 'UPCOMING':
        return 'text-blue-600 bg-blue-100';
      case 'FINISHED':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return '🔴 LIVE';
      case 'UPCOMING':
        return '⏰ UPCOMING';
      case 'FINISHED':
        return '✅ FINISHED';
      default:
        return status;
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'GOAL':
        return '⚽';
      case 'YELLOW_CARD':
        return '🟨';
      case 'RED_CARD':
        return '🟥';
      case 'SUBSTITUTION':
        return '🔄';
      case 'INJURY':
        return '🩹';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Match Management</h1>
          <p className="text-charcoal-600">Create and manage your team's matches and events</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          New Match
        </Button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Live Matches */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-red-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            {liveMatches > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Live Now</h3>
          <p className="text-4xl font-bold text-red-600">{liveMatches}</p>
          <p className="text-xs text-charcoal-500 mt-2">In progress</p>
        </div>

        {/* Upcoming */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Upcoming</h3>
          <p className="text-4xl font-bold text-blue-600">{upcomingMatches}</p>
          <p className="text-xs text-charcoal-500 mt-2">Scheduled</p>
        </div>

        {/* Finished */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Finished</h3>
          <p className="text-4xl font-bold text-green-600">{finishedMatches}</p>
          <p className="text-xs text-charcoal-500 mt-2">Completed</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* MATCHES LIST (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => setSelectedMatch(match.id)}
              className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition-all transform hover:scale-101 ${
                selectedMatch === match.id
                  ? 'border-gold-500 shadow-lg'
                  : 'border-neutral-200 hover:border-gold-300'
              }`}
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      match.status === 'LIVE'
                        ? 'bg-red-500 animate-pulse'
                        : match.status === 'UPCOMING'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(match.status)}`}>
                    {getStatusBadge(match.status)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs border-gold-300 text-gold-600 hover:bg-gold-50">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {match.status === 'UPCOMING' && (
                    <Button size="sm" className="text-xs bg-gold-500 hover:bg-gold-600 text-white">
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>

              {/* Match Score */}
              <div className="grid grid-cols-3 gap-4 items-center mb-6 py-4 border-y border-neutral-200">
                {/* Home Team */}
                <div className="text-right">
                  <p className="font-bold text-charcoal-900 mb-2">{match.homeTeam}</p>
                  {match.status !== 'UPCOMING' && match.homeGoals !== undefined && (
                    <p className="text-4xl font-bold text-gold-600">{match.homeGoals}</p>
                  )}
                </div>

                {/* Time/Date */}
                <div className="text-center space-y-1">
                  {match.status === 'LIVE' && match.minute !== undefined ? (
                    <>
                      <p className="text-xl font-bold text-red-600">{match.minute}'</p>
                      <p className="text-xs text-red-600 font-semibold">LIVE</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-charcoal-600 font-semibold">
                        {new Date(`${match.date}T${match.time}`).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-charcoal-500">{match.time}</p>
                    </>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-left">
                  <p className="font-bold text-charcoal-900 mb-2">{match.awayTeam}</p>
                  {match.status !== 'UPCOMING' && match.awayGoals !== undefined && (
                    <p className="text-4xl font-bold text-orange-500">{match.awayGoals}</p>
                  )}
                </div>
              </div>

              {/* Location & Attendance */}
              <div className="flex items-center gap-6 text-sm text-charcoal-600 mb-4 pb-4 border-b border-neutral-200">
                {match.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    <span>{match.location}</span>
                  </div>
                )}
                {match.attendance && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>{match.attendance.toLocaleString()} spectators</span>
                  </div>
                )}
              </div>

              {/* Match Events */}
              {match.events.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-3">
                    Match Events
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {match.events.map((event, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex items-center justify-between text-xs ${
                          event.team === 'home'
                            ? 'bg-gold-50 border border-gold-200'
                            : 'bg-orange-50 border border-orange-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal-700">{event.minute}'</span>
                          <span className="text-lg">{getEventIcon(event.event)}</span>
                          <span className="font-semibold text-charcoal-900">{event.player}</span>
                        </div>
                        <span className={`text-xs font-bold ${event.team === 'home' ? 'text-gold-600' : 'text-orange-600'}`}>
                          {event.team.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {match.status === 'LIVE' && (
                <Button size="sm" className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold">
                  <Flag className="w-4 h-4 mr-2" />
                  End Match
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* EVENT TRACKER (1/3) */}
        {selectedMatchData && (
          <div className="lg:sticky lg:top-20 space-y-6">
            {/* Match Summary */}
            <Card className="bg-white border border-neutral-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
                <CardTitle className="text-lg">Quick Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 border-b border-neutral-200">
                  <p className="text-sm text-charcoal-600 mb-2">Match</p>
                  <p className="font-bold text-charcoal-900">
                    {selectedMatchData.homeTeam} vs {selectedMatchData.awayTeam}
                  </p>
                </div>

                {selectedMatchData.status === 'LIVE' && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gold-50 rounded">
                      <p className="text-2xl font-bold text-gold-600">{selectedMatchData.homeGoals}</p>
                    </div>
                    <div className="p-2">
                      <p className="text-sm text-red-600 font-bold">{selectedMatchData.minute}'</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-2xl font-bold text-orange-500">{selectedMatchData.awayGoals}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Buttons */}
            {selectedMatchData.status === 'LIVE' && (
              <Card className="bg-white border border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Record Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-6">
                    ⚽ Goal
                  </Button>
                  <Button variant="outline" className="w-full py-3 font-semibold hover:bg-yellow-50">
                    🟨 Yellow Card
                  </Button>
                  <Button variant="outline" className="w-full py-3 font-semibold hover:bg-red-50">
                    🟥 Red Card
                  </Button>
                  <Button variant="outline" className="w-full py-3 font-semibold hover:bg-purple-50">
                    🔄 Substitution
                  </Button>
                  <Button variant="outline" className="w-full py-3 font-semibold hover:bg-red-50">
                    🩹 Injury
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Events */}
            {selectedMatchData.events.length > 0 && (
              <Card className="bg-white border border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Recent Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedMatchData.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-50 rounded-lg flex items-center justify-between text-xs border border-neutral-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gold-600">{event.minute}'</span>
                        <span className="text-lg">{getEventIcon(event.event)}</span>
                      </div>
                      <span className="font-semibold text-charcoal-900">{event.player}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
