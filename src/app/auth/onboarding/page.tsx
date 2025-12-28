/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Onboarding Redirect
 * Path: src/app/auth/onboarding/page.tsx
 * ============================================================================
 * 
 * Simple redirect to dashboard for new users
 * 
 * ============================================================================
 */

import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // Redirect new users directly to dashboard
  redirect('/dashboard/overview');
}