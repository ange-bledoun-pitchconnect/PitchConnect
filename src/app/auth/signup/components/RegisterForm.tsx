/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Register Form v6.0 (INLINE STYLES FIX)
 * Path: src/app/auth/signup/components/RegisterForm.tsx
 * ============================================================================
 * 
 * FIX: Using inline styles for role card backgrounds to ensure they render
 * (Tailwind JIT doesn't pick up dynamically constructed class names)
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
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Users,
  Target,
  Building2,
  Trophy,
  Wallet,
  Crown,
  Phone,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type UserRole = 'PLAYER' | 'COACH' | 'MANAGER' | 'TREASURER' | 'CLUB_OWNER' | 'LEAGUE_ADMIN';

interface FormData {
  role: UserRole | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

interface FormErrors {
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  form?: string;
}

type Step = 1 | 2 | 3;

// ============================================================================
// CONSTANTS
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+44|0)?[1-9]\d{9,10}$/;

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

// Role cards with INLINE STYLES for guaranteed color rendering
const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
  hoverColor: string;
  tier: string;
}[] = [
  {
    value: 'PLAYER',
    label: 'Player',
    description: 'Track your stats, view schedules, and connect with your team',
    icon: Users,
    bgColor: '#2563eb', // blue-600
    hoverColor: '#1d4ed8', // blue-700
    tier: 'Free',
  },
  {
    value: 'COACH',
    label: 'Coach',
    description: 'Manage training, create formations, and track player development',
    icon: Target,
    bgColor: '#ea580c', // orange-600
    hoverColor: '#c2410c', // orange-700
    tier: '£9.99/mo',
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Run your club with multi-team management and analytics',
    icon: Building2,
    bgColor: '#9333ea', // purple-600
    hoverColor: '#7e22ce', // purple-700
    tier: '£19.99/mo',
  },
  {
    value: 'TREASURER',
    label: 'Treasurer',
    description: 'Handle club finances, payments, and financial reporting',
    icon: Wallet,
    bgColor: '#059669', // emerald-600
    hoverColor: '#047857', // emerald-700
    tier: '£19.99/mo',
  },
  {
    value: 'CLUB_OWNER',
    label: 'Club Owner',
    description: 'Full control over your club with all premium features',
    icon: Crown,
    bgColor: '#d97706', // amber-600
    hoverColor: '#b45309', // amber-700
    tier: '£29.99/mo',
  },
  {
    value: 'LEAGUE_ADMIN',
    label: 'League Admin',
    description: 'Organize competitions and manage multiple clubs',
    icon: Trophy,
    bgColor: '#dc2626', // red-600
    hoverColor: '#b91c1c', // red-700
    tier: '£29.99/mo',
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

function validateStep1(data: FormData): FormErrors {
  if (!data.role) return { role: 'Please select your role to continue' };
  return {};
}

function validateStep2(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(data.email)) errors.email = 'Enter a valid email address';
  if (data.phone && !PHONE_REGEX.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Enter a valid UK phone number';
  }
  return errors;
}

function validateStep3(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (PASSWORD_REQUIREMENTS.some((r) => !r.test(data.password))) {
    errors.password = 'Password does not meet all requirements';
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  if (!data.acceptTerms) errors.acceptTerms = 'You must accept the terms';
  return errors;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all"
            style={{
              backgroundColor: currentStep >= step ? '#f97316' : '#e5e7eb',
              color: currentStep >= step ? 'white' : '#6b7280',
              boxShadow: currentStep >= step ? '0 4px 14px rgba(249, 115, 22, 0.3)' : 'none',
            }}
          >
            {currentStep > step ? <Check className="h-5 w-5" /> : step}
          </div>
          {index < 2 && (
            <div 
              className="mx-2 h-1 w-8 rounded-full transition-all"
              style={{ backgroundColor: currentStep > step ? '#f97316' : '#e5e7eb' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RoleCard({
  option,
  selected,
  onSelect,
  disabled,
}: {
  option: typeof ROLE_OPTIONS[0];
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const Icon = option.icon;
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: isHovered ? option.hoverColor : option.bgColor,
        boxShadow: selected 
          ? '0 0 0 4px rgba(251, 146, 60, 0.5), 0 10px 25px -5px rgba(0, 0, 0, 0.2)' 
          : '0 4px 15px -3px rgba(0, 0, 0, 0.2)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">{option.label}</h3>
            <span 
              className="text-sm font-bold text-white px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              {option.tier}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {option.description}
          </p>
        </div>
        
        {/* Selection Indicator */}
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
          style={{
            borderColor: selected ? 'white' : 'rgba(255, 255, 255, 0.6)',
            backgroundColor: selected ? 'white' : 'transparent',
          }}
        >
          {selected && <Check className="h-4 w-4" style={{ color: option.bgColor }} />}
        </div>
      </div>
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i < passed ? colors[passed - 1] : '#e5e7eb' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <div 
              key={req.id} 
              className="flex items-center gap-2 text-sm"
              style={{ color: met ? '#16a34a' : '#6b7280' }}
            >
              {met ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// REGISTER FORM
// ============================================================================

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    role: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase() as UserRole;
    if (roleParam && ROLE_OPTIONS.some(r => r.value === roleParam)) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
    setIsHydrated(true);
  }, [searchParams]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleNext = useCallback(() => {
    const validationErrors = step === 1 ? validateStep1(formData) : validateStep2(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3) as Step);
  }, [step, formData]);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as Step);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateStep3(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          acceptMarketing: formData.acceptMarketing,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      toast.success('Account created! Signing you in...');

      const signInResult = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        startTransition(() => {
          router.push('/onboarding');
          router.refresh();
        });
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/onboarding' });
    } catch {
      toast.error('Failed to connect to Google');
      setIsGoogleLoading(false);
    }
  }, []);

  if (!isHydrated) return <Skeleton />;

  const isLoading = isSubmitting || isGoogleLoading || isPending;

  // Common input styles
  const inputBaseStyle = "w-full rounded-xl border-2 bg-white px-4 py-3.5 pl-12 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20";
  const inputNormalBorder = "border-gray-300 focus:border-orange-500 hover:border-gray-400";
  const inputErrorBorder = "border-red-300 focus:border-red-500";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div 
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
        >
          <Sparkles className="h-4 w-4" />
          <span>14-Day Free Trial</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111827' }}>
          {step === 1 && 'Choose your role'}
          {step === 2 && 'Tell us about yourself'}
          {step === 3 && 'Create your password'}
        </h1>
        <p style={{ color: '#4b5563' }}>
          {step === 1 && 'Select how you\'ll use PitchConnect'}
          {step === 2 && 'We\'ll personalize your experience'}
          {step === 3 && 'Almost done! Secure your account'}
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Error Alert */}
      {errors.form && (
        <div 
          className="flex items-start gap-3 rounded-xl border p-4"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>{errors.form}</p>
        </div>
      )}

      {/* ============== STEP 1: Role Selection ============== */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 px-4 py-3.5 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              borderColor: '#d1d5db', 
              backgroundColor: 'white', 
              color: '#374151',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '2px solid #e5e7eb' }} />
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-4 text-sm font-medium uppercase tracking-wide"
                style={{ backgroundColor: 'white', color: '#6b7280' }}
              >
                or select your role
              </span>
            </div>
          </div>

          {/* Role Error */}
          {errors.role && (
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color: '#dc2626' }}>
              <AlertCircle className="h-4 w-4" />
              {errors.role}
            </p>
          )}

          {/* Role Cards - WITH INLINE STYLES */}
          <div className="space-y-3">
            {ROLE_OPTIONS.map((option) => (
              <RoleCard
                key={option.value}
                option={option}
                selected={formData.role === option.value}
                onSelect={() => updateField('role', option.value)}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading || !formData.role}
            className="w-full rounded-xl px-4 py-4 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              background: 'linear-gradient(to right, #f97316, #ea580c)',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
            }}
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ============== STEP 2: Personal Details ============== */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold" style={{ color: '#374151' }}>First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="John"
                  disabled={isLoading}
                  className={`${inputBaseStyle} ${errors.firstName ? inputErrorBorder : inputNormalBorder}`}
                />
              </div>
              {errors.firstName && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Smith"
                  disabled={isLoading}
                  className={`${inputBaseStyle} ${errors.lastName ? inputErrorBorder : inputNormalBorder}`}
                />
              </div>
              {errors.lastName && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@yourclub.com"
                disabled={isLoading}
                className={`${inputBaseStyle} ${errors.email ? inputErrorBorder : inputNormalBorder}`}
              />
            </div>
            {errors.email && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: '#374151' }}>
              Phone Number <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+44 7700 900000"
                disabled={isLoading}
                className={`${inputBaseStyle} ${errors.phone ? inputErrorBorder : inputNormalBorder}`}
              />
            </div>
            {errors.phone && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.phone}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 rounded-xl border-2 px-4 py-3.5 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ borderColor: '#d1d5db', backgroundColor: 'white', color: '#374151' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] rounded-xl px-4 py-3.5 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(to right, #f97316, #ea580c)',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
              }}
            >
              <span>Continue</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}

      {/* ============== STEP 3: Password ============== */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Create a strong password"
                  disabled={isLoading}
                  className={`${inputBaseStyle} pr-12 ${errors.password ? inputErrorBorder : inputNormalBorder}`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9ca3af' }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.password}</p>}
            </div>
            {formData.password && <PasswordStrength password={formData.password} />}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#9ca3af' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                className={`${inputBaseStyle} pr-12 ${errors.confirmPassword ? inputErrorBorder : inputNormalBorder}`}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#9ca3af' }}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm" style={{ color: '#dc2626' }}>{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm" style={{ color: errors.acceptTerms ? '#dc2626' : '#4b5563' }}>
                I agree to the <Link href="/legal/terms" style={{ color: '#ea580c' }} className="hover:underline">Terms</Link> and <Link href="/legal/privacy" style={{ color: '#ea580c' }} className="hover:underline">Privacy Policy</Link>
                <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptMarketing}
                onChange={(e) => updateField('acceptMarketing', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm" style={{ color: '#4b5563' }}>Send me tips and updates (unsubscribe anytime)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 rounded-xl border-2 px-4 py-3.5 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ borderColor: '#d1d5db', backgroundColor: 'white', color: '#374151' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] rounded-xl px-4 py-3.5 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(to right, #f97316, #ea580c)',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Sign In Link */}
      <p className="text-center text-sm" style={{ color: '#4b5563' }}>
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#ea580c' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-8 w-36 rounded-full mx-auto" style={{ backgroundColor: '#e5e7eb' }} />
        <div className="h-9 w-56 rounded mx-auto" style={{ backgroundColor: '#e5e7eb' }} />
        <div className="h-5 w-48 rounded mx-auto" style={{ backgroundColor: '#e5e7eb' }} />
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-10 w-10 rounded-full" style={{ backgroundColor: '#e5e7eb' }} />)}
      </div>
      <div className="h-14 rounded-xl" style={{ backgroundColor: '#e5e7eb' }} />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#e5e7eb' }} />)}
      </div>
    </div>
  );
}

export default RegisterForm;