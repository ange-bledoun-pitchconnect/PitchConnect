// =============================================================================
// 🏆 PITCHCONNECT - MANAGER ANALYTICS REDIRECT
// =============================================================================
// Path: src/app/dashboard/manager/analytics/page.tsx
// Purpose: Redirect users to club/team specific analytics
//
// DECISION: This page is removed per user request.
// Users should access analytics through specific clubs/teams instead.
// =============================================================================

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export default async function ManagerAnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Redirect to the manager dashboard where they can select a club/team
  redirect('/dashboard/manager');
}