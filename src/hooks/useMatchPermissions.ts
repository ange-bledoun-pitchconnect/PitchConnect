// ============================================================================
// 🔐 USE MATCH PERMISSIONS HOOK v7.4.0
// ============================================================================
// Role-based access control for match operations
// ============================================================================

'use client';

import { useMemo } from 'react';
import type { Match, MatchPermissions } from '@/types/match';
import type { ClubMemberRole } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface UserSession {
  id: string;
  email: string;
  roles: string[];
  isSuperAdmin: boolean;
  clubMemberships: ClubMembership[];
  coachId?: string;
}

export interface ClubMembership {
  clubId: string;
  role: ClubMemberRole;
  isActive: boolean;
  canManageMatches: boolean;
  canManageRoster: boolean;
  canCreateFriendlyMatches: boolean;
  canManageLineups: boolean;
}

// ============================================================================
// PERMISSION CONSTANTS
// ============================================================================

// Roles that can fully manage matches
const MATCH_ADMIN_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
];

// Roles that can manage lineups
const LINEUP_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
];

// Roles that can record events
const EVENT_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'ANALYST',
  'VIDEO_ANALYST',
];

// Roles that can record results
const RESULT_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
];

// Roles that can approve results
const APPROVAL_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMembershipForClub(
  memberships: ClubMembership[],
  clubId: string
): ClubMembership | undefined {
  return memberships.find((m) => m.clubId === clubId && m.isActive);
}

function hasRole(membership: ClubMembership | undefined, roles: ClubMemberRole[]): boolean {
  if (!membership) return false;
  return roles.includes(membership.role);
}

function isMatchCreator(match: Match, userId: string, coachId?: string): boolean {
  if (match.createdById === userId) return true;
  if (coachId && match.createdByCoachId === coachId) return true;
  return false;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useMatchPermissions(
  match: Match | null,
  session: UserSession | null
): MatchPermissions {
  return useMemo(() => {
    // Default permissions (no access)
    const defaultPermissions: MatchPermissions = {
      canView: false,
      canEdit: false,
      canDelete: false,
      canManageLineup: false,
      canRecordEvents: false,
      canRecordResult: false,
      canApproveResult: false,
      canManageOfficials: false,
      isCreator: false,
      isHomeTeamStaff: false,
      isAwayTeamStaff: false,
      role: null,
    };
    
    // No session = no permissions (except public viewing)
    if (!session) {
      return {
        ...defaultPermissions,
        canView: true, // Public matches can be viewed
      };
    }
    
    // Super admins have full access
    if (session.isSuperAdmin) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageLineup: true,
        canRecordEvents: true,
        canRecordResult: true,
        canApproveResult: true,
        canManageOfficials: true,
        isCreator: false,
        isHomeTeamStaff: true,
        isAwayTeamStaff: true,
        role: 'OWNER' as ClubMemberRole,
      };
    }
    
    // No match = limited permissions
    if (!match) {
      return defaultPermissions;
    }
    
    // Check club memberships
    const homeMembership = getMembershipForClub(session.clubMemberships, match.homeClubId);
    const awayMembership = getMembershipForClub(session.clubMemberships, match.awayClubId);
    
    const isHomeTeamStaff = !!homeMembership;
    const isAwayTeamStaff = !!awayMembership;
    const isCreator = isMatchCreator(match, session.id, session.coachId);
    
    // Use the best role available
    const activeMembership = homeMembership || awayMembership;
    const role = activeMembership?.role || null;
    
    // Everyone can view
    const canView = true;
    
    // Edit permissions
    const canEdit = 
      isCreator ||
      hasRole(homeMembership, MATCH_ADMIN_ROLES) ||
      (homeMembership?.canManageMatches ?? false) ||
      (awayMembership?.canManageMatches ?? false);
    
    // Delete permissions (more restricted)
    const canDelete = 
      hasRole(homeMembership, ['OWNER', 'MANAGER']) ||
      hasRole(awayMembership, ['OWNER', 'MANAGER']);
    
    // Lineup permissions
    const canManageLineup =
      hasRole(homeMembership, LINEUP_ROLES) ||
      hasRole(awayMembership, LINEUP_ROLES) ||
      (homeMembership?.canManageLineups ?? false) ||
      (awayMembership?.canManageLineups ?? false);
    
    // Event recording permissions
    const canRecordEvents =
      hasRole(homeMembership, EVENT_ROLES) ||
      hasRole(awayMembership, EVENT_ROLES);
    
    // Result recording permissions
    const canRecordResult =
      hasRole(homeMembership, RESULT_ROLES) ||
      hasRole(awayMembership, RESULT_ROLES) ||
      (homeMembership?.canManageMatches ?? false) ||
      (awayMembership?.canManageMatches ?? false);
    
    // Result approval permissions (typically one club confirms other's result)
    const canApproveResult =
      hasRole(homeMembership, APPROVAL_ROLES) ||
      hasRole(awayMembership, APPROVAL_ROLES);
    
    // Officials management
    const canManageOfficials =
      hasRole(homeMembership, MATCH_ADMIN_ROLES) ||
      (homeMembership?.canManageMatches ?? false);
    
    return {
      canView,
      canEdit,
      canDelete,
      canManageLineup,
      canRecordEvents,
      canRecordResult,
      canApproveResult,
      canManageOfficials,
      isCreator,
      isHomeTeamStaff,
      isAwayTeamStaff,
      role,
    };
  }, [match, session]);
}

