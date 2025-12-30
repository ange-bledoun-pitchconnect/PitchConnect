/**
 * Preferences Settings Page - ENTERPRISE EDITION
 * Path: /dashboard/settings/preferences/page.tsx
 *
 * ============================================================================
 * FEATURES (Display & Theme Only - No Notifications)
 * ============================================================================
 * ✅ Theme selection (Light, Dark, System)
 * ✅ Language selection
 * ✅ Timezone configuration
 * ✅ Display options (Compact mode, Reduce animations)
 * ✅ Font size customization
 * ✅ Date/Time format preferences
 * ✅ Currency preferences
 * ✅ Measurement units (Metric/Imperial)
 * ✅ Custom toast notifications
 * ✅ Dark mode support
 * ✅ Accessibility compliance
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Monitor,
  Palette,
  Type,
  Calendar,
  Clock,
  DollarSign,
  Ruler,
  Save,
  RotateCcw,
  Check,
  X,
  Info,
  Loader2,
  AlertCircle,
  Zap,
  Eye,
} from 'lucide-react';

// ============================================================================
// UI COMPONENTS
// ============================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ============================================================================
// CUSTOM TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600',
    default: 'bg-charcoal-800 dark:bg-charcoal-700',
  };

  const icons = {
    success: <Check className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    default: <Loader2 className="w-5 h-5 text-white animate-spin" />,
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
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
  <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className="pointer-events-auto">
        <Toast message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'default') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };
};

// ============================================================================
// TYPES
// ============================================================================

interface PreferencesData {
  // Theme
  theme: 'light' | 'dark' | 'system';
  // Regional
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  measurementUnit: 'metric' | 'imperial';
  // Display
  fontSize: 'small' | 'normal' | 'large';
  compactMode: boolean;
  reduceAnimations: boolean;
  highContrastMode: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PREFERENCES: PreferencesData = {
  theme: 'system',
  language: 'en',
  timezone: 'Europe/London',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'GBP',
  measurementUnit: 'metric',
  fontSize: 'normal',
  compactMode: false,
  reduceAnimations: false,
  highContrastMode: false,
};

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'Europe/Rome', label: 'Rome (CET)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT)' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '25/12/2025' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/25/2025' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2025-12-25' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '25 Dec 2025' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', example: 'Dec 25, 2025' },
];

const CURRENCIES = [
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Theme Card Component
 */
interface ThemeCardProps {
  theme: 'light' | 'dark' | 'system';
  selected: boolean;
  onClick: () => void;
}

const ThemeCard = ({ theme, selected, onClick }: ThemeCardProps) => {
  const config = {
    light: {
      icon: Sun,
      label: 'Light',
      description: 'Light theme for bright environments',
      preview: 'bg-white border-neutral-200',
      previewAccent: 'bg-neutral-100',
    },
    dark: {
      icon: Moon,
      label: 'Dark',
      description: 'Dark theme to reduce eye strain',
      preview: 'bg-charcoal-800 border-charcoal-700',
      previewAccent: 'bg-charcoal-700',
    },
    system: {
      icon: Monitor,
      label: 'System',
      description: 'Follow your device settings',
      preview: 'bg-gradient-to-r from-white to-charcoal-800 border-neutral-300',
      previewAccent: 'bg-gradient-to-r from-neutral-100 to-charcoal-700',
    },
  };

  const { icon: Icon, label, description, preview, previewAccent } = config[theme];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-gold-500 dark:border-gold-400 bg-gold-50 dark:bg-gold-900/20 shadow-md'
          : 'border-neutral-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700'
      }`}
    >
      {/* Preview */}
      <div className={`w-full h-16 rounded-lg border mb-3 ${preview} overflow-hidden`}>
        <div className={`h-4 ${previewAccent}`} />
        <div className="p-2 space-y-1">
          <div className={`h-1.5 w-3/4 rounded ${previewAccent}`} />
          <div className={`h-1.5 w-1/2 rounded ${previewAccent}`} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            selected
              ? 'bg-gold-100 dark:bg-gold-900/30'
              : 'bg-neutral-100 dark:bg-charcoal-700'
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              selected ? 'text-gold-600 dark:text-gold-400' : 'text-charcoal-600 dark:text-charcoal-400'
            }`}
          />
        </div>
        <div>
          <p className="font-bold text-charcoal-900 dark:text-white">{label}</p>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">{description}</p>
        </div>
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-1 text-gold-600 dark:text-gold-400">
          <Check className="w-4 h-4" />
          <span className="text-xs font-semibold">Selected</span>
        </div>
      )}
    </button>
  );
};

/**
 * Font Size Selector Component
 */
interface FontSizeSelectorProps {
  value: 'small' | 'normal' | 'large';
  onChange: (value: 'small' | 'normal' | 'large') => void;
}

