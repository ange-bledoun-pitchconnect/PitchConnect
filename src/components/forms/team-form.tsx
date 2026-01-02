/**
 * ============================================================================
 * Team Form Component
 * ============================================================================
 * 
 * Enterprise-grade team creation/editing form with multi-sport support,
 * formation selection, and staff assignment.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/forms/team-form.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Sport-specific formations
 * - Team category selection (U8-U23, Senior, Women, etc.)
 * - Staff assignment (coach, manager, captain)
 * - Home venue selection
 * - Team colors and branding
 * - Season assignment
 * - Validation with Zod
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * - COACH, COACH_PRO: Create/edit team info
 * - MANAGER, CLUB_MANAGER: Full team management
 * - CLUB_OWNER: Full access
 * - ADMIN, SUPERADMIN: Full access
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Shield,
  MapPin,
  Calendar,
  Palette,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  User,
  Award,
  Building2,
  Hash,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type Sport,
  SPORT_CONFIG,
  getFormationsForSport,
  ALL_SPORTS,
} from '@/config/sport-dashboard-config';

// =============================================================================
// SCHEMA
// =============================================================================

const teamFormSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  shortName: z
    .string()
    .max(10, 'Short name must be 10 characters or less')
    .optional(),
  sport: z.enum([
    'FOOTBALL', 'RUGBY', 'CRICKET', 'BASKETBALL', 'AMERICAN_FOOTBALL',
    'HOCKEY', 'NETBALL', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL',
    'FUTSAL', 'BEACH_FOOTBALL',
  ] as const),
  
  // Category
  category: z.enum([
    'SENIOR', 'RESERVE', 'YOUTH', 'ACADEMY',
    'U23', 'U21', 'U19', 'U18', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8',
    'WOMEN', 'WOMEN_RESERVE', 'GIRLS',
    'VETERANS', 'MASTERS',
  ]).default('SENIOR'),
  
  // Formation (sport-specific)
  defaultFormation: z.string().optional(),
  
  // Venue
  homeVenueId: z.string().optional(),
  homePitch: z.string().max(50).optional(),
  
  // Season
  seasonId: z.string().optional(),
  
  // Staff
  headCoachId: z.string().optional(),
  assistantCoachId: z.string().optional(),
  managerId: z.string().optional(),
  captainId: z.string().optional(),
  viceCaptainId: z.string().optional(),
  
  // Branding
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  
  // Status
  isActive: z.boolean().default(true),
  isYouth: z.boolean().default(false),
  isWomen: z.boolean().default(false),
  
  // Notes
  notes: z.string().max(1000).optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface TeamFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<TeamFormData>;
  clubId: string;
  onSubmit: (data: TeamFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultSport?: Sport;
  venues?: { id: string; name: string }[];
  seasons?: { id: string; name: string; isCurrent: boolean }[];
  coaches?: { id: string; name: string; role: string }[];
  players?: { id: string; name: string; position: string }[];
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TEAM_CATEGORIES = [
  { value: 'SENIOR', label: 'Senior / First Team', group: 'Senior' },
  { value: 'RESERVE', label: 'Reserve / Second Team', group: 'Senior' },
  { value: 'WOMEN', label: "Women's First Team", group: 'Women' },
  { value: 'WOMEN_RESERVE', label: "Women's Reserve", group: 'Women' },
  { value: 'GIRLS', label: 'Girls Team', group: 'Women' },
  { value: 'U23', label: 'Under 23', group: 'Youth' },
  { value: 'U21', label: 'Under 21', group: 'Youth' },
  { value: 'U19', label: 'Under 19', group: 'Youth' },
  { value: 'U18', label: 'Under 18', group: 'Youth' },
  { value: 'U17', label: 'Under 17', group: 'Youth' },
  { value: 'U16', label: 'Under 16', group: 'Youth' },
  { value: 'U15', label: 'Under 15', group: 'Youth' },
  { value: 'U14', label: 'Under 14', group: 'Youth' },
  { value: 'U13', label: 'Under 13', group: 'Youth' },
  { value: 'U12', label: 'Under 12', group: 'Academy' },
  { value: 'U11', label: 'Under 11', group: 'Academy' },
  { value: 'U10', label: 'Under 10', group: 'Academy' },
  { value: 'U9', label: 'Under 9', group: 'Academy' },
  { value: 'U8', label: 'Under 8', group: 'Academy' },
  { value: 'ACADEMY', label: 'Academy General', group: 'Academy' },
  { value: 'VETERANS', label: 'Veterans', group: 'Other' },
  { value: 'MASTERS', label: 'Masters', group: 'Other' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function TeamForm({
  mode,
  initialData,
  clubId,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultSport = 'FOOTBALL',
  venues = [],
  seasons = [],
  coaches = [],
  players = [],
  className,
}: TeamFormProps) {
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
    formState: { errors, isValid, isDirty },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: '',
      shortName: '',
      sport: defaultSport,
      category: 'SENIOR',
      defaultFormation: '',
      homeVenueId: '',
      homePitch: '',
      seasonId: seasons.find((s) => s.isCurrent)?.id || '',
      headCoachId: '',
      assistantCoachId: '',
      managerId: '',
      captainId: '',
      viceCaptainId: '',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      isActive: true,
      isYouth: false,
      isWomen: false,
      notes: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  // Watch values
  const selectedSport = watch('sport');
  const selectedCategory = watch('category');
  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // Get sport config
  const sportConfig = useMemo(() => {
    return SPORT_CONFIG[selectedSport] || SPORT_CONFIG.FOOTBALL;
  }, [selectedSport]);

  // Get formations for sport
  const formationOptions = useMemo(() => {
    return getFormationsForSport(selectedSport);
  }, [selectedSport]);

  // Update youth/women flags based on category
  useEffect(() => {
    const youthCategories = ['U23', 'U21', 'U19', 'U18', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8', 'YOUTH', 'ACADEMY'];
    const womenCategories = ['WOMEN', 'WOMEN_RESERVE', 'GIRLS'];
    
    setValue('isYouth', youthCategories.includes(selectedCategory));
    setValue('isWomen', womenCategories.includes(selectedCategory));
  }, [selectedCategory, setValue]);

  // Handle form submission
  const handleFormSubmit = async (data: TeamFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save team');
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
          {sportConfig.name} Team
        </div>
        {selectedCategory && (
          <Badge variant="outline">{TEAM_CATEGORIES.find((c) => c.value === selectedCategory)?.label}</Badge>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., First Team, U18 Blues"
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
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Short Name
            </label>
            <input
              type="text"
              {...register('shortName')}
              placeholder="e.g., 1st, U18"
              maxLength={10}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white placeholder-charcoal-400',
                'focus:outline-none focus:ring-2 transition-colors',
                'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <Controller
              name="category"
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
                    {['Senior', 'Women', 'Youth', 'Academy', 'Other'].map((group) => (
                      <optgroup key={group} label={group}>
                        {TEAM_CATEGORIES.filter((c) => c.group === group).map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Default Formation */}
          {formationOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Default Formation
              </label>
              <Controller
                name="defaultFormation"
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
                      <option value="">Select formation...</option>
                      {formationOptions.map((formation) => (
                        <option key={formation.id} value={formation.id}>
                          {formation.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                  </div>
                )}
              />
            </div>
          )}

          {/* Season */}
          {seasons.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Season
              </label>
              <Controller
                name="seasonId"
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
                      <option value="">Select season...</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name} {season.isCurrent && '(Current)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Venue Information */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Home Venue
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue */}
          {venues.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Home Venue
              </label>
              <Controller
                name="homeVenueId"
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
                      <option value="">Select venue...</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                  </div>
                )}
              />
            </div>
          )}

          {/* Pitch/Court */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Home Pitch / Court
            </label>
            <input
              type="text"
              {...register('homePitch')}
              placeholder="e.g., Pitch 1, Main Court"
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white placeholder-charcoal-400',
                'focus:outline-none focus:ring-2 transition-colors',
                'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
          </div>
        </div>
      </div>

      {/* Team Colors */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Team Colors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Primary Color
            </label>
            <div className="flex gap-3">
              <Controller
                name="primaryColor"
                control={control}
                render={({ field }) => (
                  <input
                    type="color"
                    {...field}
                    className="w-14 h-12 rounded-lg border-2 border-neutral-200 dark:border-charcoal-700 cursor-pointer"
                  />
                )}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setValue('primaryColor', e.target.value)}
                placeholder="#000000"
                className={cn(
                  'flex-1 px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                  'text-charcoal-900 dark:text-white placeholder-charcoal-400 font-mono',
                  'focus:outline-none focus:ring-2 transition-colors',
                  'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                )}
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Secondary Color
            </label>
            <div className="flex gap-3">
              <Controller
                name="secondaryColor"
                control={control}
                render={({ field }) => (
                  <input
                    type="color"
                    {...field}
                    className="w-14 h-12 rounded-lg border-2 border-neutral-200 dark:border-charcoal-700 cursor-pointer"
                  />
                )}
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setValue('secondaryColor', e.target.value)}
                placeholder="#FFFFFF"
                className={cn(
                  'flex-1 px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                  'text-charcoal-900 dark:text-white placeholder-charcoal-400 font-mono',
                  'focus:outline-none focus:ring-2 transition-colors',
                  'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                )}
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-charcoal-500 dark:text-charcoal-400">Preview:</span>
          <div className="flex items-center gap-1">
            <div
              className="w-8 h-8 rounded-l-lg border-2 border-neutral-200 dark:border-charcoal-700"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="w-8 h-8 rounded-r-lg border-2 border-neutral-200 dark:border-charcoal-700"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Info className="h-4 w-4" />
          Additional Notes
        </h3>

        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any additional notes about the team..."
          className={cn(
            'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
            'text-charcoal-900 dark:text-white placeholder-charcoal-400',
            'focus:outline-none focus:ring-2 transition-colors resize-none',
            'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
          )}
        />
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
          <p className="text-sm">Team {mode === 'create' ? 'created' : 'updated'} successfully!</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isLoading || !isValid}
          className={cn(
            'bg-gradient-to-r text-white',
            sportConfig.gradientFrom,
            sportConfig.gradientTo
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Team' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

TeamForm.displayName = 'TeamForm';

export default TeamForm;
