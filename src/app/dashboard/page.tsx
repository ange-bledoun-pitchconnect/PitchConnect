'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

const DASHBOARD_ROUTES: Record<string, string> = {
  SUPERADMIN: '/dashboard/admin',
  LEAGUE_ADMIN: '/dashboard/leagues',
  CLUB_MANAGER: '/dashboard/clubs',
  COACH: '/dashboard/coach',
  TREASURER: '/dashboard/treasurer',
  PLAYER_PRO: '/dashboard/player',
  PLAYER: '/dashboard/player',
  PARENT: '/dashboard/parent',
};

const getDashboardRoute = (user: ExtendedUser | undefined): string => {
  if (!user) return '/dashboard/player';

  // SuperAdmin takes highest priority
  if (user.isSuperAdmin) {
    return DASHBOARD_ROUTES.SUPERADMIN;
  }

  const roles = user.roles || [];

  // Priority order: LEAGUE_ADMIN > CLUB_MANAGER > COACH > TREASURER > PLAYER_PRO > PLAYER > PARENT
  if (roles.includes('LEAGUE_ADMIN')) return DASHBOARD_ROUTES.LEAGUE_ADMIN;
  if (roles.includes('CLUB_MANAGER')) return DASHBOARD_ROUTES.CLUB_MANAGER;
  if (roles.includes('COACH')) return DASHBOARD_ROUTES.COACH;
  if (roles.includes('TREASURER')) return DASHBOARD_ROUTES.TREASURER;
  if (roles.includes('PLAYER_PRO')) return DASHBOARD_ROUTES.PLAYER_PRO;
  if (roles.includes('PLAYER')) return DASHBOARD_ROUTES.PLAYER;
  if (roles.includes('PARENT')) return DASHBOARD_ROUTES.PARENT;

  // Default fallback
  return '/dashboard/player';
};

export default function DashboardRouter() {
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: 'authenticated' | 'loading' | 'unauthenticated';
  };
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const route = getDashboardRoute(session.user);
      console.log('🔄 Routing to:', route, 'User:', session.user);
      router.replace(route);
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-500/20 to-orange-400/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      {/* Loading Card */}
      <div className="relative z-10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Loading Your Dashboard</h1>
          <p className="text-gray-300 text-lg">Preparing your personalized experience...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-charcoal-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500 animate-pulse"></div>
        </div>

        {/* Trust Message */}
        <p className="text-gray-400 text-sm">
          Don&apos;t worry, this should only take a moment...
        </p>
      </div>
    </div>
  );
}
