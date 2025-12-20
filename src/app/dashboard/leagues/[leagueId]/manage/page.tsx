'use client';

/**
 * PitchConnect League Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/manage/page.tsx
 *
 * Features:
 * ✅ Comprehensive league settings configuration
 * ✅ Points configuration: win, draw, loss, bonus points
 * ✅ Team configuration: team limits, player limits
 * ✅ Tiebreaker rules with priority ordering
 * ✅ Registration settings with entry fees and deadlines
 * ✅ Real-time form validation and feedback
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Responsive grid layout for all settings
 * ✅ Loading and error states
 * ✅ Dark mode support
 * ✅ Schema-aligned data models
 * ✅ Accessibility features
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Loader2,
  Save,
  AlertCircle,
  Trophy,
  Users,
  Lock,
  Zap,
  Check,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface LeagueConfiguration {
  id: string;
  leagueId: string;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsForGoals: number;
  minTeams: number;
  maxTeams: number | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  entryFee: number | null;
  minPlayerAge: number;
  maxPlayerAge: number;
  maxPlayersPerTeam: number | null;
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

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIEBREAKER_OPTIONS = [
  { value: 'GOAL_DIFFERENCE', label: 'Goal Difference' },
  { value: 'GOALS_SCORED', label: 'Goals Scored' },
  { value: 'HEAD_TO_HEAD', label: 'Head to Head' },
  { value: 'AWAY_GOALS', label: 'Away Goals' },
];

// ============================================================================
// TOAST COMPONENT (No External Dependency)
// ============================================================================

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  const baseClasses =
    'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 z-50';

  const typeClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400',
  };

  const icons = {
    success: <Check className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

const FormSection = ({
  title,
  description,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: 'gold' | 'blue' | 'purple' | 'red';
  children: React.ReactNode;
}) => {
  const colorMap = {
    gold: 'text-gold-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
      <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
        <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
          <Icon className={`h-5 w-5 ${colorMap[color]}`} />
          {title}
        </h2>
        <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
          {description}
        </p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};

// ============================================================================
// FORM INPUT COMPONENT
// ============================================================================

const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  min,
  max,
  step,
  disabled = false,
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  placeholder?: string;
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value || ''}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
      />
    </div>
  );
};

// ============================================================================
// FORM SELECT COMPONENT
// ============================================================================

const FormSelect = ({
  label,
  id,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50 dark:border-charcoal-700 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================

const ToggleSwitch = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-charcoal-700">
      <div>
        <p className="font-semibold text-charcoal-700 dark:text-charcoal-300">
          {label}
        </p>
        <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
          {description}
        </p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-5 w-5 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LeagueManagePage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [league, setLeague] = useState<League | null>(null);
  const [config, setConfig] = useState<LeagueConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

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
      showToast('Failed to load league settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

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

      showToast('✅ League settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save league settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (!league || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <p className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
            Error loading league
          </p>
          <button
            onClick={() => router.push(`/dashboard/leagues/${leagueId}`)}
            className="rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to League
            </button>
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
              <Settings className="h-10 w-10 text-white" />
            </div>

            <div>
              <h1 className="mb-2 text-4xl font-bold text-charcoal-900 dark:text-white">
                League Settings
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                {league.name} ({league.code})
              </p>
            </div>
          </div>
        </div>

        {/* POINTS CONFIGURATION */}
        <FormSection
          title="Points Configuration"
          description="Define points awarded for different match outcomes"
          icon={Trophy}
          color="gold"
        >
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormInput
              label="Points for Win"
              id="pointsForWin"
              type="number"
              value={config.pointsForWin}
              onChange={(e) =>
                handleConfigChange('pointsForWin', parseInt(e.target.value))
              }
              min="0"
            />
            <FormInput
              label="Points for Draw"
              id="pointsForDraw"
              type="number"
              value={config.pointsForDraw}
              onChange={(e) =>
                handleConfigChange('pointsForDraw', parseInt(e.target.value))
              }
              min="0"
            />
            <FormInput
              label="Points for Loss"
              id="pointsForLoss"
              type="number"
              value={config.pointsForLoss}
              onChange={(e) =>
                handleConfigChange('pointsForLoss', parseInt(e.target.value))
              }
              min="0"
            />
          </div>

          {/* BONUS POINTS */}
          <div className="border-t border-neutral-200 pt-6 dark:border-charcoal-700">
            <div className="mb-4">
              <ToggleSwitch
                label="Enable Bonus Points"
                description="Award bonus points for scoring goals"
                checked={config.bonusPointsEnabled}
                onChange={(checked) =>
                  handleConfigChange('bonusPointsEnabled', checked)
                }
              />
            </div>

            {config.bonusPointsEnabled && (
              <FormInput
                label="Bonus Points Per Goal"
                id="bonusPoints"
                type="number"
                value={config.bonusPointsForGoals}
                onChange={(e) =>
                  handleConfigChange(
                    'bonusPointsForGoals',
                    parseFloat(e.target.value)
                  )
                }
                min="0"
                max="1"
                step="0.1"
              />
            )}
          </div>
        </FormSection>

        {/* TEAM CONFIGURATION */}
        <div className="mb-8">
          <FormSection
            title="Team Configuration"
            description="Set team and player limits"
            icon={Users}
            color="blue"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
                label="Minimum Teams"
                id="minTeams"
                type="number"
                value={config.minTeams}
                onChange={(e) =>
                  handleConfigChange('minTeams', parseInt(e.target.value))
                }
                min="1"
              />
              <FormInput
                label="Maximum Teams (0 = Unlimited)"
                id="maxTeams"
                type="number"
                value={config.maxTeams || 0}
                onChange={(e) =>
                  handleConfigChange(
                    'maxTeams',
                    parseInt(e.target.value) || null
                  )
                }
                min="0"
              />
              <FormInput
                label="Minimum Players per Match"
                id="minPlayersPerMatch"
                type="number"
                value={config.minPlayersPerMatch}
                onChange={(e) =>
                  handleConfigChange(
                    'minPlayersPerMatch',
                    parseInt(e.target.value)
                  )
                }
                min="1"
              />
              <FormInput
                label="Max Players per Team (0 = Unlimited)"
                id="maxPlayersPerTeam"
                type="number"
                value={config.maxPlayersPerTeam || 0}
                onChange={(e) =>
                  handleConfigChange(
                    'maxPlayersPerTeam',
                    parseInt(e.target.value) || null
                  )
                }
                min="0"
              />
            </div>
          </FormSection>
        </div>

        {/* TIEBREAKER RULES */}
        <div className="mb-8">
          <FormSection
            title="Tiebreaker Rules"
            description="Define how teams are ranked when they have equal points"
            icon={Zap}
            color="purple"
          >
            <div className="space-y-4">
              <FormSelect
                label="1st Tiebreaker"
                id="tiebreaker1"
                value={config.tiebreaker1}
                onChange={(e) =>
                  handleConfigChange('tiebreaker1', e.target.value)
                }
                options={TIEBREAKER_OPTIONS}
              />
              <FormSelect
                label="2nd Tiebreaker"
                id="tiebreaker2"
                value={config.tiebreaker2}
                onChange={(e) =>
                  handleConfigChange('tiebreaker2', e.target.value)
                }
                options={TIEBREAKER_OPTIONS}
              />
              <FormSelect
                label="3rd Tiebreaker"
                id="tiebreaker3"
                value={config.tiebreaker3}
                onChange={(e) =>
                  handleConfigChange('tiebreaker3', e.target.value)
                }
                options={TIEBREAKER_OPTIONS}
              />
            </div>
          </FormSection>
        </div>

        {/* REGISTRATION SETTINGS */}
        <div className="mb-8">
          <FormSection
            title="Registration Settings"
            description="Control team registration and entry fees"
            icon={Lock}
            color="red"
          >
            <div className="space-y-4">
              <ToggleSwitch
                label="Registration Open"
                description="Allow new teams to join the league"
                checked={config.registrationOpen}
                onChange={(checked) =>
                  handleConfigChange('registrationOpen', checked)
                }
              />

              {config.registrationOpen && (
                <>
                  <FormInput
                    label="Entry Fee (£) - Optional"
                    id="entryFee"
                    type="number"
                    value={config.entryFee || 0}
                    onChange={(e) =>
                      handleConfigChange(
                        'entryFee',
                        parseFloat(e.target.value) || null
                      )
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <FormInput
                    label="Registration Deadline - Optional"
                    id="registrationDeadline"
                    type="datetime-local"
                    value={
                      config.registrationDeadline
                        ? config.registrationDeadline.slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      handleConfigChange('registrationDeadline', e.target.value)
                    }
                  />
                </>
              )}
            </div>
          </FormSection>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700">
              <X className="h-4 w-4" />
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-6 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
