'use client';

import React from 'react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { cn } from '@/lib/utils';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  player: {
    id: string;
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
    stats?: {
      goals: number;
      assists: number;
      minutesPlayed: number;
      appearances: number;
    };
  };
  onClick?: () => void;
}

const POSITION_LABELS = {
  FORWARD: 'Forward',
  MIDFIELDER: 'Midfielder',
  DEFENDER: 'Defender',
  GOALKEEPER: 'Goalkeeper',
};

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  const { user, position, jerseyNumber, stats } = player;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {/* Jersey Number */}
      <div className={styles.jerseyBadge}>{jerseyNumber}</div>

      {/* Avatar */}
      <UserAvatar
        firstName={user.firstName}
        lastName={user.lastName}
        email={user.email}
        position={position}
        size="md"
        className={styles.avatar}
      />

      {/* Player Info */}
      <div className={styles.info}>
        <h4 className={styles.name}>
          {user.firstName} {user.lastName}
        </h4>
        <p className={styles.position}>{POSITION_LABELS[position]}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.goals}</span>
            <span className={styles.statLabel}>Goals</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.assists}</span>
            <span className={styles.statLabel}>Assists</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.appearances}</span>
            <span className={styles.statLabel}>Apps</span>
          </div>
        </div>
      )}

      {/* Hover Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} title="View profile">
          View
        </button>
        <button className={styles.actionBtn} title="More options">
          ⋮
        </button>
      </div>
    </div>
  );
}
