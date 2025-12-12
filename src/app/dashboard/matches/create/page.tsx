// MATCH MANAGEMENT UI - PRODUCTION GRADE
// Path: src/app/dashboard/matches/create/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, Loader2, CheckCircle, Calendar, Clock, Users } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface League {
  id: string;
  name: string;
  sport: string;
}

interface Team {
  id: string;
  name: string;
  logo?: string;
}

interface MatchFormData {
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  venueId?: string;
  scheduledDate: string;
  scheduledTime: string;
  sport: string;
  matchType: 'LEAGUE' | 'CUP' | 'FRIENDLY' | 'PLAYOFF';
  notes?: string;
}

interface FormError {
  field: string;
  message: string;
}

// ============================================================================
// MATCH CREATION FORM
// ============================================================================

export default function CreateMatchPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  const [formData, setFormData] = useState<MatchFormData>({
    homeTeamId: '',
    awayTeamId: '',
    leagueId: '',
    sport: 'FOOTBALL',
    matchType: 'LEAGUE',
    scheduledDate: '',
    scheduledTime: '15:00',
  });

  // Fetch leagues on mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leagues');
        const json = await response.json();
        if (json.success) {
          setLeagues(json.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
        setErrors([{ field: 'general', message: 'Failed to load leagues' }]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchLeagues();
    }
  }, [session?.user]);

  // Fetch teams when league changes
  useEffect(() => {
    if (!formData.leagueId) {
      setTeams([]);
      setSelectedLeague(null);
      return;
    }

    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leagues/${formData.leagueId}/available-teams`);
        const json = await response.json();
        if (json.success) {
          setTeams(json.data || []);
          const league = leagues.find((l) => l.id === formData.leagueId);
          setSelectedLeague(league || null);
          setFormData((prev) => ({ ...prev, sport: league?.sport || 'FOOTBALL' }));
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        setErrors([{ field: 'teams', message: 'Failed to load teams' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [formData.leagueId, leagues]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!formData.leagueId) newErrors.push({ field: 'leagueId', message: 'League is required' });
    if (!formData.homeTeamId) newErrors.push({ field: 'homeTeamId', message: 'Home team is required' });
    if (!formData.awayTeamId) newErrors.push({ field: 'awayTeamId', message: 'Away team is required' });
    if (!formData.scheduledDate) newErrors.push({ field: 'scheduledDate', message: 'Match date is required' });

    if (formData.homeTeamId === formData.awayTeamId) {
      newErrors.push({ field: 'awayTeamId', message: 'Home and away teams must be different' });
    }

    const matchDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (matchDateTime < new Date()) {
      newErrors.push({ field: 'scheduledDate', message: 'Match date cannot be in the past' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}:00Z`;

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeamId: formData.homeTeamId,
          awayTeamId: formData.awayTeamId,
          leagueId: formData.leagueId,
          scheduledDate: scheduledDateTime,
          sport: formData.sport,
          matchType: formData.matchType,
          notes: formData.notes,
        }),
      });

      const json = await response.json();

      if (!json.success) {
        setErrors([{ field: 'general', message: json.error || 'Failed to create match' }]);
        return;
      }

      setSuccess(true);

      // Redirect to match detail page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/matches/${json.data.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating match:', error);
      setErrors([{ field: 'general', message: 'An error occurred. Please try again.' }]);
    } finally {
      setSubmitting(false);
    }
  };

  // Error display component
  const ErrorAlert = ({ error }: { error: FormError }) => (
    <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-900 border border-red-200">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-medium">{error.message}</p>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Match Created Successfully!</h2>
          <p className="text-gray-600">Redirecting to match details...</p>
        </div>
      </div>
    );
  }

  const homeTeam = teams.find((t) => t.id === formData.homeTeamId);
  const awayTeam = teams.find((t) => t.id === formData.awayTeamId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Match</h1>
          <p className="mt-2 text-lg text-gray-600">Set up a new match for your league</p>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 space-y-3">
            {errors.map((error, idx) => (
              <ErrorAlert key={idx} error={error} />
            ))}
          </div>
        )}

        {/* Form */}
        <div className="rounded-lg bg-white shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            {/* League Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select League *
              </label>
              <select
                value={formData.leagueId}
                onChange={(e) => {
                  setFormData({ ...formData, leagueId: e.target.value });
                  setErrors(errors.filter((err) => err.field !== 'leagueId'));
                }}
                disabled={loading || leagues.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Choose a league...</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.sport})
                  </option>
                ))}
              </select>
            </div>

            {/* Sport and Match Type (Read-only after league selection) */}
            {selectedLeague && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport
                  </label>
                  <input
                    type="text"
                    value={formData.sport}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Match Type
                  </label>
                  <select
                    value={formData.matchType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        matchType: e.target.value as MatchFormData['matchType'],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LEAGUE">League</option>
                    <option value="CUP">Cup</option>
                    <option value="FRIENDLY">Friendly</option>
                    <option value="PLAYOFF">Playoff</option>
                  </select>
                </div>
              </div>
            )}

            {/* Home vs Away Team Selection */}
            {teams.length > 0 && (
              <div className="space-y-6">
                {/* Home Team */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-2" />
                    Home Team *
                  </label>
                  <select
                    value={formData.homeTeamId}
                    onChange={(e) => {
                      setFormData({ ...formData, homeTeamId: e.target.value });
                      setErrors(errors.filter((err) => err.field !== 'homeTeamId' && err.field !== 'awayTeamId'));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select home team...</option>
                    {teams
                      .filter((t) => t.id !== formData.awayTeamId)
                      .map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Away Team */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-2" />
                    Away Team *
                  </label>
                  <select
                    value={formData.awayTeamId}
                    onChange={(e) => {
                      setFormData({ ...formData, awayTeamId: e.target.value });
                      setErrors(errors.filter((err) => err.field !== 'homeTeamId' && err.field !== 'awayTeamId'));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select away team...</option>
                    {teams
                      .filter((t) => t.id !== formData.homeTeamId)
                      .map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Match Preview */}
            {homeTeam && awayTeam && (
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Match Preview:</p>
                <div className="flex items-center justify-between text-center">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{homeTeam.name}</p>
                  </div>
                  <p className="px-4 text-gray-400">vs</p>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{awayTeam.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Match Date *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => {
                    setFormData({ ...formData, scheduledDate: e.target.value });
                    setErrors(errors.filter((err) => err.field !== 'scheduledDate'));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-2" />
                  Match Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about the match..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Match'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-900 border border-blue-200">
          <p className="text-sm">
            <strong>Note:</strong> Once the match is created, you'll be able to add lineups, assign a referee, and
            start logging events when the match begins.
          </p>
        </div>
      </div>
    </div>
  );
}