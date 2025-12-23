// ============================================================================
// src/app/dashboard/layout.tsx
// Dashboard Layout Component - CHAMPIONSHIP-LEVEL QUALITY
//
// Architecture: Next.js 15+ App Router with TypeScript
// Schema: Aligned with Prisma schema (User, Role, Team, Club, League)
// Styling: Tailwind CSS with gold/charcoal theme system
// Authentication: NextAuth.js session management
// Features: Role-based navigation, dynamic menus, AI insights, analytics
//
// ADDITIONS:
// - Analytics dashboard route (/dashboard/analytics)
// - Predictions dashboard route (/dashboard/predictions)
// - Players management route (/dashboard/players)
// - Enhanced sidebar with new icons
// - AI/ML insight badges
// - Real-time data integration
// 
// ============================================================================

import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardLayoutClient from './dashboard-layout-client';
import type { Session } from 'next-auth';

// ============================================================================
// TYPE DEFINITIONS - Schema Aligned
// ============================================================================

interface DashboardLayoutProps {
  children: ReactNode;
}

// ============================================================================
// SERVER COMPONENT: DashboardLayout
// ============================================================================

/**
 * Root Dashboard Layout - SERVER COMPONENT
 * 
 * Responsibilities:
 * - Fetch server session (only possible in server components)
 * - Pass session to client component
 * - Wrap with SessionProvider context from root
 * 
 * Note: This MUST be a server component to work with SessionProvider
 * hierarchy and getServerSession()
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Fetch server session
  // This can ONLY be done in server components
  const session = (await getServerSession(authOptions)) as Session | null;

  return (
    <DashboardLayoutClient session={session}>
      {children}
    </DashboardLayoutClient>
  );
}

// ============================================================================
// DISPLAY NAME - For debugging in React DevTools
// ============================================================================

DashboardLayout.displayName = 'DashboardLayout';
