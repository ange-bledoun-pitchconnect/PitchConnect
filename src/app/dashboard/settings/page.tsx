'use client';

/**
 * Settings Page - PitchConnect
 * - User preferences
 * - Theme toggle (Light/Dark)
 * - Account management
 * - Notification settings
 * - Privacy controls
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Moon, Sun, Lock, User, Globe, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  matchReminders: boolean;
  weeklyDigest: boolean;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    matchReminders: true,
    weeklyDigest: true,
    twoFactorEnabled: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'security' | 'account'>('appearance');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pitchconnect-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    // Load theme
    const theme = localStorage.getItem('pitchconnect-theme') as 'light' | 'dark' | 'system' || 'light';
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('pitchconnect-settings', JSON.stringify(settings));
      localStorage.setItem('pitchconnect-theme', settings.theme);
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-charcoal-600 dark:text-charcoal-400">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-charcoal-700">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'appearance'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'notifications'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'security'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'account'
                ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                : 'border-transparent text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </span>
          </button>
        </div>
      </div>

      {/* APPEARANCE TAB */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Theme Section */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="mb-6 text-xl font-bold text-charcoal-900 dark:text-white">
              Theme Preference
            </h2>

            <div className="space-y-4">
              {/* Light Mode */}
              <label className="flex cursor-pointer items-start gap-4 rounded-lg p-4 transition-all hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={settings.theme === 'light'}
                  onChange={() => handleThemeChange('light')}
                  className="mt-1 h-5 w-5 text-gold-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Light Mode
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Use light colors for the interface
                  </p>
                </div>
                <Sun className="h-6 w-6 text-yellow-500" />
              </label>

              {/* Dark Mode */}
              <label className="flex cursor-pointer items-start gap-4 rounded-lg p-4 transition-all hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={settings.theme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                  className="mt-1 h-5 w-5 text-gold-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Dark Mode
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Use dark colors to reduce eye strain
                  </p>
                </div>
                <Moon className="h-6 w-6 text-indigo-500" />
              </label>

              {/* System */}
              <label className="flex cursor-pointer items-start gap-4 rounded-lg p-4 transition-all hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={settings.theme === 'system'}
                  onChange={() => handleThemeChange('system')}
                  className="mt-1 h-5 w-5 text-gold-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    System
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Follow your device settings
                  </p>
                </div>
                <Globe className="h-6 w-6 text-blue-500" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="mb-6 text-xl font-bold text-charcoal-900 dark:text-white">
              Notification Settings
            </h2>

            <div className="space-y-4">
              {[
                {
                  key: 'emailNotifications',
                  label: 'Email Notifications',
                  description: 'Receive updates via email'
                },
                {
                  key: 'pushNotifications',
                  label: 'Push Notifications',
                  description: 'Receive browser push notifications'
                },
                {
                  key: 'matchReminders',
                  label: 'Match Reminders',
                  description: 'Get reminded before matches'
                },
                {
                  key: 'weeklyDigest',
                  label: 'Weekly Digest',
                  description: 'Receive a weekly summary email'
                }
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-white">
                      {setting.label}
                    </p>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      {setting.description}
                    </p>
                  </div>
                  <label className="relative flex h-8 w-14 cursor-pointer items-center rounded-full bg-neutral-300 transition-colors dark:bg-charcoal-700"
                    style={{
                      backgroundColor: settings[setting.key as keyof UserSettings] ? '#FFD700' : undefined
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings[setting.key as keyof UserSettings] as boolean}
                      onChange={() => handleToggle(setting.key as keyof UserSettings)}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                        settings[setting.key as keyof UserSettings] ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="mb-6 text-xl font-bold text-charcoal-900 dark:text-white">
              Security Settings
            </h2>

            <div className="space-y-4">
              {/* Two Factor Auth */}
              <div className="flex items-center justify-between rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Add an extra layer of security
                  </p>
                </div>
                <button className="rounded-lg bg-gold-500 px-4 py-2 font-semibold text-white transition-all hover:bg-gold-600">
                  {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Password
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Change your password
                  </p>
                </div>
                <button className="rounded-lg border-2 border-neutral-300 px-4 py-2 font-semibold text-charcoal-900 transition-all hover:border-gold-400 dark:border-charcoal-600 dark:text-white">
                  Change
                </button>
              </div>

              {/* Sessions */}
              <div className="flex items-center justify-between rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-charcoal-700">
                <div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">
                    Active Sessions
                  </p>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Manage your login sessions
                  </p>
                </div>
                <button className="rounded-lg border-2 border-neutral-300 px-4 py-2 font-semibold text-charcoal-900 transition-all hover:border-gold-400 dark:border-charcoal-600 dark:text-white">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT TAB */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="mb-6 text-xl font-bold text-charcoal-900 dark:text-white">
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={session?.user?.name || ''}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ''}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-charcoal-900 dark:border-charcoal-700 dark:bg-charcoal-900 dark:text-white"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
            <h2 className="mb-4 text-xl font-bold text-red-900 dark:text-red-400">
              Danger Zone
            </h2>

            <div className="space-y-4">
              <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-all hover:bg-red-700">
                <LogOut className="h-5 w-5" />
                Sign Out of All Devices
              </button>

              <button className="flex items-center gap-2 rounded-lg border-2 border-red-600 px-4 py-2 font-semibold text-red-600 transition-all hover:bg-red-50 dark:hover:bg-red-900/20">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border-2 border-neutral-300 px-6 py-2 font-semibold text-charcoal-900 transition-all hover:border-neutral-400 dark:border-charcoal-600 dark:text-white dark:hover:border-charcoal-500"
        >
          Cancel
        </button>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="rounded-lg bg-gradient-to-r from-gold-500 to-orange-400 px-6 py-2 font-semibold text-white shadow-lg transition-all hover:from-gold-600 hover:to-orange-500 hover:shadow-xl disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
