/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Login Form v5.0 (FULLY FIXED)
 * Path: src/app/auth/login/components/LoginForm.tsx
 * ============================================================================
 * 
 * FIXES:
 * - "Sign in to your account" heading NOW VISIBLE
 * - Google button is a FULL bordered button with text
 * - Divider "or continue with email" has proper contrast
 * - All text readable in light mode
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password. Please try again.',
  EmailNotVerified: 'Please verify your email before signing in.',
  AccessDenied: 'Your account has been suspended. Contact support.',
  OAuthAccountNotLinked: 'This email is linked to another sign-in method.',
  Default: 'Something went wrong. Please try again.',
};

// ============================================================================
// LOGIN FORM
// ============================================================================

export function LoginForm({ callbackUrl = '/dashboard' }: { callbackUrl?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(ERROR_MESSAGES[error] || ERROR_MESSAGES.Default);
      window.history.replaceState({}, '', '/auth/login');
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pitchconnect_auth');
      if (saved) {
        const { email: savedEmail } = JSON.parse(saved);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        const message = ERROR_MESSAGES[result.error] || ERROR_MESSAGES.Default;
        setErrors({ form: message });
        toast.error(message);
        return;
      }

      if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem('pitchconnect_auth', JSON.stringify({ email: email.toLowerCase().trim() }));
        } else {
          localStorage.removeItem('pitchconnect_auth');
        }
        toast.success('Welcome back!');
        startTransition(() => {
          router.push(callbackUrl);
          router.refresh();
        });
      }
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, rememberMe, callbackUrl, router]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      toast.error('Failed to connect to Google');
      setIsGoogleLoading(false);
    }
  }, [callbackUrl]);

  if (!isHydrated) return <Skeleton />;

  const isLoading = isSubmitting || isGoogleLoading || isPending;

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER - NOW FULLY VISIBLE
          ============================================================ */}
      <div className="text-center space-y-3">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-600">
          <Sparkles className="h-4 w-4" />
          <span>Welcome Back</span>
        </div>
        
        {/* Main Heading - FIXED: Now visible with proper color */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h1>
        
        {/* Subtitle */}
        <p className="text-base text-gray-600 dark:text-gray-400">
          Access your teams, analytics, and more
        </p>
      </div>

      {/* ============================================================
          ERROR ALERT
          ============================================================ */}
      {errors.form && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{errors.form}</p>
        </div>
      )}

      {/* ============================================================
          GOOGLE BUTTON - FIXED: Full bordered button with text
          ============================================================ */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="
          flex w-full items-center justify-center gap-3 
          rounded-xl border-2 border-gray-300 
          bg-white hover:bg-gray-50
          px-4 py-3.5 
          font-semibold text-gray-700 
          shadow-sm
          transition-all duration-200
          hover:border-gray-400 hover:shadow
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>

      {/* ============================================================
          DIVIDER - FIXED: Better contrast, visible text
          ============================================================ */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
            or continue with email
          </span>
        </div>
      </div>

      {/* ============================================================
          FORM
          ============================================================ */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
              placeholder="you@yourclub.com"
              disabled={isLoading}
              autoComplete="email"
              className={`
                w-full rounded-xl border-2 bg-white 
                px-4 py-3.5 pl-12 
                text-gray-900 
                placeholder:text-gray-400
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-orange-500/20
                disabled:opacity-50 disabled:bg-gray-50
                ${errors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-orange-500 hover:border-gray-400'
                }
              `}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <Link 
              href="/auth/forgot-password" 
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
              className={`
                w-full rounded-xl border-2 bg-white 
                px-4 py-3.5 pl-12 pr-12
                text-gray-900 
                placeholder:text-gray-400
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-orange-500/20
                disabled:opacity-50 disabled:bg-gray-50
                ${errors.password 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-orange-500 hover:border-gray-400'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
          />
          <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
            Remember me
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full rounded-xl 
            bg-gradient-to-r from-orange-500 to-orange-600 
            px-4 py-4 
            font-semibold text-white 
            shadow-lg shadow-orange-500/30
            transition-all duration-200
            hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/40
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      {/* ============================================================
          SIGN UP LINK
          ============================================================ */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
          Create one for free
        </Link>
      </p>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-8 w-36 bg-gray-200 rounded-full mx-auto" />
        <div className="h-9 w-64 bg-gray-200 rounded mx-auto" />
        <div className="h-5 w-52 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="h-14 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="space-y-4">
        <div className="h-14 bg-gray-200 rounded-xl" />
        <div className="h-14 bg-gray-200 rounded-xl" />
        <div className="h-14 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-5 w-48 bg-gray-200 rounded mx-auto" />
    </div>
  );
}

export default LoginForm;