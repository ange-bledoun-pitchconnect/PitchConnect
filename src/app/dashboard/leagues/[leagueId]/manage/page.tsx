'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Loader2,
  Save,
  X,
  AlertCircle,
  Trophy,
  Users,
  Lock,
  Zap,
  Shield,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LeagueConfiguration {
  id: string;
  leagueId: string;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsForGoals: number;
  minTeams: number;
  maxTeams: number;
  registrationOpen: boolean;
  registrationDeadline: string;
  entryFee: number;
  minPlayerAge: number;
  maxPlayerAge: number;
  maxPlayersPerTeam: number;
  minPlayersPerMatch: number;
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
}

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  country: string;
  season: number;
  status: string;
  format: string;
  visibility: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  logo?: string;
}

const TIEBREAKER_OPTIONS = [
  { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
  { value: 'GOALS_SCORED', label: 'Goals Scored' },
  { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  { value: 'AWAY_GOALS', label: 'Away Goals' },
];

export default function LeagueManagePage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [league, setLeague] = useState<League | null>(null);
  const [config, setConfig] = useState<LeagueConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  const fetchLeagueData = async () => {
    try {
      setIsLoading(true);
      
      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      if (!leagueRes.ok) throw new Error('Failed to fetch league');
      const leagueData = await leagueRes.json();
      setLeague(leagueData);

      const configRes = await fetch(`/api/leagues/${leagueId}/settings`);
      if (!configRes.ok) throw new Error('Failed to fetch configuration');
      const configData = await configRes.json();
      setConfig(configData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load league settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof LeagueConfiguration, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  const handleSaveSettings = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('League settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save league settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!league || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-charcoal-900 dark:text-white mb-2">Error loading league</p>
          <Button 
            onClick={() => router.push(`/dashboard/leagues/${leagueId}`)} 
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/leagues/${leagueId}`)}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Button>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-10 h-10 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">League Settings</h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">{league.name} ({league.code})</p>
            </div>
          </div>
        </div>

        {/* Points Configuration */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Trophy className="w-5 h-5 text-gold-500" />
              Points Configuration
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Define points awarded for different match outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Points for Win */}
              <div>
                <Label htmlFor="pointsForWin" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Points for Win
                </Label>
                <Input
                  id="pointsForWin"
                  type="number"
                  min="0"
                  value={config.pointsForWin}
                  onChange={(e) => handleConfigChange('pointsForWin', parseInt(e.target.value))}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Points for Draw */}
              <div>
                <Label htmlFor="pointsForDraw" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Points for Draw
                </Label>
                <Input
                  id="pointsForDraw"
                  type="number"
                  min="0"
                  value={config.pointsForDraw}
                  onChange={(e) => handleConfigChange('pointsForDraw', parseInt(e.target.value))}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Points for Loss */}
              <div>
                <Label htmlFor="pointsForLoss" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Points for Loss
                </Label>
                <Input
                  id="pointsForLoss"
                  type="number"
                  min="0"
                  value={config.pointsForLoss}
                  onChange={(e) => handleConfigChange('pointsForLoss', parseInt(e.target.value))}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>
            </div>

            {/* Bonus Points */}
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-charcoal-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-charcoal-700 dark:text-charcoal-300 font-semibold">
                    Enable Bonus Points
                  </Label>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Award bonus points for scoring goals
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.bonusPointsEnabled}
                  onChange={(e) => handleConfigChange('bonusPointsEnabled', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              {config.bonusPointsEnabled && (
                <div>
                  <Label htmlFor="bonusPoints" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Bonus Points Per Goal
                  </Label>
                  <Input
                    id="bonusPoints"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.bonusPointsForGoals}
                    onChange={(e) => handleConfigChange('bonusPointsForGoals', parseFloat(e.target.value))}
                    className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Configuration */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Users className="w-5 h-5 text-blue-500" />
              Team Configuration
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Set team and player limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Teams */}
              <div>
                <Label htmlFor="minTeams" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Minimum Teams
                </Label>
                <Input
                  id="minTeams"
                  type="number"
                  min="1"
                  value={config.minTeams}
                  onChange={(e) => handleConfigChange('minTeams', parseInt(e.target.value))}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Max Teams */}
              <div>
                <Label htmlFor="maxTeams" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Maximum Teams (0 = Unlimited)
                </Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="0"
                  value={config.maxTeams || 0}
                  onChange={(e) => handleConfigChange('maxTeams', parseInt(e.target.value) || null)}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Min Players per Match */}
              <div>
                <Label htmlFor="minPlayersPerMatch" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Minimum Players per Match
                </Label>
                <Input
                  id="minPlayersPerMatch"
                  type="number"
                  min="1"
                  value={config.minPlayersPerMatch}
                  onChange={(e) => handleConfigChange('minPlayersPerMatch', parseInt(e.target.value))}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>

              {/* Max Players per Team */}
              <div>
                <Label htmlFor="maxPlayersPerTeam" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Max Players per Team (0 = Unlimited)
                </Label>
                <Input
                  id="maxPlayersPerTeam"
                  type="number"
                  min="0"
                  value={config.maxPlayersPerTeam || 0}
                  onChange={(e) => handleConfigChange('maxPlayersPerTeam', parseInt(e.target.value) || null)}
                  className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiebreaker Rules */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Zap className="w-5 h-5 text-purple-500" />
              Tiebreaker Rules
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Define how teams are ranked when they have equal points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tiebreaker1" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  1st Tiebreaker
                </Label>
                <select
                  id="tiebreaker1"
                  value={config.tiebreaker1}
                  onChange={(e) => handleConfigChange('tiebreaker1', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-neutral-50 dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
                >
                  {TIEBREAKER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="tiebreaker2" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  2nd Tiebreaker
                </Label>
                <select
                  id="tiebreaker2"
                  value={config.tiebreaker2}
                  onChange={(e) => handleConfigChange('tiebreaker2', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-neutral-50 dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
                >
                  {TIEBREAKER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="tiebreaker3" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  3rd Tiebreaker
                </Label>
                <select
                  id="tiebreaker3"
                  value={config.tiebreaker3}
                  onChange={(e) => handleConfigChange('tiebreaker3', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-neutral-50 dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
                >
                  {TIEBREAKER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card className="mb-8 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              <Lock className="w-5 h-5 text-red-500" />
              Registration Settings
            </CardTitle>
            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              Control team registration and entry fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Registration Open */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
                <div>
                  <Label className="text-charcoal-700 dark:text-charcoal-300 font-semibold">
                    Registration Open
                  </Label>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Allow new teams to join the league
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.registrationOpen}
                  onChange={(e) => handleConfigChange('registrationOpen', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* Entry Fee */}
              {config.registrationOpen && (
                <div>
                  <Label htmlFor="entryFee" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Entry Fee (£) - Optional
                  </Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.entryFee || 0}
                    onChange={(e) => handleConfigChange('entryFee', parseFloat(e.target.value) || null)}
                    className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              )}

              {/* Registration Deadline */}
              {config.registrationOpen && (
                <div>
                  <Label htmlFor="registrationDeadline" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Registration Deadline - Optional
                  </Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={config.registrationDeadline ? config.registrationDeadline.slice(0, 16) : ''}
                    onChange={(e) => handleConfigChange('registrationDeadline', e.target.value)}
                    className="bg-neutral-50 dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <Button 
              variant="outline" 
              className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
