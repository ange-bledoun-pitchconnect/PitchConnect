'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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
  Globe,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Zod, z } from 'zod';

// ============================================================================
// 🎯 TYPE DEFINITIONS - ALIGNED WITH PRISMA SCHEMA
// ============================================================================

type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN';

interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  selectedRole: UserRole;
  leagueCode: string;
}

interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// 📋 VALIDATION SCHEMAS - ZOD FOR TYPE SAFETY
// ============================================================================

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter');

const step1Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  selectedRole: z.enum(['PLAYER', 'COACH', 'MANAGER', 'LEAGUE_ADMIN']),
  leagueCode: z.string().optional(),
}).refine((data) => {
  if (data.selectedRole === 'LEAGUE_ADMIN' && !data.leagueCode) {
    return false;
  }
  return true;
}, {
  message: 'League code is required for League Organizers',
  path: ['leagueCode'],
});

// ============================================================================
// 🎨 COMPONENT - PRODUCTION READY
// ============================================================================

export default function SignupPage() {
  const router = useRouter();

  // ──────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    country: 'United Kingdom',
    city: '',
    selectedRole: 'PLAYER',
    leagueCode: '',
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const handleStep1Submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearErrors();

      // Validate with Zod
      const validation = step1Schema.safeParse({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.password, // Will be compared in form state
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
        city: formData.city,
      });

      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFieldErrors(errors);
        setError('Please check all required fields');
        return;
      }

      // Additional validation for password match
      if (formData.password !== formData.password) {
        setError('Passwords do not match');
        return;
      }

      setStep(2);
      clearErrors();
    },
    [formData, clearErrors]
  );

  const handleSignup = useCallback(async () => {
    setIsLoading(true);
    clearErrors();

    try {
      // Validate step 2
      const validation = step2Schema.safeParse({
        selectedRole: formData.selectedRole,
        leagueCode: formData.leagueCode,
      });

      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFieldErrors(errors);
        setError('Please check all required fields');
        setIsLoading(false);
        return;
      }

      // API call to signup endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          country: formData.country.trim(),
          city: formData.city.trim(),
          requestedRole: formData.selectedRole,
          leagueCode: formData.selectedRole === 'LEAGUE_ADMIN' ? formData.leagueCode.trim() : null,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
          data.message ||
          'Signup failed. Please try again.'
        );
        setIsLoading(false);
        toast.error(data.error || 'Signup failed');
        return;
      }

      // Success - show step 3
      toast.success('Account created! Check your email to verify.');
      setStep(3);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Signup error:', errorMessage);
      setError('An error occurred. Please try again.');
      toast.error('Signup error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, clearErrors]);

  // ──────────────────────────────────────────────────────────────────────
  // INPUT HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (field: keyof SignupFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear field-specific error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    },
    [fieldErrors]
  );

  const handleRoleChange = useCallback((role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      selectedRole: role,
    }));
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER - STEP 1: PERSONAL INFORMATION
  // ──────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-4">
      {/* First & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label
            htmlFor="firstName"
            className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
          >
            <User className="w-4 h-4 text-gold-500" />
            First Name *
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            className={`bg-neutral-50 border ${fieldErrors.firstName ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg transition`}
            disabled={isLoading}
          />
          {fieldErrors.firstName && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="lastName"
            className="text-charcoal-900 font-semibold text-sm"
          >
            Last Name *
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Smith"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            className={`bg-neutral-50 border ${fieldErrors.lastName ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg transition`}
            disabled={isLoading}
          />
          {fieldErrors.lastName && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2.5">
        <Label
          htmlFor="email"
          className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
        >
          <Mail className="w-4 h-4 text-gold-500" />
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john.smith@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          autoComplete="email"
          className={`bg-neutral-50 border ${fieldErrors.email ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg transition`}
          disabled={isLoading}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-600 font-medium">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <Label
          htmlFor="password"
          className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
        >
          <Lock className="w-4 h-4 text-gold-500" />
          Password *
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            autoComplete="new-password"
            className={`bg-neutral-50 border ${fieldErrors.password ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg pr-10 transition`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-charcoal-500">
          8+ characters, 1 uppercase, 1 number, 1 lowercase required
        </p>
        {fieldErrors.password && (
          <p className="text-xs text-red-600 font-medium">{fieldErrors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2.5">
        <Label
          htmlFor="confirmPassword"
          className="text-charcoal-900 font-semibold text-sm"
        >
          Confirm Password *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            autoComplete="new-password"
            className={`bg-neutral-50 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg pr-10 transition`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700 transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-600 font-medium">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Country & City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label
            htmlFor="country"
            className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
          >
            <Globe className="w-4 h-4 text-gold-500" />
            Country *
          </Label>
          <Input
            id="country"
            type="text"
            placeholder="United Kingdom"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            required
            className={`bg-neutral-50 border ${fieldErrors.country ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg transition`}
            disabled={isLoading}
          />
          {fieldErrors.country && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.country}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="city"
            className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
          >
            <MapPin className="w-4 h-4 text-gold-500" />
            City *
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="London"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            required
            className={`bg-neutral-50 border ${fieldErrors.city ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 h-11 rounded-lg transition`}
            disabled={isLoading}
          />
          {fieldErrors.city && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.city}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 disabled:from-gold-400 disabled:to-orange-300 disabled:cursor-not-allowed text-white font-bold py-3 h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-8"
      >
        Continue
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );

  // ──────────────────────────────────────────────────────────────────────
  // RENDER - STEP 2: ROLE SELECTION
  // ──────────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Role Selection Cards */}
      <div className="space-y-3">
        {/* Player Card */}
        <div
          onClick={() => handleRoleChange('PLAYER')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
            formData.selectedRole === 'PLAYER'
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
            {formData.selectedRole === 'PLAYER' && (
              <CheckCircle2 className="w-6 h-6 text-gold-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Coach Card */}
        <div
          onClick={() => handleRoleChange('COACH')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
            formData.selectedRole === 'COACH'
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
            {formData.selectedRole === 'COACH' && (
              <CheckCircle2 className="w-6 h-6 text-orange-400 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Manager Card */}
        <div
          onClick={() => handleRoleChange('MANAGER')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
            formData.selectedRole === 'MANAGER'
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
            {formData.selectedRole === 'MANAGER' && (
              <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* League Admin Card */}
        <div
          onClick={() => handleRoleChange('LEAGUE_ADMIN')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
            formData.selectedRole === 'LEAGUE_ADMIN'
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
            {formData.selectedRole === 'LEAGUE_ADMIN' && (
              <CheckCircle2 className="w-6 h-6 text-gold-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* League Code Input (for non-player roles) */}
      {formData.selectedRole !== 'PLAYER' && (
        <div className="space-y-2.5 p-4 bg-neutral-50 rounded-xl">
          <Label
            htmlFor="leagueCode"
            className="flex items-center gap-2 text-charcoal-900 font-semibold text-sm"
          >
            <Building2 className="w-4 h-4 text-gold-500" />
            League Code {formData.selectedRole === 'LEAGUE_ADMIN' && '*'}
          </Label>
          <Input
            id="leagueCode"
            type="text"
            placeholder="Enter your league code (e.g., LC-2025-001)"
            value={formData.leagueCode}
            onChange={(e) => handleInputChange('leagueCode', e.target.value)}
            required={formData.selectedRole === 'LEAGUE_ADMIN'}
            className={`bg-white border ${fieldErrors.leagueCode ? 'border-red-500' : 'border-neutral-200'} focus:border-gold-500 h-11 rounded-lg transition`}
            disabled={isLoading}
          />
          <p className="text-xs text-charcoal-500">
            {formData.selectedRole === 'LEAGUE_ADMIN'
              ? 'Your league code is required for verification'
              : 'Optional: Link your team to an existing league'}
          </p>
          {fieldErrors.leagueCode && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.leagueCode}</p>
          )}
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {formData.selectedRole === 'PLAYER'
              ? '✓ Instant access to all player features'
              : '⏳ Your request will be reviewed by our team. You\'ll have player access while waiting.'}
          </span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <Button
          type="button"
          onClick={() => setStep(1)}
          variant="outline"
          disabled={isLoading}
          className="flex-1 border-2 border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-50 h-11 rounded-lg"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSignup}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 disabled:from-gold-400 disabled:to-orange-300 disabled:cursor-not-allowed text-white font-bold h-11 rounded-lg shadow-lg hover:shadow-xl transition-all"
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
  );

  // ──────────────────────────────────────────────────────────────────────
  // RENDER - STEP 3: EMAIL VERIFICATION
  // ──────────────────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Account Created!</h3>
        <p className="text-charcoal-600 mb-2">We've sent a verification email to</p>
        <p className="font-bold text-gold-600 mb-4 break-all text-lg">{formData.email}</p>
        <p className="text-sm text-charcoal-500 leading-relaxed">
          Click the verification link in your inbox to activate your account and get started with
          PitchConnect.
        </p>
      </div>

      {/* Upgrade Pending (non-player roles) */}
      {formData.selectedRole !== 'PLAYER' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>✓ Your {formData.selectedRole.replace(/_/g, ' ')} request is pending.</strong>
            <br />
            You can use PitchConnect as a Player while our team reviews your verification request.
            This usually takes 1-2 business days.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => router.push('/auth/login')}
          className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold py-3 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Go to Sign In
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-charcoal-500">
          Didn't receive the email?{' '}
          <button
            type="button"
            className="font-bold text-gold-500 hover:text-orange-400 transition"
          >
            Resend verification
          </button>
        </p>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gold-500/20 to-orange-400/10 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl relative z-10 bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500" />

        {/* Header */}
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

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mt-6 justify-center">
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                step >= 1 ? 'bg-gradient-to-r from-gold-500 to-orange-400' : 'bg-neutral-200'
              }`}
              style={{ maxWidth: '100px' }}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                step >= 2 ? 'bg-gradient-to-r from-gold-500 to-purple-500' : 'bg-neutral-200'
              }`}
              style={{ maxWidth: '100px' }}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                step >= 3 ? 'bg-gradient-to-r from-purple-500 to-orange-400' : 'bg-neutral-200'
              }`}
              style={{ maxWidth: '100px' }}
            />
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="pt-0 pb-8 px-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Sign In Link (Step 1 & 2 only) */}
          {step !== 3 && (
            <div className="text-center text-sm text-charcoal-600 pt-6 mt-6 border-t border-neutral-100">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-gold-500 hover:text-orange-400 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
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
