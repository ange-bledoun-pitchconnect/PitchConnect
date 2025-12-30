'use client';

// ============================================================================
// 🏆 PITCHCONNECT PLAYER FORM v7.5.0
// ============================================================================
// Enhanced PlayerForm with full 12-sport support
// Features: Dynamic positions, schema alignment, validation, accessibility
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  User,
  Calendar,
  Hash,
  MapPin,
  Ruler,
  Weight,
  FileText,
  Globe,
  Shield,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  Info,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sport,
  SPORT_CONFIGS,
  SPORT_POSITIONS,
  PLAYER_STATUS_OPTIONS,
  PREFERRED_FOOT_OPTIONS,
  getSportOptions,
  getPositionsForSport,
} from '@/lib/sport-config';

// ============================================================================
// VALIDATION SCHEMA (Aligned to Prisma schema v7.5.0)
// ============================================================================

const playerFormSchema = z.object({
  // User fields
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),

  // Player fields
  sport: z.enum([
    'FOOTBALL',
    'RUGBY',
    'CRICKET',
    'BASKETBALL',
    'AMERICAN_FOOTBALL',
    'HOCKEY',
    'NETBALL',
    'LACROSSE',
    'AUSTRALIAN_RULES',
    'GAELIC_FOOTBALL',
    'FUTSAL',
    'BEACH_FOOTBALL',
  ]),
  primaryPosition: z.string().optional(),
  secondaryPosition: z.string().optional(),
  tertiaryPosition: z.string().optional(),
  jerseyNumber: z
    .number()
    .int()
    .min(1, 'Jersey number must be at least 1')
    .max(99, 'Jersey number must be at most 99')
    .optional()
    .nullable(),
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']).optional(),

  // Physical attributes
  height: z.number().min(50, 'Height must be at least 50cm').max(250, 'Height must be at most 250cm').optional().nullable(),
  weight: z.number().min(20, 'Weight must be at least 20kg').max(200, 'Weight must be at most 200kg').optional().nullable(),

  // Status & Info
  nationality: z.string().max(100).optional(),
  secondNationality: z.string().max(100).optional(),
  status: z.string().default('ACTIVE'),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),

  // Team assignment (optional)
  teamId: z.string().optional(),
  clubId: z.string().optional(),

  // Youth/Academy
  isYouth: z.boolean().default(false),
  isAcademy: z.boolean().default(false),
  youthCategory: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PlayerFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PlayerFormData>;
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  clubId?: string;
  teamId?: string;
  defaultSport?: Sport;
  showTeamAssignment?: boolean;
  teams?: { id: string; name: string; sport: Sport }[];
  compact?: boolean;
  className?: string;
}

// ============================================================================
// PLAYER FORM COMPONENT
// ============================================================================

