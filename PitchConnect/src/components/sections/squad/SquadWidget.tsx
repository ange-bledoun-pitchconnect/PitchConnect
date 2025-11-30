'use client';

import React, { useState, useMemo } from 'react';
import { useTeamFilter } from '@/lib/dashboard/team-context';
import { PlayerCard } from './PlayerCard';
import { cn } from '@/lib/utils';
import styles from './SquadWidget.module.css';

export interface SquadPlayer {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  position: 'FORWARD' | 'MIDFIELDER' | 'DEFENDER' | 'GOALKEEPER';
  jerseyNumber: number;
  height?: number;
  weight?: number;
  currentTeamId: string;
  stats?: {
    goals: number;
    assists: number;
    minutesPlayed: number;
    appearances: number;
  };
}

interface TeamSquad {
  teamId: string;
  teamName: string;
  players: SquadPlayer[];
}

interface SquadWidgetProps {
  teamsData: TeamSquad[];
  className?: string;
}

export function SquadWidget({ teamsData, className }: SquadWidgetProps) {
  const { selectedTeams } = useTeamFilter();
  const [activeTeamTab, setActiveTeamTab] = useState<string | 'all'>('all');

  // Filter teams based on selection
  const visibleTeams = useMemo(() => {
    return teamsData.filter(team => selectedTeams.includes(team.teamId));
  }, [teamsData, selectedTeams]);

  // Determine which teams to display
  const displayTeams = useMemo(() => {
    if (activeTeamTab === 'all') {
      return visibleTeams;
    }
    return visibleTeams.filter(t => t.teamId === activeTeamTab);
  }, [visibleTeams, activeTeamTab]);

  // Stats calculation
  const stats = useMemo(() => {
    const combined = displayTeams.flatMap(t => t.players);
    return {
      totalPlayers: combined.length,
      byPosition: {
        FORWARD: combined.filter(p => p.position === 'FORWARD').length,
        MIDFIELDER: combined.filter(p => p.position === 'MIDFIELDER').length,
        DEFENDER: combined.filter(p => p.position === 'DEFENDER').length,
        GOALKEEPER: combined.filter(p => p.position === 'GOALKEEPER').length,
      },
    };
  }, [displayTeams]);

  if (visibleTeams.length === 0) {
    return (
      <div className={cn(styles.widget, className)}>
        <div className={styles.empty}>
          <p>No teams selected. Choose teams from the filter above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.widget, className)}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Squad Overview</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Players</span>
            <span className={styles.statValue}>{stats.totalPlayers}</span>
          </div>
        </div>
      </div>

      {/* Team Tabs */}
      {visibleTeams.length > 1 && (
        <div className={styles.tabsContainer}>
          <button
            className={cn(styles.tab, activeTeamTab === 'all' && styles.tabActive)}
            onClick={() => setActiveTeamTab('all')}
          >
            All Teams
          </button>
          {visibleTeams.map(team => (
            <button
              key={team.teamId}
              className={cn(
                styles.tab,
                activeTeamTab === team.teamId && styles.tabActive
              )}
              onClick={() => setActiveTeamTab(team.teamId)}
            >
              {team.teamName}
            </button>
          ))}
        </div>
      )}

      {/* Position Breakdown */}
      <div className={styles.positionStats}>
        <div className={styles.positionCard}>
          <span className={styles.positionIcon}>⚡</span>
          <div className={styles.positionInfo}>
            <p className={styles.positionLabel}>Forwards</p>
            <p className={styles.positionCount}>{stats.byPosition.FORWARD}</p>
          </div>
        </div>
        <div className={styles.positionCard}>
          <span className={styles.positionIcon}>🔄</span>
          <div className={styles.positionInfo}>
            <p className={styles.positionLabel}>Midfielders</p>
            <p className={styles.positionCount}>{stats.byPosition.MIDFIELDER}</p>
          </div>
        </div>
        <div className={styles.positionCard}>
          <span className={styles.positionIcon}>🛡️</span>
          <div className={styles.positionInfo}>
            <p className={styles.positionLabel}>Defenders</p>
            <p className={styles.positionCount}>{stats.byPosition.DEFENDER}</p>
          </div>
        </div>
        <div className={styles.positionCard}>
          <span className={styles.positionIcon}>🧤</span>
          <div className={styles.positionInfo}>
            <p className={styles.positionLabel}>Goalkeepers</p>
            <p className={styles.positionCount}>{stats.byPosition.GOALKEEPER}</p>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className={styles.playersGrid}>
        {displayTeams.map(team => (
          <div key={team.teamId} className={styles.teamSection}>
            {displayTeams.length > 1 && activeTeamTab === 'all' && (
              <h3 className={styles.teamHeading}>{team.teamName}</h3>
            )}
            <div className={styles.playersList}>
              {team.players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
            {team.players.length === 0 && (
              <div className={styles.emptyTeam}>
                <p>No players in this team</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
