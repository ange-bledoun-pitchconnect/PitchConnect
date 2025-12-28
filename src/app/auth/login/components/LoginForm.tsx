/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Login Form v7.0 (FULL VISIBILITY FIX)
 * Path: src/app/auth/login/components/LoginForm.tsx
 * ============================================================================
 * 
 * FIXES APPLIED:
 * - Google button shows full text "Continue with Google"
 * - "Sign In" heading is visible
 * - All text has proper contrast using inline styles
 * - Form inputs have proper styling
 * 
 * ============================================================================
 */

'use client';

import { useState, useTransition } from 'react';
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
  Shield,
  Zap,
} from 'lucide-react';

// ============================================================================
// GOOGLE ICON COMPONENT
// ============================================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ============================================================================
// MAIN LOGIN FORM COMPONENT
// ============================================================================

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear errors on change
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setErrors({ form: 'Invalid email or password. Please try again.' });
          toast.error('Login failed', {
            description: 'Please check your credentials and try again.',
          });
        } else {
          toast.success('Welcome back!', {
            description: 'Redirecting to your dashboard...',
          });
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (error) {
        setErrors({ form: 'An unexpected error occurred. Please try again.' });
        toast.error('Something went wrong', {
          description: 'Please try again later.',
        });
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      toast.error('Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const isLoading = isPending || isGoogleLoading;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div
        className="rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: '#fff7ed' }}
          >
            <Sparkles style={{ color: '#ea580c' }} className="h-4 w-4" />
            <span style={{ color: '#ea580c' }} className="text-sm font-semibold">
              Welcome Back
            </span>
          </div>

          {/* Main Heading - FIXED VISIBILITY */}
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#111827' }}
          >
            Sign In
          </h1>

          {/* Subtitle */}
          <p style={{ color: '#6b7280' }} className="text-base">
            Access your teams, analytics, and more
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-8">
          {/* Google Button - FIXED TO SHOW FULL TEXT */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #e5e7eb',
              color: '#374151',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#6b7280' }} />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '2px solid #e5e7eb' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-sm font-medium uppercase tracking-wider"
                style={{ backgroundColor: '#ffffff', color: '#9ca3af' }}
              >
                Or continue with email
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errors.form && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-6"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>
                {errors.form}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#374151' }}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 outline-none"
                  style={{
                    backgroundColor: '#f9fafb',
                    border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    color: '#111827',
                  }}
                  onFocus={(e) => {
                    if (!errors.email) e.currentTarget.style.borderColor = '#f97316';
                  }}
                  onBlur={(e) => {
                    if (!errors.email) e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#374151' }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 outline-none"
                  style={{
                    backgroundColor: '#f9fafb',
                    border: errors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    color: '#111827',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) e.currentTarget.style.borderColor = '#f97316';
                  }}
                  onBlur={(e) => {
                    if (!errors.password) e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: '#9ca3af' }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: '#9ca3af' }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-orange-500"
                />
                <span className="text-sm" style={{ color: '#6b7280' }}>
                  Remember me
                </span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold transition-colors"
                style={{ color: '#ea580c' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c2410c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ea580c')}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0 4px 15px -3px rgba(249, 115, 22, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px -3px rgba(249, 115, 22, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(249, 115, 22, 0.4)';
              }}
            >
              {isPending ? (
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

          {/* Sign Up Link */}
          <p className="mt-6 text-center" style={{ color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-bold transition-colors"
              style={{ color: '#ea580c' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#c2410c')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#ea580c')}
            >
              Create one for free
            </Link>
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
          <Shield className="h-4 w-4" style={{ color: '#22c55e' }} />
          <span className="text-sm">Bank-level Security</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
          <Lock className="h-4 w-4" style={{ color: '#6b7280' }} />
          <span className="text-sm">GDPR Compliant</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
          <Zap className="h-4 w-4" style={{ color: '#eab308' }} />
          <span className="text-sm">99.9% Uptime</span>
        </div>
      </div>

      {/* Social Proof */}
      <p className="mt-4 text-center text-sm" style={{ color: '#9ca3af' }}>
        Trusted by <span className="font-bold" style={{ color: '#374151' }}>5,000+</span> teams worldwide
      </p>
    </div>
  );
}