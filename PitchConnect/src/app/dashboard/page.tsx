// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserRole = 'PLAYER' | 'PLAYER_PRO' | 'COACH' | 'CLUB_MANAGER' | 'LEAGUE_ADMIN' | 'TREASURER' | 'PARENT';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isSuperAdmin?: boolean;
  roles?: UserRole[];
}

interface ExtendedSession {
  user?: ExtendedUser;
}

// ============================================================================
// DASHBOARD ROUTES MAPPING - Maps user roles to their dashboard paths
// ============================================================================

const DASHBOARD_ROUTES: Record<string, string> = {
  SUPERADMIN: '/dashboard/superadmin', // ✅ CORRECTED - Points to /superadmin page.tsx
  LEAGUE_ADMIN: '/dashboard/leagues',
  CLUB_MANAGER: '/dashboard/clubs',
  COACH: '/dashboard/coach',
  TREASURER: '/dashboard/treasurer',
  PLAYER_PRO: '/dashboard/player',
  PLAYER: '/dashboard/player',
  PARENT: '/dashboard/parent',
};

// ============================================================================
// ROLE PRIORITY RESOLVER - Determines which dashboard to show
// ============================================================================

const getDashboardRoute = (user: ExtendedUser | undefined): string => {
  if (!user) return '/dashboard/player';

  // SuperAdmin takes HIGHEST priority - unrestricted access
  if (user.isSuperAdmin) {
    console.log('✅ User is SuperAdmin, routing to:', DASHBOARD_ROUTES.SUPERADMIN);
    return DASHBOARD_ROUTES.SUPERADMIN;
  }

  const roles = user.roles || [];

  // Priority order (highest → lowest):
  // LEAGUE_ADMIN > CLUB_MANAGER > COACH > TREASURER > PLAYER_PRO > PLAYER > PARENT
  if (roles.includes('LEAGUE_ADMIN')) {
    console.log('📊 User is LEAGUE_ADMIN');
    return DASHBOARD_ROUTES.LEAGUE_ADMIN;
  }
  if (roles.includes('CLUB_MANAGER')) {
    console.log('🏢 User is CLUB_MANAGER');
    return DASHBOARD_ROUTES.CLUB_MANAGER;
  }
  if (roles.includes('COACH')) {
    console.log('👨‍🏫 User is COACH');
    return DASHBOARD_ROUTES.COACH;
  }
  if (roles.includes('TREASURER')) {
    console.log('💰 User is TREASURER');
    return DASHBOARD_ROUTES.TREASURER;
  }
  if (roles.includes('PLAYER_PRO')) {
    console.log('⚽ User is PLAYER_PRO');
    return DASHBOARD_ROUTES.PLAYER_PRO;
  }
  if (roles.includes('PLAYER')) {
    console.log('🎯 User is PLAYER');
    return DASHBOARD_ROUTES.PLAYER;
  }
  if (roles.includes('PARENT')) {
    console.log('👨‍👩‍👧 User is PARENT');
    return DASHBOARD_ROUTES.PARENT;
  }

  // Default fallback - new users without roles
  console.log('❓ No roles found, defaulting to PLAYER');
  return '/dashboard/player';
};

// ============================================================================
// MAIN COMPONENT - Dashboard Router
// ============================================================================

export default function DashboardRouter() {
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: 'authenticated' | 'loading' | 'unauthenticated';
  };
  const router = useRouter();

  // ============================================================================
  // AUTH & ROUTING EFFECT - Handles all redirects based on auth status
  // ============================================================================

  useEffect(() => {
    console.log('🔄 Dashboard Router Effect - Status:', status);

    // Don't redirect while auth is loading
    if (status === 'loading') {
      console.log('⏳ Auth is loading, waiting...');
      return;
    }

    // Unauthenticated → login page
    if (status === 'unauthenticated') {
      console.log('🔐 No session detected, redirecting to login');
      router.replace('/auth/login');
      return;
    }

    // Authenticated → role-based dashboard
    if (status === 'authenticated' && session?.user) {
      const route = getDashboardRoute(session.user);
      const userRole = session.user.isSuperAdmin
        ? 'SuperAdmin'
        : session.user.roles?.[0] || 'Player';

      console.log(
        '✅ AUTHENTICATED USER ROUTING',
        `| Route: ${route}`,
        `| Role: ${userRole}`,
        `| Email: ${session.user.email}`,
        `| isSuperAdmin: ${session.user.isSuperAdmin}`
      );
      
      // DEBUG: Log the actual DASHBOARD_ROUTES object
      console.log('📋 DASHBOARD_ROUTES:', DASHBOARD_ROUTES);
      
      router.replace(route);
    }
  }, [status, session, router]);

  // ============================================================================
  // UI: Beautiful Loading State While Routing
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gold/Orange blob (top-right) */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-500/20 to-orange-400/10 rounded-full blur-3xl animate-blob" />

        {/* Purple blob (bottom-left, delayed) */}
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '2s' }}
        />

        {/* Blue blob (middle, longer delay) */}
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Loading Content Card */}
      <div className="relative z-10 text-center space-y-6 max-w-md">
        {/* Animated Loader Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-gold-500/50 transition-shadow duration-300">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>

        {/* Heading Text */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-400 to-orange-300 bg-clip-text text-transparent">
            Loading Your Dashboard
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Preparing your personalized experience based on your role...
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-charcoal-700 rounded-full overflow-hidden shadow-lg">
          <div className="h-full bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500 animate-pulse"></div>
        </div>

        {/* Additional Context */}
        <p className="text-gray-400 text-sm pt-4">
          ✨ Setting up your interface...
        </p>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-charcoal-800/50 border border-gold-500/20 rounded-lg text-left">
            <p className="text-xs text-gray-500 mb-2">Debug Info:</p>
            <p className="text-xs text-gold-400 font-mono">
              Status: {status}
            </p>
            <p className="text-xs text-gold-400 font-mono">
              SuperAdmin: {session?.user?.isSuperAdmin ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-xs text-gold-400 font-mono">
              Roles: {session?.user?.roles?.join(', ') || 'None'}
            </p>
            <p className="text-xs text-gold-400 font-mono">
              Route: {getDashboardRoute(session?.user)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
