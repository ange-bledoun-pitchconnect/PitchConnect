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
import { Plus, Edit2, Play, Flag, Zap } from 'lucide-react';

export default function MatchManagementPage() {
  const { user, isLoading } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const matches = [
    {
      id: '1',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Manchester City',
      date: '2025-11-19',
      time: '15:00',
      status: 'UPCOMING',
      events: [],
    },
    {
      id: '2',
      homeTeam: 'Arsenal FC',
      awayTeam: 'Tottenham',
      date: '2025-11-12',
      time: '19:00',
      status: 'LIVE',
      homeGoals: 2,
      awayGoals: 1,
      minute: 65,
      events: [
        { minute: 12, player: 'John Smith', event: 'GOAL', team: 'home' },
        { minute: 28, player: 'Marcus Johnson', event: 'YELLOW_CARD', team: 'away' },
        { minute: 45, player: 'Alex Williams', event: 'GOAL', team: 'home' },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Match Management</h1>
            <p className="text-foreground/70">Create and manage match events</p>
          </div>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Match
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match List (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className={`glass cursor-pointer transition-all ${
                  selectedMatch === match.id ? 'ring-2 ring-brand-gold' : ''
                }`}
                onClick={() => setSelectedMatch(match.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        match.status === 'LIVE' ? 'bg-red-500 animate-pulse' :
                        match.status === 'UPCOMING' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`} />
                      <span className={`text-xs font-semibold ${
                        match.status === 'LIVE' ? 'text-red-600' :
                        match.status === 'UPCOMING' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {match.status === 'LIVE' ? '🔴 LIVE' : 
                         match.status === 'UPCOMING' ? '⏰ UPCOMING' : 
                         '✅ FINISHED'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-3 gap-4 items-center mb-4">
                    <div className="text-right">
                      <p className="font-semibold">{match.homeTeam}</p>
                      {match.status !== 'UPCOMING' && (
                        <p className="text-2xl font-bold text-hero">{match.homeGoals}</p>
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      {match.status === 'LIVE' ? (
                        <p className="text-sm text-red-600 font-semibold">{match.minute}'</p>
                      ) : (
                        <p className="text-sm text-foreground/60">
                          {new Date(`${match.date}T${match.time}`).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-foreground/60">{match.time}</p>
                    </div>

                    <div className="text-left">
                      <p className="font-semibold">{match.awayTeam}</p>
                      {match.status !== 'UPCOMING' && (
                        <p className="text-2xl font-bold text-hero">{match.awayGoals}</p>
                      )}
                    </div>
                  </div>

                  {/* Events */}
                  {match.events && match.events.length > 0 && (
                    <div className="border-t border-border/50 pt-3 space-y-2">
                      {match.events.map((event, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
                          <span className="font-semibold">{event.minute}'</span>
                          <span>{event.player}</span>
                          {event.event === 'GOAL' && <span className="text-lg">⚽</span>}
                          {event.event === 'YELLOW_CARD' && <span className="text-lg">🟨</span>}
                          {event.event === 'RED_CARD' && <span className="text-lg">🟥</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {match.status === 'UPCOMING' && (
                    <Button size="sm" className="w-full mt-4 btn-primary text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Start Match
                    </Button>
                  )}

                  {match.status === 'LIVE' && (
                    <Button size="sm" className="w-full mt-4 btn-primary text-xs">
                      <Flag className="w-3 h-3 mr-1" />
                      End Match
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Event Tracker (1/3) */}
          {selectedMatch && (
            <Card className="glass sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Live Events</CardTitle>
                <CardDescription>Record match events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full btn-primary flex items-center justify-center gap-2">
                  ⚽ Goal
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  🟨 Yellow Card
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  🟥 Red Card
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  🔄 Substitution
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  🩹 Injury
                </Button>

                {/* Recent Events */}
                <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground/60">Recent Events</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>John Smith</span>
                      <span>⚽ 45'</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Marcus Johnson</span>
                      <span>🟨 28'</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
