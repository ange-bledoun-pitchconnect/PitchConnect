/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Reset Password Page
 * Path: src/app/auth/reset-password/page.tsx
 * ============================================================================
 * 
 * This page handles the password reset completion when users click
 * the reset link from their email.
 * 
 * URL Format: /auth/reset-password?token=xxx
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  XCircle,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function PasswordStrength({ password }: { password: string }) {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < passed
                ? passed <= 1 ? 'bg-red-500'
                : passed <= 2 ? 'bg-orange-500'
                : passed <= 3 ? 'bg-yellow-500'
                : 'bg-green-500'
                : 'bg-charcoal-700'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <div
              key={req.id}
              className={`flex items-center gap-2 text-xs transition-colors ${
                met ? 'text-green-400' : 'text-charcoal-500'
              }`}
            >
              {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {req.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// RESET PASSWORD FORM
// ============================================================================

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get token from URL
  const token = searchParams.get('token');
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; form?: string }>({});

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        setIsTokenValid(response.ok);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const failedReqs = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
      if (failedReqs.length > 0) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  }, [password, confirmPassword]);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, password, validateForm]);

  // Loading state
  if (isValidating) {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 mx-auto text-gold-500 animate-spin" />
        <p className="text-charcoal-400">Validating your reset link...</p>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !isTokenValid) {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white font-display">
            Invalid or expired link
          </h1>
          <p className="text-charcoal-400">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
        </div>

        <Link
          href="/auth/forgot-password"
          className="
            inline-flex items-center justify-center gap-2 rounded-xl 
            bg-gradient-to-r from-gold-500 to-orange-500 
            px-6 py-3 font-semibold text-charcoal-900 shadow-lg shadow-gold-500/25
            transition-all duration-300 hover:shadow-gold-500/40 hover:scale-[1.02]
          "
        >
          Request New Link
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white font-display">
            Password reset successful
          </h1>
          <p className="text-charcoal-400">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="
            inline-flex items-center justify-center gap-2 rounded-xl 
            bg-gradient-to-r from-gold-500 to-orange-500 
            px-6 py-3 font-semibold text-charcoal-900 shadow-lg shadow-gold-500/25
            transition-all duration-300 hover:shadow-gold-500/40 hover:scale-[1.02]
          "
        >
          Sign In
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  // Form state
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-400 mb-4">
          <Sparkles className="h-3 w-3" />
          Almost Done
        </div>
        <h1 className="text-3xl font-bold text-white font-display">
          Create new password
        </h1>
        <p className="text-charcoal-400">
          Enter a strong password for your account
        </p>
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{errors.form}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* New Password */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-charcoal-200">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Create a strong password"
                disabled={isSubmitting}
                autoComplete="new-password"
                className={`
                  w-full rounded-xl border bg-charcoal-800/50 px-4 py-3.5 pl-12 pr-12 text-white 
                  placeholder:text-charcoal-500 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.password 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-white/10 focus:border-gold-500 focus:ring-gold-500/20 hover:border-white/20'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errors.password}
              </p>
            )}
          </div>
          {password && <PasswordStrength password={password} />}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal-200">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-500 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm your password"
              disabled={isSubmitting}
              autoComplete="new-password"
              className={`
                w-full rounded-xl border bg-charcoal-800/50 px-4 py-3.5 pl-12 pr-12 text-white 
                placeholder:text-charcoal-500 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.confirmPassword 
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-white/10 focus:border-gold-500 focus:ring-gold-500/20 hover:border-white/20'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {errors.confirmPassword}
            </p>
          )}
          {password && confirmPassword && password === confirmPassword && (
            <p className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Passwords match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            relative w-full rounded-xl bg-gradient-to-r from-gold-500 to-orange-500 
            px-4 py-4 font-semibold text-charcoal-900 shadow-lg shadow-gold-500/25
            transition-all duration-300 hover:shadow-gold-500/40 hover:scale-[1.02]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Resetting password...
            </>
          ) : (
            <>
              Reset Password
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <p className="text-center text-sm text-charcoal-400">
        Remember your password?{' '}
        <Link href="/auth/login" className="font-semibold text-gold-400 hover:text-gold-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ============================================================================
// PAGE COMPONENT WITH SUSPENSE
// ============================================================================

function ResetPasswordSkeleton() {
  return (
    <div className="text-center space-y-4">
      <div className="h-12 w-12 mx-auto bg-charcoal-800 rounded-full animate-pulse" />
      <div className="h-5 w-48 mx-auto bg-charcoal-800 rounded animate-pulse" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}