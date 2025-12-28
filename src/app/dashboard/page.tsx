/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Dashboard Router Page
 * Path: src/app/dashboard/page.tsx
 * ============================================================================
 * 
 * INTELLIGENT ROLE-BASED ROUTING
 * 
 * This page acts as a router that redirects users to their appropriate
 * dashboard based on their role and permissions.
 * 
 * Schema Alignment (UserRole enum):
 * - PLAYER → /dashboard/player
 * - COACH → /dashboard/coach  
 * - MANAGER → /dashboard/manager
 * - TREASURER → /dashboard/treasurer
 * - CLUB_OWNER → /dashboard/club
 * - LEAGUE_ADMIN → /dashboard/league
 * 
 * Special Cases:
 * - SuperAdmin → /dashboard/admin
 * - Multiple roles → Highest priority role wins
 * - No roles → Default to player dashboard
 * 
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Trophy } from 'lucide-react';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

/**
 * User roles from Prisma schema
 * These MUST match the UserRole enum in schema.prisma
 */
type UserRole = 
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'TREASURER'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST';

/**
 * Extended user interface with role information
 */
interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isSuperAdmin?: boolean;
  roles?: UserRole[];
}

// ============================================================================
// CONSTANTS - Route Configuration
// ============================================================================

/**
 * Dashboard route mapping
 * Maps each role to its corresponding dashboard path
 */
const DASHBOARD_ROUTES: Record<string, string> = {
  // Admin routes
  SUPERADMIN: '/dashboard/admin',
  
  // Management roles (highest priority)
  LEAGUE_ADMIN: '/dashboard/league',
  CLUB_OWNER: '/dashboard/club',
  MANAGER: '/dashboard/manager',
  
  // Staff roles
  COACH: '/dashboard/coach',
  TREASURER: '/dashboard/treasurer',
  ANALYST: '/dashboard/analytics',
  SCOUT: '/dashboard/scouting',
  REFEREE: '/dashboard/referee',
  
  // Player role (default)
  PLAYER: '/dashboard/player',
};

/**
 * Role priority order (highest to lowest)
 * When a user has multiple roles, they're routed to the highest priority dashboard
 */
const ROLE_PRIORITY: UserRole[] = [
  'LEAGUE_ADMIN',
  'CLUB_OWNER',
  'MANAGER',
  'COACH',
  'TREASURER',
  'ANALYST',
  'SCOUT',
  'REFEREE',
  'PLAYER',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the appropriate dashboard route based on user data
 * 
 * Priority:
 * 1. SuperAdmin flag (highest)
 * 2. Roles in priority order
 * 3. Default to player dashboard
 */
function getDashboardRoute(user: SessionUser | undefined): string {
  if (!user) {
    return DASHBOARD_ROUTES.PLAYER;
  }

  // SuperAdmin takes absolute priority
  if (user.isSuperAdmin) {
    return DASHBOARD_ROUTES.SUPERADMIN;
  }

  const userRoles = user.roles || [];

  // Find the highest priority role the user has
  for (const role of ROLE_PRIORITY) {
    if (userRoles.includes(role)) {
      return DASHBOARD_ROUTES[role] || DASHBOARD_ROUTES.PLAYER;
    }
  }

  // Default fallback
  return DASHBOARD_ROUTES.PLAYER;
}

/**
 * Get role display name for UI
 */
function getRoleDisplayName(user: SessionUser | undefined): string {
  if (!user) return 'Player';
  if (user.isSuperAdmin) return 'Super Admin';
  
  const roles = user.roles || [];
  if (roles.includes('LEAGUE_ADMIN')) return 'League Admin';
  if (roles.includes('CLUB_OWNER')) return 'Club Owner';
  if (roles.includes('MANAGER')) return 'Manager';
  if (roles.includes('COACH')) return 'Coach';
  if (roles.includes('TREASURER')) return 'Treasurer';
  if (roles.includes('ANALYST')) return 'Analyst';
  if (roles.includes('SCOUT')) return 'Scout';
  if (roles.includes('REFEREE')) return 'Referee';
  
  return 'Player';
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LoadingScreen({ 
  status, 
  roleName, 
  destination 
}: { 
  status: string; 
  roleName: string; 
  destination: string;
}) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)' 
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(249, 115, 22, 0.15)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(139, 92, 246, 0.1)', animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0 20px 40px rgba(249, 115, 22, 0.3)'
            }}
          >
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 
            className="text-4xl font-bold"
            style={{ 
              background: 'linear-gradient(to right, #f97316, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Loading Dashboard
          </h1>
          <p className="text-lg" style={{ color: '#9ca3af' }}>
            Preparing your personalized experience...
          </p>
        </div>

        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: '#374151' }}
        >
          <div 
            className="h-full rounded-full animate-pulse"
            style={{ 
              background: 'linear-gradient(to right, #f97316, #fbbf24, #a855f7)',
              width: '100%'
            }}
          />
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f97316' }} />
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div 
            className="mt-8 p-4 rounded-xl text-left text-sm font-mono"
            style={{ 
              backgroundColor: 'rgba(31, 41, 55, 0.5)', 
              border: '1px solid rgba(249, 115, 22, 0.2)' 
            }}
          >
            <p style={{ color: '#6b7280' }} className="mb-2">Debug Info:</p>
            <p style={{ color: '#fbbf24' }}>Status: {status}</p>
            <p style={{ color: '#fbbf24' }}>Role: {roleName}</p>
            <p style={{ color: '#fbbf24' }}>Destination: {destination}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [destination, setDestination] = useState('/dashboard/player');

  // Get typed user from session
  const user = session?.user as SessionUser | undefined;
  const roleName = getRoleDisplayName(user);

  // Handle routing based on auth status
  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Redirect unauthenticated users to login
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/dashboard');
      return;
    }

    // Calculate and perform redirect for authenticated users
    if (status === 'authenticated' && user) {
      const route = getDashboardRoute(user);
      setDestination(route);
      
      // Log routing decision in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Dashboard Router:', {
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          roles: user.roles,
          destination: route,
        });
      }

      // Perform redirect
      router.replace(route);
    }
  }, [status, user, router]);

  // Show loading screen while processing
  return (
    <LoadingScreen 
      status={status} 
      roleName={roleName}
      destination={destination}
    />
  );
}