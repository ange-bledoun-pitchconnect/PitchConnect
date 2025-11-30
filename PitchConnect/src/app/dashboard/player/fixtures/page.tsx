/**
 * Player Fixtures Page
 * Calendar view of upcoming and past matches
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock } from 'lucide-react';

export default function PlayerFixturesPage() {
  const { isLoading } = useAuth();
  const [matches] = useState([
    {
      id: '1',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Manchester City',
      date: '2025-11-19',
      time: '15:00',
      venue: 'Emirates Stadium',
      status: 'UPCOMING',
      competition: 'Premier League',
    },
    {
      id: '2',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Tottenham',
      date: '2025-11-26',
      time: '19:45',
      venue: 'Emirates Stadium',
      status: 'UPCOMING',
      competition: 'Premier League',
    },
    {
      id: '3',
      homeTeam: 'Liverpool',
      awayTeam: 'Arsenal FC',
      date: '2025-11-12',
      time: '15:00',
      venue: 'Anfield',
      status: 'FINISHED',
      competition: 'Premier League',
      result: '2-1',
      playerStats: { goals: 1, assists: 0, minutes: 90, rating: 7.5 },
    },
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Fixtures & Matches</h1>
          <p className="text-foreground/70">Your upcoming and past fixtures</p>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="glass overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-6">
                  {/* Status Badge */}
                  <div className="md:col-span-1">
                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        match.status === 'UPCOMING'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-green-500/10 text-green-600'
                      }`}
                    >
                      {match.status === 'UPCOMING' ? '⏰ Upcoming' : '✅ Finished'}
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className="md:col-span-1">
                    <p className="font-semibold">{match.homeTeam}</p>
                    <p className="text-xs text-foreground/60">
                      {match.status === 'FINISHED' && 'Home'}
                    </p>
                  </div>

                  {/* Score/VS */}
                  <div className="md:col-span-1 text-center">
                    {match.status === 'UPCOMING' ? (
                      <p className="text-2xl font-bold text-hero">VS</p>
                    ) : (
                      <p className="text-2xl font-bold text-hero">{match.result}</p>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="md:col-span-1">
                    <p className="font-semibold">{match.awayTeam}</p>
                    <p className="text-xs text-foreground/60">
                      {match.status === 'FINISHED' && 'Away'}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="md:col-span-1 space-y-2 text-sm text-foreground/70">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(`${match.date}T${match.time}`).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.venue}
                    </p>
                  </div>
                </div>

                {/* Finished Match Stats */}
                {match.status === 'FINISHED' && match.playerStats && (
                  <div className="border-t border-border/50 bg-muted/30 p-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-foreground/60">Goals</p>
                      <p className="font-semibold text-lg text-brand-gold">
                        {match.playerStats.goals}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground/60">Assists</p>
                      <p className="font-semibold text-lg text-brand-purple">
                        {match.playerStats.assists}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground/60">Minutes</p>
                      <p className="font-semibold text-lg">{match.playerStats.minutes}'</p>
                    </div>
                    <div>
                      <p className="text-foreground/60">Rating</p>
                      <p className="font-semibold text-lg text-brand-gold">
                        {match.playerStats.rating}/10
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar Legend */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-gold" />
              Season Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground/60 mb-2">Matches Played</p>
                <p className="text-3xl font-bold text-hero">12</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground/60 mb-2">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600">2</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground/60 mb-2">Goals This Season</p>
                <p className="text-3xl font-bold text-brand-gold">5</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground/60 mb-2">Assists This Season</p>
                <p className="text-3xl font-bold text-brand-purple">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
