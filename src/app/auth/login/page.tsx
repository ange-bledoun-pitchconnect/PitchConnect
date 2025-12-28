/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Login Page v3.0
 * Path: src/app/auth/login/page.tsx
 * ============================================================================
 */

import { Suspense } from 'react';
import LoginForm from './components/LoginForm';

// Skeleton for Suspense fallback
function LoginSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-6 w-24 bg-charcoal-800 rounded-full mx-auto" />
        <div className="h-9 w-64 bg-charcoal-800 rounded mx-auto" />
        <div className="h-5 w-48 bg-charcoal-800 rounded mx-auto" />
      </div>
      <div className="h-14 bg-charcoal-800 rounded-xl" />
      <div className="h-4 bg-charcoal-800 rounded w-full" />
      <div className="space-y-5">
        <div className="h-14 bg-charcoal-800 rounded-xl" />
        <div className="h-14 bg-charcoal-800 rounded-xl" />
        <div className="h-14 bg-charcoal-800 rounded-xl" />
      </div>
      <div className="h-5 w-40 bg-charcoal-800 rounded mx-auto" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}