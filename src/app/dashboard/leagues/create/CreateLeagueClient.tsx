// =============================================================================
// 🏆 PITCHCONNECT - CREATE LEAGUE CLIENT COMPONENT
// =============================================================================
// 3-step wizard for league creation with sport-specific defaults
// =============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
  Settings,
  Users,
  Globe,
  Lock,
  EyeOff,
  Info,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type LeagueFormat = 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'ROUND_ROBIN';
type Visibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

interface SportConfig {
  label: string;
  icon: string;
  color: string;
  defaults: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    bonusPointsEnabled: boolean;
    bonusPointsConfig?: Record<string, number>;
  };
  tiebreakers: Array<{ value: string; label: string }>;
}

interface LeagueFormData {
  // Basic Info
  name: string;
  code: string;
  sport: Sport;
  country: string;
  description: string;
  // Season
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  // Format & Rules
  format: LeagueFormat;
  visibility: Visibility;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  // Configuration
  minTeams: number;
  maxTeams: number | null;
  maxPlayersPerTeam: number | null;
  registrationOpen: boolean;
  bonusPointsEnabled: boolean;
  bonusPointsConfig: Record<string, number>;
  // Tiebreakers
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
}

interface CreateLeagueClientProps {
  sportOptions: Array<{ value: Sport; label: string; icon: string }>;
  sportConfig: Record<Sport, SportConfig>;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function CreateLeagueClient({ sportOptions, sportConfig }: CreateLeagueClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    code: '',
    sport: 'FOOTBALL',
    country: 'United Kingdom',
    description: '',
    seasonName: `${currentYear}/${currentYear + 1}`,
    seasonStartDate: `${currentYear}-09-01`,
    seasonEndDate: `${currentYear + 1}-05-31`,
    format: 'LEAGUE',
    visibility: 'PUBLIC',
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    minTeams: 4,
    maxTeams: 20,
    maxPlayersPerTeam: 25,
    registrationOpen: true,
    bonusPointsEnabled: false,
    bonusPointsConfig: {},
    tiebreaker1: 'GOAL_DIFFERENCE',
    tiebreaker2: 'GOALS_SCORED',
    tiebreaker3: 'HEAD_TO_HEAD',
  });

  // Update defaults when sport changes
  useEffect(() => {
    const config = sportConfig[formData.sport];
    setFormData(prev => ({
      ...prev,
      pointsForWin: config.defaults.pointsForWin,
      pointsForDraw: config.defaults.pointsForDraw,
      pointsForLoss: config.defaults.pointsForLoss,
      bonusPointsEnabled: config.defaults.bonusPointsEnabled,
      bonusPointsConfig: config.defaults.bonusPointsConfig || {},
      tiebreaker1: config.tiebreakers[0]?.value || 'GOAL_DIFFERENCE',
      tiebreaker2: config.tiebreakers[1]?.value || 'GOALS_SCORED',
      tiebreaker3: config.tiebreakers[2]?.value || 'HEAD_TO_HEAD',
    }));
  }, [formData.sport, sportConfig]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const steps = [
    { number: 1, title: 'Basic Info', icon: Trophy },
    { number: 2, title: 'Format & Rules', icon: Settings },
    { number: 3, title: 'Configuration', icon: Users },
  ];

  const formatOptions: Array<{ value: LeagueFormat; label: string; description: string }> = [
    { value: 'LEAGUE', label: 'League', description: 'Round-robin format with home and away matches' },
    { value: 'ROUND_ROBIN', label: 'Round Robin', description: 'Every team plays every other team once' },
    { value: 'KNOCKOUT', label: 'Knockout', description: 'Single elimination tournament' },
    { value: 'GROUP_KNOCKOUT', label: 'Group + Knockout', description: 'Group stage followed by knockout rounds' },
  ];

  const visibilityOptions: Array<{ value: Visibility; label: string; icon: any; description: string }> = [
    { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Anyone can view standings and fixtures' },
    { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only teams and admins can view' },
    { value: 'UNLISTED', label: 'Unlisted', icon: EyeOff, description: 'Visible only with direct link' },
  ];

  const selectedSportConfig = sportConfig[formData.sport];

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleNext = () => {
    if (currentStep === 1 && (!formData.name || !formData.code)) {
      showToast('Please provide league name and code', 'error');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      showToast('Please provide league name and code', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // League
          name: formData.name,
          code: formData.code.toUpperCase(),
          sport: formData.sport,
          country: formData.country,
          description: formData.description,
          format: formData.format,
          visibility: formData.visibility,
          // Season
          seasonName: formData.seasonName,
          seasonStartDate: formData.seasonStartDate,
          seasonEndDate: formData.seasonEndDate,
          // Configuration
          pointsForWin: formData.pointsForWin,
          pointsForDraw: formData.pointsForDraw,
          pointsForLoss: formData.pointsForLoss,
          minTeams: formData.minTeams,
          maxTeams: formData.maxTeams,
          maxPlayersPerTeam: formData.maxPlayersPerTeam,
          registrationOpen: formData.registrationOpen,
          bonusPointsEnabled: formData.bonusPointsEnabled,
          bonusPointsConfig: formData.bonusPointsConfig,
          tiebreaker1: formData.tiebreaker1,
          tiebreaker2: formData.tiebreaker2,
          tiebreaker3: formData.tiebreaker3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create league');
      }

      const league = await response.json();
      showToast('League created successfully!', 'success');
      setTimeout(() => router.push(`/dashboard/leagues/${league.id}`), 1000);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create league', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepIcon = steps[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/leagues"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leagues
          </Link>

          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedSportConfig.color} flex items-center justify-center shadow-lg`}>
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New League</h1>
              <p className="text-slate-600 dark:text-slate-400">Set up your league in 3 easy steps</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    currentStep >= step.number
                      ? `bg-gradient-to-br ${selectedSportConfig.color} text-white`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-1 flex-1 transition-colors ${
                    currentStep > step.number
                      ? `bg-gradient-to-r ${selectedSportConfig.color}`
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CurrentStepIcon className="w-5 h-5 text-amber-500" />
              {steps[currentStep - 1].title}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      League Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Premier Sunday League"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      League Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., PSL2024"
                      required
                      maxLength={20}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unique identifier</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Sport <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sportOptions.map((sport) => (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, sport: sport.value })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.sport === sport.value
                            ? `border-amber-500 bg-amber-50 dark:bg-amber-900/20`
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <span className="text-2xl">{sport.icon}</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{sport.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" /> Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g., United Kingdom"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" /> Season Name
                    </label>
                    <input
                      type="text"
                      value={formData.seasonName}
                      onChange={(e) => setFormData({ ...formData, seasonName: e.target.value })}
                      placeholder="e.g., 2024/2025"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your league..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </>
            )}

            {/* Step 2: Format & Rules */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    League Format
                  </label>
                  <div className="space-y-3">
                    {formatOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.format === option.value
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={option.value}
                          checked={formData.format === option.value}
                          onChange={(e) => setFormData({ ...formData, format: e.target.value as LeagueFormat })}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{option.label}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Visibility
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.visibility === option.value
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value={option.value}
                            checked={formData.visibility === option.value}
                            onChange={(e) => setFormData({ ...formData, visibility: e.target.value as Visibility })}
                            className="mt-1"
                          />
                          <Icon className="w-5 h-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{option.label}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Points System
                    </label>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Defaults for {selectedSportConfig.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Win</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.pointsForWin}
                        onChange={(e) => setFormData({ ...formData, pointsForWin: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Draw</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.pointsForDraw}
                        onChange={(e) => setFormData({ ...formData, pointsForDraw: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Loss</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.pointsForLoss}
                        onChange={(e) => setFormData({ ...formData, pointsForLoss: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Minimum Teams
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={formData.minTeams}
                      onChange={(e) => setFormData({ ...formData, minTeams: parseInt(e.target.value) || 2 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Maximum Teams (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxTeams || 0}
                      onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Max Players/Team
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxPlayersPerTeam || 0}
                      onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Tiebreaker Rules
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'tiebreaker1', label: '1st Tiebreaker' },
                      { key: 'tiebreaker2', label: '2nd Tiebreaker' },
                      { key: 'tiebreaker3', label: '3rd Tiebreaker' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
                        <select
                          value={formData[key as keyof LeagueFormData] as string}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        >
                          {selectedSportConfig.tiebreakers.map((tb) => (
                            <option key={tb.value} value={tb.value}>{tb.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.registrationOpen}
                      onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Open Registration</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Allow teams to request to join</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bonusPointsEnabled}
                      onChange={(e) => setFormData({ ...formData, bonusPointsEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Enable Bonus Points</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Award extra points for performance</p>
                    </div>
                  </label>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">League Preview</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">{formData.name || 'League Name'}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded font-semibold">{formData.code || 'CODE'}</span>
                    <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">{selectedSportConfig.icon} {selectedSportConfig.label}</span>
                    <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">{formData.format.replace(/_/g, ' ')}</span>
                    <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">{formData.visibility}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Points: W={formData.pointsForWin} • D={formData.pointsForDraw} • L={formData.pointsForLoss}
                    {formData.bonusPointsEnabled && ' • Bonus Points Enabled'}
                  </p>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/leagues"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </Link>
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${selectedSportConfig.color} text-white font-semibold rounded-xl`}
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.code}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${selectedSportConfig.color} text-white font-semibold rounded-xl disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Create League
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}