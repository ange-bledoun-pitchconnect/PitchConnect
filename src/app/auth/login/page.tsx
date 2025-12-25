'use client';

/**
 * PitchConnect Login Page - v2.1 ENHANCED
 * Enterprise-Grade Authentication Interface with Email/Password Support
 * Copy and paste this entire file to: ./src/app/auth/login/page.tsx
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader, Trophy, Mail, Lock } from 'lucide-react';

// Toast Component
const Toast = ({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) => {
  const bgColor = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  }[type];

  const textColor = {
    success: 'text-emerald-800 dark:text-emerald-400',
    error: 'text-red-800 dark:text-red-400',
    info: 'text-blue-800 dark:text-blue-400',
  }[type];

  const borderColor = {
    success: 'border-emerald-200 dark:border-emerald-800',
    error: 'border-red-200 dark:border-red-800',
    info: 'border-blue-200 dark:border-blue-800',
  }[type];

  return (
    <div className={`flex gap-3 rounded-lg border ${borderColor} ${bgColor} p-4 ${textColor} animate-in fade-in slide-in-from-top-2 duration-300`}>
      {type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
      {type === 'success' && <div className="h-5 w-5 flex-shrink-0 rounded-full bg-current" />}
      {type === 'info' && <div className="h-5 w-5 flex-shrink-0 rounded-full bg-current" />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

// Validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const validateForm = (email: string, password: string) => {
  const errors: Record<string, string> = {};

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Check for error in URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = 'An error occurred during authentication';
      if (error === 'CredentialsSignin') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error === 'EmailNotVerified') {
        errorMessage = 'Please verify your email before logging in.';
      }
      showToast(errorMessage, 'error');
    }
  }, [searchParams, showToast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      const validationErrors = validateForm(email, password);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        showToast('Please fix the errors below', 'error');
        return;
      }

      setIsLoading(true);

      try {
        const result = await signIn('credentials', {
          email: email.toLowerCase().trim(),
          password,
          redirect: false,
        });

        if (result?.error) {
          // Map error codes to user-friendly messages
          let errorMessage = 'Invalid email or password. Please try again.';
          
          if (result.error === 'CredentialsSignin') {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (result.error === 'EmailNotVerified') {
            errorMessage = 'Please verify your email before logging in.';
          } else if (result.error === 'AccessDenied') {
            errorMessage = 'Your account has been suspended. Please contact support.';
          }
          
          setErrors({ form: errorMessage });
          showToast(errorMessage, 'error');
        } else if (result?.ok) {
          try {
            await fetch('/api/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'LOGIN_SUCCESS',
                email: email.toLowerCase(),
                timestamp: new Date().toISOString(),
              }),
            });
          } catch {
            // Silently fail analytics
          }

          showToast('Welcome back! Redirecting...', 'success');

          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', email.toLowerCase());
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push('/dashboard');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
        setErrors({ form: errorMessage });
        showToast(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, rememberMe, router, showToast]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      showToast('Google sign-in failed. Please try again.', 'error');
      setIsGoogleLoading(false);
    }
  }, [showToast]);

  // Restore remembered email
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    try {
      const rememberMePreference = localStorage.getItem('rememberMe');
      if (rememberMePreference) {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail && !email) {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      }
      setIsHydrated(true);
    } catch {
      setIsHydrated(true);
    }
  }, [email]);

  if (!isHydrated) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
      {/* LEFT SIDE - BRANDING (Desktop only) */}
      <div className="hidden flex-1 bg-gradient-to-br from-amber-400 via-amber-300 to-orange-400 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PitchConnect</h1>
              <p className="text-sm text-white/80">Sports Management Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="mb-2 text-3xl font-bold">Welcome Back</h2>
            <p className="text-lg text-white/90">
              The world's most powerful sports management platform for clubs, coaches, and players.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Complete Team Management',
                description: 'Organize players, teams, schedules, and rosters effortlessly',
              },
              {
                title: 'Real-time Analytics',
                description: 'Track performance, player statistics, and league standings',
              },
              {
                title: 'Video Analysis',
                description: 'Upload and analyze match footage with AI-powered insights',
              },
              {
                title: 'Secure & Enterprise-Grade',
                description: 'Bank-level security with GDPR compliance and data protection',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <span className="text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm text-white/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/60">© {new Date().getFullYear()} PitchConnect. All rights reserved.</p>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          {/* Logo (Mobile Only) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">PitchConnect</h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">Sports Management</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-charcoal-900 dark:text-white">Sign In</h2>
            <p className="text-charcoal-600 dark:text-charcoal-300">
              Access your PitchConnect account and manage your teams
            </p>
          </div>

          {/* Toast */}
          {toast && (
            <div className="mb-6">
              <Toast message={toast.message} type={toast.type} />
            </div>
          )}

          {/* Form Error */}
          {errors.form && (
            <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errors.form}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="coach@yourclub.com"
                  className={`w-full rounded-lg border bg-white px-4 py-3 pl-10 text-charcoal-900 placeholder-charcoal-400 transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-charcoal-800 dark:text-white dark:placeholder-charcoal-500 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
                      : 'border-neutral-200 focus:border-amber-500 focus:ring-amber-500/20 dark:border-charcoal-700'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border bg-white px-4 py-3 pl-10 pr-10 text-charcoal-900 placeholder-charcoal-400 transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-charcoal-800 dark:text-white dark:placeholder-charcoal-500 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
                      : 'border-neutral-200 focus:border-amber-500 focus:ring-amber-500/20 dark:border-charcoal-700'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-300 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="text-sm text-charcoal-700 dark:text-charcoal-300">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-500 hover:to-orange-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader className="h-5 w-5 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-neutral-200 dark:border-charcoal-700"></div>
            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">Or continue with</span>
            <div className="flex-1 border-t border-neutral-200 dark:border-charcoal-700"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={isGoogleLoading || isLoading}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 font-semibold text-charcoal-900 transition-all duration-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white dark:hover:bg-charcoal-700"
          >
            <span className="flex items-center justify-center gap-2">
              {isGoogleLoading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </>
              )}
            </span>
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Create account
            </Link>
          </p>

          {/* Legal */}
          <div className="mt-8 space-y-2 text-center text-xs text-charcoal-600 dark:text-charcoal-400">
            <p>By signing in, you agree to our</p>
            <div className="flex items-center justify-center gap-2">
              <Link href="/legal/terms" className="text-amber-600 hover:text-amber-700 dark:text-amber-400">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/legal/privacy" className="text-amber-600 hover:text-amber-700 dark:text-amber-400">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}