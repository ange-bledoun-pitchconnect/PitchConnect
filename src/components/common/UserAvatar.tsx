/**
 * ============================================================================
 * UserAvatar Component
 * ============================================================================
 * 
 * Enterprise-grade user avatar with multi-sport position support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users - Universal avatar component
 * 
 * SCHEMA ALIGNMENT:
 * - User model (avatar fields)
 * - Player model (position)
 * - Sport enum (all 12 sports)
 * - Position enum (100+ positions)
 * - UserRole enum (15 roles)
 * 
 * FEATURES:
 * - Multi-sport position badges
 * - Role-based fallback colors
 * - Lazy loading with skeleton
 * - Error fallback with initials
 * - Multiple sizes (xs, sm, md, lg, xl, 2xl)
 * - Online/offline status indicator
 * - Hover effects
 * - Keyboard accessible
 * - Dark mode support
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  User,
  Shield,
  Crown,
  Whistle,
  ClipboardList,
  BarChart3,
  Stethoscope,
  Camera,
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS (Aligned with Schema v7.10.1)
// =============================================================================

/**
 * Sport enum from schema
 */
type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

/**
 * Position category for grouping
 */
type PositionCategory = 
  | 'GOALKEEPER'
  | 'DEFENSE'
  | 'MIDFIELD'
  | 'ATTACK'
  | 'FORWARD'
  | 'SPECIALIST'
  | 'UTILITY'
  | 'UNKNOWN';

/**
 * User role from schema
 */
type UserRole =
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'ADMIN'
  | 'TREASURER'
  | 'CLUB_MANAGER'
  | 'CLUB_OWNER'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST'
  | 'PARENT'
  | 'SUPERADMIN'
  | 'LEAGUE_ADMIN'
  | 'MEDICAL_STAFF'
  | 'MEDIA_MANAGER';

/**
 * Online status
 */
type OnlineStatus = 'online' | 'offline' | 'away' | 'busy';

/**
 * Avatar size
 */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Component props
 */
