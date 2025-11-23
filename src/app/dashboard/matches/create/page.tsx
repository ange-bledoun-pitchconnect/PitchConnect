'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  CheckCircle,
  MapPin,
  Clock,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  club: {
    name: string;
  };
}

export default function CreateMatchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const [matchData, setMatchData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    venue: '',
    attendanceDeadline: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');

      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchData.homeTeamId || !matchData.awayTeamId) {
      toast.error('Please select both home and away teams');
      return;
    }

    if (matchData.homeTeamId === matchData.awayTeamId) {
      toast.error('Home and away teams must be different');
      return;
    }

    if (!matchData.date || !matchData.time) {
      toast.error('Please provide match date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const matchDateTime = new Date(`${matchData.date}T${matchData.time}`);
      const attendanceDeadlineDateTime = matchData.attendanceDeadline
        ? new Date(`${matchData.attendanceDeadline}T23:59:59`)
        : new Date(matchDateTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

      const response = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamId: matchData.homeTeamId,
          awayTeamId: matchData.awayTeamId,
          date: matchDateTime.toISOString(),
          venue: matchData.venue || null,
          attendanceDeadline: attendanceDeadlineDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create match');
      }

      const data = await response.json();
      toast.success('⚽ Match created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/matches/${data.matchId}`);
      }, 1000);
    } catch (error) {
      console.error('Match creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? `${team.name} (${team.club.name})` : 'Select team...';
  };

  if (isLoadingTeams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/matches')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Create New Match</h1>
              <p className="text-charcoal-600">Schedule a match between two teams</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Match Details
            </CardTitle>
            <CardDescription>Enter match information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Teams Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team */}
                <div className="space-y-2">
                  <Label htmlFor="homeTeam">
                    Home Team <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="homeTeam"
                    value={matchData.homeTeamId}
                    onChange={(e) =>
                      setMatchData({ ...matchData, homeTeamId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select home team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.club.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Away Team */}
                <div className="space-y-2">
                  <Label htmlFor="awayTeam">
                    Away Team <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="awayTeam"
                    value={matchData.awayTeamId}
                    onChange={(e) =>
                      setMatchData({ ...matchData, awayTeamId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select away team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.club.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Match Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={matchData.date}
                    onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Kick-off Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={matchData.time}
                    onChange={(e) => setMatchData({ ...matchData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Venue
                </Label>
                <Input
                  id="venue"
                  value={matchData.venue}
                  onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
                  placeholder="e.g., City Stadium, Pitch 1"
                />
              </div>

              {/* Attendance Deadline */}
              <div className="space-y-2">
                <Label htmlFor="attendanceDeadline">
                  Attendance Deadline (Optional)
                </Label>
                <Input
                  id="attendanceDeadline"
                  type="date"
                  value={matchData.attendanceDeadline}
                  onChange={(e) =>
                    setMatchData({ ...matchData, attendanceDeadline: e.target.value })
                  }
                />
                <p className="text-xs text-charcoal-600">
                  Players must confirm availability before this date (default: 24 hours before match)
                </p>
              </div>

              {/* Preview */}
              {matchData.homeTeamId && matchData.awayTeamId && matchData.date && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-charcoal-600 mb-3 font-semibold">Match Preview:</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="font-bold text-charcoal-900">
                        {getTeamName(matchData.homeTeamId).split('(')[0]}
                      </p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300 mt-2">
                        HOME
                      </Badge>
                    </div>
                    <div className="px-6">
                      <p className="text-2xl font-bold text-charcoal-900">VS</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-charcoal-900">
                        {getTeamName(matchData.awayTeamId).split('(')[0]}
                      </p>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300 mt-2">
                        AWAY
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                    <p className="text-sm text-charcoal-700">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      {new Date(`${matchData.date}T${matchData.time || '00:00'}`).toLocaleString(
                        'en-GB',
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                    {matchData.venue && (
                      <p className="text-sm text-charcoal-600 mt-1">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        {matchData.venue}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/matches')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !matchData.homeTeamId || !matchData.awayTeamId}
                  className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Match
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
