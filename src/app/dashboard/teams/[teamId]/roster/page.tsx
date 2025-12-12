'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Search, Filter, Plus, MoreVertical, Edit2, Trash2, Award } from 'lucide-react';
import { formatPlayerStats, calculateAge } from '@/lib/api/helpers';

interface RosterPlayer {
  id: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
  };
  position: string;
  shirtNumber: number;
  joinDate: string;
  contractEndDate?: string;
  status: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'ON_LOAN' | 'INACTIVE';
  marketValue?: number;
  stats?: {
    appearances: number;
    goals: number;
    assists: number;
  };
}

interface Team {
  id: string;
  name: string;
  logo?: string;
  sport: string;
  memberCount: number;
}

const StatusBadgeColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INJURED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  ON_LOAN: 'bg-blue-100 text-blue-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

export default function TeamRosterPage() {
  const params = useParams();
  const { data: session } = useSession();
  const teamId = params.teamId as string;

  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'shirt-number' | 'name' | 'position' | 'age'>('shirt-number');

  // Fetch team and roster
  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setLoading(true);

        // Fetch team details
        const teamRes = await fetch(`/api/teams/${teamId}`, {
          headers: { 'Authorization': `Bearer ${session?.user?.token}` },
        });
        const teamData = await teamRes.json();
        if (teamData.success) setTeam(teamData.data);

        // Fetch roster
        const rostRes = await fetch(`/api/teams/${teamId}/roster`, {
          headers: { 'Authorization': `Bearer ${session?.user?.token}` },
        });
        const rostData = await rostRes.json();
        if (rostData.success) setRoster(rostData.data);
      } catch (error) {
        console.error('Failed to fetch roster:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchRoster();
    }
  }, [teamId, session?.user]);

  // Filter and sort roster
  const filteredRoster = roster
    .filter((p) => {
      const fullName = `${p.player.firstName} ${p.player.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const matchesPosition = !filterPosition || p.position === filterPosition;
      const matchesStatus = !filterStatus || p.status === filterStatus;
      return matchesSearch && matchesPosition && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'shirt-number':
          return (a.shirtNumber || 0) - (b.shirtNumber || 0);
        case 'name':
          return `${a.player.firstName} ${a.player.lastName}`.localeCompare(
            `${b.player.firstName} ${b.player.lastName}`
          );
        case 'position':
          return a.position.localeCompare(b.position);
        case 'age':
          const ageA = calculateAge(new Date(a.player.dateOfBirth || ''));
          const ageB = calculateAge(new Date(b.player.dateOfBirth || ''));
          return ageB - ageA;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {team?.logo && <img src={team.logo} alt={team.name} className="h-12 w-12 rounded" />}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{team?.name}</h1>
                <p className="text-gray-600 mt-1">{team?.memberCount} players in squad</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Plus className="h-5 w-5" />
              Add Player
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              {team?.sport === 'FOOTBALL' && (
                <>
                  <option value="GK">Goalkeeper</option>
                  <option value="CB">Center Back</option>
                  <option value="RB">Right Back</option>
                  <option value="LB">Left Back</option>
                  <option value="CM">Midfielder</option>
                  <option value="ST">Striker</option>
                </>
              )}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INJURED">Injured</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ON_LOAN">On Loan</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="shirt-number">Shirt Number</option>
              <option value="name">Name (A-Z)</option>
              <option value="position">Position</option>
              <option value="age">Age</option>
            </select>
          </div>
        </div>

        {/* Roster Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Player</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Age</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stats</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Market Value</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((player) => {
                const age = calculateAge(new Date(player.player.dateOfBirth || ''));
                return (
                  <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-lg font-bold text-gray-900">{player.shirtNumber}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {player.player.firstName} {player.player.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{player.player.nationality}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{player.position}</td>
                    <td className="px-6 py-4 text-gray-700">{age} years</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${StatusBadgeColor[player.status]}`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {player.stats && (
                          <>
                            <Award className="h-4 w-4 text-blue-600" />
                            <span>{player.stats.appearances} apps</span>
                            <span className="text-green-600 font-semibold">{player.stats.goals} goals</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {player.marketValue ? `$${(player.marketValue / 1000000).toFixed(1)}M` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded transition" title="Edit">
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded transition" title="Remove">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded transition" title="More">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRoster.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No players found</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Players</p>
            <p className="text-3xl font-bold text-gray-900">{filteredRoster.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600">{filteredRoster.filter((p) => p.status === 'ACTIVE').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Injured</p>
            <p className="text-3xl font-bold text-red-600">{filteredRoster.filter((p) => p.status === 'INJURED').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Avg Age</p>
            <p className="text-3xl font-bold text-blue-600">
              {(
                filteredRoster.reduce((sum, p) => sum + calculateAge(new Date(p.player.dateOfBirth || '')), 0) /
                (filteredRoster.length || 1)
              ).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
