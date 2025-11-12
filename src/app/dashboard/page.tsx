/**
 * Dashboard Router
 * Redirects users to their role-specific dashboard
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user) {
      const roles = (session.user as any).roles || [];

      // Route based on primary role
      if (roles.includes('PLAYER')) {
        router.push('/dashboard/player');
      } else if (roles.includes('COACH')) {
        router.push('/dashboard/coach');
      } else if (roles.includes('CLUB_MANAGER')) {
        router.push('/dashboard/club');
      } else if (roles.includes('LEAGUE_ADMIN')) {
        router.push('/dashboard/league');
      } else {
        router.push('/dashboard/player');
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
