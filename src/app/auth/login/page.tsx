/**
 * Login Page
 * Email/Password and OAuth authentication
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
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
        setError('Invalid email or password');
        toast.error('Invalid email or password');
      } else if (result?.ok) {
        toast.success('Logged in successfully!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch (err) {
      toast.error(`${provider} login failed`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12" 
      suppressHydrationWarning
    >
      <div className="w-full max-w-md space-y-8" suppressHydrationWarning>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-hero">⚽ PitchConnect</h1>
          <p className="text-foreground/70">Sign in to your account</p>
        </div>

        {/* Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2" suppressHydrationWarning>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2" suppressHydrationWarning>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-brand-gold hover:text-brand-gold/80"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleOAuthLogin('google')}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </div>

            {/* Signup Link */}
            <p className="text-center text-sm text-foreground/70">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-brand-gold hover:text-brand-gold/80 font-medium">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-foreground/50">
          <p>By signing in, you agree to our</p>
          <div className="flex gap-4 justify-center">
            <Link href="/terms" className="hover:text-foreground/70">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-foreground/70">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
