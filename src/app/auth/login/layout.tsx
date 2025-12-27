/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Login Page Layout
 * Path: src/app/auth/login/layout.tsx
 * ============================================================================
 * 
 * Minimal layout for login page metadata.
 * Main layout structure is handled by parent auth/layout.tsx
 * 
 * ============================================================================
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your PitchConnect account to manage your sports teams, track performance, and access analytics.',
  openGraph: {
    title: 'Sign In | PitchConnect',
    description: 'Access your PitchConnect account',
  },
};

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return <>{children}</>;
}