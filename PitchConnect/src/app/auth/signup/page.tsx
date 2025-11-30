'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Mail,
  Lock,
  User,
  MapPin,
  Loader2,
  Trophy,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
} from 'lucide-react';

type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PLAYER');
  const [leagueCode, setLeagueCode] = useState('');

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least 1 uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least 1 number';
    return null;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }

    setStep(2);
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);

    if (selectedRole === 'LEAGUE_ADMIN' && !leagueCode) {
      setError('League code is required for League Organizers');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          country,
          city,
          requestedRole: selectedRole,
          leagueCode: selectedRole !== 'PLAYER' ? leagueCode : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setStep(3);
    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-500/20 to-orange-400/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-2xl relative z-10 bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500" />

        <CardHeader className="text-center pt-10 pb-6 px-6">
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-4xl font-bold text-charcoal-900 mb-3">
            {step === 1 && 'Join PitchConnect'}
            {step === 2 && 'Choose Your Role'}
            {step === 3 && 'Verify Your Email'}
          </CardTitle>
          <CardDescription className="text-base text-charcoal-600">
            {step === 1 && 'Start your team management journey today'}
            {step === 2 && "Tell us how you'll use PitchConnect"}
            {step === 3 && 'Check your inbox to activate your account'}
          </CardDescription>

          <div className="flex items-center gap-2 mt-6 justify-center">
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-gold-500 to-orange-400' : 'bg-neutral-200'}`} style={{ maxWidth: '100px' }} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-gold-500 to-purple-500' : 'bg-neutral-200'}`} style={{ maxWidth: '100px' }} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-gradient-to-r from-purple-500 to-orange-400' : 'bg-neutral-200'}`} style={{ maxWidth: '100px' }} />
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-8 px-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="firstName" className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm">
                    <User className="w-4 h-4 text-gold-500" />
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="lastName" className="text-charcoal-900 font-semibold text-sm">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email" className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm">
                  <Mail className="w-4 h-4 text-gold-500" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.smith@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm">
                  <Lock className="w-4 h-4 text-gold-500" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-charcoal-500">
                  8+ characters, 1 uppercase, 1 number required
                </p>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-charcoal-900 font-semibold text-sm">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="country" className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="United Kingdom"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="city" className="text-charcoal-900 font-semibold text-sm">
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="London"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-3 h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-8"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedRole('PLAYER')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                    selectedRole === 'PLAYER'
                      ? 'border-gold-500 bg-gold-50 shadow-md'
                      : 'border-neutral-200 hover:border-gold-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-charcoal-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">⚽</span>
                        I&apos;m a Player
                      </h3>
                      <p className="text-sm text-charcoal-600">
                        Track stats, join teams, and grow as an athlete
                      </p>
                    </div>
                    {selectedRole === 'PLAYER' && (
                      <CheckCircle2 className="w-6 h-6 text-gold-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRole('COACH')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                    selectedRole === 'COACH'
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-neutral-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-charcoal-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        I&apos;m a Coach
                      </h3>
                      <p className="text-sm text-charcoal-600">
                        Manage teams, develop players, analyze performance
                      </p>
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        ⭐ Requires admin verification
                      </p>
                    </div>
                    {selectedRole === 'COACH' && (
                      <CheckCircle2 className="w-6 h-6 text-orange-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRole('MANAGER')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                    selectedRole === 'MANAGER'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-neutral-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-charcoal-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        I&apos;m a Club Manager
                      </h3>
                      <p className="text-sm text-charcoal-600">
                        Oversee clubs, manage teams, handle operations
                      </p>
                      <p className="text-xs text-purple-600 mt-2 font-medium">
                        ⭐ Requires admin verification
                      </p>
                    </div>
                    {selectedRole === 'MANAGER' && (
                      <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRole('LEAGUE_ADMIN')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                    selectedRole === 'LEAGUE_ADMIN'
                      ? 'border-gold-500 bg-gold-50 shadow-md'
                      : 'border-neutral-200 hover:border-gold-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-charcoal-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        I&apos;m a League Organizer
                      </h3>
                      <p className="text-sm text-charcoal-600">
                        Organize competitions, manage leagues at scale
                      </p>
                      <p className="text-xs text-gold-600 mt-2 font-medium">
                        ⭐ Requires admin verification + league code
                      </p>
                    </div>
                    {selectedRole === 'LEAGUE_ADMIN' && (
                      <CheckCircle2 className="w-6 h-6 text-gold-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {selectedRole !== 'PLAYER' && (
                <div className="space-y-2.5 p-4 bg-neutral-50 rounded-xl">
                  <Label htmlFor="leagueCode" className="text-charcoal-900 font-semibold text-sm">
                    League Code {selectedRole === 'LEAGUE_ADMIN' && '*'}
                  </Label>
                  <Input
                    id="leagueCode"
                    type="text"
                    placeholder="Enter your league code"
                    value={leagueCode}
                    onChange={(e) => setLeagueCode(e.target.value)}
                    required={selectedRole === 'LEAGUE_ADMIN'}
                    className="bg-white border border-neutral-200 focus:border-gold-500 h-11 rounded-lg"
                  />
                  <p className="text-xs text-charcoal-500">
                    {selectedRole === 'LEAGUE_ADMIN'
                      ? 'Your league code is required for verification'
                      : 'Optional: Link your team to an existing league'}
                  </p>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {selectedRole === 'PLAYER'
                    ? '✓ Instant access to all features'
                    : '⏳ Your request will be reviewed by our team. You\'ll have player access while waiting.'}
                </p>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-2 border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 h-11 rounded-lg"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold h-11 rounded-lg shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Account Created!</h3>
                <p className="text-charcoal-600 mb-2">
                  We&apos;ve sent a verification email to
                </p>
                <p className="font-bold text-gold-600 mb-4 break-all">{email}</p>
                <p className="text-sm text-charcoal-500 leading-relaxed">
                  Click the verification link in your inbox to activate your account and get started.
                </p>
              </div>

              {selectedRole !== 'PLAYER' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    <strong>✓ Your {selectedRole.replace(/_/g, ' ')} request is pending.</strong>
                    <br />
                    You can use PitchConnect as a Player while our team reviews your request.
                  </p>
                </div>
              )}

              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-3 h-12 rounded-lg shadow-lg hover:shadow-xl"
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step !== 3 && (
            <div className="text-center text-sm text-charcoal-600 pt-6 mt-6 border-t border-neutral-100">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold text-gold-500 hover:text-orange-400 transition">
                Sign In
              </Link>
            </div>
          )}
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
