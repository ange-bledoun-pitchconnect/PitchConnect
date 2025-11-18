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

// ========================================
// TYPES
// ========================================

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface SizeConfig {
  container: number;
  fontSize: string;
}

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  position?: PlayerPosition;
  email: string;
  size?: AvatarSize;
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

// ========================================
// CONSTANTS
// ========================================

const SIZE_MAP: Record<AvatarSize, SizeConfig> = {
  sm: { container: 32, fontSize: '0.75rem' },
  md: { container: 40, fontSize: '0.875rem' },
  lg: { container: 56, fontSize: '1rem' },
  xl: { container: 80, fontSize: '1.25rem' },
};

const POSITION_ICONS: Record<PlayerPosition, string> = {
  FORWARD: '⚡',
  MIDFIELDER: '🔄',
  DEFENDER: '🛡️',
  GOALKEEPER: '🧤',
  UNKNOWN: '⚽',
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getPositionIcon(position: PlayerPosition): string {
  return POSITION_ICONS[position] || '⚽';
}

// ========================================
// MAIN COMPONENT
// ========================================

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
  // ========================================
  // STATE
  // ========================================

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const avatarUrl = generateFootballAvatar(email, position);
  const initials = getAvatarInitials(firstName, lastName);
  const positionColor = getPositionColor(position);
  const dimensions = SIZE_MAP[size];

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleLoadingComplete = (): void => {
    setIsLoading(false);
  };

  const handleError = (): void => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className={cn(
        styles['avatarContainer'],
        styles[`size-${size}`],
        onClick && styles['clickable'],
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${firstName} ${lastName}${position ? ` - ${position}` : ''}`}
    >
      {/* ====== AVATAR IMAGE ====== */}
      <div
        className={cn(
          styles['avatarImage'],
          hasError && styles['avatarError']
        )}
        style={{
          backgroundColor: hasError ? positionColor.bg : 'transparent',
        }}
      >
        {/* Image Loading State */}
        {!hasError && (
          <>
            {isLoading && (
              <div
                className={styles['skeleton']}
                style={{ backgroundColor: positionColor.bg }}
                aria-hidden="true"
              />
            )}
            <Image
              src={avatarUrl}
              alt={`${firstName} ${lastName}'s avatar`}
              width={dimensions.container}
              height={dimensions.container}
              className={cn(
                styles['avatarImg'],
                !isLoading && styles['avatarImgLoaded']
              )}
              onLoad={handleLoadingComplete}
              onError={handleError}
              priority={size === 'xl'}
              unoptimized={avatarUrl.includes('dicebear.com')}
            />
          </>
        )}

        {/* ====== FALLBACK INITIALS ====== */}
        {hasError && (
          <span
            className={styles['initials']}
            style={{
              color: positionColor.text,
              fontSize: dimensions.fontSize,
            }}
            aria-label={`${firstName} ${lastName} initials`}
          >
            {initials}
          </span>
        )}
      </div>

      {/* ====== POSITION BADGE ====== */}
      {position && position !== 'UNKNOWN' && (
        <div
          className={styles['positionBadge']}
          style={{
            backgroundColor: positionColor.bg,
            color: positionColor.text,
          }}
          title={position}
          aria-label={`Position: ${position}`}
        >
          {getPositionIcon(position)}
        </div>
      )}

      {/* ====== LABEL ====== */}
      {showLabel && (
        <div className={styles['label']}>
          <p className={styles['name']}>
            {firstName} {lastName}
          </p>
          {position && position !== 'UNKNOWN' && (
            <p className={styles['position']}>{position}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// DISPLAY NAME (for React DevTools)
// ========================================

UserAvatar.displayName = 'UserAvatar';