// ============================================================================
// SERVER-SIDE PERMISSION CHECK
// ============================================================================

export async function checkMatchPermissions(
  matchId: string,
  userId: string,
  action: keyof MatchPermissions
): Promise<boolean> {
  // This would be called from API routes
  // Implementation depends on your data layer
  
  const response = await fetch(`/api/matches/${matchId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action }),
  });
  
  if (!response.ok) return false;
  
  const data = await response.json();
  return data.allowed === true;
}

// ============================================================================
// PERMISSION GUARD COMPONENT
// ============================================================================

interface MatchPermissionGuardProps {
  match: Match | null;
  session: UserSession | null;
  permission: keyof MatchPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MatchPermissionGuard({
  match,
  session,
  permission,
  children,
  fallback = null,
}: MatchPermissionGuardProps): React.ReactNode {
  const permissions = useMatchPermissions(match, session);
  
  if (!permissions[permission]) {
    return fallback;
  }
  
  return children;
}

// ============================================================================
// HOOK FOR CHECKING MULTIPLE PERMISSIONS
// ============================================================================

export function useMatchActions(
  match: Match | null,
  session: UserSession | null
) {
  const permissions = useMatchPermissions(match, session);
  
  return useMemo(() => ({
    canWatchLive: permissions.canView && match?.status !== 'SCHEDULED',
    canEditDetails: permissions.canEdit,
    canSetLineup: permissions.canManageLineup,
    canRecordEvents: permissions.canRecordEvents && ['LIVE', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'HALFTIME'].includes(match?.status || ''),
    canSubmitResult: permissions.canRecordResult && match?.status !== 'FINISHED',
    canApproveResult: permissions.canApproveResult && match?.resultApprovalStatus === 'PENDING',
    canDeleteMatch: permissions.canDelete && match?.status === 'SCHEDULED',
    canAssignOfficials: permissions.canManageOfficials,
    showAdminActions: permissions.canEdit || permissions.canManageLineup || permissions.canRecordEvents,
  }), [match, permissions]);
}

// ============================================================================
// GET PERMISSION DESCRIPTION
// ============================================================================

export function getPermissionDescription(permission: keyof MatchPermissions): string {
  const descriptions: Record<keyof MatchPermissions, string> = {
    canView: 'View match details',
    canEdit: 'Edit match information',
    canDelete: 'Delete this match',
    canManageLineup: 'Set and modify team lineups',
    canRecordEvents: 'Record match events (goals, cards, etc.)',
    canRecordResult: 'Submit match result',
    canApproveResult: 'Approve or dispute match result',
    canManageOfficials: 'Assign match officials',
    isCreator: 'You created this match',
    isHomeTeamStaff: 'You are staff for the home team',
    isAwayTeamStaff: 'You are staff for the away team',
    role: 'Your role in the club',
  };
  
  return descriptions[permission] || permission;
}

// ============================================================================
// ROLE DISPLAY HELPER
// ============================================================================

export function getRoleDisplayName(role: ClubMemberRole): string {
  const names: Record<ClubMemberRole, string> = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    HEAD_COACH: 'Head Coach',
    ASSISTANT_COACH: 'Assistant Coach',
    PLAYER: 'Player',
    STAFF: 'Staff',
    TREASURER: 'Treasurer',
    SCOUT: 'Scout',
    ANALYST: 'Analyst',
    MEDICAL_STAFF: 'Medical Staff',
    PHYSIOTHERAPIST: 'Physiotherapist',
    NUTRITIONIST: 'Nutritionist',
    PSYCHOLOGIST: 'Psychologist',
    PERFORMANCE_COACH: 'Performance Coach',
    GOALKEEPING_COACH: 'Goalkeeping Coach',
    KIT_MANAGER: 'Kit Manager',
    MEDIA_OFFICER: 'Media Officer',
    VIDEO_ANALYST: 'Video Analyst',
  };
  
  return names[role] || role;
}
