/**
 * Preferences Settings Page
 * User preferences, notifications, and display settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Eye,
  Volume2,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

interface PreferencesData {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: {
    matchReminders: boolean;
    teamInvites: boolean;
    performanceUpdates: boolean;
    weeklyDigest: boolean;
    systemUpdates: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    matchEvents: boolean;
    teamMessages: boolean;
    achievements: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showActivity: boolean;
    showStats: boolean;
  };
  display: {
    compactMode: boolean;
    reduceAnimations: boolean;
    fontSize: 'small' | 'normal' | 'large';
  };
}

export default function PreferencesPage() {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'auto',
    language: 'en',
    timezone: 'Europe/London',
    emailNotifications: {
      matchReminders: true,
      teamInvites: true,
      performanceUpdates: true,
      weeklyDigest: true,
      systemUpdates: false,
    },
    pushNotifications: {
      enabled: true,
      matchEvents: true,
      teamMessages: true,
      achievements: true,
    },
    privacy: {
      profileVisibility: 'friends',
      showActivity: true,
      showStats: true,
    },
    display: {
      compactMode: false,
      reduceAnimations: false,
      fontSize: 'normal',
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Preferences saved successfully!');
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    toast.success('Preferences reset to defaults');
    setHasChanges(false);
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences((prev) => {
      const updated = { ...prev };
      const keys = key.split('.');
      let current = updated as any;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Preferences</h1>
          <p className="text-charcoal-600">Customize your experience and notification settings</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* DISPLAY & THEME */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-blue-600" />
            Display & Theme
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="text-charcoal-700 font-semibold">Theme</Label>
            <div className="grid md:grid-cols-3 gap-4">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    updatePreference('theme', theme);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all transform hover:scale-102 ${
                    preferences.theme === theme
                      ? 'border-gold-500 bg-gold-50 shadow-md'
                      : 'border-neutral-200 bg-neutral-50 hover:border-gold-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {theme === 'light' && <Sun className="w-6 h-6 text-yellow-500" />}
                    {theme === 'dark' && <Moon className="w-6 h-6 text-purple-600" />}
                    {theme === 'auto' && <Globe className="w-6 h-6 text-blue-600" />}
                  </div>
                  <p className="font-semibold text-charcoal-900 capitalize text-sm">{theme}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <Label className="text-charcoal-700 font-semibold">Font Size</Label>
            <div className="grid md:grid-cols-3 gap-4">
              {(['small', 'normal', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePreference('display.fontSize', size)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    preferences.display.fontSize === size
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-neutral-200 bg-neutral-50 hover:border-gold-300'
                  }`}
                >
                  <p
                    className={`font-semibold text-charcoal-900 capitalize ${
                      size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                    }`}
                  >
                    {size}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <Label className="text-charcoal-700 font-semibold">Display Options</Label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all">
                <input
                  type="checkbox"
                  checked={preferences.display.compactMode}
                  onChange={(e) => updatePreference('display.compactMode', e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-charcoal-900">Compact Mode</p>
                  <p className="text-xs text-charcoal-600">Reduce spacing and make content denser</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all">
                <input
                  type="checkbox"
                  checked={preferences.display.reduceAnimations}
                  onChange={(e) => updatePreference('display.reduceAnimations', e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-charcoal-900">Reduce Animations</p>
                  <p className="text-xs text-charcoal-600">Minimize motion for accessibility</p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NOTIFICATIONS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-gold-600" />
            Notifications
          </CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Email Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-gold-600" />
              <h3 className="font-bold text-charcoal-900">Email Notifications</h3>
            </div>
            <div className="space-y-2">
              {[
                {
                  key: 'emailNotifications.matchReminders',
                  label: 'Match Reminders',
                  desc: 'Get notified before upcoming matches',
                },
                {
                  key: 'emailNotifications.teamInvites',
                  label: 'Team Invites',
                  desc: 'Receive team join invitations',
                },
                {
                  key: 'emailNotifications.performanceUpdates',
                  label: 'Performance Updates',
                  desc: 'Weekly performance statistics',
                },
                {
                  key: 'emailNotifications.weeklyDigest',
                  label: 'Weekly Digest',
                  desc: 'Summary of league activities',
                },
                {
                  key: 'emailNotifications.systemUpdates',
                  label: 'System Updates',
                  desc: 'Important platform announcements',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={
                      preferences.emailNotifications[
                        item.key.split('.')[1] as keyof typeof preferences.emailNotifications
                      ]
                    }
                    onChange={(e) => updatePreference(item.key, e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal-900 text-sm">{item.label}</p>
                    <p className="text-xs text-charcoal-600">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-3 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-charcoal-900">Push Notifications</h3>
            </div>
            <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200 cursor-pointer hover:border-purple-300 transition-all">
              <input
                type="checkbox"
                checked={preferences.pushNotifications.enabled}
                onChange={(e) => updatePreference('pushNotifications.enabled', e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 text-purple-600 cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-bold text-charcoal-900">Enable Push Notifications</p>
                <p className="text-xs text-charcoal-600">Get instant alerts on your device</p>
              </div>
            </label>

            {preferences.pushNotifications.enabled && (
              <div className="space-y-2 mt-3">
                {[
                  { key: 'pushNotifications.matchEvents', label: 'Match Events', desc: 'Live match updates' },
                  { key: 'pushNotifications.teamMessages', label: 'Team Messages', desc: 'Team chat alerts' },
                  { key: 'pushNotifications.achievements', label: 'Achievements', desc: 'New achievements earned' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={
                        preferences.pushNotifications[
                          item.key.split('.')[1] as keyof typeof preferences.pushNotifications
                        ]
                      }
                      onChange={(e) => updatePreference(item.key, e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal-900 text-sm">{item.label}</p>
                      <p className="text-xs text-charcoal-600">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PRIVACY & VISIBILITY */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-purple-600" />
            Privacy & Visibility
          </CardTitle>
          <CardDescription>Control who can see your information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-3">
            <Label className="text-charcoal-700 font-semibold">Profile Visibility</Label>
            <div className="grid md:grid-cols-3 gap-4">
              {(['public', 'friends', 'private'] as const).map((visibility) => (
                <button
                  key={visibility}
                  onClick={() => updatePreference('privacy.profileVisibility', visibility)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    preferences.privacy.profileVisibility === visibility
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-neutral-200 bg-neutral-50 hover:border-purple-300'
                  }`}
                >
                  <p className="font-semibold text-charcoal-900 capitalize text-sm">{visibility}</p>
                  <p className="text-xs text-charcoal-600 mt-1">
                    {visibility === 'public' && 'Everyone can see'}
                    {visibility === 'friends' && 'Friends only'}
                    {visibility === 'private' && 'Only you'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Options */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <Label className="text-charcoal-700 font-semibold">Activity & Statistics</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all">
                <input
                  type="checkbox"
                  checked={preferences.privacy.showActivity}
                  onChange={(e) => updatePreference('privacy.showActivity', e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-charcoal-900 text-sm">Show Activity Status</p>
                  <p className="text-xs text-charcoal-600">Let others see when you're online</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-gold-300 transition-all">
                <input
                  type="checkbox"
                  checked={preferences.privacy.showStats}
                  onChange={(e) => updatePreference('privacy.showStats', e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-charcoal-900 text-sm">Show Statistics</p>
                  <p className="text-xs text-charcoal-600">Allow others to view your stats</p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LANGUAGE & REGIONAL */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-green-600" />
            Language & Regional
          </CardTitle>
          <CardDescription>Language and timezone preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-charcoal-700 font-semibold">
              Language
            </Label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => updatePreference('language', e.target.value)}
              className="w-full p-3 border-2 border-neutral-200 rounded-lg bg-white text-charcoal-900 font-medium hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="it">Italiano (Italian)</option>
              <option value="pt">Português (Portuguese)</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-charcoal-700 font-semibold">
              Timezone
            </Label>
            <select
              id="timezone"
              value={preferences.timezone}
              onChange={(e) => updatePreference('timezone', e.target.value)}
              className="w-full p-3 border-2 border-neutral-200 rounded-lg bg-white text-charcoal-900 font-medium hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
            >
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* SAVE REMINDER */}
      {hasChanges && (
        <div className="p-4 bg-gold-50 border-l-4 border-gold-500 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-charcoal-900">You have unsaved changes</p>
            <p className="text-sm text-charcoal-700 mt-1">Click the "Save Changes" button to apply your preferences.</p>
          </div>
        </div>
      )}
    </div>
  );
}
