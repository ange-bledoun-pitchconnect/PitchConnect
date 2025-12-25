'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';

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

/**
 * Type Definitions
 * Fully aligned with Prisma User schema
 */
type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'LEAGUE_ADMIN';
type SignupStep = 1 | 2 | 3;

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  selectedRole: UserRole;
  leagueCode: string;
}

interface SignupApiRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  requestedRole: UserRole;
  leagueCode: string | null;
}

interface SignupApiResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
  };
  error?: string;
}

/**
 * Zod Validation Schemas
 * Centralized, reusable validation logic
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number');

const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();

const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long');

const locationSchema = z.string().min(2, 'This field is required').max(50, 'Input is too long').optional();

const step1Schema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: nameSchema,
    lastName: nameSchema,
    country: z.string().min(2, 'Country is required').max(100, 'Country is too long'),
    city: locationSchema.default(''),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const step2Schema = z.object({
  selectedRole: z.enum(['PLAYER', 'COACH', 'MANAGER', 'LEAGUE_ADMIN']),
  leagueCode: z.string().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

/**
 * SignupPage Component
 * Production-ready signup flow with 3-step wizard
 */
export default function SignupPage(): JSX.Element {
  const router = useRouter();

  /**
   * Form State
   */
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: 'United Kingdom',
    city: '',
    selectedRole: 'PLAYER',
    leagueCode: '',
  });

  /**
   * UI State
   */
  const [step, setStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  /**
   * Clear specific field error on input change
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  /**
   * Handle form input changes
   */
  const handleInputChange = useCallback(
    (field: keyof SignupFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Validate and proceed to Step 2
   */
  const handleStep1Submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearErrors();

      try {
        const validatedData = step1Schema.parse({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          country: formData.country.trim(),
          city: formData.city.trim(),
        });

        // Update form data with validated values
        setFormData((prev) => ({
          ...prev,
          ...validatedData,
        }));

        setStep(2);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const newFieldErrors: Record<string, string> = {};
          err.errors.forEach((error) => {
            if (error.path.length > 0) {
              newFieldErrors[error.path[0] as string] = error.message;
            }
          });
          setFieldErrors(newFieldErrors);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    },
    [formData, clearErrors]
  );

  /**
   * Handle Step 2 - Role selection and submission
   */
  const handleSignup = useCallback(async () => {
    clearErrors();
    setIsLoading(true);

    try {
      // Validate step 2
      const step2Data = step2Schema.parse({
        selectedRole: formData.selectedRole,
        leagueCode: formData.leagueCode,
      });

      // Check league code requirement
      if (formData.selectedRole === 'LEAGUE_ADMIN' && !formData.leagueCode.trim()) {
        setError('League code is required for League Organizers');
        setIsLoading(false);
        return;
      }

      // Prepare API request
      const signupRequest: SignupApiRequest = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        requestedRole: step2Data.selectedRole,
        leagueCode: step2Data.selectedRole === 'LEAGUE_ADMIN' ? formData.leagueCode.trim() : null,
      };

      // Make API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupRequest),
      });

      const data: SignupApiResponse = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Signup failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success
      toast.success('Account created! Check your email to verify.');
      setStep(3);
    } catch (err) {
      let errorMessage = 'An error occurred. Please try again.';

      if (err instanceof z.ZodError) {
        errorMessage = err.errors[0]?.message || errorMessage;
      } else if (err instanceof Error) {
        console.error('Signup error:', err.message);
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, clearErrors]);

  /**
   * Handle back navigation from Step 2
   */
  const handleBackToStep1 = useCallback(() => {
    clearErrors();
    setStep(1);
  }, [clearErrors]);

  /**
   * Render Step 1 - Personal Information
   */
  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="firstName" className="flex items-center gap-2 text-charcoal-900 text-sm font-semibold">
            <User className="h-4 w-4 text-gold-500" />
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={isLoading}
            required
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!fieldErrors.firstName}
            aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
          />
          {fieldErrors.firstName && (
            <p id="firstName-error" className="text-xs font-medium text-red-600">
              {fieldErrors.firstName}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="lastName" className="text-sm font-semibold text-charcoal-900">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Smith"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={isLoading}
            required
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!fieldErrors.lastName}
            aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
          />
          {fieldErrors.lastName && (
            <p id="lastName-error" className="text-xs font-medium text-red-600">
              {fieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2.5">
        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-charcoal-900">
          <Mail className="h-4 w-4 text-gold-500" />
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john.smith@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
          className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-xs font-medium text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2.5">
        <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-charcoal-900">
          <Lock className="h-4 w-4 text-gold-500" />
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={isLoading}
            required
            autoComplete="new-password"
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 pr-10 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 transition hover:text-charcoal-700 disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-charcoal-500">8+ characters, 1 uppercase, 1 lowercase, 1 number required</p>
        {fieldErrors.password && (
          <p id="password-error" className="text-xs font-medium text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2.5">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-charcoal-900">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            disabled={isLoading}
            required
            autoComplete="new-password"
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 pr-10 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 transition hover:text-charcoal-700 disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          />
        </div>
        {fieldErrors.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs font-medium text-red-600">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2.5">
          <Label htmlFor="country" className="flex items-center gap-2 text-sm font-semibold text-charcoal-900">
            <MapPin className="h-4 w-4 text-gold-500" />
            Country <span className="text-red-500">*</span>
          </Label>
          <Input
            id="country"
            type="text"
            placeholder="United Kingdom"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={isLoading}
            required
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!fieldErrors.country}
            aria-describedby={fieldErrors.country ? 'country-error' : undefined}
          />
          {fieldErrors.country && (
            <p id="country-error" className="text-xs font-medium text-red-600">
              {fieldErrors.country}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="city" className="text-sm font-semibold text-charcoal-900">
            City
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="London"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={isLoading}
            className="h-11 rounded-lg border border-neutral-200 bg-neutral-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {fieldErrors.city && (
            <p id="city-error" className="text-xs font-medium text-red-600">
              {fieldErrors.city}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-8 h-12 w-full rounded-lg bg-gradient-to-r from-gold-500 to-orange-400 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:from-gold-600 hover:to-orange-500 hover:shadow-xl disabled:from-gold-400 disabled:to-orange-300 disabled:cursor-not-allowed"
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );

  /**
   * Render Step 2 - Role Selection
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Role Selection Cards */}
      <div className="space-y-3">
        {/* Player Role */}
        <button
          onClick={() => {
            handleInputChange('selectedRole', 'PLAYER');
            clearFieldError('selectedRole');
          }}
          disabled={isLoading}
          className={`rounded-xl border-2 p-4 transition-all duration-200 ${
            formData.selectedRole === 'PLAYER'
              ? 'border-gold-500 bg-gold-50 shadow-md'
              : 'border-neutral-200 bg-white hover:border-gold-300'
          } disabled:opacity-50`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 flex items-center gap-2 font-bold text-charcoal-900">
                <span className="text-lg">⚽</span>
                I&apos;m a Player
              </h3>
              <p className="text-sm text-charcoal-600">Track stats, join teams, and grow as an athlete</p>
            </div>
            {formData.selectedRole === 'PLAYER' && <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-gold-500" />}
          </div>
        </button>

        {/* Coach Role */}
        <button
          onClick={() => {
            handleInputChange('selectedRole', 'COACH');
            clearFieldError('selectedRole');
          }}
          disabled={isLoading}
          className={`rounded-xl border-2 p-4 transition-all duration-200 ${
            formData.selectedRole === 'COACH'
              ? 'border-orange-400 bg-orange-50 shadow-md'
              : 'border-neutral-200 bg-white hover:border-orange-300'
          } disabled:opacity-50`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 flex items-center gap-2 font-bold text-charcoal-900">
                <span className="text-lg">🏆</span>
                I&apos;m a Coach
              </h3>
              <p className="text-sm text-charcoal-600">Manage teams, develop players, analyze performance</p>
              <p className="mt-2 text-xs font-medium text-orange-600">⭐ Requires admin verification</p>
            </div>
            {formData.selectedRole === 'COACH' && <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-orange-400" />}
          </div>
        </button>

        {/* Manager Role */}
        <button
          onClick={() => {
            handleInputChange('selectedRole', 'MANAGER');
            clearFieldError('selectedRole');
          }}
          disabled={isLoading}
          className={`rounded-xl border-2 p-4 transition-all duration-200 ${
            formData.selectedRole === 'MANAGER'
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-neutral-200 bg-white hover:border-purple-300'
          } disabled:opacity-50`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 flex items-center gap-2 font-bold text-charcoal-900">
                <span className="text-lg">📊</span>
                I&apos;m a Club Manager
              </h3>
              <p className="text-sm text-charcoal-600">Oversee clubs, manage teams, handle operations</p>
              <p className="mt-2 text-xs font-medium text-purple-600">⭐ Requires admin verification</p>
            </div>
            {formData.selectedRole === 'MANAGER' && <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-purple-500" />}
          </div>
        </button>

        {/* League Admin Role */}
        <button
          onClick={() => {
            handleInputChange('selectedRole', 'LEAGUE_ADMIN');
            clearFieldError('selectedRole');
          }}
          disabled={isLoading}
          className={`rounded-xl border-2 p-4 transition-all duration-200 ${
            formData.selectedRole === 'LEAGUE_ADMIN'
              ? 'border-gold-500 bg-gold-50 shadow-md'
              : 'border-neutral-200 bg-white hover:border-gold-300'
          } disabled:opacity-50`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 flex items-center gap-2 font-bold text-charcoal-900">
                <span className="text-lg">🎯</span>
                I&apos;m a League Organizer
              </h3>
              <p className="text-sm text-charcoal-600">Organize competitions, manage leagues at scale</p>
              <p className="mt-2 text-xs font-medium text-gold-600">⭐ Requires admin verification + league code</p>
            </div>
            {formData.selectedRole === 'LEAGUE_ADMIN' && <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-gold-500" />}
          </div>
        </button>
      </div>

      {/* League Code Input - Conditional */}
      {formData.selectedRole !== 'PLAYER' && (
        <div className="space-y-2.5 rounded-xl bg-neutral-50 p-4">
          <Label htmlFor="leagueCode" className="text-sm font-semibold text-charcoal-900">
            League Code {formData.selectedRole === 'LEAGUE_ADMIN' && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="leagueCode"
            type="text"
            placeholder="Enter your league code"
            value={formData.leagueCode}
            onChange={(e) => handleInputChange('leagueCode', e.target.value)}
            disabled={isLoading}
            required={formData.selectedRole === 'LEAGUE_ADMIN'}
            className="h-11 rounded-lg border border-neutral-200 bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby="leagueCode-help"
          />
          <p id="leagueCode-help" className="text-xs text-charcoal-500">
            {formData.selectedRole === 'LEAGUE_ADMIN'
              ? 'Your league code is required for verification'
              : 'Optional: Link your team to an existing league'}
          </p>
        </div>
      )}

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="flex items-start gap-2 text-sm text-blue-800">
          <Zap className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {formData.selectedRole === 'PLAYER'
            ? '✓ Instant access to all features'
            : '⏳ Your request will be reviewed by our team. You\'ll have player access while waiting.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleBackToStep1}
          disabled={isLoading}
          variant="outline"
          className="h-11 flex-1 rounded-lg border-2 border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSignup}
          disabled={isLoading}
          className="h-11 flex-1 rounded-lg bg-gradient-to-r from-gold-500 to-orange-400 font-bold text-white shadow-lg transition-all duration-200 hover:from-gold-600 hover:to-orange-500 hover:shadow-xl disabled:from-gold-400 disabled:to-orange-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  /**
   * Render Step 3 - Email Verification
   */
  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-2xl font-bold text-charcoal-900">Account Created!</h3>
        <p className="mb-2 text-charcoal-600">We&apos;ve sent a verification email to</p>
        <p className="mb-4 break-all font-bold text-gold-600">{formData.email}</p>
        <p className="text-sm leading-relaxed text-charcoal-500">
          Click the verification link in your inbox to activate your account and get started.
        </p>
      </div>

      {/* Role Verification Notice */}
      {formData.selectedRole !== 'PLAYER' && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>✓ Your {formData.selectedRole.replace(/_/g, ' ')} request is pending.</strong>
            <br />
            You can use PitchConnect as a Player while our team reviews your request.
          </p>
        </div>
      )}

      {/* Sign In Button */}
      <Button
        onClick={() => router.push('/auth/login')}
        className="h-12 w-full rounded-lg bg-gradient-to-r from-gold-500 to-orange-400 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:from-gold-600 hover:to-orange-500 hover:shadow-xl"
      >
        Go to Sign In
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  /**
   * Main Render
   */
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-gold-500/20 to-orange-400/10 blur-3xl" />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-500/20 to-transparent blur-3xl"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Main Card */}
      <Card className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        {/* Top Border Accent */}
        <div className="h-1.5 bg-gradient-to-r from-gold-500 via-orange-400 to-purple-500" />

        {/* Card Header */}
        <CardHeader className="px-6 pb-6 pt-10 text-center">
          <div className="mb-6 flex animate-scale-in justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>

          <CardTitle className="mb-3 text-4xl font-bold text-charcoal-900">
            {step === 1 && 'Join PitchConnect'}
            {step === 2 && 'Choose Your Role'}
            {step === 3 && 'Verify Your Email'}
          </CardTitle>

          <CardDescription className="text-base text-charcoal-600">
            {step === 1 && 'Start your team management journey today'}
            {step === 2 && "Tell us how you'll use PitchConnect"}
            {step === 3 && 'Check your inbox to activate your account'}
          </CardDescription>

          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
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

        {/* Card Content */}
        <CardContent className="px-6 pb-8 pt-0">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex animate-slide-down gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Sign In Link */}
          {step !== 3 && (
            <div className="border-t border-neutral-100 pt-6 text-center text-sm text-charcoal-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold text-gold-500 transition hover:text-orange-400">
                Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-charcoal-700/50 bg-gradient-to-t from-charcoal-900 to-transparent py-6 text-center text-xs text-charcoal-400">
        <p>
          © 2025 PitchConnect. All rights reserved. |{' '}
          <a href="#" className="transition hover:text-gold-400">
            Privacy
          </a>{' '}
          |{' '}
          <a href="#" className="transition hover:text-gold-400">
            Terms
          </a>
        </p>
      </div>
    </div>
  );
}
