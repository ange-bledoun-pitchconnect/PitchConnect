/**
 * ============================================================================
 * TRAINING SESSION FORM - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade training session creation/editing form with:
 * - Sport-specific training categories
 * - All 6 TrainingStatus values (DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED)
 * - Dual attendance mode: Auto-invite all OR manual player selection
 * - Recurring session support
 * - Equipment and focus area suggestions per sport
 * - Multi-team or club-wide sessions
 * 
 * SCHEMA ALIGNMENT:
 * - TrainingSession model fields
 * - TrainingCategory enum (sport-specific + custom)
 * - TrainingIntensity enum (RECOVERY → COMPETITIVE)
 * - TrainingStatus enum (DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED)
 * - TrainingAttendance model for player tracking
 * 
 * @version 2.0.0
 * @path src/components/training/TrainingSessionForm.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, addWeeks, setHours, setMinutes } from 'date-fns';
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  Dumbbell,
  Target,
  FileText,
  Loader2,
  Plus,
  X,
  Repeat,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/components/ui/use-toast';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES - ALIGNED WITH PRISMA SCHEMA
// =============================================================================

/** Prisma TrainingIntensity enum */
export type TrainingIntensity = 
  | 'RECOVERY'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'MAXIMUM'
  | 'COMPETITIVE';

/** Prisma TrainingCategory enum */
export type TrainingCategory =
  | 'PASSING'
  | 'SHOOTING'
  | 'DEFENDING'
  | 'POSSESSION'
  | 'SET_PIECES'
  | 'DRIBBLING'
  | 'CONDITIONING'
  | 'STRENGTH_POWER'
  | 'SPEED_AGILITY'
  | 'FLEXIBILITY'
  | 'BALANCE_COORDINATION'
  | 'ENDURANCE'
  | 'TACTICAL'
  | 'FORMATION_WORK'
  | 'GAME_STRATEGY'
  | 'TRANSITIONS'
  | 'RECOVERY'
  | 'MENTAL_PREPARATION'
  | 'VIDEO_ANALYSIS'
  | 'SPORT_SPECIFIC';

/** Prisma TrainingStatus enum - ALL 6 VALUES */
export type TrainingStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

/** Attendance mode for the session */
export type AttendanceMode = 'AUTO_ALL' | 'MANUAL_SELECT';

/** Recurrence pattern */
export type RecurrencePattern = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface TeamPlayer {
  id: string;
  playerId: string;
  jerseyNumber?: number;
  position?: string;
  player: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
}

export interface Team {
  id: string;
  name: string;
  players?: TeamPlayer[];
}

export interface TrainingSessionFormProps {
  /** Club ID */
  clubId: string;
  /** Sport for category suggestions */
  sport: Sport;
  /** Coach ID creating the session */
  coachId: string;
  /** Available teams */
  teams?: Team[];
  /** Initial data for editing */
  initialData?: Partial<TrainingSessionFormData> & { id?: string };
  /** Success callback */
  onSuccess?: () => void;
  /** Cancel callback */
  onCancel?: () => void;
}

export interface TrainingSessionFormData {
  title: string;
  description?: string;
  teamId?: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  category: TrainingCategory;
  customCategory?: string | null;
  intensity: TrainingIntensity;
  status: TrainingStatus;
  location?: string;
  venueId?: string | null;
  maxParticipants?: number | null;
  objectives: string[];
  equipment: string[];
  notes?: string;
  coachNotes?: string;
  isPublic: boolean;
  isRequired: boolean;
  // Extended fields
  attendanceMode: AttendanceMode;
  selectedPlayerIds: string[];
  recurrence: RecurrencePattern;
  recurrenceEndDate?: Date | null;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const INTENSITY_OPTIONS: Array<{
  value: TrainingIntensity;
  label: string;
  color: string;
  description: string;
}> = [
  { value: 'RECOVERY', label: 'Recovery', color: 'bg-green-500', description: 'Light activity, active recovery' },
  { value: 'LOW', label: 'Low', color: 'bg-blue-500', description: 'Technical focus, low physical demand' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-500', description: 'Balanced intensity training' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500', description: 'High physical and mental demand' },
  { value: 'MAXIMUM', label: 'Maximum', color: 'bg-red-500', description: 'Peak intensity, match simulation' },
  { value: 'COMPETITIVE', label: 'Competitive', color: 'bg-purple-500', description: 'Game-like competitive drills' },
];

const STATUS_OPTIONS: Array<{
  value: TrainingStatus;
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
}> = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-500', icon: FileText, description: 'Not yet published' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-500', icon: CalendarIcon, description: 'Confirmed and visible' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-green-500', icon: Dumbbell, description: 'Currently happening' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500', icon: CheckCircle2, description: 'Session finished' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500', icon: X, description: 'Session cancelled' },
  { value: 'POSTPONED', label: 'Postponed', color: 'bg-amber-500', icon: Clock, description: 'Rescheduled for later' },
];

