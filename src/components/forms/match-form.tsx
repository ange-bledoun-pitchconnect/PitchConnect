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
import { Loader2 } from 'lucide-react';

const matchSchema = z.object({
  homeTeam: z.string().min(2, 'Home team is required'),
  awayTeam: z.string().min(2, 'Away team is required'),
  date: z.string().min(1, 'Match date is required'),
  venue: z.string().optional(),
  sport: z.string().min(1, 'Sport is required'),
  competition: z.string().optional(),
  formation: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'completed']),
  homeTeamGoals: z.coerce.number().optional(),
  awayTeamGoals: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

interface MatchFormProps {
  mode: 'create' | 'edit';
  matchId?: string;
  initialData?: Partial<MatchFormData>;
}

export function MatchForm({
  mode,
  matchId,
  initialData,
}: MatchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: initialData,
  });

  const status = watch('status');

  const onSubmit = async (data: MatchFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        await axios.post('/api/matches', data);
      } else {
        await axios.put(`/api/matches/${matchId}`, data);
      }

      router.push('/dashboard/matches-v2');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {mode === 'create' ? 'Schedule New Match' : 'Edit Match'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Teams */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Teams</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Home Team"
              placeholder="Team A"
              {...register('homeTeam')}
              error={errors.homeTeam?.message}
              required
            />
            <Input
              label="Away Team"
              placeholder="Team B"
              {...register('awayTeam')}
              error={errors.awayTeam?.message}
              required
            />
          </div>
        </div>

        {/* Match Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Match Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Match Date & Time"
              type="datetime-local"
              {...register('date')}
              error={errors.date?.message}
              required
            />
            <Input
              label="Venue"
              placeholder="Stadium name"
              {...register('venue')}
              error={errors.venue?.message}
            />
          </div>

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

            <Input
              label="Competition"
              placeholder="League, Cup, Friendly, etc."
              {...register('competition')}
              error={errors.competition?.message}
            />
          </div>
        </div>

        {/* Tactical Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Tactical</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Formation
            </label>
            <select
              {...register('formation')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Formation</option>
              <option value="4-4-2">4-4-2</option>
              <option value="4-3-3">4-3-3</option>
              <option value="5-3-2">5-3-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
            </select>
            {errors.formation && (
              <p className="text-sm text-red-600 mt-1">{errors.formation.message}</p>
            )}
          </div>
        </div>

        {/* Status & Score */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Status</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Match Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>

          {(status === 'live' || status === 'completed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Home Team Goals"
                type="number"
                min="0"
                {...register('homeTeamGoals')}
                error={errors.homeTeamGoals?.message}
              />
              <Input
                label="Away Team Goals"
                type="number"
                min="0"
                {...register('awayTeamGoals')}
                error={errors.awayTeamGoals?.message}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <Textarea
            label="Notes"
            placeholder="Add any additional notes about the match..."
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
            onClick={() => router.push('/dashboard/matches-v2')}
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
            {mode === 'create' ? 'Schedule Match' : 'Update Match'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
