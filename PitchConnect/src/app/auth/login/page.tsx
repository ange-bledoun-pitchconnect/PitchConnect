// src/app/auth/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, Lock, Loader2, Trophy, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  const fillDemoCredentials = () => {
    setEmail('ange@getpitchconnect.com');
    setPassword('your-actual-password'); // Update with actual demo password
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-purple-50/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-orange-500 bg-clip-text text-transparent">
            PitchConnect
          </span>
        </Link>

        <Card className="bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500" />

          <CardHeader className="text-center pt-10 pb-6 px-8">
            <CardTitle className="text-4xl font-bold text-charcoal-900 mb-3">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-charcoal-600 leading-relaxed">
              Sign in to your PitchConnect account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 pb-8 px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2.5" suppressHydrationWarning>
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
                >
                  <Mail className="w-4 h-4 text-gold-500" />
                  Email Address
                </Label>
                <div suppressHydrationWarning>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    className="bg-neutral-50 border border-neutral-300 text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all h-12 rounded-lg"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2.5" suppressHydrationWarning>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
                  >
                    <Lock className="w-4 h-4 text-gold-500" />
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-xs font-medium text-gold-500 hover:text-gold-600 transition-colors flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show
                      </>
                    )}
                  </button>
                </div>
                <div suppressHydrationWarning>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    className="bg-neutral-50 border border-neutral-300 text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all h-12 rounded-lg"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-gold-500 focus:ring-gold-500"
                  />
                  <span className="text-sm text-charcoal-600 font-medium">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-gold-600 hover:text-gold-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-6 h-14 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Demo Credentials Button */}
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full text-center text-sm font-medium text-charcoal-600 hover:text-purple-600 transition-colors py-3 hover:bg-purple-50 rounded-lg"
              >
                Fill demo credentials (SuperAdmin)
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-charcoal-600">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link href="/auth/signup">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-neutral-300 text-charcoal-700 hover:bg-neutral-50 font-bold py-6 h-14 rounded-xl transition-all"
              >
                Create Account
              </Button>
            </Link>

            {/* Trust Indicators */}
            <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-neutral-100">
              <div className="text-center">
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-xs font-semibold text-charcoal-600">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-xs font-semibold text-charcoal-600">Fast</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-xs font-semibold text-charcoal-600">Trusted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-charcoal-600 hover:text-gold-600 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 text-center py-6 text-charcoal-500 text-xs">
        <p>
          © 2024 PitchConnect. All rights reserved. |{' '}
          <Link href="/privacy" className="hover:text-gold-600 transition">
            Privacy
          </Link>{' '}
          |{' '}
          <Link href="/terms" className="hover:text-gold-600 transition">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
