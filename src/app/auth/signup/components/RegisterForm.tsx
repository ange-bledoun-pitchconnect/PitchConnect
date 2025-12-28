/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Register Form v8.0 (COMPLETE REDESIGN)
 * Path: src/app/auth/signup/components/RegisterForm.tsx
 * ============================================================================
 * 
 * REDESIGNED with:
 * - 2-column grid layout for role cards
 * - CSS custom properties for guaranteed color rendering
 * - Cleaner, more premium visual design
 * - Better visual hierarchy
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  Shield,
  Zap,
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

// ============================================================================
// ROLE CARD STYLES - INJECTED AS CSS
// ============================================================================

const ROLE_STYLES = `
  .role-card-player { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important; }
  .role-card-coach { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; }
  .role-card-manager { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important; }
  .role-card-treasurer { background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; }
  .role-card-club_owner { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important; }
  .role-card-league_admin { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; }
  
  .role-card-player:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important; }
  .role-card-coach:hover { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%) !important; }
  .role-card-manager:hover { background: linear-gradient(135deg, #9333ea 0%, #6d28d9 100%) !important; }
  .role-card-treasurer:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%) !important; }
  .role-card-club_owner:hover { background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important; }
  .role-card-league_admin:hover { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important; }
`;

// ============================================================================
// GOOGLE ICON
// ============================================================================

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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
// PASSWORD STRENGTH
// ============================================================================

function PasswordStrength({ password }: { password: string }) {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < passed ? colors[passed - 1] : '#e5e7eb' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <div key={req.id} className="flex items-center gap-2">
              {met ? (
                <Check className="h-4 w-4" style={{ color: '#16a34a' }} />
              ) : (
                <X className="h-4 w-4" style={{ color: '#d1d5db' }} />
              )}
              <span className="text-xs" style={{ color: met ? '#16a34a' : '#6b7280' }}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ROLE DATA
// ============================================================================

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  tier: string;
  popular?: boolean;
}[] = [
  { value: 'PLAYER', label: 'Player', description: 'Track stats & schedules', icon: Users, tier: 'Free', popular: true },
  { value: 'COACH', label: 'Coach', description: 'Manage training & development', icon: Target, tier: '£9.99/mo' },
  { value: 'MANAGER', label: 'Manager', description: 'Multi-team management', icon: Building2, tier: '£19.99/mo' },
  { value: 'TREASURER', label: 'Treasurer', description: 'Financial management', icon: Wallet, tier: '£19.99/mo' },
  { value: 'CLUB_OWNER', label: 'Club Owner', description: 'Full club control', icon: Crown, tier: '£29.99/mo' },
  { value: 'LEAGUE_ADMIN', label: 'League Admin', description: 'Manage competitions', icon: Trophy, tier: '£29.99/mo' },
];

// ============================================================================
// MAIN REGISTER FORM
// ============================================================================

