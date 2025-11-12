/**
 * Player Teams Page
 * View all teams player is part of
 * Manage team membership and roles
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Calendar, Trophy, Plus, Settings } from 'lucide-react';

export default function PlayerTeamsPage() {
  const { user, isLoading } = useAuth();
  const [teams] = useState([
    {
      id: '1',
      name: 'Arsenal FC',
      club: 'Arsenal Football Club',
      position: 'Midfielder',
      shirtNumber: 7,
      isCaptain: true,
      joinedDate: '2024-01-15',
      matches: 12,
      goals: 3,
      assists: 2,
    },
    {
      id: '2',
      name: 'Power League',
      club: 'Local League',
      position: 'Forward',
      shirtNumber: 9,
      isCaptain: false,
      joinedDate: '2024-03-20',
      matches: 8,
      goals: 5,
      assists: 1,
    },
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
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
            <h1 className="text-4xl font-bold mb-2">My Teams</h1>
            <p className="text-foreground/70">
              Manage your teams and memberships
            </p>
          </div>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Join Team
          </Button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="glass overflow-hidden">
              <div className="bg-gradient-to-r from-brand-gold/20 to-brand-purple/20 p-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{team.name}</h3>
                    <p className="text-sm text-foreground/60 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {team.club}
                    </p>
                  </div>
                  {team.isCaptain && (
                    <div className="bg-brand-gold text-brand-black px-3 py-1 rounded-full text-xs font-semibold">
                      🎖️ Captain
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="pt-6 space-y-4">
                {/* Position & Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Position</p>
                    <p className="font-semibold">{team.position}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Shirt Number</p>
                    <p className="font-semibold">#{team.shirtNumber}</p>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs text-foreground/60 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined
                  </p>
                  <p className="font-semibold">
                    {new Date(team.joinedDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Stats */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Matches</span>
                    <span className="font-semibold">{team.matches}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Goals</span>
                    <span className="font-semibold text-brand-gold">{team.goals}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Assists</span>
                    <span className="font-semibold text-brand-purple">{team.assists}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button variant="outline" className="text-xs">
                    View Squad
                  </Button>
                  <Button variant="outline" className="text-xs">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Requests */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-gold" />
              Team Invitations
            </CardTitle>
            <CardDescription>Pending team join requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Manchester United Academy</p>
                  <p className="text-sm text-foreground/60">Youth Development Squad</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="btn-primary">Accept</Button>
                  <Button size="sm" variant="outline">Decline</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
