'use client';

import React, { useMemo } from 'react';
import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// ========================================
// TYPES & INTERFACES
// ========================================

interface Player {
  id: string;
  shirtNumber: number | null;
  position: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface SquadTeam {
  teamId: string;
  teamName: string;
  players: Player[];
}

interface TeamData {
  id: string;
  name: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
}

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  homeGoals?: number | null;
  awayGoals?: number | null;
  date: string;
}

interface Team {
  id: string;
  name: string;
  category: string;
  season: number;
  club: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface CoachDashboardClientProps {
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: string[];
    };
    teams: Team[];
    squadData: SquadTeam[];
    recentMatches: Match[];
    upcomingMatches: Match[];
  };
}

// ========================================
// MAIN COMPONENT
// ========================================

export function CoachDashboardClient({ data }: CoachDashboardClientProps) {
  const { selectedTeams, setSelectedTeams } = useTeamFilter();

  // ========================================
  // FILTERED DATA - Client-side filtering based on selectedTeams
  // ========================================

  const filteredSquadData = useMemo(() => {
    if (selectedTeams.length === 0) {
      return data.squadData;
    }
    return data.squadData.filter(team =>
      selectedTeams.includes(team.teamId)
    );
  }, [data.squadData, selectedTeams]);

  const filteredRecentMatches = useMemo(() => {
    if (selectedTeams.length === 0) {
      return data.recentMatches;
    }
    return data.recentMatches.filter(match =>
      selectedTeams.includes(match.homeTeamId) ||
      selectedTeams.includes(match.awayTeamId)
    );
  }, [data.recentMatches, selectedTeams]);

  const filteredUpcomingMatches = useMemo(() => {
    if (selectedTeams.length === 0) {
      return data.upcomingMatches;
    }
    return data.upcomingMatches.filter(match =>
      selectedTeams.includes(match.homeTeamId) ||
      selectedTeams.includes(match.awayTeamId)
    );
  }, [data.upcomingMatches, selectedTeams]);

  const totalPlayers = useMemo(() => {
    return filteredSquadData.reduce(
      (acc, team) => acc + team.players.length,
      0
    );
  }, [filteredSquadData]);

  // ========================================
  // HELPERS
  // ========================================

  const getUserTypeBadge = (roles: string[]): string => {
    if (roles.includes('COACH')) return 'COACH';
    if (roles.includes('PLAYER')) return 'PLAYER';
    return roles[0] || 'USER';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddTeam = (): void => {
    // TODO: Implement add team modal/dialog
    console.log('Add new team clicked');
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="p-6 space-y-6">
      {/* ====== HEADER SECTION ====== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* LEFT: User Info */}
        <div className="flex items-center gap-4">
          <UserAvatar
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            email={data.user.email}
            size="lg"
          />

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                Welcome, {data.user.firstName} {data.user.lastName}
              </h1>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold rounded-full uppercase tracking-wide">
                {getUserTypeBadge(data.user.roles)}
              </span>
            </div>
            <p className="text-gray-400 mt-1">
              Managing {data.teams.length}{' '}
              {data.teams.length === 1 ? 'team' : 'teams'}
            </p>
          </div>
        </div>

        {/* RIGHT: Team Filter and Actions */}
        <div className="flex items-center gap-3">
          <TeamFilterDropdown
            teams={data.teams.map(team => ({
              id: team.id,
              name: team.name,
            }))}
            selectedTeams={selectedTeams}
            onChange={setSelectedTeams}
          />
          <Button variant="outline" size="sm" onClick={handleAddTeam}>
            <Plus size={16} className="mr-2" />
            Add New Team
          </Button>
        </div>
      </div>

      {/* ====== TEAMS OVERVIEW GRID ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.teams.map(team => (
          <div
            key={team.id}
            className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20 hover:border-gold/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">{team.name}</h3>
              <span className="px-2 py-1 bg-gold/20 text-gold text-xs font-semibold rounded">
                {team.category}
              </span>
            </div>
            {team.club && (
              <p className="text-gray-400 text-sm">
                {team.club.name} • Season {team.season}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ====== DASHBOARD GRID ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SQUAD OVERVIEW */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">Squad Overview</h2>
          {filteredSquadData.length > 0 ? (
            <div className="space-y-4">
              {filteredSquadData.map(team => (
                <div key={team.teamId}>
                  <h3 className="text-lg font-semibold text-gold mb-2">
                    {team.teamName}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    {team.players.length} players
                  </p>
                  <div className="mt-2 space-y-1">
                    {team.players.slice(0, 3).map((player: Player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-gold font-bold">
                          #{player.shirtNumber || '—'}
                        </span>
                        <span className="text-white">
                          {player.user.firstName} {player.user.lastName}
                        </span>
                        <span className="text-gray-400">• {player.position}</span>
                      </div>
                    ))}
                    {team.players.length > 3 && (
                      <p className="text-gray-500 text-sm pt-1">
                        +{team.players.length - 3} more players
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              {selectedTeams.length === 0
                ? 'Select teams to view squad'
                : 'No teams selected'}
            </p>
          )}
        </div>

        {/* RECENT MATCHES */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
          {filteredRecentMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredRecentMatches.map(match => (
                <div
                  key={match.id}
                  className="bg-black/30 rounded-lg p-4 border border-gold/10 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">
                      {match.homeTeam.name}
                    </span>
                    <span className="text-gold font-bold text-lg">
                      {match.homeGoals ?? 0} - {match.awayGoals ?? 0}
                    </span>
                    <span className="text-white font-medium text-sm">
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDate(match.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              {selectedTeams.length === 0
                ? 'Select teams to view matches'
                : 'No recent matches'}
            </p>
          )}
        </div>

        {/* UPCOMING FIXTURES */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Fixtures</h2>
          {filteredUpcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredUpcomingMatches.map(match => (
                <div
                  key={match.id}
                  className="bg-black/30 rounded-lg p-4 border border-gold/10 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">
                      {match.homeTeam.name}
                    </span>
                    <span className="text-gold font-bold">vs</span>
                    <span className="text-white font-medium text-sm">
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDate(match.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              {selectedTeams.length === 0
                ? 'Select teams to view fixtures'
                : 'No upcoming fixtures'}
            </p>
          )}
        </div>

        {/* QUICK STATS */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Players</span>
              <span className="text-2xl font-bold text-gold">{totalPlayers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Matches Played</span>
              <span className="text-2xl font-bold text-gold">
                {filteredRecentMatches.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Upcoming Fixtures</span>
              <span className="text-2xl font-bold text-gold">
                {filteredUpcomingMatches.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