export default function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleRoleSelect = useCallback((role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
    setErrors((prev) => ({ ...prev, role: undefined }));
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    let stepErrors: FormErrors = {};
    if (step === 1) stepErrors = validateStep1(formData);
    else if (step === 2) stepErrors = validateStep2(formData);
    else if (step === 3) stepErrors = validateStep3(formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [step, formData]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep() && step < 3) {
      setStep((s) => (s + 1) as Step);
    }
  }, [validateCurrentStep, step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || undefined,
            requestedRole: formData.role,
            acceptTerms: formData.acceptTerms,
            acceptMarketing: formData.acceptMarketing,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ form: data.error || 'Registration failed' });
          toast.error('Registration failed', { description: data.error });
          return;
        }

        toast.success('Account created!', {
          description: 'Please check your email to verify your account.',
        });

        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push('/dashboard');
        } else {
          router.push('/auth/login?registered=true');
        }
      } catch (error) {
        setErrors({ form: 'An unexpected error occurred' });
        toast.error('Something went wrong');
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      toast.error('Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const isLoading = isPending || isGoogleLoading;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Inject CSS for role card colors */}
      <style dangerouslySetInnerHTML={{ __html: ROLE_STYLES }} />
      
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Card Container */}
        <div
          className="rounded-3xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div 
            className="px-6 sm:px-10 pt-8 pb-6 text-center"
            style={{ 
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              borderBottom: '1px solid #fed7aa'
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Sparkles className="h-4 w-4" style={{ color: '#ea580c' }} />
              <span className="text-sm font-semibold" style={{ color: '#ea580c' }}>14-Day Free Trial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111827' }}>
              {step === 1 && 'Create your account'}
              {step === 2 && 'Your details'}
              {step === 3 && 'Secure your account'}
            </h1>
            <p className="mt-2 text-base" style={{ color: '#6b7280' }}>
              {step === 1 && 'Choose how you\'ll use PitchConnect'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'Set a strong password'}
            </p>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {[1, 2, 3].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300"
                    style={{
                      backgroundColor: step >= s ? '#f97316' : '#ffffff',
                      color: step >= s ? '#ffffff' : '#9ca3af',
                      border: step >= s ? 'none' : '2px solid #e5e7eb',
                      boxShadow: step >= s ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                    }}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </div>
                  {i < 2 && (
                    <div
                      className="w-12 sm:w-16 h-1 mx-2 rounded-full transition-all duration-300"
                      style={{ backgroundColor: step > s ? '#f97316' : '#e5e7eb' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-10 py-8">
            {errors.form && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl mb-6"
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#dc2626' }} />
                <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>{errors.form}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* ================================================================
                  STEP 1: Role Selection
              ================================================================ */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-semibold transition-all disabled:opacity-50"
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: '2px solid #e5e7eb', 
                      color: '#374151',
                    }}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <GoogleIcon />
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full" style={{ borderTop: '2px solid #f3f4f6' }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span 
                        className="px-4 text-sm font-medium"
                        style={{ backgroundColor: '#ffffff', color: '#9ca3af' }}
                      >
                        or choose your role
                      </span>
                    </div>
                  </div>

                  {/* Role Cards Grid - 2 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ROLES.map((role) => {
                      const Icon = role.icon;
                      const isSelected = formData.role === role.value;
                      const cardClass = `role-card-${role.value.toLowerCase()}`;
                      
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => handleRoleSelect(role.value)}
                          disabled={isLoading}
                          className={`${cardClass} relative rounded-2xl p-5 text-left transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]`}
                          style={{
                            boxShadow: isSelected 
                              ? '0 0 0 3px #f97316, 0 10px 30px -5px rgba(0, 0, 0, 0.25)' 
                              : '0 4px 20px -5px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          {/* Popular Badge */}
                          {role.popular && (
                            <div 
                              className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{ backgroundColor: '#fbbf24', color: '#78350f' }}
                            >
                              Popular
                            </div>
                          )}
                          
                          <div className="flex items-start gap-4">
                            <div 
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-lg font-bold text-white">{role.label}</h3>
                                {/* Selection Check */}
                                <div
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all"
                                  style={{
                                    backgroundColor: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                                    border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.5)',
                                  }}
                                >
                                  {isSelected && <Check className="h-4 w-4" style={{ color: '#f97316' }} />}
                                </div>
                              </div>
                              <p 
                                className="text-sm mt-1"
                                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                              >
                                {role.description}
                              </p>
                              <div 
                                className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                              >
                                {role.tier}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {errors.role && (
                    <p className="text-sm font-medium text-center" style={{ color: '#ef4444' }}>
                      {errors.role}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.role || isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                      boxShadow: '0 4px 15px -3px rgba(249, 115, 22, 0.4)' 
                    }}
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* ================================================================
                  STEP 2: Personal Details
              ================================================================ */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5" style={{ color: '#9ca3af' }} />
                        </div>
                        <input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={isLoading}
                          placeholder="John"
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all"
                          style={{ 
                            backgroundColor: '#f9fafb', 
                            border: errors.firstName ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                            color: '#111827' 
                          }}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                        Last Name
                      </label>
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Doe"
                        className="w-full px-4 py-3.5 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          border: errors.lastName ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                          color: '#111827' 
                        }}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5" style={{ color: '#9ca3af' }} />
                      </div>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                          color: '#111827' 
                        }}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      Phone Number <span style={{ color: '#9ca3af' }}>(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5" style={{ color: '#9ca3af' }} />
                      </div>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="+44 7700 900000"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          border: errors.phone ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                          color: '#111827' 
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.phone}</p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={handleBack} 
                      disabled={isLoading} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all"
                      style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Back</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleNext} 
                      disabled={isLoading} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                    >
                      <span>Continue</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================
                  STEP 3: Password
              ================================================================ */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5" style={{ color: '#9ca3af' }} />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          border: errors.password ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                          color: '#111827' 
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#9ca3af' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#9ca3af' }} />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-3">
                        <PasswordStrength password={formData.password} />
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5" style={{ color: '#9ca3af' }} />
                      </div>
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all"
                        style={{ 
                          backgroundColor: '#f9fafb', 
                          border: errors.confirmPassword ? '2px solid #ef4444' : '2px solid #e5e7eb', 
                          color: '#111827' 
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#9ca3af' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#9ca3af' }} />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="acceptTerms" 
                        checked={formData.acceptTerms} 
                        onChange={handleChange} 
                        className="w-5 h-5 mt-0.5 rounded accent-orange-500" 
                      />
                      <span className="text-sm" style={{ color: '#4b5563' }}>
                        I agree to the{' '}
                        <Link href="/terms" className="font-semibold" style={{ color: '#ea580c' }}>
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="font-semibold" style={{ color: '#ea580c' }}>
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-sm" style={{ color: '#ef4444' }}>{errors.acceptTerms}</p>
                    )}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="acceptMarketing" 
                        checked={formData.acceptMarketing} 
                        onChange={handleChange} 
                        className="w-5 h-5 mt-0.5 rounded accent-orange-500" 
                      />
                      <span className="text-sm" style={{ color: '#4b5563' }}>
                        Send me updates about new features and tips
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={handleBack} 
                      disabled={isLoading} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all"
                      style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Back</span>
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                    >
                      {isPending ? (
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
                </div>
              )}
            </form>

            {/* Sign In Link */}
            <p className="mt-8 text-center" style={{ color: '#6b7280' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold" style={{ color: '#ea580c' }}>
                Sign in
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
      </div>
    </>
  );
}