const FontSizeSelector = ({ value, onChange }: FontSizeSelectorProps) => {
  const sizes = [
    { id: 'small' as const, label: 'Small', textClass: 'text-sm' },
    { id: 'normal' as const, label: 'Normal', textClass: 'text-base' },
    { id: 'large' as const, label: 'Large', textClass: 'text-lg' },
  ];

  return (
    <div className="flex gap-3">
      {sizes.map((size) => (
        <button
          key={size.id}
          onClick={() => onChange(size.id)}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            value === size.id
              ? 'border-gold-500 dark:border-gold-400 bg-gold-50 dark:bg-gold-900/20'
              : 'border-neutral-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-700'
          }`}
        >
          <span className={`font-semibold text-charcoal-900 dark:text-white ${size.textClass}`}>
            Aa
          </span>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">{size.label}</p>
        </button>
      ))}
    </div>
  );
};

/**
 * Toggle Switch Component
 */
interface ToggleSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ElementType;
}

const ToggleSwitch = ({ label, description, checked, onChange, icon: Icon }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-charcoal-700/50 rounded-xl">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            checked ? 'bg-gold-100 dark:bg-gold-900/30' : 'bg-neutral-200 dark:bg-charcoal-600'
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              checked ? 'text-gold-600 dark:text-gold-400' : 'text-charcoal-500 dark:text-charcoal-400'
            }`}
          />
        </div>
        <div>
          <p className="font-semibold text-charcoal-900 dark:text-white">{label}</p>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          checked ? 'bg-gold-500 dark:bg-gold-600' : 'bg-neutral-300 dark:bg-charcoal-600'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PreferencesPage() {
  const { toasts, removeToast, success, error: showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesData>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pitchconnect-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved preferences');
      }
    }
  }, []);

  const updatePreference = useCallback(<K extends keyof PreferencesData>(
    key: K,
    value: PreferencesData[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      localStorage.setItem('pitchconnect-preferences', JSON.stringify(preferences));

      // Apply theme
      const html = document.documentElement;
      if (preferences.theme === 'dark') {
        html.classList.add('dark');
      } else if (preferences.theme === 'light') {
        html.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }

      success('Preferences saved successfully!');
      setHasChanges(false);
    } catch (err) {
      showError('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">Preferences</h2>
          <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
            Customize your display, language, and regional settings
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-charcoal-300 dark:border-charcoal-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold-500 to-orange-500 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Theme Selection */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
            <Palette className="w-5 h-5 text-purple-500" />
            Theme
          </CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThemeCard
              theme="light"
              selected={preferences.theme === 'light'}
              onClick={() => updatePreference('theme', 'light')}
            />
            <ThemeCard
              theme="dark"
              selected={preferences.theme === 'dark'}
              onClick={() => updatePreference('theme', 'dark')}
            />
            <ThemeCard
              theme="system"
              selected={preferences.theme === 'system'}
              onClick={() => updatePreference('theme', 'system')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
            <Eye className="w-5 h-5 text-blue-500" />
            Display
          </CardTitle>
          <CardDescription>Customize the interface appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4" />
              Font Size
            </Label>
            <FontSizeSelector
              value={preferences.fontSize}
              onChange={(v) => updatePreference('fontSize', v)}
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <ToggleSwitch
              label="Compact Mode"
              description="Reduce spacing for more content"
              checked={preferences.compactMode}
              onChange={() => updatePreference('compactMode', !preferences.compactMode)}
              icon={Zap}
            />
            <ToggleSwitch
              label="Reduce Animations"
              description="Minimize motion for accessibility"
              checked={preferences.reduceAnimations}
              onChange={() => updatePreference('reduceAnimations', !preferences.reduceAnimations)}
              icon={Zap}
            />
            <ToggleSwitch
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
              checked={preferences.highContrastMode}
              onChange={() => updatePreference('highContrastMode', !preferences.highContrastMode)}
              icon={Eye}
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
            <Globe className="w-5 h-5 text-green-500" />
            Regional Settings
          </CardTitle>
          <CardDescription>Language, timezone, and format preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4" />
                Language
              </Label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                Timezone
              </Label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Date Format
              </Label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => updatePreference('dateFormat', e.target.value)}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
              >
                {DATE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label} ({fmt.example})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                Time Format
              </Label>
              <div className="flex gap-3">
                <button
                  onClick={() => updatePreference('timeFormat', '12h')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    preferences.timeFormat === '12h'
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                      : 'border-neutral-200 dark:border-charcoal-600'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">12-hour</span>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400">2:30 PM</p>
                </button>
                <button
                  onClick={() => updatePreference('timeFormat', '24h')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    preferences.timeFormat === '24h'
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                      : 'border-neutral-200 dark:border-charcoal-600'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">24-hour</span>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400">14:30</p>
                </button>
              </div>
            </div>
          </div>

          {/* Currency & Units */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Currency
              </Label>
              <select
                value={preferences.currency}
                onChange={(e) => updatePreference('currency', e.target.value)}
                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.symbol} - {curr.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4" />
                Measurement Units
              </Label>
              <div className="flex gap-3">
                <button
                  onClick={() => updatePreference('measurementUnit', 'metric')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    preferences.measurementUnit === 'metric'
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                      : 'border-neutral-200 dark:border-charcoal-600'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">Metric</span>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400">km, kg, °C</p>
                </button>
                <button
                  onClick={() => updatePreference('measurementUnit', 'imperial')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    preferences.measurementUnit === 'imperial'
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                      : 'border-neutral-200 dark:border-charcoal-600'
                  }`}
                >
                  <span className="font-semibold text-charcoal-900 dark:text-white">Imperial</span>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400">mi, lb, °F</p>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-gold-500 dark:bg-gold-600 text-white rounded-full shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">You have unsaved changes</span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-gold-600 hover:bg-gold-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Now'}
          </Button>
        </div>
      )}
    </div>
  );
}

PreferencesPage.displayName = 'PreferencesPage';