/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Dashboard Router v2.0
 * Path: src/app/dashboard/page.tsx
 * ============================================================================
 * 
 * SMART ROLE-BASED ROUTING:
 * 
 * This page acts as a router that redirects users to their primary dashboard
 * based on their highest-priority role. Users with multiple roles will be
 * directed to their most privileged dashboard, but can switch roles using
 * the RoleSwitcher component in the layout.
 * 
 * ROLE PRIORITY (highest to lowest):
 * 1. SUPER_ADMIN → /dashboard/superadmin
 * 2. LEAGUE_ADMIN → /dashboard/league-admin
 * 3. CLUB_OWNER → /dashboard/club
 * 4. CLUB_MANAGER → /dashboard/club
 * 5. MANAGER → /dashboard/manager
 * 6. TREASURER → /dashboard/treasurer
 * 7. COACH → /dashboard/coach
 * 8. ANALYST → /dashboard/analyst
 * 9. SCOUT → /dashboard/scout
 * 10. REFEREE → /dashboard/referee
 * 11. MEDICAL_STAFF → /dashboard/medical
 * 12. MEDIA_MANAGER → /dashboard/media
 * 13. PARENT → /dashboard/parent
 * 14. GUARDIAN → /dashboard/parent
 * 15. PLAYER → /dashboard/player
 * 16. FAN → /dashboard/fan
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

/**
 * Role priority array - higher index = lower priority
 * The first matching role determines the dashboard redirect
 */
const ROLE_PRIORITY: string[] = [
  'SUPER_ADMIN',
  'LEAGUE_ADMIN',
  'CLUB_OWNER',
  'CLUB_MANAGER',
  'MANAGER',
  'TREASURER',
  'COACH',
  'ANALYST',
  'SCOUT',
  'REFEREE',
  'MEDICAL_STAFF',
  'MEDIA_MANAGER',
  'PARENT',
  'GUARDIAN',
  'PLAYER',
  'FAN',
];

/**
 * Maps roles to their respective dashboard paths
 */
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SUPER_ADMIN: '/dashboard/superadmin',
  LEAGUE_ADMIN: '/dashboard/league-admin',
  CLUB_OWNER: '/dashboard/club',
  CLUB_MANAGER: '/dashboard/club',
  MANAGER: '/dashboard/manager',
  TREASURER: '/dashboard/treasurer',
  COACH: '/dashboard/coach',
  ANALYST: '/dashboard/analyst',
  SCOUT: '/dashboard/scout',
  REFEREE: '/dashboard/referee',
  MEDICAL_STAFF: '/dashboard/medical',
  MEDIA_MANAGER: '/dashboard/media',
  PARENT: '/dashboard/parent',
  GUARDIAN: '/dashboard/parent',
  PLAYER: '/dashboard/player',
  FAN: '/dashboard/fan',
};

// Default dashboard for users with no roles
const DEFAULT_DASHBOARD = '/dashboard/player';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the highest priority role from a user's roles
 */
function getHighestPriorityRole(userRoles: string[]): string | null {
  if (!userRoles || userRoles.length === 0) return null;
  
  // Find the first role in priority order that the user has
  for (const role of ROLE_PRIORITY) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Gets the dashboard path for a given role
 */
function getDashboardPath(role: string | null): string {
  if (!role) return DEFAULT_DASHBOARD;
  return ROLE_DASHBOARD_MAP[role] || DEFAULT_DASHBOARD;
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function DashboardRouterPage() {
  // Get the session
  const session = await getServerSession(authOptions);

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check for SuperAdmin flag first (highest priority)
  if (session.user.isSuperAdmin) {
    redirect('/dashboard/superadmin');
  }

  // Get user from database to get fresh roles
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      roles: true,
      // Also check for role-specific records
      player: { select: { id: true } },
      coach: { select: { id: true } },
      referee: { select: { id: true } },
      scout: { select: { id: true } },
      analyst: { select: { id: true } },
      manager: { select: { id: true } },
      treasurer: { select: { id: true } },
      parent: { select: { id: true } },
      leagueAdmin: { select: { id: true } },
    },
  });

  if (!user) {
    // User doesn't exist in DB - redirect to login
    redirect('/auth/login');
  }

  // Get user's roles (String[] scalar from Prisma)
  const userRoles = user.roles || [];

  // Infer roles from related records if roles array is empty
  const inferredRoles: string[] = [...userRoles];
  
  if (user.player && !inferredRoles.includes('PLAYER')) {
    inferredRoles.push('PLAYER');
  }
  if (user.coach && !inferredRoles.includes('COACH')) {
    inferredRoles.push('COACH');
  }
  if (user.referee && !inferredRoles.includes('REFEREE')) {
    inferredRoles.push('REFEREE');
  }
  if (user.scout && !inferredRoles.includes('SCOUT')) {
    inferredRoles.push('SCOUT');
  }
  if (user.analyst && !inferredRoles.includes('ANALYST')) {
    inferredRoles.push('ANALYST');
  }
  if (user.manager && !inferredRoles.includes('MANAGER')) {
    inferredRoles.push('MANAGER');
  }
  if (user.treasurer && !inferredRoles.includes('TREASURER')) {
    inferredRoles.push('TREASURER');
  }
  if (user.parent && !inferredRoles.includes('PARENT')) {
    inferredRoles.push('PARENT');
  }
  if (user.leagueAdmin && !inferredRoles.includes('LEAGUE_ADMIN')) {
    inferredRoles.push('LEAGUE_ADMIN');
  }

  // Get the highest priority role
  const primaryRole = getHighestPriorityRole(inferredRoles);
  
  // Get the dashboard path for that role
  const dashboardPath = getDashboardPath(primaryRole);

  // Log for debugging
  console.log('[DASHBOARD ROUTER]', {
    userId: session.user.id,
    userRoles: inferredRoles,
    primaryRole,
    redirectTo: dashboardPath,
  });

  // Redirect to the appropriate dashboard
  redirect(dashboardPath);
}

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Dashboard | PitchConnect',
  description: 'Your personalized dashboard',
};