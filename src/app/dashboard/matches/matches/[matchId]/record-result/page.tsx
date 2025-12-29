// ============================================================================
// 📋 RECORD RESULT PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId]/record-result - Submit match result with
// multi-sport score breakdown support
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Shield,
  Trophy,
  Target,
  FileText,
  Users,
  Hash,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useRealTimeMatch } from '@/hooks/useRealTimeMatch';
import {
  getSportConfig,
  getSportScoreBreakdownFields,
  calculateTotalScore,
} from '@/lib/config/sports';
import { MATCH_STATUS_CONFIG } from '@/types/match';
import type { MatchStatus, Sport } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface ResultFormData {
  homeScore: number;
  awayScore: number;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  homeExtraTimeScore: number | null;
  awayExtraTimeScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScoreBreakdown: Record<string, number>;
  awayScoreBreakdown: Record<string, number>;
  status: MatchStatus;
  attendance: number | null;
  matchReport: string;
  notes: string;
}

// ============================================================================
// SCORE INPUT COMPONENT
// ============================================================================

interface ScoreInputProps {
  label: string;
  homeValue: number;
  awayValue: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  homeTeamName: string;
  awayTeamName: string;
  min?: number;
  max?: number;
  nullable?: boolean;
}

function ScoreInput({
  label,
  homeValue,
  awayValue,
  onHomeChange,
  onAwayChange,
  homeTeamName,
  awayTeamName,
  min = 0,
  max = 99,
}: ScoreInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-center block">{label}</Label>
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="text-right">
          <Input
            type="number"
            min={min}
            max={max}
            value={homeValue}
            onChange={(e) => onHomeChange(parseInt(e.target.value) || 0)}
            className="w-20 text-center text-lg font-bold ml-auto"
            aria-label={`${homeTeamName} ${label.toLowerCase()}`}
          />
        </div>
        <div className="text-center text-muted-foreground">-</div>
        <div>
          <Input
            type="number"
            min={min}
            max={max}
            value={awayValue}
            onChange={(e) => onAwayChange(parseInt(e.target.value) || 0)}
            className="w-20 text-center text-lg font-bold"
            aria-label={`${awayTeamName} ${label.toLowerCase()}`}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCORE BREAKDOWN COMPONENT
// ============================================================================

interface ScoreBreakdownInputProps {
  sport: Sport;
  homeBreakdown: Record<string, number>;
  awayBreakdown: Record<string, number>;
  onHomeChange: (key: string, value: number) => void;
  onAwayChange: (key: string, value: number) => void;
  homeTeamName: string;
  awayTeamName: string;
}

function ScoreBreakdownInput({
  sport,
  homeBreakdown,
  awayBreakdown,
  onHomeChange,
  onAwayChange,
  homeTeamName,
  awayTeamName,
}: ScoreBreakdownInputProps) {
  const fields = getSportScoreBreakdownFields(sport);

  if (fields.length === 0) {
    return null;
  }

  const homeTotalFromBreakdown = calculateTotalScore(sport, homeBreakdown);
  const awayTotalFromBreakdown = calculateTotalScore(sport, awayBreakdown);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Score Breakdown
        </CardTitle>
        <CardDescription>
          Detailed scoring for {getSportConfig(sport).name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Headers */}
        <div className="grid grid-cols-3 gap-4 text-center font-medium">
          <div className="flex items-center justify-end gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            {homeTeamName}
          </div>
          <div className="text-muted-foreground">Scoring Type</div>
          <div className="flex items-center gap-2">
            {awayTeamName}
            <Shield className="h-4 w-4 text-orange-600" />
          </div>
        </div>

        <Separator />

        {/* Breakdown Fields */}
        {fields.map((field) => (
          <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
            <Input
              type="number"
              min={0}
              value={homeBreakdown[field.key] || 0}
              onChange={(e) => onHomeChange(field.key, parseInt(e.target.value) || 0)}
              className="w-16 text-center ml-auto"
              aria-label={`${homeTeamName} ${field.label}`}
            />
            <div className="text-center text-sm">
              {field.label}
              {field.points > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({field.points}pts)
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              value={awayBreakdown[field.key] || 0}
              onChange={(e) => onAwayChange(field.key, parseInt(e.target.value) || 0)}
              className="w-16 text-center"
              aria-label={`${awayTeamName} ${field.label}`}
            />
          </div>
        ))}

        <Separator />

        {/* Calculated Totals */}
        <div className="grid grid-cols-3 gap-4 items-center font-bold">
          <div className="text-right text-xl">{homeTotalFromBreakdown}</div>
          <div className="text-center text-muted-foreground text-sm">
            Calculated Total
          </div>
          <div className="text-xl">{awayTotalFromBreakdown}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function RecordResultPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  // State
  const [formData, setFormData] = useState<ResultFormData>({
    homeScore: 0,
    awayScore: 0,
    homeHalftimeScore: null,
    awayHalftimeScore: null,
    homeExtraTimeScore: null,
    awayExtraTimeScore: null,
    homePenalties: null,
    awayPenalties: null,
    homeScoreBreakdown: {},
    awayScoreBreakdown: {},
    status: 'FINISHED',
    attendance: null,
    matchReport: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch match data
  const { match, refresh, isLoading } = useRealTimeMatch({
    matchId,
    enabled: true,
  });

  // Initialize form from match data
  useEffect(() => {
    if (!match) return;

    setFormData({
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      homeHalftimeScore: match.homeHalftimeScore,
      awayHalftimeScore: match.awayHalftimeScore,
      homeExtraTimeScore: match.homeExtraTimeScore,
      awayExtraTimeScore: match.awayExtraTimeScore,
      homePenalties: match.homePenalties,
      awayPenalties: match.awayPenalties,
      homeScoreBreakdown: (match.homeScoreBreakdown as Record<string, number>) || {},
      awayScoreBreakdown: (match.awayScoreBreakdown as Record<string, number>) || {},
      status: match.status === 'FINISHED' ? 'FINISHED' : 'FINISHED',
      attendance: match.attendance,
      matchReport: match.matchReport || '',
      notes: match.notes || '',
    });
  }, [match]);

  const sport = match?.homeClub?.sport || 'FOOTBALL';
  const sportConfig = getSportConfig(sport);
  const hasScoreBreakdown = getSportScoreBreakdownFields(sport).length > 0;

  // Update form field
  const updateField = useCallback(<K extends keyof ResultFormData>(
    field: K,
    value: ResultFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  // Update score breakdown
  const updateHomeBreakdown = useCallback((key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      homeScoreBreakdown: { ...prev.homeScoreBreakdown, [key]: value },
    }));
  }, []);

  const updateAwayBreakdown = useCallback((key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      awayScoreBreakdown: { ...prev.awayScoreBreakdown, [key]: value },
    }));
  }, []);

  // Submit result
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validation
      if (formData.homeScore < 0 || formData.awayScore < 0) {
        throw new Error('Scores cannot be negative');
      }

      const payload = {
        ...formData,
        homeScoreBreakdown: Object.keys(formData.homeScoreBreakdown).length > 0
          ? formData.homeScoreBreakdown
          : null,
        awayScoreBreakdown: Object.keys(formData.awayScoreBreakdown).length > 0
          ? formData.awayScoreBreakdown
          : null,
      };

      const response = await fetch(`/api/matches/${matchId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save result');
      }

      setSuccess('Match result saved successfully');
      setIsConfirmOpen(false);
      refresh();

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/dashboard/matches/${matchId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !match) {
    return (
      <main className="container py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="container py-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Match Not Found</h2>
          <Button asChild>
            <Link href="/dashboard/matches">Back to Matches</Link>
          </Button>
        </Card>
      </main>
    );
  }

  // Check if match already finished
  const isAlreadyFinished = match.status === 'FINISHED';

  return (
    <main className="container py-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/matches/${matchId}`} className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Match
          </Link>
        </Button>

        <Badge className={`${sportConfig.bgColor} ${sportConfig.darkBgColor} ${sportConfig.color}`}>
          {sportConfig.emoji} {sportConfig.name}
        </Badge>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {isAlreadyFinished && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This match has already been marked as finished. You can update the result if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Record Match Result</h1>
        <p className="text-muted-foreground">
          Enter the final score and match details
        </p>
      </div>

      {/* Match Header */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center">
              {match.homeClub?.logo ? (
                <img
                  src={match.homeClub.logo}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover mb-2"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              )}
              <h3 className="font-bold">
                {match.homeClub?.shortName || match.homeClub?.name}
              </h3>
              <p className="text-xs text-muted-foreground">{match.homeTeam?.name}</p>
            </div>

            {/* Main Score */}
            <div className="space-y-4">
              <ScoreInput
                label="Final Score"
                homeValue={formData.homeScore}
                awayValue={formData.awayScore}
                onHomeChange={(v) => updateField('homeScore', v)}
                onAwayChange={(v) => updateField('awayScore', v)}
                homeTeamName={match.homeClub?.shortName || 'Home'}
                awayTeamName={match.awayClub?.shortName || 'Away'}
              />
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center">
              {match.awayClub?.logo ? (
                <img
                  src={match.awayClub.logo}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover mb-2"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              )}
              <h3 className="font-bold">
                {match.awayClub?.shortName || match.awayClub?.name}
              </h3>
              <p className="text-xs text-muted-foreground">{match.awayTeam?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Additional Details */}
      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-6 pt-4">
          {/* Half-time Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Half-Time Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 items-center">
                <Input
                  type="number"
                  min={0}
                  value={formData.homeHalftimeScore ?? ''}
                  onChange={(e) =>
                    updateField(
                      'homeHalftimeScore',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="-"
                  className="w-16 text-center ml-auto"
                />
                <div className="text-center text-muted-foreground">HT</div>
                <Input
                  type="number"
                  min={0}
                  value={formData.awayHalftimeScore ?? ''}
                  onChange={(e) =>
                    updateField(
                      'awayHalftimeScore',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="-"
                  className="w-16 text-center"
                />
              </div>
            </CardContent>
          </Card>

          {/* Extra Time (if applicable) */}
          {sportConfig.hasExtraTime && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extra Time</CardTitle>
                <CardDescription>Only fill if match went to extra time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <Input
                    type="number"
                    min={0}
                    value={formData.homeExtraTimeScore ?? ''}
                    onChange={(e) =>
                      updateField(
                        'homeExtraTimeScore',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="-"
                    className="w-16 text-center ml-auto"
                  />
                  <div className="text-center text-muted-foreground">AET</div>
                  <Input
                    type="number"
                    min={0}
                    value={formData.awayExtraTimeScore ?? ''}
                    onChange={(e) =>
                      updateField(
                        'awayExtraTimeScore',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="-"
                    className="w-16 text-center"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Penalties (if applicable) */}
          {sportConfig.hasPenalties && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Penalties</CardTitle>
                <CardDescription>Only fill if match went to penalty shootout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <Input
                    type="number"
                    min={0}
                    value={formData.homePenalties ?? ''}
                    onChange={(e) =>
                      updateField(
                        'homePenalties',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="-"
                    className="w-16 text-center ml-auto"
                  />
                  <div className="text-center text-muted-foreground">PEN</div>
                  <Input
                    type="number"
                    min={0}
                    value={formData.awayPenalties ?? ''}
                    onChange={(e) =>
                      updateField(
                        'awayPenalties',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="-"
                    className="w-16 text-center"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown (for multi-sport) */}
          {hasScoreBreakdown && (
            <ScoreBreakdownInput
              sport={sport}
              homeBreakdown={formData.homeScoreBreakdown}
              awayBreakdown={formData.awayScoreBreakdown}
              onHomeChange={updateHomeBreakdown}
              onAwayChange={updateAwayBreakdown}
              homeTeamName={match.homeClub?.shortName || 'Home'}
              awayTeamName={match.awayClub?.shortName || 'Away'}
            />
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 pt-4">
          {/* Match Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Match Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value as MatchStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINISHED">Finished (Full Time)</SelectItem>
                  <SelectItem value="ABANDONED">Abandoned</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="POSTPONED">Postponed</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={0}
                value={formData.attendance ?? ''}
                onChange={(e) =>
                  updateField(
                    'attendance',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Number of spectators"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-6 pt-4">
          {/* Match Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Match Report
              </CardTitle>
              <CardDescription>
                Public summary of the match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.matchReport}
                onChange={(e) => updateField('matchReport', e.target.value)}
                placeholder="Write a summary of the match..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Internal Notes</CardTitle>
              <CardDescription>
                Private notes for staff only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Internal notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/matches/${matchId}`}>Cancel</Link>
        </Button>
        <Button onClick={() => setIsConfirmOpen(true)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Result
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Match Result</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to record the following result:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center gap-4 text-center">
              <div>
                <p className="font-medium">{match.homeClub?.shortName || match.homeClub?.name}</p>
                <p className="text-3xl font-bold">{formData.homeScore}</p>
              </div>
              <span className="text-2xl text-muted-foreground">-</span>
              <div>
                <p className="font-medium">{match.awayClub?.shortName || match.awayClub?.name}</p>
                <p className="text-3xl font-bold">{formData.awayScore}</p>
              </div>
            </div>

            {(formData.homeHalftimeScore !== null || formData.awayHalftimeScore !== null) && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Half-time: {formData.homeHalftimeScore ?? '-'} - {formData.awayHalftimeScore ?? '-'}
              </p>
            )}

            {(formData.homePenalties !== null || formData.awayPenalties !== null) && (
              <p className="text-center text-sm text-muted-foreground">
                Penalties: {formData.homePenalties ?? '-'} - {formData.awayPenalties ?? '-'}
              </p>
            )}

            <p className="text-center text-sm mt-2">
              Status: <Badge variant="outline">{MATCH_STATUS_CONFIG[formData.status]?.label}</Badge>
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirm Result'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
