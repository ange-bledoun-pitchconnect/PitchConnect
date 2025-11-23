'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Save,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
}

export default function RecordResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState({
    homeGoals: 0,
    awayGoals: 0,
    status: 'FINISHED',
  });

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');

      const data = await response.json();
      setMatch(data.match);

      // Pre-fill existing scores if any
      if (data.match.homeGoals !== null) {
        setResult({
          homeGoals: data.match.homeGoals,
          awayGoals: data.match.awayGoals || 0,
          status: data.match.status,
        });
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/matches/${matchId}/record-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record result');
      }

      toast.success('✅ Match result recorded successfully!');

      setTimeout(() => {
        router.push(`/dashboard/matches/${matchId}`);
      }, 1000);
    } catch (error) {
      console.error('Record result error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record result');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10">
        <div className="text-center">
          <p className="text-xl font-semibold text-charcoal-900 mb-2">Match not found</p>
          <Button onClick={() => router.push('/dashboard/matches')}>Back to Matches</Button>
        </div>
      </div>
    );
  }

  const winner =
    result.homeGoals > result.awayGoals
      ? match.homeTeam.name
      : result.awayGoals > result.homeGoals
      ? match.awayTeam.name
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/10 to-green-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/matches/${matchId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Match
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Record Match Result</h1>
              <p className="text-charcoal-600">Enter the final score and match status</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Match Score</CardTitle>
            <CardDescription>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Score Input */}
              <div className="grid grid-cols-3 gap-6 items-center">
                {/* Home Team Score */}
                <div className="text-center">
                  <Label className="block mb-3 font-bold text-lg">
                    {match.homeTeam.name}
                  </Label>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-3">
                    HOME
                  </Badge>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={result.homeGoals}
                    onChange={(e) =>
                      setResult({ ...result, homeGoals: parseInt(e.target.value) || 0 })
                    }
                    className="text-center text-4xl font-bold h-20"
                    required
                  />
                </div>

                {/* VS Separator */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-charcoal-400">-</p>
                </div>

                {/* Away Team Score */}
                <div className="text-center">
                  <Label className="block mb-3 font-bold text-lg">
                    {match.awayTeam.name}
                  </Label>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-300 mb-3">
                    AWAY
                  </Badge>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={result.awayGoals}
                    onChange={(e) =>
                      setResult({ ...result, awayGoals: parseInt(e.target.value) || 0 })
                    }
                    className="text-center text-4xl font-bold h-20"
                    required
                  />
                </div>
              </div>

              {/* Match Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Match Status</Label>
                <select
                  id="status"
                  value={result.status}
                  onChange={(e) => setResult({ ...result, status: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FINISHED">Finished</option>
                  <option value="LIVE">Live</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="POSTPONED">Postponed</option>
                </select>
              </div>

              {/* Result Preview */}
              {result.status === 'FINISHED' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-charcoal-600 mb-2 font-semibold">Result:</p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-charcoal-900 mb-2">
                      {result.homeGoals} - {result.awayGoals}
                    </p>
                    {winner ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Winner: {winner}
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                        Draw
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/matches/${matchId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Result
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
