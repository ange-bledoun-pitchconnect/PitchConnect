/**
 * Squad Management Page
 * View and manage team players, injuries, positions, and statistics
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  Edit3,
  Trash2,
  Shield,
  Heart,
  Activity,
  Award,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: 'AVAILABLE' | 'INJURED' | 'SUSPENDED';
  apps: number;
  goals: number;
  assists?: number;
}

export default function SquadManagementPage() {
  const { isLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'INJURED' | 'SUSPENDED'>('ALL');

  const squad: Player[] = [
    { id: '1', name: 'John Smith', number: 7, position: 'CM', status: 'AVAILABLE', apps: 12, goals: 3, assists: 2 },
    { id: '2', name: 'Marcus Johnson', number: 9, position: 'ST', status: 'AVAILABLE', apps: 10, goals: 5, assists: 1 },
    { id: '3', name: 'Alex Williams', number: 4, position: 'RB', status: 'INJURED', apps: 9, goals: 0, assists: 1 },
    { id: '4', name: 'Sarah Brown', number: 1, position: 'GK', status: 'AVAILABLE', apps: 12, goals: 0, assists: 0 },
    { id: '5', name: 'James Wilson', number: 5, position: 'CB', status: 'AVAILABLE', apps: 12, goals: 1, assists: 0 },
    { id: '6', name: 'Emma Taylor', number: 12, position: 'LW', status: 'AVAILABLE', apps: 8, goals: 2, assists: 3 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const availablePlayers = squad.filter((p) => p.status === 'AVAILABLE').length;
  const injuredPlayers = squad.filter((p) => p.status === 'INJURED').length;
  const suspendedPlayers = squad.filter((p) => p.status === 'SUSPENDED').length;

  const filteredSquad = squad.filter((player) => {
    if (filterStatus === 'ALL') return true;
    return player.status === filterStatus;
  });

  const totalGoals = squad.reduce((sum, p) => sum + p.goals, 0);
  const totalAssists = squad.reduce((sum, p) => sum + (p.assists || 0), 0);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Squad Management</h1>
          <p className="text-charcoal-600">Manage your team players and view detailed statistics</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Add Player
        </Button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* Total Players */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Squad Size</h3>
          <p className="text-4xl font-bold text-blue-600">{squad.length}</p>
          <p className="text-xs text-charcoal-500 mt-2">Players total</p>
        </div>

        {/* Available */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all group lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Available</h3>
          <p className="text-4xl font-bold text-green-600">{availablePlayers}</p>
          <p className="text-xs text-charcoal-500 mt-2">Ready</p>
        </div>

        {/* Injured */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-red-300 transition-all group lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            {injuredPlayers > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Injured</h3>
          <p className="text-4xl font-bold text-red-600">{injuredPlayers}</p>
          <p className="text-xs text-charcoal-500 mt-2">Out</p>
        </div>

        {/* Suspended */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all group lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            {suspendedPlayers > 0 && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Suspended</h3>
          <p className="text-4xl font-bold text-orange-500">{suspendedPlayers}</p>
          <p className="text-xs text-charcoal-500 mt-2">Unavailable</p>
        </div>
      </div>

      {/* SEASON STATS */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 border-l-4 border-l-gold-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-charcoal-600 text-sm font-semibold">Total Goals</h3>
            <Award className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-4xl font-bold text-gold-600">{totalGoals}</p>
          <p className="text-xs text-charcoal-500 mt-2">Season tally</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-charcoal-600 text-sm font-semibold">Assists</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-4xl font-bold text-purple-600">{totalAssists}</p>
          <p className="text-xs text-charcoal-500 mt-2">Playmaking</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-charcoal-600 text-sm font-semibold">Avg Appearances</h3>
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-4xl font-bold text-orange-500">
            {Math.round(squad.reduce((sum, p) => sum + p.apps, 0) / squad.length)}
          </p>
          <p className="text-xs text-charcoal-500 mt-2">Per player</p>
        </div>
      </div>

      {/* SQUAD TABLE */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-gold-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">Squad List</h2>
              <p className="text-sm text-charcoal-600">Showing {filteredSquad.length} of {squad.length} players</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'AVAILABLE', 'INJURED', 'SUSPENDED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === status
                      ? 'bg-gold-500 text-white shadow-md'
                      : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSquad.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No players found</h3>
            <p className="text-charcoal-600">Adjust filters to see results</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Player Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Apps
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Goals
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Assists
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredSquad.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`hover:bg-gold-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gold-100 text-gold-700 rounded-full font-bold text-sm">
                        #{player.number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-charcoal-900">{player.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {player.status === 'AVAILABLE' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ✓ Available
                        </span>
                      )}
                      {player.status === 'INJURED' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          🩹 Injured
                        </span>
                      )}
                      {player.status === 'SUSPENDED' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          ⛔ Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-charcoal-900">{player.apps}</td>
                    <td className="px-6 py-4 text-center font-bold text-gold-600">{player.goals}</td>
                    <td className="px-6 py-4 text-center font-semibold text-purple-600">{player.assists || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit player"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Remove player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INJURIES ALERT */}
      {injuredPlayers > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4">
              {injuredPlayers} Player{injuredPlayers !== 1 ? 's' : ''} Currently Injured
            </h3>
            <div className="space-y-3">
              {squad
                .filter((p) => p.status === 'INJURED')
                .map((player) => (
                  <div key={player.id} className="p-4 bg-white rounded-lg border border-red-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-charcoal-900">
                        #{player.number} {player.name}
                      </p>
                      <p className="text-sm text-charcoal-600">{player.position}</p>
                    </div>
                    <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-white font-semibold">
                      Update Status
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
