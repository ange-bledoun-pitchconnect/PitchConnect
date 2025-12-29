// =============================================================================
// 🏆 PITCHCONNECT - SETTINGS CLIENT COMPONENT
// =============================================================================
// Interactive client component for league settings
// Role-based: Admin sees edit form, others see read-only
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Trophy,
  Users,
  Zap,
  Lock,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle,
  Eye,
  Edit,
  BarChart3,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface LeagueSettings {
  id: string;
  leagueId: string;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: Record<string, number>;
  minTeams: number;
  maxTeams: number | null;
  maxPlayersPerTeam: number | null;
  minPlayersPerMatch: number;
  minPlayerAge: number;
  maxPlayerAge: number;
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
  registrationOpen: boolean;
  registrationDeadline: Date | null;
  entryFee: number | null;
  standingsColumns: string[];
}

interface LeagueData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  season: string;
  format: string;
  isPublic: boolean;
  settings: LeagueSettings | null;
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
}

interface SettingsClientProps {
  leagueId: string;
  league: LeagueData;
  sportConfig: SportConfig;
  tiebreakers: Array<{ value: string; label: string }>;
  standingsColumns: Array<{ key: string; label: string; shortLabel: string }>;
  isAdmin: boolean;
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function SettingsClient({
  leagueId,
  league,
  sportConfig,
  tiebreakers,
  standingsColumns,
  isAdmin,
}: SettingsClientProps) {
  const [settings, setSettings] = useState<LeagueSettings | null>(league.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleChange = (field: keyof LeagueSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleColumnToggle = (columnKey: string) => {
    if (!settings) return;
    const current = settings.standingsColumns || [];
    const updated = current.includes(columnKey)
      ? current.filter(c => c !== columnKey)
      : [...current, columnKey];
    setSettings({ ...settings, standingsColumns: updated });
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      showToast('Settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Settings className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Settings Configured</h2>
        <p className="text-slate-600 dark:text-slate-400">League settings have not been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/leagues/${leagueId}`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">League Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">{league.name} ({league.code})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{sportConfig.icon}</span>
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
            {sportConfig.label}
          </span>
          {isAdmin ? (
            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-1">
              <Edit className="w-4 h-4" /> Admin
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" /> View Only
            </span>
          )}
        </div>
      </div>

      {/* Points Configuration */}
      <SettingsSection
        title="Points Configuration"
        description="Points awarded for different match outcomes"
        icon={<Trophy className="w-5 h-5 text-amber-500" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsField label="Points for Win" value={settings.pointsForWin} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="0"
                value={settings.pointsForWin}
                onChange={(e) => handleChange('pointsForWin', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <DisplayValue value={settings.pointsForWin} color="green" />
            )}
          </SettingsField>

          <SettingsField label="Points for Draw" value={settings.pointsForDraw} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="0"
                value={settings.pointsForDraw}
                onChange={(e) => handleChange('pointsForDraw', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <DisplayValue value={settings.pointsForDraw} color="yellow" />
            )}
          </SettingsField>

          <SettingsField label="Points for Loss" value={settings.pointsForLoss} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="0"
                value={settings.pointsForLoss}
                onChange={(e) => handleChange('pointsForLoss', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <DisplayValue value={settings.pointsForLoss} color="red" />
            )}
          </SettingsField>
        </div>

        {/* Bonus Points */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Bonus Points</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Enable bonus points for this sport</p>
            </div>
            {isAdmin ? (
              <input
                type="checkbox"
                checked={settings.bonusPointsEnabled}
                onChange={(e) => handleChange('bonusPointsEnabled', e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.bonusPointsEnabled 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {settings.bonusPointsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Team Configuration */}
      <SettingsSection
        title="Team Configuration"
        description="Team and player limits for the league"
        icon={<Users className="w-5 h-5 text-blue-500" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField label="Minimum Teams" value={settings.minTeams} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="2"
                value={settings.minTeams}
                onChange={(e) => handleChange('minTeams', parseInt(e.target.value) || 2)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <DisplayValue value={settings.minTeams} />
            )}
          </SettingsField>

          <SettingsField label="Maximum Teams (0 = Unlimited)" value={settings.maxTeams || 0} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="0"
                value={settings.maxTeams || 0}
                onChange={(e) => handleChange('maxTeams', parseInt(e.target.value) || null)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <DisplayValue value={settings.maxTeams || 'Unlimited'} />
            )}
          </SettingsField>

          <SettingsField label="Max Players per Team" value={settings.maxPlayersPerTeam || 0} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="0"
                value={settings.maxPlayersPerTeam || 0}
                onChange={(e) => handleChange('maxPlayersPerTeam', parseInt(e.target.value) || null)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <DisplayValue value={settings.maxPlayersPerTeam || 'Unlimited'} />
            )}
          </SettingsField>

          <SettingsField label="Min Players per Match" value={settings.minPlayersPerMatch} disabled={!isAdmin}>
            {isAdmin ? (
              <input
                type="number"
                min="1"
                value={settings.minPlayersPerMatch}
                onChange={(e) => handleChange('minPlayersPerMatch', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <DisplayValue value={settings.minPlayersPerMatch} />
            )}
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Tiebreaker Rules */}
      <SettingsSection
        title="Tiebreaker Rules"
        description="How teams are ranked when they have equal points"
        icon={<Zap className="w-5 h-5 text-purple-500" />}
      >
        <div className="space-y-4">
          {[
            { key: 'tiebreaker1', label: '1st Tiebreaker' },
            { key: 'tiebreaker2', label: '2nd Tiebreaker' },
            { key: 'tiebreaker3', label: '3rd Tiebreaker' },
          ].map(({ key, label }) => (
            <SettingsField key={key} label={label} value={settings[key as keyof LeagueSettings]} disabled={!isAdmin}>
              {isAdmin ? (
                <select
                  value={settings[key as keyof LeagueSettings] as string}
                  onChange={(e) => handleChange(key as keyof LeagueSettings, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {tiebreakers.map(tb => (
                    <option key={tb.value} value={tb.value}>{tb.label}</option>
                  ))}
                </select>
              ) : (
                <DisplayValue 
                  value={tiebreakers.find(tb => tb.value === settings[key as keyof LeagueSettings])?.label || settings[key as keyof LeagueSettings]} 
                />
              )}
            </SettingsField>
          ))}
        </div>
      </SettingsSection>

      {/* Standings Columns */}
      <SettingsSection
        title="Standings Display"
        description="Choose which columns to show in the league table"
        icon={<BarChart3 className="w-5 h-5 text-orange-500" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {standingsColumns.map(col => {
            const isSelected = settings.standingsColumns?.includes(col.key);
            return (
              <button
                key={col.key}
                onClick={() => isAdmin && handleColumnToggle(col.key)}
                disabled={!isAdmin}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-400'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                } ${isAdmin ? 'hover:border-orange-400 cursor-pointer' : 'cursor-default'}`}
              >
                <p className="font-semibold text-sm">{col.shortLabel}</p>
                <p className="text-xs">{col.label}</p>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* Registration Settings */}
      <SettingsSection
        title="Registration"
        description="Control team registration and entry fees"
        icon={<Lock className="w-5 h-5 text-red-500" />}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Registration Open</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Allow new teams to join</p>
            </div>
            {isAdmin ? (
              <input
                type="checkbox"
                checked={settings.registrationOpen}
                onChange={(e) => handleChange('registrationOpen', e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.registrationOpen 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {settings.registrationOpen ? 'Open' : 'Closed'}
              </span>
            )}
          </div>

          {settings.registrationOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsField label="Entry Fee (£)" value={settings.entryFee || 0} disabled={!isAdmin}>
                {isAdmin ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.entryFee || 0}
                    onChange={(e) => handleChange('entryFee', parseFloat(e.target.value) || null)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <DisplayValue value={settings.entryFee ? `£${settings.entryFee}` : 'Free'} />
                )}
              </SettingsField>

              <SettingsField label="Registration Deadline" value="" disabled={!isAdmin}>
                {isAdmin ? (
                  <input
                    type="datetime-local"
                    value={settings.registrationDeadline ? new Date(settings.registrationDeadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('registrationDeadline', e.target.value ? new Date(e.target.value) : null)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <DisplayValue 
                    value={settings.registrationDeadline 
                      ? new Date(settings.registrationDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'No deadline'
                    } 
                  />
                )}
              </SettingsField>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Save Button (Admin Only) */}
      {isAdmin && (
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href={`/dashboard/leagues/${leagueId}`}
            className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SettingsField({
  label,
  value,
  disabled,
  children,
}: {
  label: string;
  value: any;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function DisplayValue({ value, color }: { value: any; color?: 'green' | 'yellow' | 'red' }) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
  };

  return (
    <div className={`px-4 py-3 rounded-lg border text-center font-bold ${
      color ? colorClasses[color] : 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600'
    }`}>
      {value}
    </div>
  );
}