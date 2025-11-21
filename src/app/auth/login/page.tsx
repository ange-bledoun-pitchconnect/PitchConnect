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
        // Small delay to ensure session is established
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
    setPassword('your-actual-password'); // Update this
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-500/20 to-orange-400/10 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white border-0 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="h-1.5 bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500" />

        <CardHeader className="text-center pt-10 pb-6 px-6">
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all transform hover:scale-110">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-4xl font-bold text-charcoal-900 mb-3">Welcome Back</CardTitle>
          <CardDescription className="text-base text-charcoal-600 leading-relaxed">
            Sign in to your PitchConnect account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-8 px-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            {/* Email Field */}
            <div className="space-y-2.5" suppressHydrationWarning>
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
              >
                <Mail className="w-4 h-4 text-gold-500" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                className="bg-neutral-50 border border-neutral-200 text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all h-11 rounded-lg"
                suppressHydrationWarning
              />
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
                  className="text-xs font-medium text-gold-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Show
                    </>
                  )}
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="bg-neutral-50 border border-neutral-200 text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all h-11 rounded-lg"
                suppressHydrationWarning
              />
            </div>

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-charcoal-600 hover:text-gold-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-3 h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mt-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="pt-2">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full text-center text-xs font-medium text-charcoal-600 hover:text-purple-500 transition-colors py-2 hover:bg-purple-50 rounded-lg"
              >
                Fill demo credentials (SuperAdmin)
              </button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-charcoal-600">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <Link href="/auth/signup">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold py-2.5 h-11 rounded-lg transition-all"
              >
                Create Account
              </Button>
            </Link>
          </form>

          <div className="flex flex-wrap gap-4 justify-center text-center mt-8 pt-6 border-t border-neutral-100">
            <div className="text-xs text-charcoal-600">
              <div className="text-lg mb-1">🔒</div>
              <div className="font-semibold">Secure</div>
            </div>
            <div className="text-xs text-charcoal-600">
              <div className="text-lg mb-1">⚡</div>
              <div className="font-semibold">Fast</div>
            </div>
            <div className="text-xs text-charcoal-600">
              <div className="text-lg mb-1">🌍</div>
              <div className="font-semibold">Global</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-0 left-0 right-0 text-center py-6 text-charcoal-400 text-xs border-t border-charcoal-700/50 bg-gradient-to-t from-charcoal-900 to-transparent">
        <p>
          © 2025 PitchConnect. All rights reserved. |{' '}
          <a href="#" className="hover:text-gold-400 transition">
            Privacy
          </a>{' '}
          |{' '}
          <a href="#" className="hover:text-gold-400 transition">
            Terms
          </a>
        </p>
      </div>
    </div>
  );
}
