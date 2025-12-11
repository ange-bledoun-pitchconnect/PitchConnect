'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const playerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  sport: z.string().min(1, 'Sport is required'),
  number: z.coerce.number().optional(),
  status: z.enum(['active', 'injured', 'inactive']),
  nationality: z.string().optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  mode: 'create' | 'edit';
  playerId?: string;
  initialData?: Partial<PlayerFormData>;
}

export function PlayerForm({
  mode,
  playerId,
  initialData,
}: PlayerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: PlayerFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        await axios.post('/api/players', data);
      } else {
        await axios.put(`/api/players/${playerId}`, data);
      }

      router.push('/dashboard/players-v2');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {mode === 'create' ? 'Add New Player' : 'Edit Player'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              {...register('firstName')}
              error={errors.firstName?.message}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              {...register('lastName')}
              error={errors.lastName?.message}
              required
            />
          </div>

          <Input
            label="Date of Birth"
            type="date"
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
          />

          <Input
            label="Nationality"
            placeholder="England"
            {...register('nationality')}
            error={errors.nationality?.message}
          />
        </div>

        {/* Sport & Position */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Sport & Position</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Sport <span className="text-red-500">*</span>
              </label>
              <select
                {...register('sport')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sport</option>
                <option value="football">Football</option>
                <option value="netball">Netball</option>
                <option value="rugby">Rugby</option>
              </select>
              {errors.sport && (
                <p className="text-sm text-red-600 mt-1">{errors.sport.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                {...register('position')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Position</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
                <option value="Goal Shooter">Goal Shooter</option>
                <option value="Goal Attack">Goal Attack</option>
              </select>
              {errors.position && (
                <p className="text-sm text-red-600 mt-1">{errors.position.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Physical Attributes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Physical Attributes</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Jersey Number"
              type="number"
              placeholder="7"
              {...register('number')}
              error={errors.number?.message}
            />
            <Input
              label="Height (cm)"
              type="number"
              placeholder="180"
              {...register('height')}
              error={errors.height?.message}
            />
            <Input
              label="Weight (kg)"
              type="number"
              placeholder="75"
              {...register('weight')}
              error={errors.weight?.message}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Status</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Player Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="injured">Injured</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <Textarea
            label="Notes"
            placeholder="Add any additional notes about the player..."
            {...register('notes')}
            error={errors.notes?.message}
            maxLength={500}
            showCharCount
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/players-v2')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Add Player' : 'Update Player'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
