// ============================================================================
// 🏋️ TRAINING SESSION FORM - PitchConnect v7.3.0
// ============================================================================
// Form component for creating and editing training sessions
// Supports hybrid architecture: club-wide or team-specific
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import {
  CreateTrainingSessionSchema,
  type CreateTrainingSessionInput,
} from '@/schemas/training.schema';
import { createTrainingSession, updateTrainingSession } from '@/actions/training.actions';
import { getSportConfig, getTrainingCategoriesForSport } from '@/config/sport-config';
import type { Sport, TrainingCategory, TrainingIntensity, TrainingStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TrainingSessionFormProps {
  clubId: string;
  sport: Sport;
  coachId: string;
  teams?: Array<{ id: string; name: string }>;
  initialData?: Partial<CreateTrainingSessionInput> & { id?: string };
  onSuccess?: () => void;
}

// ============================================================================
// INTENSITY OPTIONS
// ============================================================================

const INTENSITY_OPTIONS: Array<{ value: TrainingIntensity; label: string; color: string }> = [
  { value: 'RECOVERY', label: 'Recovery', color: 'bg-green-500' },
  { value: 'LOW', label: 'Low', color: 'bg-blue-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-500' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500' },
  { value: 'MAXIMUM', label: 'Maximum', color: 'bg-red-500' },
  { value: 'COMPETITIVE', label: 'Competitive', color: 'bg-purple-500' },
];

const STATUS_OPTIONS: Array<{ value: TrainingStatus; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TrainingSessionForm({
  clubId,
  sport,
  coachId,
  teams = [],
  initialData,
  onSuccess,
}: TrainingSessionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [equipment, setEquipment] = useState<string[]>(initialData?.equipment || []);
  const [focusAreas, setFocusAreas] = useState<string[]>(initialData?.focusAreas || []);
  const [newEquipment, setNewEquipment] = useState('');
  const [newFocusArea, setNewFocusArea] = useState('');

  // Get sport-specific training categories
  const sportConfig = getSportConfig(sport);
  const trainingCategories = getTrainingCategoriesForSport(sport);

  const isEditing = !!initialData?.id;

  const form = useForm<CreateTrainingSessionInput>({
    resolver: zodResolver(CreateTrainingSessionSchema),
    defaultValues: {
      clubId,
      coachId,
      teamId: initialData?.teamId || null,
      name: initialData?.name || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime || new Date(),
      endTime: initialData?.endTime || new Date(Date.now() + 90 * 60 * 1000), // 90 min default
      intensity: initialData?.intensity || 'MEDIUM',
      category: initialData?.category || 'CONDITIONING',
      customCategory: initialData?.customCategory || null,
      location: initialData?.location || '',
      maxParticipants: initialData?.maxParticipants || null,
      notes: initialData?.notes || '',
      status: initialData?.status || 'SCHEDULED',
      equipment: initialData?.equipment || [],
      focusAreas: initialData?.focusAreas || [],
    },
  });

  const watchCategory = form.watch('category');
  const watchTeamId = form.watch('teamId');

  // Get selected category config
  const selectedCategoryConfig = trainingCategories.find(
    (c) => c.category === watchCategory || c.customKey === form.watch('customCategory')
  );

  // Handle form submission
  const onSubmit = (data: CreateTrainingSessionInput) => {
    startTransition(async () => {
      try {
        // Add equipment and focus areas
        data.equipment = equipment;
        data.focusAreas = focusAreas;

        let result;
        if (isEditing && initialData?.id) {
          result = await updateTrainingSession(initialData.id, data);
        } else {
          result = await createTrainingSession(data);
        }

        if (result.success) {
          toast({
            title: isEditing ? 'Session updated' : 'Session created',
            description: `Training session "${data.name}" has been ${isEditing ? 'updated' : 'scheduled'}.`,
          });
          onSuccess?.();
          router.refresh();
        } else {
          toast({
            title: 'Error',
            description: result.error?.message || 'Failed to save training session',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    });
  };

  // Handle adding equipment
  const addEquipment = () => {
    if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
      setEquipment([...equipment, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  // Handle adding focus area
  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea('');
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
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Session Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Monday Morning Training"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Team Selection (Optional - for team-specific training) */}
          <div className="space-y-2">
            <Label htmlFor="teamId">Team (Optional)</Label>
            <Select
              value={watchTeamId || 'club-wide'}
              onValueChange={(value) =>
                form.setValue('teamId', value === 'club-wide' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team or leave for club-wide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="club-wide">Club-wide (All Teams)</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave empty for club-wide training or select a specific team
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
            {/* Start Date/Time */}
            <div className="space-y-2">
              <Label>Start Date & Time *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.watch('startTime'), 'PPP p')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('startTime')}
                    onSelect={(date) => {
                      if (date) {
                        const current = form.watch('startTime');
                        date.setHours(current.getHours(), current.getMinutes());
                        form.setValue('startTime', date);
                      }
                    }}
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={format(form.watch('startTime'), 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = new Date(form.watch('startTime'));
                        date.setHours(parseInt(hours), parseInt(minutes));
                        form.setValue('startTime', date);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date/Time */}
            <div className="space-y-2">
              <Label>End Date & Time *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.watch('endTime'), 'PPP p')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('endTime')}
                    onSelect={(date) => {
                      if (date) {
                        const current = form.watch('endTime');
                        date.setHours(current.getHours(), current.getMinutes());
                        form.setValue('endTime', date);
                      }
                    }}
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={format(form.watch('endTime'), 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = new Date(form.watch('endTime'));
                        date.setHours(parseInt(hours), parseInt(minutes));
                        form.setValue('endTime', date);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                className="pl-10"
                placeholder="e.g., Main Training Ground, Pitch 1"
                {...form.register('location')}
              />
            </div>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                className="pl-10"
                placeholder="Leave empty for unlimited"
                {...form.register('maxParticipants', { valueAsNumber: true })}
              />
            </div>
          </div>
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
            <Select
              value={watchCategory}
              onValueChange={(value) => {
                form.setValue('category', value as TrainingCategory);
                // Find if it's a custom category
                const cat = trainingCategories.find((c) => c.category === value || c.customKey === value);
                if (cat?.category === 'SPORT_SPECIFIC' && cat.customKey) {
                  form.setValue('customCategory', cat.customKey);
                } else {
                  form.setValue('customCategory', null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {trainingCategories.map((cat) => (
                  <SelectItem
                    key={cat.customKey || cat.category}
                    value={cat.category === 'SPORT_SPECIFIC' ? cat.customKey! : cat.category}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategoryConfig && (
              <p className="text-xs text-muted-foreground">{selectedCategoryConfig.description}</p>
            )}
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <Label>Intensity *</Label>
            <Select
              value={form.watch('intensity')}
              onValueChange={(value) => form.setValue('intensity', value as TrainingIntensity)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intensity" />
              </SelectTrigger>
              <SelectContent>
                {INTENSITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${option.color}`} />
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as TrainingStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            <div className="flex gap-2">
              <Input
                placeholder="Add equipment..."
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEquipment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipment.map((item, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => setEquipment(equipment.filter((_, i) => i !== index))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedCategoryConfig?.equipment?.map((item, index) => (
                !equipment.includes(item) && (
                  <Badge
                    key={`suggested-${index}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => setEquipment([...equipment, item])}
                  >
                    + {item}
                  </Badge>
                )
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <Label>Focus Areas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add focus area..."
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFocusArea();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addFocusArea}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((item, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => setFocusAreas(focusAreas.filter((_, i) => i !== index))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedCategoryConfig?.focusAreas?.map((item, index) => (
                !focusAreas.includes(item) && (
                  <Badge
                    key={`suggested-${index}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => setFocusAreas([...focusAreas, item])}
                  >
                    + {item}
                  </Badge>
                )
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for players or staff..."
              rows={3}
              {...form.register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
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

export default TrainingSessionForm;