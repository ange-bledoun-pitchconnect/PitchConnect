/**
 * ============================================================================
 * RoleRequestBadge Component
 * ============================================================================
 * 
 * Enterprise-grade badge for displaying role request status.
 * Aligned with Schema v7.10.1 UserRole enum and RoleRequest model.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users with pending role requests
 * - ADMIN: Managing role approvals
 * - SUPERADMIN: Platform-wide role management
 * - CLUB_MANAGER: Club role approvals
 * 
 * SCHEMA ALIGNMENT:
 * - UserRole enum (15 roles)
 * - RoleRequest model
 * - RoleRequestStatus enum
 * 
 * SUPPORTED ROLES (from Schema):
 * - PLAYER, COACH, MANAGER, ADMIN, TREASURER
 * - CLUB_MANAGER, CLUB_OWNER, REFEREE, SCOUT, ANALYST
 * - PARENT, SUPERADMIN, LEAGUE_ADMIN, MEDICAL_STAFF, MEDIA_MANAGER
 * 
 * ============================================================================
 */

'use client';

import {
  BadgeCheck,
  AlertCircle,
  Clock,
  XCircle,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  Trophy,
  ClipboardList,
  Wallet,
  Building2,
  Crown,
  Whistle,
  Binoculars,
  BarChart3,
  Heart,
  Camera,
  Stethoscope,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS (Aligned with Schema v7.10.1)
// =============================================================================

/**
 * Role request status from schema
 */
export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

/**
 * User role from schema
 */
export type UserRole =
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
 * Badge size
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Component props
 */
export interface RoleRequestBadgeProps {
  /** Request status */
  status: RoleRequestStatus;
  /** Role being requested */
  role: UserRole | string;
  /** Badge size */
  size?: BadgeSize;
  /** Show role icon */
  showIcon?: boolean;
  /** Show status icon */
  showStatusIcon?: boolean;
  /** Custom class name */
  className?: string;
  /** Show timestamp */
  timestamp?: Date | string;
  /** Click handler */
  onClick?: () => void;
  /** Animate pending status */
  animatePending?: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

interface StatusConfig {
  label: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  icon: LucideIcon;
}

const STATUS_CONFIG: Record<RoleRequestStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending Approval',
    bgLight: 'bg-yellow-100',
    bgDark: 'dark:bg-yellow-900/30',
    textLight: 'text-yellow-800',
    textDark: 'dark:text-yellow-300',
    borderLight: 'border-yellow-300',
    borderDark: 'dark:border-yellow-700',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    bgLight: 'bg-green-100',
    bgDark: 'dark:bg-green-900/30',
    textLight: 'text-green-800',
    textDark: 'dark:text-green-300',
    borderLight: 'border-green-300',
    borderDark: 'dark:border-green-700',
    icon: BadgeCheck,
  },
  REJECTED: {
    label: 'Rejected',
    bgLight: 'bg-red-100',
    bgDark: 'dark:bg-red-900/30',
    textLight: 'text-red-700',
    textDark: 'dark:text-red-300',
    borderLight: 'border-red-400',
    borderDark: 'dark:border-red-700',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    bgLight: 'bg-gray-100',
    bgDark: 'dark:bg-gray-800',
    textLight: 'text-gray-700',
    textDark: 'dark:text-gray-300',
    borderLight: 'border-gray-300',
    borderDark: 'dark:border-gray-600',
    icon: AlertCircle,
  },
  EXPIRED: {
    label: 'Expired',
    bgLight: 'bg-orange-100',
    bgDark: 'dark:bg-orange-900/30',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    borderLight: 'border-orange-300',
    borderDark: 'dark:border-orange-700',
    icon: Clock,
  },
};

