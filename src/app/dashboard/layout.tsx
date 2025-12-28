/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Dashboard Layout (Server Component)
 * Path: src/app/dashboard/layout.tsx
 * ============================================================================
 * 
 * ROOT DASHBOARD LAYOUT - SERVER COMPONENT
 * 
 * Architecture:
 * - Next.js 15+ App Router
 * - Server-side session fetching
 * - Passes session to client layout
 * 
 * Schema Alignment:
 * - UserRole: PLAYER, COACH, MANAGER, TREASURER, CLUB_OWNER, LEAGUE_ADMIN
 * - SubscriptionTier: PLAYER_FREE, PLAYER_PRO, COACH, MANAGER, LEAGUE_ADMIN
 * 
 * ============================================================================
 */

import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './dashboard-layout-client';
import type { Metadata } from 'next';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | PitchConnect Dashboard',
  },
  description: 'Manage your teams, track performance, and access powerful analytics with PitchConnect.',
};

// ============================================================================
// TYPES
// ============================================================================

interface DashboardLayoutProps {
  children: ReactNode;
}

// ============================================================================
// SERVER COMPONENT
// ============================================================================

/**
 * Dashboard Layout - Server Component
 * 
 * This component:
 * 1. Fetches the server session (must be done server-side)
 * 2. Redirects unauthenticated users to login
 * 3. Passes session to the client layout component
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Fetch server session - ONLY possible in server components
  const session = await getServerSession(authOptions);

  // Redirect to login if no session
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  return (
    <DashboardLayoutClient session={session}>
      {children}
    </DashboardLayoutClient>
  );
}