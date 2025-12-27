/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Forgot Password Page
 * Path: src/app/auth/forgot-password/page.tsx
 * ============================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// FORGOT PASSWORD PAGE
// ============================================================================

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send reset email');
      }

      setIsSuccess(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  // Success State
  if (isSuccess) {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white font-display">
            Check your email
          </h1>
          <p className="text-charcoal-400">
            We've sent a password reset link to{' '}
            <span className="font-medium text-white">{email}</span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-charcoal-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-gold-400 hover:underline"
            >
              try again
            </button>
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-400 mb-4">
          <Sparkles className="h-3 w-3" />
          Password Recovery
        </div>
        <h1 className="text-3xl font-bold text-white font-display">
          Forgot your password?
        </h1>
        <p className="text-charcoal-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-charcoal-200">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-500 pointer-events-none" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="you@yourclub.com"
              disabled={isSubmitting}
              autoComplete="email"
              className="
                w-full rounded-xl border bg-charcoal-800/50 px-4 py-3.5 pl-12 text-white 
                placeholder:text-charcoal-500 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                border-white/10 focus:border-gold-500 focus:ring-gold-500/20 hover:border-white/20
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />
          </div>
        </div>

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
              Sending...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}