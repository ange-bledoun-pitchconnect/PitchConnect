/**
 * Player Teams Page
 * View all teams player is part of
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Calendar,
  Trophy,
  Plus,
  Settings,
  Users,
  Target,
  Award,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  club: string;
  position: string;
  shirtNumber: number;
  isCaptain: boolean;
  joinedDate: string;
  matches: number;
  goals: number;
  assists: number;
}

export default function PlayerTeamsPage() {
  const { isLoading } = useAuth();
  const [teams] = useState<Team[]>([
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
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">My Teams</h1>
          <p className="text-charcoal-600">Manage your teams and memberships</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Join Team
        </Button>
      </div>

      {/* TEAMS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="bg-white border border-neutral-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 p-6 border-b border-neutral-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-charcoal-900 mb-1">{team.name}</h3>
                  <p className="text-sm text-charcoal-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    {team.club}
                  </p>
                </div>
                {team.isCaptain && (
                  <div className="px-3 py-1 bg-gradient-to-r from-gold-500 to-orange-400 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Captain
                  </div>
                )}
              </div>
            </div>

            <CardContent className="pt-6 space-y-5">
              {/* Position & Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">POSITION</p>
                  <p className="font-bold text-blue-700 text-lg">{team.position}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">SHIRT NUMBER</p>
                  <p className="font-bold text-purple-700 text-2xl">#{team.shirtNumber}</p>
                </div>
              </div>

              {/* Joined Date */}
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-charcoal-600 font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  MEMBER SINCE
                </p>
                <p className="font-bold text-charcoal-900">
                  {new Date(team.joinedDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Stats */}
              <div className="p-4 bg-gradient-to-br from-gold-50 to-orange-50 rounded-lg border border-gold-200">
                <p className="text-xs text-charcoal-700 font-bold mb-3 uppercase tracking-wider">Season Stats</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200">
                      <Users className="w-5 h-5 text-gold-600" />
                    </div>
                    <p className="text-2xl font-bold text-charcoal-900">{team.matches}</p>
                    <p className="text-xs text-charcoal-600 font-semibold">Matches</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200">
                      <Target className="w-5 h-5 text-gold-600" />
                    </div>
                    <p className="text-2xl font-bold text-gold-600">{team.goals}</p>
                    <p className="text-xs text-charcoal-600 font-semibold">Goals</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 border border-gold-200">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{team.assists}</p>
                    <p className="text-xs text-charcoal-600 font-semibold">Assists</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold">
                  <Users className="w-4 h-4 mr-2" />
                  View Squad
                </Button>
                <Button variant="outline" className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEAM INVITATIONS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-600" />
            Team Invitations
          </CardTitle>
          <CardDescription>Pending join requests waiting for your response</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-charcoal-900 mb-1">Manchester United Academy</p>
                <p className="text-sm text-charcoal-600">Youth Development Squad • Position: Forward</p>
              </div>
              <div className="flex gap-2">
                <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 font-semibold">
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
