'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  generateFootballAvatar,
  getAvatarInitials,
  getPositionColor,
  PlayerPosition,
} from '@/lib/avatars/football-avatars';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  position?: PlayerPosition;
  email: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

export function UserAvatar({
  firstName,
  lastName,
  position,
  email,
  size = 'md',
  className,
  showLabel = false,
  onClick,
}: UserAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const avatarUrl = generateFootballAvatar(email, position);
  const initials = getAvatarInitials(firstName, lastName);
  const positionColor = getPositionColor(position);

  const sizeMap = {
    sm: { container: 32, fontSize: '0.75rem' },
    md: { container: 40, fontSize: '0.875rem' },
    lg: { container: 56, fontSize: '1rem' },
    xl: { container: 80, fontSize: '1.25rem' },
  };

  const dimensions = sizeMap[size];

  return (
    <div
      className={cn(
        styles.avatarContainer,
        styles[`size-${size}`],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${firstName} ${lastName}${position ? ` - ${position}` : ''}`}
    >
      {/* Football Avatar Image */}
      <div
        className={cn(
          styles.avatarImage,
          hasError && styles.avatarError
        )}
        style={{
          backgroundColor: hasError ? positionColor.bg : 'transparent',
        }}
      >
        {!hasError && (
          <>
            {isLoading && (
              <div
                className={styles.skeleton}
                style={{ backgroundColor: positionColor.bg }}
              />
            )}
            <Image
              src={avatarUrl}
              alt={`${firstName} ${lastName}'s avatar`}
              width={dimensions.container}
              height={dimensions.container}
              className={cn(
                styles.avatarImg,
                !isLoading && styles.avatarImgLoaded
              )}
              onLoadingComplete={() => setIsLoading(false)}
              onError={() => setHasError(true)}
              priority={size === 'xl'}
            />
          </>
        )}

        {/* Fallback Initials */}
        {hasError && (
          <span
            className={styles.initials}
            style={{
              color: positionColor.text,
              fontSize: dimensions.fontSize,
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Position Badge */}
      {position && position !== 'UNKNOWN' && (
        <div
          className={styles.positionBadge}
          style={{
            backgroundColor: positionColor.bg,
            color: positionColor.text,
          }}
          title={position}
        >
          {getPositionIcon(position)}
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <div className={styles.label}>
          <p className={styles.name}>{firstName}</p>
          {position && (
            <p className={styles.position}>{position}</p>
          )}
        </div>
      )}
    </div>
  );
}

function getPositionIcon(position: PlayerPosition): string {
  const icons = {
    FORWARD: '⚡',
    MIDFIELDER: '🔄',
    DEFENDER: '🛡️',
    GOALKEEPER: '🧤',
    UNKNOWN: '⚽',
  };
  return icons[position] || '⚽';
}
