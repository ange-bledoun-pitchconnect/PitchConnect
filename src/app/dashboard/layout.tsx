'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeamFilterProvider } from '@/lib/dashboard/team-context';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TeamFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="flex h-screen">
          {/* SIDEBAR */}
          <DashboardSidebar userType={session?.user?.userType as string} />

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-40">
              <div className="px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-charcoal-900">Dashboard</h1>
                <DashboardHeader />
              </div>
            </div>

            {/* PAGE CONTENT */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TeamFilterProvider>
  );
}