const RECURRENCE_OPTIONS: Array<{ value: RecurrencePattern; label: string }> = [
  { value: 'NONE', label: 'No recurrence (single session)' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

// Sport-specific training categories with metadata
const TRAINING_CATEGORIES: Record<Sport, Array<{
  category: TrainingCategory;
  label: string;
  icon: string;
  description: string;
  equipment: string[];
  focusAreas: string[];
}>> = {
  FOOTBALL: [
    { category: 'PASSING', label: 'Passing & Distribution', icon: '⚽', description: 'Short and long passing drills', equipment: ['Footballs', 'Cones', 'Passing arcs'], focusAreas: ['Accuracy', 'Weight of pass', 'First touch'] },
    { category: 'SHOOTING', label: 'Shooting & Finishing', icon: '🥅', description: 'Goal scoring techniques', equipment: ['Footballs', 'Goals', 'Mannequins'], focusAreas: ['Shot placement', 'Power', 'Composure'] },
    { category: 'DEFENDING', label: 'Defending', icon: '🛡️', description: 'Defensive positioning and tackling', equipment: ['Footballs', 'Bibs', 'Cones'], focusAreas: ['Positioning', 'Timing', '1v1 defending'] },
    { category: 'POSSESSION', label: 'Possession & Rondos', icon: '🔄', description: 'Ball retention exercises', equipment: ['Footballs', 'Bibs', 'Cones'], focusAreas: ['Ball control', 'Movement', 'Awareness'] },
    { category: 'SET_PIECES', label: 'Set Pieces', icon: '📐', description: 'Corners, free kicks, penalties', equipment: ['Footballs', 'Mannequins', 'Goals'], focusAreas: ['Delivery', 'Movement', 'Finishing'] },
    { category: 'TACTICAL', label: 'Tactical Work', icon: '📋', description: 'Formation and strategy sessions', equipment: ['Tactics board', 'Bibs', 'Cones'], focusAreas: ['Shape', 'Transitions', 'Press triggers'] },
    { category: 'CONDITIONING', label: 'Conditioning', icon: '🏃', description: 'Fitness and endurance', equipment: ['Cones', 'Ladders', 'Hurdles'], focusAreas: ['Endurance', 'Speed', 'Agility'] },
    { category: 'RECOVERY', label: 'Recovery Session', icon: '🧘', description: 'Active recovery and regeneration', equipment: ['Foam rollers', 'Yoga mats', 'Resistance bands'], focusAreas: ['Flexibility', 'Muscle recovery', 'Mental reset'] },
  ],
  RUGBY: [
    { category: 'PASSING', label: 'Passing & Handling', icon: '🏉', description: 'Ball handling and distribution', equipment: ['Rugby balls', 'Cones', 'Passing gates'], focusAreas: ['Spin pass', 'Pop pass', 'Offloading'] },
    { category: 'TACTICAL', label: 'Lineouts & Scrums', icon: '📐', description: 'Set piece work', equipment: ['Scrum machine', 'Lineout poles'], focusAreas: ['Timing', 'Calls', 'Technique'] },
    { category: 'DEFENDING', label: 'Tackling & Defence', icon: '🛡️', description: 'Defensive systems and technique', equipment: ['Tackle bags', 'Hit shields', 'Cones'], focusAreas: ['Tackle technique', 'Line speed', 'Communication'] },
    { category: 'CONDITIONING', label: 'Conditioning', icon: '🏃', description: 'Rugby-specific fitness', equipment: ['Sleds', 'Tyres', 'Cones'], focusAreas: ['Power', 'Endurance', 'Speed'] },
    { category: 'GAME_STRATEGY', label: 'Attack Patterns', icon: '⚡', description: 'Attacking structures and plays', equipment: ['Rugby balls', 'Bibs', 'Cones'], focusAreas: ['Phase play', 'Width', 'Support lines'] },
    { category: 'RECOVERY', label: 'Recovery', icon: '🧘', description: 'Pool recovery and regeneration', equipment: ['Pool access', 'Foam rollers'], focusAreas: ['Muscle recovery', 'Flexibility'] },
  ],
  CRICKET: [
    { category: 'SPORT_SPECIFIC', label: 'Batting Practice', icon: '🏏', description: 'Net sessions and drills', equipment: ['Cricket balls', 'Bats', 'Nets', 'Bowling machine'], focusAreas: ['Technique', 'Shot selection', 'Footwork'] },
    { category: 'SPORT_SPECIFIC', label: 'Bowling Practice', icon: '🎯', description: 'Pace and spin bowling', equipment: ['Cricket balls', 'Stumps', 'Markers'], focusAreas: ['Line and length', 'Variations', 'Run-up'] },
    { category: 'SPORT_SPECIFIC', label: 'Fielding Drills', icon: '🧤', description: 'Catching and ground fielding', equipment: ['Cricket balls', 'Catching cradles', 'Cones'], focusAreas: ['Catching', 'Throwing', 'Ground fielding'] },
    { category: 'TACTICAL', label: 'Match Scenarios', icon: '📋', description: 'Game situation practice', equipment: ['Full kit'], focusAreas: ['Decision making', 'Pressure handling'] },
    { category: 'CONDITIONING', label: 'Fitness', icon: '🏃', description: 'Cricket-specific conditioning', equipment: ['Cones', 'Agility ladders'], focusAreas: ['Speed', 'Agility', 'Endurance'] },
  ],
  BASKETBALL: [
    { category: 'SHOOTING', label: 'Shooting Drills', icon: '🏀', description: 'Form shooting and game shots', equipment: ['Basketballs', 'Shot clock'], focusAreas: ['Form', 'Range', 'Off-dribble'] },
    { category: 'DRIBBLING', label: 'Ball Handling', icon: '⛹️', description: 'Dribbling and handles', equipment: ['Basketballs', 'Cones', 'Dribble goggles'], focusAreas: ['Control', 'Speed', 'Creativity'] },
    { category: 'DEFENDING', label: 'Defense', icon: '🛡️', description: 'Individual and team defense', equipment: ['Basketballs', 'Cones'], focusAreas: ['Stance', 'Help defense', 'Closeouts'] },
    { category: 'TACTICAL', label: 'Plays & Sets', icon: '📋', description: 'Offensive and defensive schemes', equipment: ['Whiteboard', 'Basketballs'], focusAreas: ['Execution', 'Timing', 'Reads'] },
    { category: 'TRANSITIONS', label: 'Fast Break', icon: '⚡', description: 'Transition offense and defense', equipment: ['Basketballs'], focusAreas: ['Speed', 'Decision making', 'Finishing'] },
    { category: 'CONDITIONING', label: 'Conditioning', icon: '🏃', description: 'Basketball fitness', equipment: ['Cones', 'Ladders'], focusAreas: ['Endurance', 'Lateral quickness', 'Vertical'] },
  ],
  NETBALL: [
    { category: 'PASSING', label: 'Passing', icon: '🏐', description: 'Various passing techniques', equipment: ['Netballs', 'Cones'], focusAreas: ['Accuracy', 'Speed', 'Types'] },
    { category: 'SHOOTING', label: 'Shooting', icon: '🎯', description: 'Goal shooting practice', equipment: ['Netballs', 'Goals'], focusAreas: ['Technique', 'Pressure shooting'] },
    { category: 'DEFENDING', label: 'Defending', icon: '🛡️', description: 'Defensive positioning', equipment: ['Netballs', 'Bibs'], focusAreas: ['Interceptions', 'Rebounds', 'Pressure'] },
    { category: 'TACTICAL', label: 'Centre Pass Plays', icon: '📋', description: 'Set plays from centre', equipment: ['Netballs', 'Cones'], focusAreas: ['Timing', 'Movement', 'Options'] },
    { category: 'CONDITIONING', label: 'Fitness', icon: '🏃', description: 'Netball-specific conditioning', equipment: ['Cones', 'Ladders'], focusAreas: ['Agility', 'Speed', 'Endurance'] },
  ],
  // Add more sports as needed - these can be extended
  AMERICAN_FOOTBALL: [
    { category: 'TACTICAL', label: 'Playbook', icon: '📋', description: 'Learning plays and formations', equipment: ['Playbook', 'Whiteboard'], focusAreas: ['Assignments', 'Reads', 'Audibles'] },
    { category: 'CONDITIONING', label: 'Conditioning', icon: '🏃', description: 'Position-specific fitness', equipment: ['Sleds', 'Cones', 'Agility ladders'], focusAreas: ['Speed', 'Power', 'Endurance'] },
  ],
  HOCKEY: [
    { category: 'SPORT_SPECIFIC', label: 'Stick Skills', icon: '🏑', description: 'Ball control and dribbling', equipment: ['Hockey sticks', 'Balls', 'Cones'], focusAreas: ['Control', '3D skills', 'Elimination'] },
    { category: 'TACTICAL', label: 'Set Pieces', icon: '📋', description: 'Corners and free hits', equipment: ['Full kit'], focusAreas: ['Routines', 'Injection', 'Deflections'] },
  ],
  LACROSSE: [
    { category: 'PASSING', label: 'Stick Work', icon: '🥍', description: 'Passing and catching', equipment: ['Lacrosse sticks', 'Balls', 'Goals'], focusAreas: ['Accuracy', 'Quick release', 'Ground balls'] },
  ],
  AUSTRALIAN_RULES: [
    { category: 'SPORT_SPECIFIC', label: 'Kicking', icon: '🏈', description: 'Various kicking techniques', equipment: ['AFL balls', 'Goals'], focusAreas: ['Drop punt', 'Torpedo', 'Snap'] },
    { category: 'SPORT_SPECIFIC', label: 'Marking', icon: '✋', description: 'Contested and uncontested marks', equipment: ['AFL balls'], focusAreas: ['Timing', 'Body position', 'Courage'] },
  ],
  GAELIC_FOOTBALL: [
    { category: 'SPORT_SPECIFIC', label: 'Kick Passing', icon: '⚽', description: 'Kick pass accuracy', equipment: ['GAA balls', 'Goals'], focusAreas: ['Technique', 'Distance', 'Accuracy'] },
  ],
  FUTSAL: [
    { category: 'POSSESSION', label: 'Ball Control', icon: '⚽', description: 'Close control in tight spaces', equipment: ['Futsal balls', 'Cones'], focusAreas: ['First touch', 'Sole control', 'Turns'] },
    { category: 'TACTICAL', label: 'Rotations', icon: '🔄', description: 'Movement patterns', equipment: ['Futsal balls', 'Bibs'], focusAreas: ['3-1 rotation', '4-0 movement', 'Power play'] },
  ],
  BEACH_FOOTBALL: [
    { category: 'SPORT_SPECIFIC', label: 'Sand Techniques', icon: '🏖️', description: 'Beach-specific skills', equipment: ['Beach footballs'], focusAreas: ['Bicycle kicks', 'Volleys', 'Headers'] },
  ],
};

// Get categories for a sport (with fallback)
function getTrainingCategoriesForSport(sport: Sport) {
  return TRAINING_CATEGORIES[sport] || TRAINING_CATEGORIES.FOOTBALL;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const trainingSessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  teamId: z.string().nullable().optional(),
  date: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  category: z.string(),
  customCategory: z.string().nullable().optional(),
  intensity: z.string(),
  status: z.string(),
  location: z.string().optional(),
  venueId: z.string().nullable().optional(),
  maxParticipants: z.number().nullable().optional(),
  objectives: z.array(z.string()),
  equipment: z.array(z.string()),
  notes: z.string().optional(),
  coachNotes: z.string().optional(),
  isPublic: z.boolean(),
  isRequired: z.boolean(),
  attendanceMode: z.enum(['AUTO_ALL', 'MANUAL_SELECT']),
  selectedPlayerIds: z.array(z.string()),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  recurrenceEndDate: z.date().nullable().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  disabled?: boolean;
}

function TagInput({ value, onChange, placeholder, suggestions = [], disabled }: TagInputProps) {
  const [input, setInput] = useState('');
  
  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };
  
  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button type="button" variant="outline" onClick={addTag} disabled={disabled}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {item}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-destructive"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {suggestions
          .filter(s => !value.includes(s))
          .slice(0, 5)
          .map((suggestion, index) => (
            <Badge
              key={`suggestion-${index}`}
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => onChange([...value, suggestion])}
            >
              + {suggestion}
            </Badge>
          ))}
      </div>
    </div>
  );
}

