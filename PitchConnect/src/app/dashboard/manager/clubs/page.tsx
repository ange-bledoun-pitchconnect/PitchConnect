/**
 * Manager Clubs Page
 * Manage all clubs and their details
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Building2,
  Users,
  Trophy,
  TrendingUp,
  MapPin,
  Edit3,
  Trash2,
  Settings,
  Eye,
  ArrowRight,
  Search,
} from 'lucide-react';

interface Club {
  id: string;
  name: string;
  location: string;
  founded: number;
  teams: number;
  players: number;
  budget: number;
  trophies: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function ManagerClubsPage() {
  const { isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const clubs: Club[] = [
    {
      id: '1',
      name: 'Arsenal FC',
      location: 'London, England',
      founded: 1886,
      teams: 3,
      players: 45,
      budget: 500000,
      trophies: 13,
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Manchester United Academy',
      location: 'Manchester, England',
      founded: 1892,
      teams: 2,
      players: 32,
      budget: 450000,
      trophies: 20,
      status: 'ACTIVE',
    },
    {
      id: '3',
      name: 'Liverpool Youth',
      location: 'Liverpool, England',
      founded: 1892,
      teams: 4,
      players: 58,
      budget: 600000,
      trophies: 19,
      status: 'ACTIVE',
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

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">My Clubs</h1>
          <p className="text-charcoal-600">Manage all your clubs and their teams</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Add Club
        </Button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Clubs</h3>
          <p className="text-4xl font-bold text-blue-600">{clubs.length}</p>
          <p className="text-xs text-charcoal-500 mt-2">Active</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-gold-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Players</h3>
          <p className="text-4xl font-bold text-gold-600">{clubs.reduce((sum, c) => sum + c.players, 0)}</p>
          <p className="text-xs text-charcoal-500 mt-2">Across all clubs</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Trophies</h3>
          <p className="text-4xl font-bold text-purple-600">{clubs.reduce((sum, c) => sum + c.trophies, 0)}</p>
          <p className="text-xs text-charcoal-500 mt-2">All time</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-charcoal-600 text-sm font-medium mb-1">Total Budget</h3>
          <p className="text-3xl font-bold text-green-600">
            £{(clubs.reduce((sum, c) => sum + c.budget, 0) / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-charcoal-500 mt-2">Total allocated</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-charcoal-400" />
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-lg bg-white text-charcoal-900 placeholder:text-charcoal-400 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
        />
      </div>

      {/* CLUBS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredClubs.map((club) => (
          <Card key={club.id} className="bg-white border border-neutral-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
            {/* Club Header */}
            <div className="bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 p-6 border-b border-neutral-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-charcoal-900 mb-1">{club.name}</h3>
                  <p className="text-sm text-charcoal-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    {club.location}
                  </p>
                  <p className="text-xs text-charcoal-500 mt-1">Founded {club.founded}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  club.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {club.status}
                </div>
              </div>
            </div>

            <CardContent className="pt-6 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">TEAMS</p>
                  <p className="text-3xl font-bold text-blue-600">{club.teams}</p>
                </div>
                <div className="p-4 bg-gold-50 rounded-lg border border-gold-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">PLAYERS</p>
                  <p className="text-3xl font-bold text-gold-600">{club.players}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">TROPHIES</p>
                  <p className="text-3xl font-bold text-purple-600">{club.trophies}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-charcoal-600 font-semibold mb-2">BUDGET</p>
                  <p className="text-2xl font-bold text-green-600">£{(club.budget / 1000).toFixed(0)}k</p>
                </div>
              </div>

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

      {filteredClubs.length === 0 && (
        <div className="text-center p-12">
          <Building2 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No clubs found</h3>
          <p className="text-charcoal-600">Try adjusting your search or add a new club</p>
        </div>
      )}
    </div>
  );
}
