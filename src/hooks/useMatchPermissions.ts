/**
 * ============================================================================
 * 🔒 USE MATCH PERMISSIONS HOOK v7.10.1 - RBAC FOR MATCHES
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useMatchPermissions.ts
 * ============================================================================
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useAuth, UserRole, ClubMemberRole } from './useAuth';

export type MatchPermission =
  | 'VIEW_MATCH'
  | 'CREATE_MATCH'
  | 'UPDATE_MATCH'
  | 'DELETE_MATCH'
  | 'MANAGE_LINEUP'
  | 'RECORD_EVENTS'
  | 'RECORD_STATS'
  | 'APPROVE_RESULT'
  | 'PUBLISH_MATCH'
  | 'VIEW_LIVE'
  | 'OFFICIATE'
  | 'VIEW_ANALYTICS'
  | 'EXPORT_DATA';

export interface MatchContext {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  leagueId?: string;
  competitionId?: string;
  isPublished?: boolean;
  isLive?: boolean;
  isFinished?: boolean;
}

export interface UseMatchPermissionsReturn {
  // Permission checks
  can: (permission: MatchPermission) => boolean;
  canAll: (permissions: MatchPermission[]) => boolean;
  canAny: (permissions: MatchPermission[]) => boolean;
  
  // Specific checks
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageLineup: boolean;
  canRecordEvents: boolean;
  canRecordStats: boolean;
  canApproveResult: boolean;
  canPublish: boolean;
  canViewLive: boolean;
  canOfficiate: boolean;
  canViewAnalytics: boolean;
  canExport: boolean;
  
  // Role info
  isHomeClubMember: boolean;
  isAwayClubMember: boolean;
  isMatchOfficial: boolean;
  isLeagueAdmin: boolean;
  role: UserRole | null;
  clubRole: ClubMemberRole | null;
}

// Permission matrix - which roles can do what
const PERMISSION_MATRIX: Record<MatchPermission, {
  userRoles: UserRole[];
  clubRoles: ClubMemberRole[];
  requiresClubMembership: boolean;
  requiresMatchClub: boolean;
}> = {
  VIEW_MATCH: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 
                'COACH', 'COACH_PRO', 'PLAYER', 'PLAYER_PRO', 'REFEREE', 'SCOUT', 'ANALYST',
                'PARENT', 'GUARDIAN', 'FAN', 'MEDICAL_STAFF', 'MEDIA_MANAGER', 'TREASURER'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER', 'STAFF',
                'ANALYST', 'SCOUT', 'MEDICAL_STAFF', 'VIDEO_ANALYST'],
    requiresClubMembership: false,
    requiresMatchClub: false,
  },
  CREATE_MATCH: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH'],
    requiresClubMembership: true,
    requiresMatchClub: false,
  },
  UPDATE_MATCH: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  DELETE_MATCH: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER'],
    clubRoles: ['OWNER', 'MANAGER'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  MANAGE_LINEUP: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'COACH', 'COACH_PRO'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  RECORD_EVENTS: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER',
                'COACH', 'COACH_PRO', 'REFEREE', 'ANALYST'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'ANALYST', 'VIDEO_ANALYST'],
    requiresClubMembership: false,
    requiresMatchClub: false,
  },
  RECORD_STATS: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER',
                'COACH', 'COACH_PRO', 'ANALYST'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'ANALYST', 'VIDEO_ANALYST'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  APPROVE_RESULT: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'REFEREE'],
    clubRoles: [],
    requiresClubMembership: false,
    requiresMatchClub: false,
  },
  PUBLISH_MATCH: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER'],
    clubRoles: ['OWNER', 'MANAGER'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  VIEW_LIVE: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER',
                'COACH', 'COACH_PRO', 'PLAYER', 'PLAYER_PRO', 'REFEREE', 'SCOUT', 'ANALYST',
                'PARENT', 'GUARDIAN', 'FAN', 'MEDICAL_STAFF', 'MEDIA_MANAGER'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER', 'ANALYST', 'VIDEO_ANALYST'],
    requiresClubMembership: false,
    requiresMatchClub: false,
  },
  OFFICIATE: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'REFEREE'],
    clubRoles: [],
    requiresClubMembership: false,
    requiresMatchClub: false,
  },
  VIEW_ANALYTICS: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER',
                'COACH', 'COACH_PRO', 'ANALYST', 'SCOUT'],
    clubRoles: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'ANALYST', 'VIDEO_ANALYST', 'SCOUT'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
  EXPORT_DATA: {
    userRoles: ['SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'ANALYST'],
    clubRoles: ['OWNER', 'MANAGER', 'ANALYST'],
    requiresClubMembership: true,
    requiresMatchClub: true,
  },
};

export function useMatchPermissions(match?: MatchContext | null): UseMatchPermissionsReturn {
  const auth = useAuth();

  // Club membership checks
  const isHomeClubMember = useMemo(() => {
    if (!match?.homeClubId) return false;
    return auth.isMemberOfClub(match.homeClubId);
  }, [auth, match?.homeClubId]);

  const isAwayClubMember = useMemo(() => {
    if (!match?.awayClubId) return false;
    return auth.isMemberOfClub(match.awayClubId);
  }, [auth, match?.awayClubId]);

  const isMatchClubMember = isHomeClubMember || isAwayClubMember;
  const isMatchOfficial = auth.hasRole('REFEREE');
  const isLeagueAdmin = auth.hasRole('LEAGUE_ADMIN');

  // Get club role for match clubs
  const clubRole = useMemo((): ClubMemberRole | null => {
    if (isHomeClubMember && match?.homeClubId) {
      return auth.getClubMembership(match.homeClubId)?.role || null;
    }
    if (isAwayClubMember && match?.awayClubId) {
      return auth.getClubMembership(match.awayClubId)?.role || null;
    }
    return null;
  }, [auth, isHomeClubMember, isAwayClubMember, match?.homeClubId, match?.awayClubId]);

  // Permission check function
  const can = useCallback((permission: MatchPermission): boolean => {
    if (!auth.isAuthenticated) return false;
    if (auth.isSuperAdmin) return true;

    const config = PERMISSION_MATRIX[permission];
    if (!config) return false;

    // Check user role
    const hasUserRole = auth.hasRole(config.userRoles);
    
    // Check club role
    const hasClubRole = clubRole ? config.clubRoles.includes(clubRole) : false;

    // Check club membership requirements
    if (config.requiresMatchClub && !isMatchClubMember && !isLeagueAdmin && !isMatchOfficial) {
      return false;
    }

    if (config.requiresClubMembership && !auth.user?.clubMemberships?.length && !isLeagueAdmin) {
      return false;
    }

    return hasUserRole || hasClubRole;
  }, [auth, clubRole, isMatchClubMember, isLeagueAdmin, isMatchOfficial]);

  const canAll = useCallback((permissions: MatchPermission[]): boolean => {
    return permissions.every(p => can(p));
  }, [can]);

  const canAny = useCallback((permissions: MatchPermission[]): boolean => {
    return permissions.some(p => can(p));
  }, [can]);

  return useMemo(() => ({
    can,
    canAll,
    canAny,
    canView: can('VIEW_MATCH'),
    canCreate: can('CREATE_MATCH'),
    canEdit: can('UPDATE_MATCH'),
    canDelete: can('DELETE_MATCH'),
    canManageLineup: can('MANAGE_LINEUP'),
    canRecordEvents: can('RECORD_EVENTS'),
    canRecordStats: can('RECORD_STATS'),
    canApproveResult: can('APPROVE_RESULT'),
    canPublish: can('PUBLISH_MATCH'),
    canViewLive: can('VIEW_LIVE'),
    canOfficiate: can('OFFICIATE'),
    canViewAnalytics: can('VIEW_ANALYTICS'),
    canExport: can('EXPORT_DATA'),
    isHomeClubMember,
    isAwayClubMember,
    isMatchOfficial,
    isLeagueAdmin,
    role: auth.user?.role || null,
    clubRole,
  }), [can, canAll, canAny, isHomeClubMember, isAwayClubMember, isMatchOfficial, isLeagueAdmin, auth.user?.role, clubRole]);
}

export default useMatchPermissions;
