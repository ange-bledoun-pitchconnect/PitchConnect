'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN' | 'SUPERADMIN';

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    userType?: UserRole | null;
  };
}

const DEFAULT_ROLE: UserRole = 'PLAYER';

const DASHBOARD_ROUTES: Record<UserRole, string> = {
  PLAYER: '/dashboard/player',
  COACH: '/dashboard/coach',
  MANAGER: '/dashboard/manager',
  LEAGUE_ADMIN: '/dashboard/league-admin',
  SUPERADMIN: '/dashboard/superadmin',
};

const getDashboardRoute = (userType: UserRole | string | null | undefined): string => {
  if (!userType || typeof userType !== 'string') {
    return DASHBOARD_ROUTES[DEFAULT_ROLE];
  }

  const normalizedRole = userType.toUpperCase() as UserRole;

  if (normalizedRole in DASHBOARD_ROUTES) {
    return DASHBOARD_ROUTES[normalizedRole];
  }

  return DASHBOARD_ROUTES[DEFAULT_ROLE];
};

export default function DashboardRouter() {
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: 'authenticated' | 'loading' | 'unauthenticated';
  };
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userType = session.user.userType ?? DEFAULT_ROLE;
      const route = getDashboardRoute(userType);
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
