'use client';

/**
 * PitchConnect Create Club Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/clubs/create/page.tsx
 * 
 * Features:
 * ✅ Multi-step club creation wizard (3 steps)
 * ✅ Club details: name, location, colors, logo upload
 * ✅ Optional: founded year, stadium, description
 * ✅ First team setup (optional)
 * ✅ Logo upload with image validation (5MB limit)
 * ✅ Color picker with hex input support
 * ✅ Review & confirmation step
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Progress tracking with visual indicators
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Comprehensive error handling
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Users,
  MapPin,
  Palette,
  FileText,
  Camera,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface ClubFormData {
  name: string;
  location: string;
  city: string;
  country: string;
  foundedYear: string;
  colors: {
    primary: string;
    secondary: string;
  };
  description: string;
  stadiumName: string;
  logoUrl: string;
}

interface TeamFormData {
  name: string;
  ageGroup: string;
  category: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// COUNTRIES LIST - FROM SCHEMA
// ============================================================================

const COUNTRIES = [
  'United Kingdom',
  'Spain',
  'Germany',
  'France',
  'Italy',
  'Netherlands',
  'Portugal',
  'Belgium',
  'Austria',
  'Switzerland',
  'Sweden',
  'Norway',
  'Denmark',
  'Greece',
  'Turkey',
  'Poland',
  'Ukraine',
  'Russia',
  'United States',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'Australia',
  'Japan',
  'South Korea',
  'China',
  'India',
  'Other',
] as const;

const AGE_GROUPS = [
  { value: 'SENIOR', label: 'Senior (18+)' },
  { value: 'U21', label: 'Under 21' },
  { value: 'U18', label: 'Under 18' },
  { value: 'U16', label: 'Under 16' },
  { value: 'U14', label: 'Under 14' },
  { value: 'U12', label: 'Under 12' },
  { value: 'U10', label: 'Under 10' },
] as const;

const TEAM_CATEGORIES = [
  { value: 'FIRST_TEAM', label: 'First Team' },
  { value: 'RESERVES', label: 'Reserves' },
  { value: 'YOUTH', label: 'Youth/Academy' },
  { value: 'WOMENS', label: "Women's Team" },
] as const;

// ============================================================================
// TOAST COMPONENT (No External Dependency)
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// PROGRESS STEP INDICATOR
// ============================================================================

const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { step: 1, label: 'Club Details' },
    { step: 2, label: 'First Team' },
    { step: 3, label: 'Review' },
  ];

  return (
    <div className="flex items-center gap-4 mb-8">
      {steps.map((item, index) => (
        <div key={item.step} className="flex-1">
          <div
            className={`h-2 rounded-full transition-all ${
              currentStep >= item.step
                ? 'bg-gradient-to-r from-gold-500 to-orange-500'
                : 'bg-neutral-200 dark:bg-charcoal-700'
            }`}
          />
          <p className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 mt-2">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CreateClubPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // State Management
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [createFirstTeam, setCreateFirstTeam] = useState(true);

  const [clubData, setClubData] = useState<ClubFormData>({
    name: '',
    location: '',
    city: '',
    country: 'United Kingdom',
    foundedYear: new Date().getFullYear().toString(),
    colors: {
      primary: '#FFD700',
      secondary: '#FF6B35',
    },
    description: '',
    stadiumName: '',
    logoUrl: '',
  });

  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    ageGroup: 'SENIOR',
    category: 'FIRST_TEAM',
  });

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // LOGO UPLOAD HANDLER
  // ========================================================================

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo must be less than 5MB', 'error');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/clubs/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const data = await response.json();
      setClubData({ ...clubData, logoUrl: data.url });
      showToast('Logo uploaded successfully!', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload logo';
      showToast(errorMessage, 'error');
      console.error('Upload error:', error);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  // ========================================================================
  // SUBMIT HANDLER
  // ========================================================================

  const handleSubmit = async () => {
    // Validation
    if (!clubData.name.trim()) {
      showToast('Please provide a club name', 'error');
      return;
    }

    if (!clubData.city.trim()) {
      showToast('Please provide a city', 'error');
      return;
    }

    if (createFirstTeam && !teamData.name.trim()) {
      showToast('Please provide a team name', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/clubs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club: clubData,
          firstTeam: createFirstTeam ? teamData : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || 'Failed to create club';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      showToast('🎉 Club created successfully!', 'success');

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/clubs/${data.clubId}`);
      }, 1200);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create club. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Club creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-900 dark:to-charcoal-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/dashboard">
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-200 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-500 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">
                Create Your Club
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Set up your football club in minutes
              </p>
            </div>
          </div>

          {/* PROGRESS INDICATOR */}
          <ProgressSteps currentStep={step} />
        </div>

        {/* STEP 1: CLUB DETAILS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
                <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                  <Shield className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                  Club Information
                </h2>
                <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                  Basic details about your club
                </p>
              </div>

              <div className="space-y-6 p-6">
                {/* LOGO UPLOAD */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                    Club Logo <span className="text-xs text-charcoal-500">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-gradient-to-br from-gold-100 to-orange-100 shadow-lg dark:border-charcoal-700">
                      {clubData.logoUrl ? (
                        <Image
                          src={clubData.logoUrl}
                          alt="Club Logo"
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="h-10 w-10 text-gold-600 dark:text-gold-400" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 rounded-lg bg-neutral-200 px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-300 disabled:opacity-50 dark:bg-charcoal-700 dark:text-charcoal-300 dark:hover:bg-charcoal-600"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-xs text-charcoal-500 dark:text-charcoal-500">
                        PNG, JPG up to 5MB. Square image recommended.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CLUB NAME */}
                <div className="space-y-2">
                  <label
                    htmlFor="clubName"
                    className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    Club Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clubName"
                    type="text"
                    value={clubData.name}
                    onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                    placeholder="e.g., Arsenal FC, Manchester United"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                  />
                </div>

                {/* LOCATION */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="city"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
                      <input
                        id="city"
                        type="text"
                        value={clubData.city}
                        onChange={(e) => setClubData({ ...clubData, city: e.target.value })}
                        placeholder="London"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 pl-10 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="country"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      Country
                    </label>
                    <select
                      id="country"
                      value={clubData.country}
                      onChange={(e) => setClubData({ ...clubData, country: e.target.value })}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CLUB COLORS */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300">
                    <Palette className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                    Club Colors
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Primary Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={clubData.colors.primary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, primary: e.target.value },
                            })
                          }
                          className="h-12 w-12 cursor-pointer rounded-lg border-2 border-neutral-300 dark:border-charcoal-600"
                        />
                        <input
                          type="text"
                          value={clubData.colors.primary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, primary: e.target.value },
                            })
                          }
                          placeholder="#FFD700"
                          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Secondary Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={clubData.colors.secondary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, secondary: e.target.value },
                            })
                          }
                          className="h-12 w-12 cursor-pointer rounded-lg border-2 border-neutral-300 dark:border-charcoal-600"
                        />
                        <input
                          type="text"
                          value={clubData.colors.secondary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, secondary: e.target.value },
                            })
                          }
                          placeholder="#FF6B35"
                          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTIONAL FIELDS */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="foundedYear"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      Founded Year <span className="text-xs text-charcoal-500">(Optional)</span>
                    </label>
                    <input
                      id="foundedYear"
                      type="number"
                      value={clubData.foundedYear}
                      onChange={(e) => setClubData({ ...clubData, foundedYear: e.target.value })}
                      placeholder="2024"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="stadiumName"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      Stadium Name <span className="text-xs text-charcoal-500">(Optional)</span>
                    </label>
                    <input
                      id="stadiumName"
                      type="text"
                      value={clubData.stadiumName}
                      onChange={(e) => setClubData({ ...clubData, stadiumName: e.target.value })}
                      placeholder="Emirates Stadium"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                  >
                    <FileText className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                    Club Description <span className="text-xs text-charcoal-500">(Optional)</span>
                  </label>
                  <textarea
                    id="description"
                    value={clubData.description}
                    onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                    placeholder="Tell us about your club's history, values, and achievements..."
                    maxLength={500}
                    rows={4}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                  />
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                    {clubData.description.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!clubData.name.trim() || !clubData.city.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-3 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600"
              >
                Next: First Team
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIRST TEAM */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
                <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                  <Users className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                  Create First Team
                </h2>
                <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                  Set up your club's first team (you can add more teams later)
                </p>
              </div>

              <div className="space-y-6 p-6">
                {/* CREATE TEAM TOGGLE */}
                <div className="flex items-center justify-between rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-900/50 dark:bg-gold-900/20">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-white">
                      Create first team now?
                    </p>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      You can skip this and add teams later
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={createFirstTeam}
                      onChange={(e) => setCreateFirstTeam(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="peer-checked:from-gold-600 peer-checked:to-orange-500 h-6 w-11 rounded-full bg-neutral-200 transition-all peer-checked:bg-gradient-to-r dark:bg-charcoal-700" />
                    <div className="peer-checked:translate-x-full absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform dark:bg-charcoal-900" />
                  </label>
                </div>

                {/* TEAM FIELDS */}
                {createFirstTeam && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="teamName"
                        className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                      >
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="teamName"
                        type="text"
                        value={teamData.name}
                        onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                        placeholder="e.g., First Team, U21 Squad"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 placeholder-charcoal-400 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:placeholder-charcoal-500"
                      />
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-500">
                        Suggestion: "{clubData.name} First Team"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="ageGroup"
                        className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                      >
                        Age Group
                      </label>
                      <select
                        id="ageGroup"
                        value={teamData.ageGroup}
                        onChange={(e) => setTeamData({ ...teamData, ageGroup: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                      >
                        {AGE_GROUPS.map((group) => (
                          <option key={group.value} value={group.value}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="category"
                        className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                      >
                        Team Category
                      </label>
                      <select
                        id="category"
                        value={teamData.category}
                        onChange={(e) => setTeamData({ ...teamData, category: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white"
                      >
                        {TEAM_CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={createFirstTeam && !teamData.name.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-3 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600"
              >
                Next: Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
                <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                  <CheckCircle className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                  Review Your Club
                </h2>
                <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                  Check everything looks good before creating
                </p>
              </div>

              <div className="space-y-6 p-6">
                {/* CLUB SUMMARY */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                    Club Details
                  </h3>
                  <div className="space-y-3 rounded-xl bg-neutral-50 p-4 dark:bg-charcoal-700/50">
                    {clubData.logoUrl && (
                      <div className="flex justify-center">
                        <div className="h-24 w-24 overflow-hidden rounded-xl border-2 border-gold-200 dark:border-gold-900/50">
                          <Image
                            src={clubData.logoUrl}
                            alt="Club Logo"
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Club Name
                        </p>
                        <p className="font-bold text-charcoal-900 dark:text-white">
                          {clubData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Location
                        </p>
                        <p className="font-bold text-charcoal-900 dark:text-white">
                          {clubData.city}, {clubData.country}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Founded
                        </p>
                        <p className="font-bold text-charcoal-900 dark:text-white">
                          {clubData.foundedYear}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Colors
                        </p>
                        <div className="flex gap-2">
                          <div
                            className="h-6 w-6 rounded border border-neutral-300 dark:border-charcoal-600"
                            style={{ backgroundColor: clubData.colors.primary }}
                          />
                          <div
                            className="h-6 w-6 rounded border border-neutral-300 dark:border-charcoal-600"
                            style={{ backgroundColor: clubData.colors.secondary }}
                          />
                        </div>
                      </div>
                    </div>
                    {clubData.description && (
                      <div className="border-t border-neutral-200 pt-3 dark:border-charcoal-600">
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Description
                        </p>
                        <p className="text-charcoal-900 dark:text-white">
                          {clubData.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAM SUMMARY */}
                {createFirstTeam && (
                  <div className="space-y-3 border-t border-neutral-200 pt-6 dark:border-charcoal-700">
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-white">
                      First Team
                    </h3>
                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-900/50 dark:bg-gold-900/20">
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Team Name
                        </p>
                        <p className="font-bold text-charcoal-900 dark:text-white">
                          {teamData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Age Group
                        </p>
                        <p className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
                          {AGE_GROUPS.find((g) => g.value === teamData.ageGroup)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
                          Category
                        </p>
                        <p className="inline-block rounded-full border border-gold-200 bg-white px-3 py-1 text-xs font-semibold text-gold-700 dark:border-gold-900/50 dark:bg-charcoal-800 dark:text-gold-400">
                          {TEAM_CATEGORIES.find((c) => c.value === teamData.category)?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* OWNER INFO */}
                <div className="rounded-xl border border-gold-200 bg-gradient-to-r from-gold-50 to-orange-50 p-4 dark:border-gold-900/50 dark:from-gold-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-gold-600 dark:text-gold-400" />
                    <div>
                      <p className="font-bold text-charcoal-900 dark:text-white">
                        You will be the Club Owner
                      </p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Full control over club settings, teams, and member invitations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-8 py-3 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:from-gold-600 dark:to-orange-500 dark:hover:from-gold-700 dark:hover:to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Club...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Club
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
