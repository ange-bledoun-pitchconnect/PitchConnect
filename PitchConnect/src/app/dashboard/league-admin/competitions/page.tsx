/**
 * League Admin Competitions Page
 * Manage competitions and tournaments
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Target,
  Edit3,
  Trash2,
  Play,
  Settings,
  Eye,
  Clock,
  Check,
} from 'lucide-react';

interface Competition {
  id: string;
  name: string;
  season: string;
  teams: number;
  matches: number;
  status: 'PLANNING' | 'ONGOING' | 'COMPLETED';
  startDate: string;
  endDate: string;
  winner?: string;
  matches_played: number;
}

export default function CompetitionsPage() {
  const { isLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const competitions: Competition[] = [
    {
      id: '1',
      name: 'Premier League 2024/25',
      season: '2024/25',
      teams: 20,
      matches: 380,
      status: 'ONGOING',
      startDate: '2024-08-16',
      endDate: '2025-05-25',
      matches_played: 150,
    },
    {
      id: '2',
      name: 'FA Cup 2024/25',
      season: '2024/25',
      teams: 91,
      matches: 150,
      status: 'ONGOING',
      startDate: '2024-08-01',
      endDate: '2025-06-01',
      matches_played: 45,
    },
    {
      id: '3',
      name: 'League Two 2023/24',
      season: '2023/24',
      teams: 24,
      matches: 552,
      status: 'COMPLETED',
      startDate: '2023-08-12',
      endDate: '2024-05-18',
      winner: 'Grimsby Town',
      matches_played: 552,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const filteredCompetitions = competitions.filter((c) =>
    filterStatus === 'ALL' ? true : c.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ONGOING':
        return 'bg-green-100 text-green-700 border-green-300 animate-pulse';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return '📋';
      case 'ONGOING':
        return '🔴';
      case 'COMPLETED':
        return '✅';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Competitions</h1>
          <p className="text-charcoal-600">Manage all league competitions and tournaments</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Create Competition
        </Button>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-gold-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Competitions</h3>
          <p className="text-4xl font-bold text-gold-600">{competitions.length}</p>
          <p className="text-xs text-charcoal-500 mt-2">All time</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-green-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Active Now</h3>
          <p className="text-4xl font-bold text-green-600">
            {competitions.filter((c) => c.status === 'ONGOING').length}
          </p>
          <p className="text-xs text-charcoal-500 mt-2">In progress</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Teams</h3>
          <p className="text-4xl font-bold text-blue-600">{competitions.reduce((sum, c) => sum + c.teams, 0)}</p>
          <p className="text-xs text-charcoal-500 mt-2">Across all</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2">
        {['ALL', 'PLANNING', 'ONGOING', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === status
                ? 'bg-gold-500 text-white shadow-md'
                : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* COMPETITIONS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredCompetitions.map((comp) => (
          <Card key={comp.id} className="bg-white border border-neutral-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
            {/* Header */}
            <div className="bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 p-6 border-b border-neutral-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-charcoal-900">{comp.name}</h3>
                  <p className="text-sm text-charcoal-600 mt-1">{comp.season}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(comp.status)}`}>
                  {getStatusIcon(comp.status)} {comp.status}
                </div>
              </div>
            </div>

            <CardContent className="pt-6 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">TEAMS</p>
                  <p className="text-3xl font-bold text-blue-600">{comp.teams}</p>
                </div>
                <div className="p-4 bg-gold-50 rounded-lg border border-gold-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">MATCHES</p>
                  <p className="text-3xl font-bold text-gold-600">{comp.matches}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-700 font-semibold">Progress</span>
                  <span className="font-bold text-charcoal-900">
                    {Math.round((comp.matches_played / comp.matches) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-orange-400 h-3 rounded-full transition-all"
                    style={{ width: `${(comp.matches_played / comp.matches) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-charcoal-500">
                  {comp.matches_played} of {comp.matches} matches played
                </p>
              </div>

              {/* Dates */}
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  <span className="text-charcoal-700">
                    {new Date(comp.startDate).toLocaleDateString()} - {new Date(comp.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Winner */}
              {comp.winner && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-1">🏆 WINNER</p>
                  <p className="font-bold text-purple-700">{comp.winner}</p>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                <Button variant="outline" className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
