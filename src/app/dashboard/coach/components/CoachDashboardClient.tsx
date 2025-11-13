'use client';

import React, { useMemo } from 'react';
import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CoachDashboardClientProps {
  data: {
    user: any;
    squadData: any[];
    recentMatches: any[];
    upcomingMatches: any[];
    topPerformers: any[];
  };
}

export function CoachDashboardClient({ data }: CoachDashboardClientProps) {
  const { selectedTeams } = useTeamFilter();

  // CLIENT-SIDE FILTERING based on selectedTeams
  const filteredSquadData = useMemo(() => {
    return data.squadData.filter(team => 
      selectedTeams.includes(team.teamId)
    );
  }, [data.squadData, selectedTeams]);

  const filteredRecentMatches = useMemo(() => {
    return data.recentMatches.filter(match =>
      selectedTeams.includes(match.homeTeamId) ||
      selectedTeams.includes(match.awayTeamId)
    );
  }, [data.recentMatches, selectedTeams]);

  const filteredUpcomingMatches = useMemo(() => {
    return data.upcomingMatches.filter(match =>
      selectedTeams.includes(match.homeTeamId) ||
      selectedTeams.includes(match.awayTeamId)
    );
  }, [data.upcomingMatches, selectedTeams]);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Team Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Coach Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {data.user?.firstName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <TeamFilterDropdown />
          <Button variant="outline" size="sm">
            <Plus size={16} className="mr-2" />
            Add New Team
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Squad Overview */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Squad Overview
          </h2>
          {filteredSquadData.length > 0 ? (
            <div className="space-y-4">
              {filteredSquadData.map(team => (
                <div key={team.teamId}>
                  <h3 className="text-lg font-semibold text-gold mb-2">
                    {team.teamName}
                  </h3>
                  <p className="text-gray-300">
                    {team.players.length} players
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No teams selected</p>
          )}
        </div>

        {/* Recent Matches */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Recent Matches
          </h2>
          {filteredRecentMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredRecentMatches.map(match => (
                <div
                  key={match.id}
                  className="bg-black/30 rounded-lg p-4 border border-gold/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {match.homeTeam.name}
                    </span>
                    <span className="text-gold font-bold text-lg">
                      {match.homeScore} - {match.awayScore}
                    </span>
                    <span className="text-white font-medium">
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(match.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No recent matches</p>
          )}
        </div>

        {/* Upcoming Matches */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Upcoming Fixtures
          </h2>
          {filteredUpcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredUpcomingMatches.map(match => (
                <div
                  key={match.id}
                  className="bg-black/30 rounded-lg p-4 border border-gold/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {match.homeTeam.name}
                    </span>
                    <span className="text-gold font-bold">vs</span>
                    <span className="text-white font-medium">
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(match.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No upcoming matches</p>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-gold/20">
          <h2 className="text-xl font-bold text-white mb-4">
            Top Performers
          </h2>
          {data.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {data.topPerformers.slice(0, 5).map((performer, index) => (
                <div
                  key={performer.playerId}
                  className="flex items-center justify-between bg-black/30 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gold font-bold text-lg">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">
                        {performer.player?.user.firstName}{' '}
                        {performer.player?.user.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">
                        #{performer.player?.jerseyNumber} • {performer.player?.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gold font-bold">
                      {performer.goals}G {performer.assists}A
                    </p>
                    <p className="text-gray-400 text-sm">
                      {performer.appearances} apps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No performance data</p>
          )}
        </div>
      </div>
    </div>
  );
}
