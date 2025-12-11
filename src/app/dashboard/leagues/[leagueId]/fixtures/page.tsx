'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Loader2,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Check,
  X,
  Zap,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  time?: string;
  venue?: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}

interface Fixture {
  id: string;
  matchweek: number;
  startDate: string;
  endDate?: string;
  matches: Match[];
}

interface League {
  id: string;
  name: string;
  code: string;
  season: number;
}

export default function FixturesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchweek, setSelectedMatchweek] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchFixtures();
  }, [id]);

  const fetchFixtures = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leagues/${id}/fixtures`);
      if (!response.ok) throw new Error('Failed to fetch fixtures');

      const data = await response.json();
      setLeague(data.league);
      setFixtures(data.fixtures);
      
      if (data.fixtures.length > 0 && !selectedMatchweek) {
        setSelectedMatchweek(data.fixtures[0].matchweek);
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      toast.error('Failed to load fixtures');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFixtures = async () => {
    if (!confirm('This will generate fixtures for all teams. Continue?')) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/leagues/${id}/fixtures/generate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate fixtures');

      const data = await response.json();
      toast.success(`✅ Generated ${data.totalMatches} matches across ${data.matchweeks} matchweeks`);
      fetchFixtures();
    } catch (error) {
      console.error('Error generating fixtures:', error);
      toast.error('Failed to generate fixtures');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateScore = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const response = await fetch(`/api/leagues/${id}/fixtures/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore,
          awayScore,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) throw new Error('Failed to update match');

      toast.success('Match result updated');
      setEditingMatch(null);
      fetchFixtures();
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match result');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Completed</Badge>;
      case 'LIVE':
        return <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Live</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const selectedFixture = fixtures.find((f) => f.matchweek === selectedMatchweek);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading fixtures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leagues/${id}`)}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
                Fixtures & Results
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {league?.name} • Season {league?.season}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerateFixtures}
                disabled={isGenerating || fixtures.length > 0}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Generate
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="border-neutral-300 dark:border-charcoal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Match
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Total Matchweeks</p>
                <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{fixtures.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Total Matches</p>
                <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
                  {fixtures.reduce((sum, f) => sum + f.matches.length, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {fixtures.reduce(
                    (sum, f) => sum + f.matches.filter((m) => m.status === 'COMPLETED').length,
                    0
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {fixtures.reduce(
                    (sum, f) => sum + f.matches.filter((m) => m.status === 'SCHEDULED').length,
                    0
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matchweek Selector */}
        {fixtures.length > 0 && (
          <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {fixtures.map((fixture) => (
                  <Button
                    key={fixture.id}
                    variant={selectedMatchweek === fixture.matchweek ? 'default' : 'outline'}
                    onClick={() => setSelectedMatchweek(fixture.matchweek)}
                    className={
                      selectedMatchweek === fixture.matchweek
                        ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white'
                        : 'border-neutral-300 dark:border-charcoal-600'
                    }
                  >
                    Matchweek {fixture.matchweek}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matches */}
        {fixtures.length === 0 ? (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">
                No fixtures yet
              </h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
                Generate fixtures automatically or add matches manually
              </p>
              <Button
                onClick={handleGenerateFixtures}
                disabled={isGenerating}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Generate Fixtures
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                <Trophy className="w-5 h-5 text-gold-500" />
                Matchweek {selectedMatchweek}
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                {selectedFixture?.matches.length} matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedFixture?.matches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg border border-neutral-200 dark:border-charcoal-600"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Teams & Score */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-charcoal-900 dark:text-white">
                            {match.homeTeamName}
                          </span>
                          {match.status === 'COMPLETED' ? (
                            <span className="text-2xl font-bold text-charcoal-900 dark:text-white">
                              {match.homeScore}
                            </span>
                          ) : (
                            <span className="text-charcoal-400 dark:text-charcoal-500">-</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-charcoal-900 dark:text-white">
                            {match.awayTeamName}
                          </span>
                          {match.status === 'COMPLETED' ? (
                            <span className="text-2xl font-bold text-charcoal-900 dark:text-white">
                              {match.awayScore}
                            </span>
                          ) : (
                            <span className="text-charcoal-400 dark:text-charcoal-500">-</span>
                          )}
                        </div>
                      </div>

                      {/* Match Info */}
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(match.status)}
                        <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                          <Clock className="w-4 h-4" />
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                            <MapPin className="w-4 h-4" />
                            {match.venue}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {match.status !== 'COMPLETED' && (
                        <Button
                          onClick={() => setEditingMatch(match)}
                          size="sm"
                          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Enter Result
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Match Modal */}
        {editingMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
              <CardHeader>
                <CardTitle className="text-charcoal-900 dark:text-white">Enter Match Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-charcoal-700 dark:text-charcoal-300">
                      {editingMatch.homeTeamName}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={editingMatch.homeScore || 0}
                      id="homeScore"
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-charcoal-700 dark:text-charcoal-300">
                      {editingMatch.awayTeamName}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={editingMatch.awayScore || 0}
                      id="awayScore"
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const homeScore = parseInt(
                          (document.getElementById('homeScore') as HTMLInputElement).value
                        );
                        const awayScore = parseInt(
                          (document.getElementById('awayScore') as HTMLInputElement).value
                        );
                        handleUpdateScore(editingMatch.id, homeScore, awayScore);
                      }}
                      className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingMatch(null)}
                      variant="outline"
                      className="flex-1 border-neutral-300 dark:border-charcoal-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