interface PlayerSelectorProps {
  players: TeamPlayer[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function PlayerSelector({ players, selectedIds, onChange, disabled }: PlayerSelectorProps) {
  const togglePlayer = (playerId: string) => {
    if (selectedIds.includes(playerId)) {
      onChange(selectedIds.filter(id => id !== playerId));
    } else {
      onChange([...selectedIds, playerId]);
    }
  };
  
  const selectAll = () => {
    onChange(players.map(p => p.playerId));
  };
  
  const deselectAll = () => {
    onChange([]);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {selectedIds.length} of {players.length} selected
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={disabled}>
            <UserCheck className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={deselectAll} disabled={disabled}>
            <UserX className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
        {players.map(tp => {
          const isSelected = selectedIds.includes(tp.playerId);
          return (
            <div
              key={tp.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                isSelected
                  ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              onClick={() => !disabled && togglePlayer(tp.playerId)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => togglePlayer(tp.playerId)}
                disabled={disabled}
              />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-xs font-bold">
                {tp.jerseyNumber || tp.player.user.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {tp.player.user.firstName} {tp.player.user.lastName}
                </p>
                {tp.position && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tp.position}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TrainingSessionForm({
  clubId,
  sport,
  coachId,
  teams = [],
  initialData,
  onSuccess,
  onCancel,
}: TrainingSessionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!initialData?.id;
  
  // Get sport-specific categories
  const trainingCategories = useMemo(() => getTrainingCategoriesForSport(sport), [sport]);
  
  // Default values
  const defaultStartTime = new Date();
  defaultStartTime.setMinutes(0);
  defaultStartTime.setSeconds(0);
  
  const defaultEndTime = new Date(defaultStartTime);
  defaultEndTime.setMinutes(defaultEndTime.getMinutes() + 90);
  
  const form = useForm<TrainingSessionFormData>({
    resolver: zodResolver(trainingSessionSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      teamId: initialData?.teamId || null,
      date: initialData?.date || new Date(),
      startTime: initialData?.startTime || defaultStartTime,
      endTime: initialData?.endTime || defaultEndTime,
      category: initialData?.category || 'CONDITIONING',
      customCategory: initialData?.customCategory || null,
      intensity: initialData?.intensity || 'MEDIUM',
      status: initialData?.status || 'SCHEDULED',
      location: initialData?.location || '',
      venueId: initialData?.venueId || null,
      maxParticipants: initialData?.maxParticipants || null,
      objectives: initialData?.objectives || [],
      equipment: initialData?.equipment || [],
      notes: initialData?.notes || '',
      coachNotes: initialData?.coachNotes || '',
      isPublic: initialData?.isPublic ?? false,
      isRequired: initialData?.isRequired ?? true,
      attendanceMode: 'AUTO_ALL',
      selectedPlayerIds: initialData?.selectedPlayerIds || [],
      recurrence: 'NONE',
      recurrenceEndDate: null,
    },
  });
  
  const watchTeamId = form.watch('teamId');
  const watchCategory = form.watch('category');
  const watchAttendanceMode = form.watch('attendanceMode');
  const watchRecurrence = form.watch('recurrence');
  
  // Get selected team's players
  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === watchTeamId);
  }, [teams, watchTeamId]);
  
  const teamPlayers = selectedTeam?.players || [];
  
  // Get category config for suggestions
  const selectedCategoryConfig = useMemo(() => {
    return trainingCategories.find(c => c.category === watchCategory);
  }, [trainingCategories, watchCategory]);
  
  // Handle form submission
  const onSubmit = async (data: TrainingSessionFormData) => {
    setIsSubmitting(true);
    
    try {
      const endpoint = isEditing
        ? `/api/clubs/${clubId}/training/${initialData?.id}`
        : `/api/clubs/${clubId}/training`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // If attendance mode is AUTO_ALL, include all team players
      const playerIds = data.attendanceMode === 'AUTO_ALL' && teamPlayers.length > 0
        ? teamPlayers.map(p => p.playerId)
        : data.selectedPlayerIds;
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clubId,
          coachId,
          invitedPlayerIds: playerIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }
      
      toast({
        title: isEditing ? 'Session Updated' : 'Session Created',
        description: `Training session "${data.title}" has been ${isEditing ? 'updated' : 'scheduled'}.`,
      });
      
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Save training session error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save session',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Monday Morning Training"
              {...form.register('title')}
              disabled={isSubmitting}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          {/* Team Selection */}
          <div className="space-y-2">
            <Label>Team</Label>
            <Controller
              name="teamId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || 'club-wide'}
                  onValueChange={(val) => field.onChange(val === 'club-wide' ? null : val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team or club-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club-wide">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Club-wide (All Teams)
                      </span>
                    </SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave as club-wide for training accessible to all teams
            </p>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the session objectives..."
              rows={3}
              {...form.register('description')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(field.value, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label>Status *</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <span className={cn('w-2 h-2 rounded-full', option.color)} />
                              {option.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {STATUS_OPTIONS.find(s => s.value === form.watch('status'))?.description}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Controller
                name="startTime"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="time"
                    value={format(field.value, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(field.value);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      field.onChange(newDate);
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
            
            {/* End Time */}
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Controller
                name="endTime"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="time"
                    value={format(field.value, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(field.value);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      field.onChange(newDate);
                    }}
                    disabled={isSubmitting}
                  />
                )}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                className="pl-10"
                placeholder="e.g., Main Training Ground, Pitch 1"
                {...form.register('location')}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Recurrence */}
          <Accordion type="single" collapsible>
            <AccordionItem value="recurrence">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Recurring Session
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Recurrence Pattern</Label>
                  <Controller
                    name="recurrence"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRENCE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                {watchRecurrence !== 'NONE' && (
                  <div className="space-y-2">
                    <Label>End Date for Recurrence</Label>
                    <Controller
                      name="recurrenceEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              disabled={isSubmitting}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, 'PPP') : 'Select end date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={(date) => field.onChange(date || null)}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Training Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Training Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Training Category *</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingCategories.map(cat => (
                      <SelectItem key={cat.category} value={cat.category}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedCategoryConfig && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCategoryConfig.description}
              </p>
            )}
          </div>
          
          {/* Intensity */}
          <div className="space-y-2">
            <Label>Intensity *</Label>
            <Controller
              name="intensity"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENSITY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn('w-3 h-3 rounded-full', option.color)} />
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {INTENSITY_OPTIONS.find(i => i.value === form.watch('intensity'))?.description}
            </p>
          </div>
          
          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="maxParticipants"
                type="number"
                className="pl-10"
                placeholder="Leave empty for unlimited"
                {...form.register('maxParticipants', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Attendance */}
      {selectedTeam && teamPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance
            </CardTitle>
            <CardDescription>
              Choose how to manage attendance for this session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Attendance Mode */}
            <div className="space-y-2">
              <Label>Attendance Mode</Label>
              <Controller
                name="attendanceMode"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO_ALL">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Auto-invite all team players
                        </span>
                      </SelectItem>
                      <SelectItem value="MANUAL_SELECT">
                        <span className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Manually select players
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            {/* Player Selection (for manual mode) */}
            {watchAttendanceMode === 'MANUAL_SELECT' && (
              <Controller
                name="selectedPlayerIds"
                control={form.control}
                render={({ field }) => (
                  <PlayerSelector
                    players={teamPlayers}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            )}
            
            {watchAttendanceMode === 'AUTO_ALL' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  All {teamPlayers.length} team players will be invited to this session
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Equipment & Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Equipment & Focus Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment */}
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Controller
              name="equipment"
              control={form.control}
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add equipment..."
                  suggestions={selectedCategoryConfig?.equipment || []}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
          
          {/* Objectives / Focus Areas */}
          <div className="space-y-2">
            <Label>Session Objectives</Label>
            <Controller
              name="objectives"
              control={form.control}
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add objective..."
                  suggestions={selectedCategoryConfig?.focusAreas || []}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Players</Label>
            <Textarea
              id="notes"
              placeholder="Any notes for players attending this session..."
              rows={3}
              {...form.register('notes')}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Coach Notes (private) */}
          <div className="space-y-2">
            <Label htmlFor="coachNotes">Coach Notes (Private)</Label>
            <Textarea
              id="coachNotes"
              placeholder="Private notes visible only to coaches..."
              rows={3}
              {...form.register('coachNotes')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isRequired">Required Attendance</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Players must attend unless excused
              </p>
            </div>
            <Controller
              name="isRequired"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="isRequired"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublic">Public Session</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Visible to fans and public
              </p>
            </div>
            <Controller
              name="isPublic"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="isPublic"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onCancel?.() || router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : isEditing ? (
            'Update Session'
          ) : (
            'Create Session'
          )}
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default TrainingSessionForm;