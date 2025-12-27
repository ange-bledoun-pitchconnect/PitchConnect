/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Signup Page v3.0
 * Path: src/app/auth/signup/page.tsx
 * ============================================================================
 * 
 * Multi-step registration with role selection.
 * Uses RegisterForm for better UX with:
 * - Step 1: Role selection (Player, Coach, Manager, etc.)
 * - Step 2: Personal details (name, email, phone)
 * - Step 3: Password creation
 * 
 * ============================================================================
 */

import { Suspense } from 'react';
import { RegisterForm } from './components/RegisterForm';

function SignupSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-6 w-28 bg-charcoal-800 rounded-full mx-auto" />
        <div className="h-9 w-48 bg-charcoal-800 rounded mx-auto" />
        <div className="h-5 w-56 bg-charcoal-800 rounded mx-auto" />
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-8 bg-charcoal-800 rounded-full" />
        ))}
      </div>
      <div className="h-14 bg-charcoal-800 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-charcoal-800 rounded-xl" />
        ))}
      </div>
      <div className="h-14 bg-charcoal-800 rounded-xl" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}