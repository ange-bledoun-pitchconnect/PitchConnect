/**
 * ============================================================================
 * League Form Component
 * ============================================================================
 * 
 * Enterprise-grade league creation/editing form with multi-sport support,
 * season configuration, and competition settings.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/forms/league-form.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - League format configuration
 * - Points system customization
 * - Season/year settings
 * - Region/country assignment
 * - Promotion/relegation settings
 * - Playoff configuration
 * - Validation with Zod
 * - Dark mode support
 * 
 * AFFECTED USER ROLES:
 * - LEAGUE_ADMIN: Full access
 * - ADMIN, SUPERADMIN: Full access
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Trophy,
  Calendar,
  MapPin,
  Settings,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Hash,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type Sport,
  SPORT_CONFIG,
  ALL_SPORTS,
} from '@/config/sport-dashboard-config';

// =============================================================================
// SCHEMA
// =============================================================================

const leagueFormSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'League name is required').max(150),
  shortName: z.string().max(20).optional(),
  sport: z.enum([
    'FOOTBALL', 'RUGBY', 'CRICKET', 'BASKETBALL', 'AMERICAN_FOOTBALL',
    'HOCKEY', 'NETBALL', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL',
    'FUTSAL', 'BEACH_FOOTBALL',
  ] as const),
  
  // Classification
  tier: z.number().int().min(1).max(10).default(1),
  division: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
  country: z.string().length(2, 'Use 2-letter country code').optional(),
  
  // Season
  seasonName: z.string().max(50).optional(),
  seasonYear: z.number().int().min(2000).max(2100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  
  // Format
  format: z.enum(['LEAGUE', 'CUP', 'TOURNAMENT', 'PLAYOFF', 'HYBRID']).default('LEAGUE'),
  rounds: z.number().int().min(1).max(100).optional(),
  legsPerMatch: z.enum(['SINGLE', 'HOME_AWAY']).default('SINGLE'),
  
  // Points System
  pointsForWin: z.number().int().min(0).max(10).default(3),
  pointsForDraw: z.number().int().min(0).max(10).default(1),
  pointsForLoss: z.number().int().min(0).max(10).default(0),
  
  // Promotion/Relegation
  promotionSpots: z.number().int().min(0).max(10).default(0),
  playoffSpots: z.number().int().min(0).max(10).default(0),
  relegationSpots: z.number().int().min(0).max(10).default(0),
  
  // Settings
  hasPlayoffs: z.boolean().default(false),
  hasExtraTime: z.boolean().default(false),
  hasPenalties: z.boolean().default(false),
  hasGoldenGoal: z.boolean().default(false),
  
  // Status
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  
  // Description
  description: z.string().max(2000).optional(),
  rules: z.string().max(5000).optional(),
});

type LeagueFormData = z.infer<typeof leagueFormSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface LeagueFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<LeagueFormData>;
  onSubmit: (data: LeagueFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultSport?: Sport;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FORMAT_OPTIONS = [
  { value: 'LEAGUE', label: 'League (Round Robin)', description: 'Teams play each other once or twice' },
  { value: 'CUP', label: 'Cup (Knockout)', description: 'Single elimination tournament' },
  { value: 'TOURNAMENT', label: 'Tournament', description: 'Group stage + knockout rounds' },
  { value: 'PLAYOFF', label: 'Playoff', description: 'Seeded bracket system' },
  { value: 'HYBRID', label: 'Hybrid', description: 'League stage + playoffs' },
];

const COUNTRY_CODES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'Spain' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function LeagueForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultSport = 'FOOTBALL',
  className,
}: LeagueFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<LeagueFormData>({
    resolver: zodResolver(leagueFormSchema),
    defaultValues: {
      name: '',
      shortName: '',
      sport: defaultSport,
      tier: 1,
      division: '',
      region: '',
      country: 'GB',
      seasonName: '',
      seasonYear: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      format: 'LEAGUE',
      rounds: 2,
      legsPerMatch: 'HOME_AWAY',
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      promotionSpots: 2,
      playoffSpots: 4,
      relegationSpots: 3,
      hasPlayoffs: false,
      hasExtraTime: false,
      hasPenalties: false,
      hasGoldenGoal: false,
      isActive: true,
      isPublic: true,
      description: '',
      rules: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  // Watch values
  const selectedSport = watch('sport');
  const selectedFormat = watch('format');
  const hasPlayoffs = watch('hasPlayoffs');

  // Get sport config
  const sportConfig = useMemo(() => {
    return SPORT_CONFIG[selectedSport] || SPORT_CONFIG.FOOTBALL;
  }, [selectedSport]);

  // Check if sport has draws
  const sportHasDraws = useMemo(() => {
    return sportConfig.hasDraws !== false;
  }, [sportConfig]);

  // Handle form submission
  const handleFormSubmit = async (data: LeagueFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save league');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-8', className)}>
      {/* Sport Badge */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
          sportConfig.bgColor, sportConfig.textColor
        )}>
          <span className="text-lg">{sportConfig.icon}</span>
          {sportConfig.name} League
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          League Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* League Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              League Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Premier League, Championship Division"
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white placeholder-charcoal-400',
                'focus:outline-none focus:ring-2 transition-colors',
                errors.name
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Sport */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Sport <span className="text-red-500">*</span>
            </label>
            <Controller
              name="sport"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                      'text-charcoal-900 dark:text-white appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 transition-colors',
                      'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                    )}
                  >
                    {ALL_SPORTS.map((sport) => (
                      <option key={sport} value={sport}>
                        {SPORT_CONFIG[sport].icon} {SPORT_CONFIG[sport].name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Competition Format
            </label>
            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                      'text-charcoal-900 dark:text-white appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 transition-colors',
                      'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                    )}
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Tier */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Tier Level
            </label>
            <Controller
              name="tier"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                  )}
                />
              )}
            />
            <p className="mt-1 text-xs text-charcoal-500">1 = Top tier, 10 = Lowest tier</p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Country
            </label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                      'text-charcoal-900 dark:text-white appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 transition-colors',
                      'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                    )}
                  >
                    <option value="">Select country...</option>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Points System */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Points System
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Points for Win
            </label>
            <Controller
              name="pointsForWin"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white text-center font-bold text-lg',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 focus:ring-green-300'
                  )}
                />
              )}
            />
          </div>

          {sportHasDraws && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Points for Draw
              </label>
              <Controller
                name="pointsForDraw"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    min={0}
                    max={10}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                      'text-charcoal-900 dark:text-white text-center font-bold text-lg',
                      'focus:outline-none focus:ring-2 transition-colors',
                      'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 focus:ring-amber-300'
                    )}
                  />
                )}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Points for Loss
            </label>
            <Controller
              name="pointsForLoss"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white text-center font-bold text-lg',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 focus:ring-red-300'
                  )}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Promotion/Relegation */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Promotion & Relegation
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              Promotion Spots
            </label>
            <Controller
              name="promotionSpots"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-blue-200 dark:border-blue-800 focus:ring-blue-300'
                  )}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1 flex items-center gap-1">
              <Award className="h-3 w-3 text-purple-500" />
              Playoff Spots
            </label>
            <Controller
              name="playoffSpots"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-purple-200 dark:border-purple-800 focus:ring-purple-300'
                  )}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Relegation Spots
            </label>
            <Controller
              name="relegationSpots"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min={0}
                  max={10}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                    'text-charcoal-900 dark:text-white',
                    'focus:outline-none focus:ring-2 transition-colors',
                    'border-red-200 dark:border-red-800 focus:ring-red-300'
                  )}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">League {mode === 'create' ? 'created' : 'updated'} successfully!</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className={cn('bg-gradient-to-r text-white', sportConfig.gradientFrom, sportConfig.gradientTo)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create League' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

LeagueForm.displayName = 'LeagueForm';

export default LeagueForm;
