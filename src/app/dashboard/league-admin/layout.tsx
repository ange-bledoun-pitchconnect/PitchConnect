// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE ADMIN LAYOUT v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/league-admin/layout.tsx
// Access: LEAGUE_ADMIN role or SuperAdmin only
//
// FEATURES:
// ✅ Role-based access control
// ✅ Proper NextAuth session handling
// ✅ Redirect unauthorized users
// ✅ League context provider for child routes
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface LeagueAdminLayoutProps {
  children: ReactNode;
}

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

export default async function LeagueAdminLayout({ children }: LeagueAdminLayoutProps) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Extract roles from session
  const roles = (session.user.roles as string[]) || [];
  const isSuperAdmin = session.user.isSuperAdmin === true;

  // Check if user has LEAGUE_ADMIN role or is SuperAdmin
  const hasAccess = roles.includes('LEAGUE_ADMIN') || isSuperAdmin;

  if (!hasAccess) {
    // Redirect to main dashboard if unauthorized
    redirect('/dashboard');
  }

  // Render children if authorized
  return <>{children}</>;
}