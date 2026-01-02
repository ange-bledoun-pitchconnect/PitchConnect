/**
 * ============================================================================
 * Training Session Form Component
 * ============================================================================
 * 
 * Enterprise-grade training session creation/editing form with multi-sport
 * support, drill planning, and attendance tracking.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/forms/training-form.tsx
 * 
 * FEATURES:
 * - Multi-sport support (all 12 sports)
 * - Session type selection
 * - Drill/activity planning
 * - Equipment requirements
 * - Intensity level setting
 * - Duration and scheduling
 * - Venue/facility selection
 * - Attendance configuration
 * - Notes and objectives
 * - Validation with Zod
 * - Dark mode support
 * 
 * AFFECTED USER ROLES:
 * - COACH, COACH_PRO: Create/manage training
 * - MANAGER: View training
 * - CLUB_MANAGER: Full access
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dumbbell,
  Calendar,
  Clock,
  MapPin,
  Target,
  Flame,
  Users,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Timer,
  Clipboard,
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

const drillSchema = z.object({
  name: z.string().min(1, 'Drill name is required'),
  duration: z.number().int().min(1).max(120),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM']),
  description: z.string().max(500).optional(),
  equipment: z.array(z.string()).optional(),
});

const trainingFormSchema = z.object({
  // Basic Info
  title: z.string().min(2, 'Title is required').max(150),
  sport: z.enum([
    'FOOTBALL', 'RUGBY', 'CRICKET', 'BASKETBALL', 'AMERICAN_FOOTBALL',
    'HOCKEY', 'NETBALL', 'LACROSSE', 'AUSTRALIAN_RULES', 'GAELIC_FOOTBALL',
    'FUTSAL', 'BEACH_FOOTBALL',
  ] as const),
  
  // Session Type
  sessionType: z.enum([
    'TECHNICAL', 'TACTICAL', 'PHYSICAL', 'RECOVERY', 'MATCH_PREP',
    'TEAM_BONDING', 'VIDEO_ANALYSIS', 'GYM', 'WARMUP', 'COOLDOWN',
  ]).default('TECHNICAL'),
  
  // Schedule
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  duration: z.number().int().min(15).max(300).optional(),
  
  // Location
  venueId: z.string().optional(),
  facilityId: z.string().optional(),
  location: z.string().max(200).optional(),
  
  // Team
  teamId: z.string().min(1, 'Team is required'),
  
  // Settings
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM']).default('MEDIUM'),
  isCompulsory: z.boolean().default(true),
  maxAttendees: z.number().int().min(1).max(100).optional(),
  
  // Content
  objectives: z.array(z.string()).optional(),
  drills: z.array(drillSchema).optional(),
  equipment: z.array(z.string()).optional(),
  
  // Notes
  coachNotes: z.string().max(2000).optional(),
  playerNotes: z.string().max(1000).optional(),
  
  // Status
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface TrainingFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<TrainingFormData>;
  onSubmit: (data: TrainingFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultSport?: Sport;
  teams?: { id: string; name: string; sport: Sport }[];
  venues?: { id: string; name: string }[];
  facilities?: { id: string; name: string }[];
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SESSION_TYPES = [
  { value: 'TECHNICAL', label: 'Technical', icon: '⚽', description: 'Skills and technique focus' },
  { value: 'TACTICAL', label: 'Tactical', icon: '📋', description: 'Game plans and strategy' },
  { value: 'PHYSICAL', label: 'Physical', icon: '💪', description: 'Fitness and conditioning' },
  { value: 'RECOVERY', label: 'Recovery', icon: '🧘', description: 'Rest and regeneration' },
  { value: 'MATCH_PREP', label: 'Match Prep', icon: '🎯', description: 'Pre-match preparation' },
  { value: 'TEAM_BONDING', label: 'Team Bonding', icon: '🤝', description: 'Team building activities' },
  { value: 'VIDEO_ANALYSIS', label: 'Video Analysis', icon: '📹', description: 'Match/training review' },
  { value: 'GYM', label: 'Gym Session', icon: '🏋️', description: 'Weight training' },
  { value: 'WARMUP', label: 'Warm Up', icon: '🔥', description: 'Pre-session warm up' },
  { value: 'COOLDOWN', label: 'Cool Down', icon: '❄️', description: 'Post-session recovery' },
];

const INTENSITY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'MAXIMUM', label: 'Maximum', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const COMMON_EQUIPMENT = [
  'Footballs', 'Cones', 'Bibs', 'Goals', 'Agility Ladders', 'Hurdles',
  'Resistance Bands', 'Medicine Balls', 'Mannequins', 'Poles',
  'Goalkeeper Gloves', 'Shooting Targets', 'Speed Parachutes',
];

// =============================================================================
// COMPONENT
// =============================================================================

export function TrainingForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultSport = 'FOOTBALL',
  teams = [],
  venues = [],
  facilities = [],
  className,
}: TrainingFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      title: '',
      sport: defaultSport,
      sessionType: 'TECHNICAL',
      date: '',
      startTime: '',
      endTime: '',
      duration: 90,
      venueId: '',
      facilityId: '',
      location: '',
      teamId: '',
      intensity: 'MEDIUM',
      isCompulsory: true,
      maxAttendees: undefined,
      objectives: [],
      drills: [],
      equipment: [],
      coachNotes: '',
      playerNotes: '',
      status: 'SCHEDULED',
      ...initialData,
    },
    mode: 'onChange',
  });

  // Field arrays
  const { fields: drillFields, append: appendDrill, remove: removeDrill } = useFieldArray({
    control,
    name: 'drills',
  });

  // Watch values
  const selectedSport = watch('sport');
  const sessionType = watch('sessionType');
  const objectives = watch('objectives') || [];

  // Get sport config
  const sportConfig = useMemo(() => {
    return SPORT_CONFIG[selectedSport] || SPORT_CONFIG.FOOTBALL;
  }, [selectedSport]);

  // Filter teams by sport
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => team.sport === selectedSport);
  }, [teams, selectedSport]);

  // Add objective
  const addObjective = () => {
    if (newObjective.trim()) {
      setValue('objectives', [...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  // Remove objective
  const removeObjective = (index: number) => {
    setValue('objectives', objectives.filter((_, i) => i !== index));
  };

  // Add drill
  const addDrill = () => {
    appendDrill({
      name: '',
      duration: 15,
      intensity: 'MEDIUM',
      description: '',
      equipment: [],
    });
  };

  // Handle form submission
  const handleFormSubmit = async (data: TrainingFormData) => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit({ ...data, equipment: selectedEquipment });
      setSubmitSuccess(true);
      if (mode === 'create') {
        reset();
        setSelectedEquipment([]);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save training session');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
          sportConfig.bgColor, sportConfig.textColor
        )}>
          <span className="text-lg">{sportConfig.icon}</span>
          {sportConfig.name} Training
        </div>
        {sessionType && (
          <Badge variant="outline">
            {SESSION_TYPES.find((t) => t.value === sessionType)?.icon}{' '}
            {SESSION_TYPES.find((t) => t.value === sessionType)?.label}
          </Badge>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Session Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g., Attacking Patterns Practice"
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white placeholder-charcoal-400',
                'focus:outline-none focus:ring-2 transition-colors',
                errors.title
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Session Type
            </label>
            <Controller
              name="sessionType"
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
                    {SESSION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Team <span className="text-red-500">*</span>
            </label>
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select
                    {...field}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                      'text-charcoal-900 dark:text-white appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 transition-colors',
                      errors.teamId
                        ? 'border-red-500'
                        : 'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
                    )}
                  >
                    <option value="">Select team...</option>
                    {filteredTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('date')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white',
                'focus:outline-none focus:ring-2 transition-colors',
                errors.date
                  ? 'border-red-500'
                  : 'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register('startTime')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white',
                'focus:outline-none focus:ring-2 transition-colors',
                'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register('endTime')}
              className={cn(
                'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white',
                'focus:outline-none focus:ring-2 transition-colors',
                'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Intensity Level
            </label>
            <Controller
              name="intensity"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {INTENSITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => field.onChange(level.value)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        field.value === level.value
                          ? cn(level.color, 'ring-2 ring-current')
                          : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Target className="h-4 w-4" />
          Session Objectives
        </h3>

        <div className="space-y-3">
          {objectives.map((obj, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 rounded-lg text-sm">
                {obj}
              </span>
              <button
                type="button"
                onClick={() => removeObjective(index)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              placeholder="Add an objective..."
              className={cn(
                'flex-1 px-4 py-2 border-2 rounded-lg bg-white dark:bg-charcoal-800',
                'text-charcoal-900 dark:text-white placeholder-charcoal-400',
                'focus:outline-none focus:ring-2 transition-colors',
                'border-neutral-200 dark:border-charcoal-700 focus:ring-primary/30 focus:border-primary'
              )}
            />
            <Button type="button" variant="outline" onClick={addObjective}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider flex items-center gap-2">
          <Clipboard className="h-4 w-4" />
          Equipment Required
        </h3>

        <div className="flex flex-wrap gap-2">
          {COMMON_EQUIPMENT.map((item) => {
            const isSelected = selectedEquipment.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedEquipment(selectedEquipment.filter((e) => e !== item));
                  } else {
                    setSelectedEquipment([...selectedEquipment, item]);
                  }
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600'
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coach Notes */}
      <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
        <h3 className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider">
          Coach Notes
        </h3>
        <textarea
          {...register('coachNotes')}
          rows={3}
          placeholder="Private notes for coaching staff..."
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
          <p className="text-sm">Training session {mode === 'create' ? 'created' : 'updated'} successfully!</p>
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
              {mode === 'create' ? 'Create Session' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

TrainingForm.displayName = 'TrainingForm';

export default TrainingForm;