export function PlayerForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  clubId,
  teamId,
  defaultSport = 'FOOTBALL',
  showTeamAssignment = false,
  teams = [],
  compact = false,
  className,
}: PlayerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form setup with validation
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      sport: defaultSport,
      primaryPosition: '',
      secondaryPosition: '',
      tertiaryPosition: '',
      jerseyNumber: null,
      preferredFoot: undefined,
      height: null,
      weight: null,
      nationality: '',
      secondNationality: '',
      status: 'ACTIVE',
      notes: '',
      teamId: teamId || '',
      clubId: clubId || '',
      isYouth: false,
      isAcademy: false,
      youthCategory: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  // Watch sport for dynamic position updates
  const selectedSport = watch('sport');
  const primaryPosition = watch('primaryPosition');

  // Get positions for selected sport
  const positionOptions = useMemo(() => {
    return getPositionsForSport(selectedSport as Sport);
  }, [selectedSport]);

  // Get sport config for styling
  const sportConfig = useMemo(() => {
    return SPORT_CONFIGS[selectedSport as Sport] || SPORT_CONFIGS.FOOTBALL;
  }, [selectedSport]);

  // Reset positions when sport changes
  useEffect(() => {
    if (mode === 'create') {
      setValue('primaryPosition', '');
      setValue('secondaryPosition', '');
      setValue('tertiaryPosition', '');
    }
  }, [selectedSport, mode, setValue]);

  // Handle form submission
  const handleFormSubmit = async (data: PlayerFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);

      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save player');
    }
  };

  // Form sections for better organization
  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <User className="h-4 w-4" />
        Personal Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            {...register('firstName')}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
              errors.firstName
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
            )}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-zinc-300 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            {...register('lastName')}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
              errors.lastName
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
            )}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.lastName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
              errors.email
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
            )}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-zinc-300 mb-1">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
            className={cn(
              'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
              'border-zinc-700 focus:ring-green-500/50 focus:border-green-500',
              '[color-scheme:dark]'
            )}
          />
        </div>

        {/* Nationality */}
        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-zinc-300 mb-1">
            <Globe className="h-3 w-3 inline mr-1" />
            Nationality
          </label>
          <input
            id="nationality"
            type="text"
            {...register('nationality')}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-colors"
            placeholder="e.g., English"
          />
        </div>

        {/* Second Nationality */}
        <div>
          <label htmlFor="secondNationality" className="block text-sm font-medium text-zinc-300 mb-1">
            Second Nationality
          </label>
          <input
            id="secondNationality"
            type="text"
            {...register('secondNationality')}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-colors"
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );

  const renderSportInfo = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Sport & Position
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sport Selection */}
        <div>
          <label htmlFor="sport" className="block text-sm font-medium text-zinc-300 mb-1">
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
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                    'appearance-none cursor-pointer transition-colors'
                  )}
                >
                  {getSportOptions().map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            )}
          />
          <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Positions will update based on sport
          </p>
        </div>

        {/* Primary Position */}
        <div>
          <label htmlFor="primaryPosition" className="block text-sm font-medium text-zinc-300 mb-1">
            Primary Position
          </label>
          <Controller
            name="primaryPosition"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  {...field}
                  className={cn(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                    'appearance-none cursor-pointer transition-colors'
                  )}
                >
                  <option value="">Select position...</option>
                  {positionOptions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            )}
          />
        </div>

        {/* Secondary Position */}
        <div>
          <label htmlFor="secondaryPosition" className="block text-sm font-medium text-zinc-300 mb-1">
            Secondary Position
          </label>
          <Controller
            name="secondaryPosition"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  {...field}
                  className={cn(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                    'appearance-none cursor-pointer transition-colors'
                  )}
                >
                  <option value="">Select position...</option>
                  {positionOptions
                    .filter((pos) => pos.value !== primaryPosition)
                    .map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            )}
          />
        </div>

        {/* Jersey Number */}
        <div>
          <label htmlFor="jerseyNumber" className="block text-sm font-medium text-zinc-300 mb-1">
            <Hash className="h-3 w-3 inline mr-1" />
            Jersey Number
          </label>
          <Controller
            name="jerseyNumber"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                max={99}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                className={cn(
                  'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
                  errors.jerseyNumber
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
                )}
                placeholder="1-99"
              />
            )}
          />
          {errors.jerseyNumber && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.jerseyNumber.message}
            </p>
          )}
        </div>

        {/* Preferred Foot (only for applicable sports) */}
        {['FOOTBALL', 'RUGBY', 'FUTSAL', 'BEACH_FOOTBALL', 'GAELIC_FOOTBALL'].includes(selectedSport) && (
          <div>
            <label htmlFor="preferredFoot" className="block text-sm font-medium text-zinc-300 mb-1">
              Preferred Foot
            </label>
            <Controller
              name="preferredFoot"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    value={field.value || ''}
                    className={cn(
                      'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                      'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                      'appearance-none cursor-pointer transition-colors'
                    )}
                  >
                    <option value="">Select...</option>
                    {PREFERRED_FOOT_OPTIONS.map((foot) => (
                      <option key={foot.value} value={foot.value}>
                        {foot.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>
              )}
            />
          </div>
        )}

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-300 mb-1">
            Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  {...field}
                  className={cn(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                    'appearance-none cursor-pointer transition-colors'
                  )}
                >
                  {PLAYER_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderPhysicalAttributes = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Ruler className="h-4 w-4" />
        Physical Attributes
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Height */}
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-zinc-300 mb-1">
            Height (cm)
          </label>
          <Controller
            name="height"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={50}
                max={250}
                step={0.1}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                className={cn(
                  'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
                  errors.height
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
                )}
                placeholder="e.g., 180"
              />
            )}
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.height.message}
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-zinc-300 mb-1">
            Weight (kg)
          </label>
          <Controller
            name="weight"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={20}
                max={200}
                step={0.1}
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                className={cn(
                  'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
                  errors.weight
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
                )}
                placeholder="e.g., 75"
              />
            )}
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.weight.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderTeamAssignment = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Users className="h-4 w-4" />
        Team Assignment
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Selection */}
        <div>
          <label htmlFor="teamId" className="block text-sm font-medium text-zinc-300 mb-1">
            Assign to Team
          </label>
          <Controller
            name="teamId"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  {...field}
                  className={cn(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
                    'appearance-none cursor-pointer transition-colors'
                  )}
                >
                  <option value="">No team assignment</option>
                  {teams
                    .filter((team) => team.sport === selectedSport)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            )}
          />
        </div>

        {/* Youth/Academy Flags */}
        <div className="flex items-center gap-6 pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              name="isYouth"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500/50"
                />
              )}
            />
            <span className="text-sm text-zinc-300">Youth Player</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              name="isAcademy"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500/50"
                />
              )}
            />
            <span className="text-sm text-zinc-300">Academy Player</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Additional Notes
      </h3>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className={cn(
            'w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-none',
            errors.notes
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-zinc-700 focus:ring-green-500/50 focus:border-green-500'
          )}
          placeholder="Add any additional notes about the player..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.notes.message}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">{watch('notes')?.length || 0}/2000 characters</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-8', className)}>
      {/* Sport Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          sportConfig.bgColor,
          sportConfig.textColor
        )}
      >
        <sportConfig.icon className="h-4 w-4" />
        {sportConfig.name}
      </div>

      {/* Form Sections */}
      <div className={cn('space-y-8', compact && 'space-y-6')}>
        {renderPersonalInfo()}
        <div className="border-t border-zinc-800" />
        {renderSportInfo()}
        <div className="border-t border-zinc-800" />
        {renderPhysicalAttributes()}
        {showTeamAssignment && (
          <>
            <div className="border-t border-zinc-800" />
            {renderTeamAssignment()}
          </>
        )}
        {!compact && (
          <>
            <div className="border-t border-zinc-800" />
            {renderNotes()}
          </>
        )}
      </div>

      {/* Error/Success Messages */}
      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Player {mode === 'create' ? 'created' : 'updated'} successfully!</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
              'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white',
              'focus:outline-none focus:ring-2 focus:ring-zinc-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <X className="h-4 w-4 inline mr-1" />
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all',
            'bg-gradient-to-r text-white shadow-lg',
            sportConfig.gradientFrom,
            sportConfig.gradientTo,
            'hover:shadow-xl hover:scale-[1.02]',
            'focus:outline-none focus:ring-2 focus:ring-green-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 inline mr-1" />
              {mode === 'create' ? 'Create Player' : 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default PlayerForm;