interface RoleConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  PLAYER: {
    label: 'Player',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  COACH: {
    label: 'Coach',
    icon: ClipboardList,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  MANAGER: {
    label: 'Manager',
    icon: UserCheck,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  TREASURER: {
    label: 'Treasurer',
    icon: Wallet,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  CLUB_MANAGER: {
    label: 'Club Manager',
    icon: Building2,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  CLUB_OWNER: {
    label: 'Club Owner',
    icon: Crown,
    color: 'text-gold-600 dark:text-gold-400',
    bgColor: 'bg-gold-100 dark:bg-gold-900/30',
  },
  REFEREE: {
    label: 'Referee',
    icon: Whistle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  SCOUT: {
    label: 'Scout',
    icon: Binoculars,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  ANALYST: {
    label: 'Analyst',
    icon: BarChart3,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  PARENT: {
    label: 'Parent',
    icon: Heart,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  SUPERADMIN: {
    label: 'Super Admin',
    icon: ShieldAlert,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  LEAGUE_ADMIN: {
    label: 'League Admin',
    icon: Trophy,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  MEDICAL_STAFF: {
    label: 'Medical Staff',
    icon: Stethoscope,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  MEDIA_MANAGER: {
    label: 'Media Manager',
    icon: Camera,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
};

interface SizeConfig {
  padding: string;
  fontSize: string;
  iconSize: string;
  gap: string;
}

const SIZE_CONFIG: Record<BadgeSize, SizeConfig> = {
  sm: {
    padding: 'px-2 py-0.5',
    fontSize: 'text-xs',
    iconSize: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-2.5 py-1',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-base',
    iconSize: 'w-5 h-5',
    gap: 'gap-2',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get role config, with fallback for unknown roles
 */
function getRoleConfig(role: string): RoleConfig {
  const knownRole = role as UserRole;
  if (ROLE_CONFIG[knownRole]) {
    return ROLE_CONFIG[knownRole];
  }
  
  // Fallback for unknown roles
  return {
    label: role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Users,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  };
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RoleRequestBadge({
  status,
  role,
  size = 'sm',
  showIcon = true,
  showStatusIcon = true,
  className,
  timestamp,
  onClick,
  animatePending = true,
}: RoleRequestBadgeProps) {
  const statusConfig = STATUS_CONFIG[status];
  const roleConfig = getRoleConfig(role);
  const sizeConfig = SIZE_CONFIG[size];
  
  const StatusIcon = statusConfig.icon;
  const RoleIcon = roleConfig.icon;

  // Generate label based on status
  const getLabel = () => {
    switch (status) {
      case 'PENDING':
        return `${roleConfig.label} Pending`;
      case 'APPROVED':
        return `${roleConfig.label} Approved`;
      case 'REJECTED':
        return `${roleConfig.label} Rejected`;
      case 'CANCELLED':
        return `${roleConfig.label} Cancelled`;
      case 'EXPIRED':
        return `${roleConfig.label} Expired`;
      default:
        return roleConfig.label;
    }
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center border rounded-full font-semibold transition-all duration-200',
        sizeConfig.padding,
        sizeConfig.fontSize,
        sizeConfig.gap,
        statusConfig.bgLight,
        statusConfig.bgDark,
        statusConfig.textLight,
        statusConfig.textDark,
        statusConfig.borderLight,
        statusConfig.borderDark,
        onClick && 'cursor-pointer hover:opacity-80',
        animatePending && status === 'PENDING' && 'animate-pulse',
        className
      )}
      role="status"
      aria-label={`${roleConfig.label} request ${status.toLowerCase()}`}
    >
      {/* Status Icon */}
      {showStatusIcon && (
        <StatusIcon className={sizeConfig.iconSize} aria-hidden="true" />
      )}

      {/* Role Icon (optional) */}
      {showIcon && (
        <RoleIcon className={cn(sizeConfig.iconSize, roleConfig.color)} aria-hidden="true" />
      )}

      {/* Label */}
      <span>{getLabel()}</span>

      {/* Timestamp */}
      {timestamp && (
        <span className="opacity-70 text-[0.8em]">
          · {formatRelativeTime(timestamp)}
        </span>
      )}
    </span>
  );
}

// =============================================================================
// ROLE BADGE (Simple role display without status)
// =============================================================================

interface RoleBadgeProps {
  role: UserRole | string;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function RoleBadge({
  role,
  size = 'sm',
  showIcon = true,
  className,
  onClick,
}: RoleBadgeProps) {
  const roleConfig = getRoleConfig(role);
  const sizeConfig = SIZE_CONFIG[size];
  const RoleIcon = roleConfig.icon;

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        sizeConfig.padding,
        sizeConfig.fontSize,
        sizeConfig.gap,
        roleConfig.bgColor,
        roleConfig.color,
        'border-transparent',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      role="status"
      aria-label={roleConfig.label}
    >
      {showIcon && <RoleIcon className={sizeConfig.iconSize} aria-hidden="true" />}
      <span>{roleConfig.label}</span>
    </span>
  );
}

// =============================================================================
// ROLE REQUEST STATUS BADGE (Just status, no role)
// =============================================================================

interface StatusBadgeProps {
  status: RoleRequestStatus;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function RequestStatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  className,
  onClick,
}: StatusBadgeProps) {
  const statusConfig = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const StatusIcon = statusConfig.icon;

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center border rounded-full font-semibold',
        sizeConfig.padding,
        sizeConfig.fontSize,
        sizeConfig.gap,
        statusConfig.bgLight,
        statusConfig.bgDark,
        statusConfig.textLight,
        statusConfig.textDark,
        statusConfig.borderLight,
        statusConfig.borderDark,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      role="status"
      aria-label={statusConfig.label}
    >
      {showIcon && <StatusIcon className={sizeConfig.iconSize} aria-hidden="true" />}
      <span>{statusConfig.label}</span>
    </span>
  );
}

RoleRequestBadge.displayName = 'RoleRequestBadge';
RoleBadge.displayName = 'RoleBadge';
RequestStatusBadge.displayName = 'RequestStatusBadge';

export default RoleRequestBadge;
