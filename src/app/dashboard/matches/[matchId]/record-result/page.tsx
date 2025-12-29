'use client';

// ============================================================================
// 🏆 PITCHCONNECT - RECORD MATCH RESULT PAGE v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/record-result/page.tsx
// Multi-sport result recording with detailed scoring breakdowns
// Schema v7.3.0 aligned - Uses homeScore/awayScore
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Users,
  X,
  Plus,
  Minus,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getSportConfig,
  getSportIcon,
  getSportDisplayName,
  formatScoreDisplay,
  type SportConfig,
} from '@/lib/config/sports';
import type { Sport, MatchStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TeamInfo {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  sport: Sport;
}

interface MatchData {
  id: string;
  status: MatchStatus;
  kickOffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  venue: string | null;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

interface ScoreBreakdown {
  [key: string]: number;
}

// ============================================================================
// SCORE INPUT COMPONENT
// ============================================================================

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}

const ScoreInput = ({ label, value, onChange, max = 999, min = 0, disabled }: ScoreInputProps) => {
  const increment = () => onChange(Math.min(value + 1, max));
  const decrement = () => onChange(Math.max(value - 1, min));

  return (
    <div className="text-center">
      <label className="block text-sm font-medium text-charcoal-600 dark:text-charcoal-400 mb-2">
        {label}
      </label>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= min}
          className="w-10 h-10 rounded-full bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value) || 0;
            onChange(Math.max(min, Math.min(max, v)));
          }}
          disabled={disabled}
          min={min}
          max={max}
          className="w-20 h-14 text-center text-3xl font-bold bg-white dark:bg-charcoal-700 border-2 border-charcoal-200 dark:border-charcoal-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={increment}
          disabled={disabled || value >= max}
          className="w-10 h-10 rounded-full bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// BREAKDOWN SCORE INPUT (for Rugby, American Football, etc.)
// ============================================================================

interface BreakdownScoreInputProps {
  sportConfig: SportConfig;
  breakdown: ScoreBreakdown;
  onChange: (breakdown: ScoreBreakdown) => void;
  disabled?: boolean;
}