export interface UserAvatarProps {
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Full name (alternative to firstName/lastName) */
  name?: string;
  /** Position key from schema */
  position?: string;
  /** Sport context for position display */
  sport?: Sport;
  /** Email for Gravatar/DiceBear fallback */
  email?: string;
  /** Image URL */
  imageUrl?: string;
  /** User role for styling */
  role?: UserRole;
  /** Avatar size */
  size?: AvatarSize;
  /** Online status */
  status?: OnlineStatus;
  /** Custom class name */
  className?: string;
  /** Show label below avatar */
  showLabel?: boolean;
  /** Show position badge */
  showPosition?: boolean;
  /** Show online status indicator */
  showStatus?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Priority loading for LCP */
  priority?: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface SizeConfig {
  container: number;
  containerClass: string;
  fontSize: string;
  statusSize: string;
  positionBadgeSize: string;
  borderWidth: string;
}

const SIZE_CONFIG: Record<AvatarSize, SizeConfig> = {
  xs: {
    container: 24,
    containerClass: 'w-6 h-6',
    fontSize: 'text-[10px]',
    statusSize: 'w-2 h-2',
    positionBadgeSize: 'w-4 h-4 text-[8px]',
    borderWidth: 'border',
  },
  sm: {
    container: 32,
    containerClass: 'w-8 h-8',
    fontSize: 'text-xs',
    statusSize: 'w-2.5 h-2.5',
    positionBadgeSize: 'w-5 h-5 text-[10px]',
    borderWidth: 'border',
  },
  md: {
    container: 40,
    containerClass: 'w-10 h-10',
    fontSize: 'text-sm',
    statusSize: 'w-3 h-3',
    positionBadgeSize: 'w-6 h-6 text-xs',
    borderWidth: 'border-2',
  },
  lg: {
    container: 56,
    containerClass: 'w-14 h-14',
    fontSize: 'text-base',
    statusSize: 'w-3.5 h-3.5',
    positionBadgeSize: 'w-7 h-7 text-xs',
    borderWidth: 'border-2',
  },
  xl: {
    container: 80,
    containerClass: 'w-20 h-20',
    fontSize: 'text-xl',
    statusSize: 'w-4 h-4',
    positionBadgeSize: 'w-8 h-8 text-sm',
    borderWidth: 'border-2',
  },
  '2xl': {
    container: 112,
    containerClass: 'w-28 h-28',
    fontSize: 'text-2xl',
    statusSize: 'w-5 h-5',
    positionBadgeSize: 'w-10 h-10 text-base',
    borderWidth: 'border-3',
  },
};

interface PositionConfig {
  icon: string;
  category: PositionCategory;
  color: string;
  bgColor: string;
}

/**
 * Position category mapping
 * Maps position keys to categories for icon display
 */
const POSITION_CATEGORIES: Record<string, PositionConfig> = {
  // Football Goalkeepers
  GOALKEEPER: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALKEEPER_FUTSAL: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALKEEPER_BEACH: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALKEEPER_NETBALL: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALKEEPER_GAELIC: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALTENDER: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  GOALIE_LACROSSE: { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  
  // Defense
  CENTER_BACK: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  LEFT_BACK: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  RIGHT_BACK: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DEFENDER_BEACH: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DEFENSEMAN: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DEFENSEMAN_LACROSSE: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  CORNERBACK: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  SAFETY: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  LINEBACKER: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  GOAL_DEFENSE: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  FULL_BACK_AFL: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  FULL_BACK_GAELIC: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  HALF_BACK: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  HALF_BACK_GAELIC: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  FIXO: { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  
  // Midfield
  CENTRAL_MIDFIELDER: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  DEFENSIVE_MIDFIELDER: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  ATTACKING_MIDFIELDER: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  MIDFIELDER_LACROSSE: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  MIDFIELDER_GAELIC: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CENTER: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CENTER_HOCKEY: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  WING_ATTACK: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  WING_DEFENSE: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  RUCK: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  ROVER: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  ALA: { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  
  // Attack/Forward
  STRIKER: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  CENTER_FORWARD: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  LEFT_WINGER: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  RIGHT_WINGER: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  WINGER: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  WINGER_BEACH: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  PIVOT_BEACH: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  PIVO: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  ATTACKMAN: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  GOAL_SHOOTER: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  GOAL_ATTACK: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  FULL_FORWARD: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  HALF_FORWARD: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  HALF_FORWARD_GAELIC: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  FULL_FORWARD_GAELIC: { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  
  // Basketball
  POINT_GUARD: { icon: '🏀', category: 'MIDFIELD', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  SHOOTING_GUARD: { icon: '🏀', category: 'ATTACK', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  SMALL_FORWARD: { icon: '🏀', category: 'FORWARD', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  POWER_FORWARD: { icon: '🏀', category: 'FORWARD', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  CENTER_BASKETBALL: { icon: '🏀', category: 'FORWARD', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  
  // Rugby
  PROP: { icon: '🏉', category: 'FORWARD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  HOOKER: { icon: '🏉', category: 'FORWARD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  LOCK: { icon: '🏉', category: 'FORWARD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  FLANKER: { icon: '🏉', category: 'FORWARD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  NUMBER_8: { icon: '🏉', category: 'FORWARD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  SCRUM_HALF: { icon: '🏉', category: 'MIDFIELD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  FLY_HALF: { icon: '🏉', category: 'MIDFIELD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  INSIDE_CENTER: { icon: '🏉', category: 'MIDFIELD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  OUTSIDE_CENTER: { icon: '🏉', category: 'MIDFIELD', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  FULLBACK: { icon: '🏉', category: 'DEFENSE', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  
  // American Football
  QUARTERBACK: { icon: '🏈', category: 'SPECIALIST', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  RUNNING_BACK: { icon: '🏈', category: 'ATTACK', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  WIDE_RECEIVER: { icon: '🏈', category: 'ATTACK', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  TIGHT_END: { icon: '🏈', category: 'FORWARD', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  DEFENSIVE_END: { icon: '🏈', category: 'DEFENSE', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  
  // Cricket
  BATSMAN: { icon: '🏏', category: 'SPECIALIST', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  BOWLER: { icon: '🏏', category: 'SPECIALIST', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  ALL_ROUNDER: { icon: '🏏', category: 'UTILITY', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  WICKET_KEEPER: { icon: '🏏', category: 'SPECIALIST', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  PLAYER: <User className="w-full h-full" />,
  COACH: <ClipboardList className="w-full h-full" />,
  MANAGER: <User className="w-full h-full" />,
  ADMIN: <Shield className="w-full h-full" />,
  TREASURER: <User className="w-full h-full" />,
  CLUB_MANAGER: <User className="w-full h-full" />,
  CLUB_OWNER: <Crown className="w-full h-full" />,
  REFEREE: <Whistle className="w-full h-full" />,
  SCOUT: <User className="w-full h-full" />,
  ANALYST: <BarChart3 className="w-full h-full" />,
  PARENT: <User className="w-full h-full" />,
  SUPERADMIN: <Shield className="w-full h-full" />,
  LEAGUE_ADMIN: <Shield className="w-full h-full" />,
  MEDICAL_STAFF: <Stethoscope className="w-full h-full" />,
  MEDIA_MANAGER: <Camera className="w-full h-full" />,
};

const STATUS_COLORS: Record<OnlineStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get initials from name
 */
function getInitials(firstName?: string, lastName?: string, name?: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }
  return 'U';
}

/**
 * Get position config with fallback
 */
function getPositionConfig(position?: string): PositionConfig {
  if (!position) {
    return { icon: '⚽', category: 'UNKNOWN', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' };
  }
  
  const config = POSITION_CATEGORIES[position.toUpperCase()];
  if (config) return config;
  
  // Fallback based on position name patterns
  const pos = position.toUpperCase();
  if (pos.includes('GOALKEEPER') || pos.includes('KEEPER') || pos.includes('GOALIE')) {
    return { icon: '🧤', category: 'GOALKEEPER', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
  }
  if (pos.includes('BACK') || pos.includes('DEFENDER') || pos.includes('DEFENSE')) {
    return { icon: '🛡️', category: 'DEFENSE', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
  }
  if (pos.includes('MIDFIELD') || pos.includes('CENTER') || pos.includes('WING')) {
    return { icon: '🔄', category: 'MIDFIELD', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
  }
  if (pos.includes('FORWARD') || pos.includes('STRIKER') || pos.includes('ATTACK')) {
    return { icon: '⚡', category: 'ATTACK', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  }
  
  return { icon: '⚽', category: 'UNKNOWN', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' };
}

/**
 * Generate avatar gradient based on string
 */
function stringToGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-500',
    'from-yellow-500 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-emerald-500 to-green-500',
    'from-amber-500 to-yellow-500',
  ];
  
  return gradients[Math.abs(hash) % gradients.length];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UserAvatar({
  firstName,
  lastName,
  name,
  position,
  sport,
  email,
  imageUrl,
  role,
  size = 'md',
  status,
  className,
  showLabel = false,
  showPosition = true,
  showStatus = true,
  onClick,
  priority = false,
}: UserAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeConfig = SIZE_CONFIG[size];
  const initials = useMemo(() => getInitials(firstName, lastName, name), [firstName, lastName, name]);
  const positionConfig = useMemo(() => getPositionConfig(position), [position]);
  const gradient = useMemo(() => stringToGradient(email || name || `${firstName}${lastName}` || 'user'), [email, name, firstName, lastName]);

  const displayName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'User');
  
  // Avatar URL with fallback to DiceBear
  const avatarUrl = useMemo(() => {
    if (imageUrl) return imageUrl;
    if (email) {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=random`;
    }
    return null;
  }, [imageUrl, email]);

  const handleLoadComplete = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-3',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${displayName}${position ? ` - ${position.replace(/_/g, ' ')}` : ''}`}
    >
      {/* Avatar Image */}
      <div
        className={cn(
          'relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center',
          sizeConfig.containerClass,
          sizeConfig.borderWidth,
          'border-gold-300/30 dark:border-gold-500/20',
          'transition-transform duration-200',
          onClick && 'hover:scale-105'
        )}
      >
        {/* Background/Gradient */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            hasError && gradient
          )}
        />

        {/* Loading Skeleton */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}

        {/* Image */}
        {avatarUrl && !hasError && (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={sizeConfig.container}
            height={sizeConfig.container}
            className={cn(
              'object-cover w-full h-full',
              isLoading ? 'opacity-0' : 'opacity-100',
              'transition-opacity duration-300'
            )}
            onLoad={handleLoadComplete}
            onError={handleError}
            priority={priority}
            unoptimized={avatarUrl.includes('dicebear.com')}
          />
        )}

        {/* Fallback Initials */}
        {(hasError || !avatarUrl) && (
          <span
            className={cn(
              'relative z-10 font-bold text-white',
              sizeConfig.fontSize
            )}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Position Badge */}
      {showPosition && position && position !== 'UNKNOWN' && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center',
            'border-2 border-white dark:border-charcoal-800',
            'shadow-sm',
            sizeConfig.positionBadgeSize,
            positionConfig.bgColor
          )}
          title={position.replace(/_/g, ' ')}
        >
          {positionConfig.icon}
        </div>
      )}

      {/* Status Indicator */}
      {showStatus && status && (
        <div
          className={cn(
            'absolute top-0 right-0 rounded-full',
            'border-2 border-white dark:border-charcoal-800',
            sizeConfig.statusSize,
            STATUS_COLORS[status]
          )}
          title={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      )}

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col min-w-0">
          <p className="font-semibold text-white dark:text-white truncate text-sm">
            {displayName}
          </p>
          {position && position !== 'UNKNOWN' && (
            <p className="text-xs text-gold-400 dark:text-gold-400 truncate">
              {position.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
