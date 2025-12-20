'use client';

/**
 * PitchConnect Create League Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/create/page.tsx
 *
 * Features:
 * ✅ 3-step wizard for league creation
 * ✅ Step 1: Basic Info (name, code, sport, country, season)
 * ✅ Step 2: Format & Rules (league format, visibility, points system)
 * ✅ Step 3: Configuration (team limits, registration, bonus points)
 * ✅ Real-time preview of league configuration
 * ✅ Progress indicator with visual steps
 * ✅ Form validation at each step
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Comprehensive sport selection
 * ✅ Radio button selection for format/visibility
 * ✅ Toggle switches for registration/bonus points
 * ✅ Dark mode support
 * ✅ Responsive design
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
  Settings,
  Users,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Info,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type LeagueFormat = 'ROUND_ROBIN' | 'DOUBLE_ROUND_ROBIN' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'CUSTOM';
type LeagueVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface LeagueFormData {
  name: string;
  code: string;
  sport: string;
  country: string;
  season: number;
  format: LeagueFormat;
  visibility: LeagueVisibility;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  minTeams: number;
  maxTeams: number;
  registrationOpen: boolean;
  bonusPointsEnabled: boolean;
  bonusPointsForGoals: number;
}

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
    success: <Check className="h-5 w-5 flex-shrink-0" />,
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
// BADGE COMPONENT
// ============================================================================

const Badge = ({
  children,
  variant = 'default',
  color = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: 'gold' | 'neutral';
}) => {
  const colorMap = {
    default: {
      gold: 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600',
      neutral:
        'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600',
    },
    outline: {
      gold: 'border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-300',
      neutral: 'border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300',
    },
  };

  const baseClasses =
    'inline-block rounded-full px-3 py-1 text-xs font-semibold border';
  const variantClasses =
    variant === 'outline'
      ? `border ${colorMap.outline[color]}`
      : `border ${colorMap.default[color]}`;

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CreateLeaguePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [leagueData, setLeagueData] = useState<LeagueFormData>({
    name: '',
    code: '',
    sport: 'Football',
    country: 'United Kingdom',
    season: currentYear,
    format: 'ROUND_ROBIN',
    visibility: 'PUBLIC',
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    minTeams: 2,
    maxTeams: 20,
    registrationOpen: true,
    bonusPointsEnabled: false,
    bonusPointsForGoals: 0,
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: Trophy },
    { number: 2, title: 'Format & Rules', icon: Settings },
    { number: 3, title: 'Configuration', icon: Users },
  ];

  const formatOptions = [
    {
      value: 'ROUND_ROBIN',
      label: 'Round Robin',
      description: 'Every team plays every other team once',
    },
    {
      value: 'DOUBLE_ROUND_ROBIN',
      label: 'Double Round Robin',
      description: 'Home and away matches',
    },
    {
      value: 'KNOCKOUT',
      label: 'Knockout',
      description: 'Single elimination tournament',
    },
    {
      value: 'GROUP_KNOCKOUT',
      label: 'Group + Knockout',
      description: 'Group stage followed by knockout',
    },
    {
      value: 'CUSTOM',
      label: 'Custom',
      description: 'Create your own format',
    },
  ];

  const visibilityOptions = [
    {
      value: 'PUBLIC',
      label: 'Public',
      icon: Globe,
      description: 'Anyone can view league standings and fixtures',
    },
    {
      value: 'PRIVATE',
      label: 'Private',
      icon: Lock,
      description: 'Only teams and admins can view',
    },
    {
      value: 'UNLISTED',
      label: 'Unlisted',
      icon: EyeOff,
      description: 'Visible only with direct link',
    },
  ];

  const sportOptions = [
    { label: 'Football (Soccer)', value: 'Football' },
    { label: 'Basketball', value: 'Basketball' },
    { label: 'Rugby Union', value: 'Rugby Union' },
    { label: 'Rugby League', value: 'Rugby League' },
    { label: 'Netball', value: 'Netball' },
    { label: 'American Football', value: 'American Football' },
    { label: 'Cricket', value: 'Cricket' },
    { label: 'Hockey (Field)', value: 'Hockey' },
    { label: 'Volleyball', value: 'Volleyball' },
    { label: 'Handball', value: 'Handball' },
    { label: 'Water Polo', value: 'Water Polo' },
    { label: 'Ice Hockey', value: 'Ice Hockey' },
    { label: 'Lacrosse', value: 'Lacrosse' },
    { label: 'Dodgeball', value: 'Dodgeball' },
    { label: 'Ultimate Frisbee', value: 'Ultimate Frisbee' },
    { label: 'Futsal', value: 'Futsal' },
    { label: 'Kabaddi', value: 'Kabaddi' },
    { label: 'Gaelic Football', value: 'Gaelic Football' },
    { label: 'Hurling', value: 'Hurling' },
    { label: 'Rounders', value: 'Rounders' },
    { label: 'Softball', value: 'Softball' },
    { label: 'Baseball', value: 'Baseball' },
    { label: 'Badminton (Doubles)', value: 'Badminton' },
    { label: 'Table Tennis (Doubles)', value: 'Table Tennis' },
    { label: 'Squash (Doubles)', value: 'Squash' },
    { label: 'Beach Volleyball', value: 'Beach Volleyball' },
    { label: 'Korfball', value: 'Korfball' },
    { label: 'Touchtennis', value: 'Touchtennis' },
    { label: 'Touch Rugby', value: 'Touch Rugby' },
    { label: 'Tag Rugby', value: 'Tag Rugby' },
    { label: 'Walking Football', value: 'Walking Football' },
    { label: 'Other', value: 'Other' },
  ];

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleNext = () => {
    if (currentStep === 1) {
      if (!leagueData.name || !leagueData.code) {
        showToast('Please provide league name and code', 'error');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueData.name || !leagueData.code) {
      showToast('Please provide league name and code', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leagueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create league');
      }

      showToast('🏆 League created successfully!', 'success');

      setTimeout(() => {
        router.push('/dashboard/leagues');
      }, 1000);
    } catch (error) {
      console.error('League creation error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create league',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const CurrentStepIcon = steps[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/dashboard/leagues">
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Leagues
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                Create New League
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Set up your league in 3 easy steps
              </p>
            </div>
          </div>
        </div>

        {/* PROGRESS STEPS */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-br from-gold-500 to-orange-400 text-white'
                        : 'bg-neutral-200 text-neutral-500 dark:bg-charcoal-700 dark:text-charcoal-500'
                    }`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number
                        ? 'text-charcoal-900 dark:text-white'
                        : 'text-charcoal-500 dark:text-charcoal-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-1 flex-1 transition-colors ${
                      currentStep > step.number
                        ? 'bg-gradient-to-r from-gold-500 to-orange-400'
                        : 'bg-neutral-200 dark:bg-charcoal-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FORM CARD */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <CurrentStepIcon className="h-5 w-5 text-gold-500" />
              {steps[currentStep - 1].title}
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              {currentStep === 1 && 'Enter basic league information'}
              {currentStep === 2 && 'Choose format and visibility settings'}
              {currentStep === 3 && 'Configure league rules and limits'}
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: BASIC INFO */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* League Name */}
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      League Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={leagueData.name}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, name: e.target.value })
                      }
                      placeholder="e.g., Premier Sunday League"
                      required
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                    />
                  </div>

                  {/* League Code */}
                  <div className="space-y-2">
                    <label
                      htmlFor="code"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      League Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={leagueData.code}
                      onChange={(e) =>
                        setLeagueData({
                          ...leagueData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g., PSL2024"
                      required
                      maxLength={20}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                    />
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                      Unique identifier for your league (letters and numbers
                      only)
                    </p>
                  </div>

                  {/* Sport */}
                  <div className="space-y-2">
                    <label
                      htmlFor="sport"
                      className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      Sport
                    </label>
                    <select
                      id="sport"
                      value={leagueData.sport}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, sport: e.target.value })
                      }
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                    >
                      {sportOptions.map((sport) => (
                        <option key={sport.value} value={sport.value}>
                          {sport.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label
                      htmlFor="country"
                      className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      <MapPin className="h-4 w-4" />
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={leagueData.country}
                      onChange={(e) =>
                        setLeagueData({
                          ...leagueData,
                          country: e.target.value,
                        })
                      }
                      placeholder="e.g., United Kingdom"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                    />
                  </div>

                  {/* Season */}
                  <div className="space-y-2">
                    <label
                      htmlFor="season"
                      className="flex items-center gap-2 text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                    >
                      <Calendar className="h-4 w-4" />
                      Season
                    </label>
                    <select
                      id="season"
                      value={leagueData.season}
                      onChange={(e) =>
                        setLeagueData({
                          ...leagueData,
                          season: parseInt(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                    >
                      {seasons.map((year) => (
                        <option key={year} value={year}>
                          {year}/{year + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: FORMAT & RULES */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* League Format */}
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      League Format
                    </label>
                    <div className="grid gap-3">
                      {formatOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                            leagueData.format === option.value
                              ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                              : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-charcoal-600 dark:bg-charcoal-700 dark:hover:border-charcoal-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={option.value}
                            checked={leagueData.format === option.value}
                            onChange={(e) =>
                              setLeagueData({
                                ...leagueData,
                                format: e.target.value as LeagueFormat,
                              })
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-charcoal-900 dark:text-white">
                              {option.label}
                            </p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      League Visibility
                    </label>
                    <div className="grid gap-3">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                            leagueData.visibility === option.value
                              ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                              : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-charcoal-600 dark:bg-charcoal-700 dark:hover:border-charcoal-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value={option.value}
                            checked={leagueData.visibility === option.value}
                            onChange={(e) =>
                              setLeagueData({
                                ...leagueData,
                                visibility: e.target.value as LeagueVisibility,
                              })
                            }
                            className="mt-1"
                          />
                          <option.icon className="mt-0.5 h-5 w-5 text-gold-500" />
                          <div className="flex-1">
                            <p className="font-semibold text-charcoal-900 dark:text-white">
                              {option.label}
                            </p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Points System */}
                  <div className="space-y-4">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      Points System
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="pointsWin"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Win
                        </label>
                        <input
                          id="pointsWin"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsWin}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              pointsWin: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="pointsDraw"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Draw
                        </label>
                        <input
                          id="pointsDraw"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsDraw}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              pointsDraw: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="pointsLoss"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Loss
                        </label>
                        <input
                          id="pointsLoss"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsLoss}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              pointsLoss: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIGURATION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Team Limits */}
                  <div className="space-y-4">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      Team Limits
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="minTeams"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Minimum Teams
                        </label>
                        <input
                          id="minTeams"
                          type="number"
                          min="2"
                          max="100"
                          value={leagueData.minTeams}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              minTeams: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="maxTeams"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Maximum Teams
                        </label>
                        <input
                          id="maxTeams"
                          type="number"
                          min="2"
                          max="100"
                          value={leagueData.maxTeams}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              maxTeams: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      Registration
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-charcoal-600 dark:bg-charcoal-700">
                      <input
                        type="checkbox"
                        checked={leagueData.registrationOpen}
                        onChange={(e) =>
                          setLeagueData({
                            ...leagueData,
                            registrationOpen: e.target.checked,
                          })
                        }
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          Open Registration
                        </p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          Allow teams to request to join this league
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Bonus Points */}
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-charcoal-900 dark:text-white">
                      Bonus Points
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-charcoal-600 dark:bg-charcoal-700">
                      <input
                        type="checkbox"
                        checked={leagueData.bonusPointsEnabled}
                        onChange={(e) =>
                          setLeagueData({
                            ...leagueData,
                            bonusPointsEnabled: e.target.checked,
                          })
                        }
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-white">
                          Enable Bonus Points
                        </p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          Award bonus points for goals scored
                        </p>
                      </div>
                    </label>
                    {leagueData.bonusPointsEnabled && (
                      <div className="ml-12 space-y-2">
                        <label
                          htmlFor="bonusPointsForGoals"
                          className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                        >
                          Points per Goal
                        </label>
                        <input
                          id="bonusPointsForGoals"
                          type="number"
                          min="0"
                          max="5"
                          value={leagueData.bonusPointsForGoals}
                          onChange={(e) =>
                            setLeagueData({
                              ...leagueData,
                              bonusPointsForGoals: parseInt(e.target.value),
                            })
                          }
                          className="w-32 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-700 dark:bg-gold-900/20">
                    <div className="mb-3 flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600 dark:text-gold-400" />
                      <p className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
                        League Preview
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-charcoal-900 dark:text-white">
                        {leagueData.name || 'League Name'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color="gold">{leagueData.code || 'CODE'}</Badge>
                        <Badge variant="outline">
                          {leagueData.season}/{leagueData.season + 1}
                        </Badge>
                        <Badge variant="outline">
                          {leagueData.sport}
                        </Badge>
                        <Badge variant="outline">
                          {leagueData.format.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {leagueData.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Points: Win {leagueData.pointsWin} • Draw{' '}
                        {leagueData.pointsDraw} • Loss {leagueData.pointsLoss}
                        {leagueData.bonusPointsEnabled &&
                          ` • Bonus: ${leagueData.bonusPointsForGoals}/goal`}
                      </p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Teams: {leagueData.minTeams}-{leagueData.maxTeams} •
                        Registration:{' '}
                        {leagueData.registrationOpen ? 'Open' : 'Closed'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-charcoal-700">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard/leagues">
                    <button
                      type="button"
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
                    >
                      Cancel
                    </button>
                  </Link>
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        isSubmitting || !leagueData.name || !leagueData.code
                      }
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Create League
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
