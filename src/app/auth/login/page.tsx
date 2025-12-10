'use client';

/**
 * Login Page - PitchConnect
 * - Secure authentication
 * - Remember me functionality
 * - Password reset link
 * - Sign up navigation
 * - Mobile responsive
 * - Dark mode support
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Attempt sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError(result.error || 'Invalid email or password');
        toast.error('Login failed. Please check your credentials.');
      } else if (result?.ok) {
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      toast.error('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800">
      {/* LEFT SIDE - BRANDING (Hidden on mobile) */}
      <div className="hidden flex-1 bg-gradient-to-br from-gold-500 via-gold-400 to-orange-400 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg">
              <Trophy className="h-7 w-7 text-gold-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PitchConnect</h1>
              <p className="text-sm text-white/80">Sports Management</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="mb-2 text-3xl font-bold">Welcome Back</h2>
            <p className="text-lg text-white/90">
              Manage your sports club with the world's most powerful platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold">Complete team management</p>
                <p className="text-sm text-white/80">Organize players, teams, and schedules</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold">Real-time analytics</p>
                <p className="text-sm text-white/80">Track performance and player stats</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold">Secure & reliable</p>
                <p className="text-sm text-white/80">Enterprise-grade security for your data</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} PitchConnect. All rights reserved.
        </p>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          {/* Logo (Mobile only) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">
                PitchConnect
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Sports Management
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-charcoal-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-charcoal-600 dark:text-charcoal-300">
              Access your PitchConnect account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white dark:placeholder-charcoal-500"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-gold-600 transition-colors hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white dark:placeholder-charcoal-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-charcoal-300"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="text-sm text-charcoal-700 dark:text-charcoal-300">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-gold-500 to-orange-400 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-gold-600 hover:to-orange-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 font-semibold text-charcoal-900 transition-all duration-200 hover:bg-neutral-50 disabled:opacity-50 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white dark:hover:bg-charcoal-700"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            </span>
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-charcoal-600 dark:text-charcoal-400">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-gold-600 transition-colors hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