const BreakdownScoreInput = ({ sportConfig, breakdown, onChange, disabled }: BreakdownScoreInputProps) => {
  const handleChange = (key: string, value: number) => {
    onChange({ ...breakdown, [key]: value });
  };

  const totalScore = Object.entries(breakdown).reduce((total, [key, count]) => {
    const pointValue = sportConfig.scoring.pointValues[key] || 0;
    return total + count * pointValue;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Object.entries(sportConfig.scoring.pointValues).map(([key, points]) => (
          <div key={key} className="text-center p-3 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
            <label className="block text-xs font-medium text-charcoal-500 dark:text-charcoal-400 mb-1">
              {sportConfig.scoring.labels[key] || key} ({points}pts)
            </label>
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleChange(key, Math.max(0, (breakdown[key] || 0) - 1))}
                disabled={disabled || (breakdown[key] || 0) <= 0}
                className="w-8 h-8 rounded-full bg-charcoal-200 dark:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-300 dark:hover:bg-charcoal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-bold"
              >
                -
              </button>
              <span className="w-10 text-xl font-bold text-charcoal-900 dark:text-white">
                {breakdown[key] || 0}
              </span>
              <button
                type="button"
                onClick={() => handleChange(key, (breakdown[key] || 0) + 1)}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-charcoal-200 dark:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-300 dark:hover:bg-charcoal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <span className="text-sm text-green-700 dark:text-green-300">Total Score:</span>
        <span className="ml-2 text-3xl font-bold text-green-600 dark:text-green-400">{totalScore}</span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function RecordResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  // State
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Scoring mode
  const [useBreakdown, setUseBreakdown] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeBreakdown, setHomeBreakdown] = useState<ScoreBreakdown>({});
  const [awayBreakdown, setAwayBreakdown] = useState<ScoreBreakdown>({});
  const [homeHalftimeScore, setHomeHalftimeScore] = useState<number | null>(null);
  const [awayHalftimeScore, setAwayHalftimeScore] = useState<number | null>(null);
  const [resultStatus, setResultStatus] = useState<MatchStatus>('FINISHED');

  // Sport config
  const sportConfig = useMemo(() => {
    if (!match) return null;
    return getSportConfig(match.homeTeam.sport);
  }, [match]);

  // Fetch match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/matches/${matchId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch match');
        }

        const data = await response.json();
        setMatch(data);

        // Initialize scores from existing data
        setHomeScore(data.homeScore ?? 0);
        setAwayScore(data.awayScore ?? 0);
        setHomeHalftimeScore(data.homeHalftimeScore);
        setAwayHalftimeScore(data.awayHalftimeScore);

        // Check if sport uses breakdown scoring
        const config = getSportConfig(data.homeTeam.sport);
        if (config.scoring.trackBreakdown) {
          setUseBreakdown(true);
          // Initialize empty breakdown
          const emptyBreakdown: ScoreBreakdown = {};
          Object.keys(config.scoring.pointValues).forEach((key) => {
            emptyBreakdown[key] = 0;
          });
          setHomeBreakdown(emptyBreakdown);
          setAwayBreakdown(emptyBreakdown);
        }
      } catch (err) {
        console.error('Error fetching match:', err);
        setError('Failed to load match data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Calculate total from breakdown
  const calculateBreakdownTotal = useCallback(
    (breakdown: ScoreBreakdown): number => {
      if (!sportConfig) return 0;
      return Object.entries(breakdown).reduce((total, [key, count]) => {
        const pointValue = sportConfig.scoring.pointValues[key] || 0;
        return total + count * pointValue;
      }, 0);
    },
    [sportConfig]
  );

  // Final scores
  const finalHomeScore = useBreakdown ? calculateBreakdownTotal(homeBreakdown) : homeScore;
  const finalAwayScore = useBreakdown ? calculateBreakdownTotal(awayBreakdown) : awayScore;

  // Determine result
  const result = useMemo(() => {
    if (finalHomeScore > finalAwayScore) return 'home';
    if (finalAwayScore > finalHomeScore) return 'away';
    return 'draw';
  }, [finalHomeScore, finalAwayScore]);

  // Handle save
  const handleSave = async () => {
    if (!match) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: finalHomeScore,
          awayScore: finalAwayScore,
          homeHalftimeScore: homeHalftimeScore,
          awayHalftimeScore: awayHalftimeScore,
          status: resultStatus,
          homeBreakdown: useBreakdown ? homeBreakdown : undefined,
          awayBreakdown: useBreakdown ? awayBreakdown : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save result');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/matches/${matchId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving result:', err);
      setError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 dark:text-green-400 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-300">Loading match data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-red-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-charcoal-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-charcoal-900 dark:text-white mb-2">Error</h2>
            <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match || !sportConfig) return null;

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <Card className="w-full max-w-md bg-white dark:bg-charcoal-800 border-green-200 dark:border-green-800">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-2">
              Result Saved!
            </h2>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              {match.homeTeam.name} {finalHomeScore} - {finalAwayScore} {match.awayTeam.name}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-blue-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/matches/${matchId}`}
            className="inline-flex items-center gap-2 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-4xl">{getSportIcon(match.homeTeam.sport)}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">
                Record Result
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {getSportDisplayName(match.homeTeam.sport)}
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {/* Main Card */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-500" />
                Final Score
              </CardTitle>
              {sportConfig.scoring.trackBreakdown && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    {useBreakdown ? 'Detailed' : 'Simple'}
                  </span>
                  <button
                    onClick={() => setUseBreakdown(!useBreakdown)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useBreakdown ? 'bg-green-500' : 'bg-charcoal-300 dark:bg-charcoal-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        useBreakdown ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Enter the final score for this match
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Teams Header */}
            <div className="grid grid-cols-2 gap-8">
              {/* Home Team */}
              <div className="text-center">
                {match.homeTeam.logo ? (
                  <img
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    className="w-20 h-20 mx-auto mb-3 rounded-xl object-cover border-4 border-blue-200 dark:border-blue-800"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-4xl border-4 border-blue-200 dark:border-blue-800">
                    {getSportIcon(match.homeTeam.sport)}
                  </div>
                )}
                <h3 className="font-bold text-lg text-charcoal-900 dark:text-white">
                  {match.homeTeam.name}
                </h3>
                <Badge variant="outline" className="mt-1 text-blue-600 dark:text-blue-400">
                  Home
                </Badge>
              </div>

              {/* Away Team */}
              <div className="text-center">
                {match.awayTeam.logo ? (
                  <img
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-20 h-20 mx-auto mb-3 rounded-xl object-cover border-4 border-orange-200 dark:border-orange-800"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-4xl border-4 border-orange-200 dark:border-orange-800">
                    {getSportIcon(match.awayTeam.sport)}
                  </div>
                )}
                <h3 className="font-bold text-lg text-charcoal-900 dark:text-white">
                  {match.awayTeam.name}
                </h3>
                <Badge variant="outline" className="mt-1 text-orange-600 dark:text-orange-400">
                  Away
                </Badge>
              </div>
            </div>

            {/* Score Input */}
            {useBreakdown && sportConfig.scoring.trackBreakdown ? (
              <div className="space-y-8">
                {/* Home Breakdown */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-charcoal-900 dark:text-white mb-4 text-center">
                    {match.homeTeam.name} Score Breakdown
                  </h4>
                  <BreakdownScoreInput
                    sportConfig={sportConfig}
                    breakdown={homeBreakdown}
                    onChange={setHomeBreakdown}
                    disabled={isSaving}
                  />
                </div>

                {/* Away Breakdown */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-charcoal-900 dark:text-white mb-4 text-center">
                    {match.awayTeam.name} Score Breakdown
                  </h4>
                  <BreakdownScoreInput
                    sportConfig={sportConfig}
                    breakdown={awayBreakdown}
                    onChange={setAwayBreakdown}
                    disabled={isSaving}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 items-center">
                <ScoreInput
                  label={sportConfig.scoring.displayLabel}
                  value={homeScore}
                  onChange={setHomeScore}
                  max={sportConfig.scoring.maxScore}
                  disabled={isSaving}
                />
                <div className="text-center text-4xl font-bold text-charcoal-400">-</div>
                <ScoreInput
                  label={sportConfig.scoring.displayLabel}
                  value={awayScore}
                  onChange={setAwayScore}
                  max={sportConfig.scoring.maxScore}
                  disabled={isSaving}
                />
              </div>
            )}

            {/* Half-time Score (optional) */}
            <div className="pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
              <h4 className="font-medium text-charcoal-700 dark:text-charcoal-300 mb-4 text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Half-time Score (Optional)
              </h4>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <Input
                    type="number"
                    min={0}
                    max={sportConfig.scoring.maxScore}
                    value={homeHalftimeScore ?? ''}
                    onChange={(e) =>
                      setHomeHalftimeScore(e.target.value ? parseInt(e.target.value) : null)
                    }
                    disabled={isSaving}
                    placeholder="-"
                    className="text-center text-xl font-bold h-12"
                  />
                </div>
                <div className="text-center text-2xl font-bold text-charcoal-400">-</div>
                <div className="text-center">
                  <Input
                    type="number"
                    min={0}
                    max={sportConfig.scoring.maxScore}
                    value={awayHalftimeScore ?? ''}
                    onChange={(e) =>
                      setAwayHalftimeScore(e.target.value ? parseInt(e.target.value) : null)
                    }
                    disabled={isSaving}
                    placeholder="-"
                    className="text-center text-xl font-bold h-12"
                  />
                </div>
              </div>
            </div>

            {/* Match Status */}
            <div className="pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
              <h4 className="font-medium text-charcoal-700 dark:text-charcoal-300 mb-4">
                Match Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['FINISHED', 'CANCELLED', 'POSTPONED', 'ABANDONED'] as MatchStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setResultStatus(status)}
                      disabled={isSaving}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        resultStatus === status
                          ? status === 'FINISHED'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-charcoal-200 dark:border-charcoal-600 text-charcoal-600 dark:text-charcoal-400 hover:border-charcoal-400'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Result Preview */}
            <div className="p-6 bg-gradient-to-r from-charcoal-900 to-charcoal-800 dark:from-charcoal-700 dark:to-charcoal-600 rounded-xl text-white">
              <div className="text-center mb-4">
                <h4 className="text-charcoal-300 text-sm mb-2">Final Result</h4>
                <div className="text-4xl sm:text-5xl font-bold">
                  {finalHomeScore} - {finalAwayScore}
                </div>
              </div>
              <div className="text-center">
                {result === 'home' && (
                  <Badge className="bg-green-500 text-white">
                    🏆 {match.homeTeam.name} Win
                  </Badge>
                )}
                {result === 'away' && (
                  <Badge className="bg-green-500 text-white">
                    🏆 {match.awayTeam.name} Win
                  </Badge>
                )}
                {result === 'draw' && (
                  <Badge className="bg-yellow-500 text-white">🤝 Draw</Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {isSaving ? (
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
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Recording Tips</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                <li>Verify the score is correct before saving</li>
                <li>Half-time score is optional but helps with match analysis</li>
                {sportConfig.scoring.trackBreakdown && (
                  <li>Use detailed scoring for accurate statistics tracking</li>
                )}
                <li>Once saved, results can be edited by managers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
