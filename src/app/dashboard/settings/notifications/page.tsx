/**
 * Notifications Settings Page
 * Manage notification channels and preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Volume2,
  AlertCircle,
  CheckCircle,
  Eye,
  Save,
  RotateCcw,
  Zap,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
  color: string;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
}

interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface NotificationSettings {
  channels: NotificationChannel[];
  categories: NotificationCategory[];
  quietHours: QuietHours;
  frequency: string;
}

export default function NotificationsPage() {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [frequency, setFrequency] = useState('instant');
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  });

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-6 h-6" />,
      description: 'Receive notifications via email',
      enabled: true,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'Get instant alerts on your device',
      enabled: true,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'inapp',
      name: 'In-App Notifications',
      icon: <Bell className="w-6 h-6" />,
      description: 'See alerts within the app',
      enabled: true,
      color: 'from-gold-500 to-orange-400',
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <MessageSquare className="w-6 h-6" />,
      description: 'Receive text messages (Premium)',
      enabled: false,
      color: 'from-green-500 to-green-600',
    },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'matches',
      name: 'Match Notifications',
      description: 'Match schedules, results, and updates',
      email: true,
      push: true,
      inApp: true,
      sms: false,
    },
    {
      id: 'team',
      name: 'Team Activities',
      description: 'Team invites, member changes, and announcements',
      email: true,
      push: true,
      inApp: true,
      sms: false,
    },
    {
      id: 'training',
      name: 'Training Sessions',
      description: 'Training reminders and session updates',
      email: true,
      push: true,
      inApp: true,
      sms: false,
    },
    {
      id: 'performance',
      name: 'Performance Updates',
      description: 'Stats, achievements, and progress',
      email: true,
      push: false,
      inApp: true,
      sms: false,
    },
    {
      id: 'payments',
      name: 'Payment Alerts',
      description: 'Timesheet approvals and payment notifications',
      email: true,
      push: true,
      inApp: true,
      sms: false,
    },
    {
      id: 'social',
      name: 'Social Interactions',
      description: 'Comments, messages, and interactions',
      email: false,
      push: true,
      inApp: true,
      sms: false,
    },
    {
      id: 'system',
      name: 'System Updates',
      description: 'Important platform announcements',
      email: true,
      push: false,
      inApp: true,
      sms: false,
    },
    {
      id: 'marketing',
      name: 'Marketing & Promotions',
      description: 'New features, offers, and news',
      email: false,
      push: false,
      inApp: false,
      sms: false,
    },
  ]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      
      // Update state with fetched settings
      if (data.settings) {
        if (data.settings.channels) setChannels(data.settings.channels);
        if (data.settings.categories) setCategories(data.settings.categories);
        if (data.settings.quietHours) setQuietHours(data.settings.quietHours);
        if (data.settings.frequency) setFrequency(data.settings.frequency);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelToggle = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
      )
    );
    setHasChanges(true);
  };

  const handleCategoryChange = (
    categoryId: string,
    channel: keyof Omit<NotificationCategory, 'id' | 'name' | 'description'>
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [channel]: !cat[channel] } : cat
      )
    );
    setHasChanges(true);
  };

  const handleQuietHoursToggle = () => {
    setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    setQuietHours((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels,
          categories,
          quietHours,
          frequency,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('✅ Notification settings saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default settings?')) return;

    setIsLoading(true);
    await fetchSettings();
    toast.success('🔄 Settings reset to defaults');
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Notifications</h1>
          <p className="text-charcoal-600">Manage how and when you receive notifications</p>
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
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* NOTIFICATION CHANNELS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Notification Channels
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelToggle(channel.id)}
                className={`p-6 rounded-xl border-2 transition-all transform hover:scale-102 text-left ${
                  channel.enabled
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${channel.color} text-white`}
                  >
                    {channel.icon}
                  </div>
                  {channel.enabled && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <h3 className="font-bold text-charcoal-900 mb-1">{channel.name}</h3>
                <p className="text-sm text-charcoal-600">{channel.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NOTIFICATION CATEGORIES */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Customize notifications by category</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Push
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    <Bell className="w-4 h-4 inline mr-1" />
                    In-App
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    SMS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {categories.map((category, idx) => (
                  <tr
                    key={category.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-charcoal-900">{category.name}</p>
                        <p className="text-xs text-charcoal-600">{category.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.email}
                          onChange={() => handleCategoryChange(category.id, 'email')}
                          className="w-5 h-5 rounded border-neutral-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.push}
                          onChange={() => handleCategoryChange(category.id, 'push')}
                          className="w-5 h-5 rounded border-neutral-300 text-purple-600 cursor-pointer focus:ring-2 focus:ring-purple-500"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.inApp}
                          onChange={() => handleCategoryChange(category.id, 'inApp')}
                          className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer focus:ring-2 focus:ring-gold-500"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.sms}
                          onChange={() => handleCategoryChange(category.id, 'sms')}
                          disabled={!channels.find((c) => c.id === 'sms')?.enabled}
                          className="w-5 h-5 rounded border-neutral-300 text-green-600 cursor-pointer focus:ring-2 focus:ring-green-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* QUIET HOURS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Set times when you don't want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <label className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:border-orange-300 transition-all">
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={handleQuietHoursToggle}
              className="w-5 h-5 rounded border-neutral-300 text-orange-600 cursor-pointer focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex-1">
              <p className="font-semibold text-charcoal-900">Enable Quiet Hours</p>
              <p className="text-xs text-charcoal-600">Mute non-urgent notifications during set times</p>
            </div>
          </label>

          {quietHours.enabled && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-charcoal-700">Start Time</label>
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-neutral-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-charcoal-700">End Time</label>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-neutral-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              During quiet hours, you'll still receive urgent notifications related to active matches and critical team updates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* NOTIFICATION FREQUENCY */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-green-600" />
            Notification Frequency
          </CardTitle>
          <CardDescription>How often you receive notification digests</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {[
            { value: 'instant', label: 'Instant', desc: 'Get notified immediately' },
            { value: 'hourly', label: 'Hourly Digest', desc: 'Consolidated notifications every hour' },
            { value: 'daily', label: 'Daily Digest', desc: 'Summary at the end of the day' },
            { value: 'weekly', label: 'Weekly Digest', desc: 'Weekly summary on Sundays' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:border-green-300 transition-all"
            >
              <input
                type="radio"
                name="frequency"
                value={option.value}
                checked={frequency === option.value}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-5 h-5 cursor-pointer text-green-600 focus:ring-2 focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-charcoal-900">{option.label}</p>
                <p className="text-xs text-charcoal-600">{option.desc}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* SAVE REMINDER */}
      {hasChanges && (
        <div className="p-4 bg-gold-50 border-l-4 border-gold-500 rounded-lg flex items-start gap-3 sticky bottom-4 shadow-lg">
          <AlertCircle className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-charcoal-900">You have unsaved changes</p>
            <p className="text-sm text-charcoal-700 mt-1">
              Click the "Save Changes" button at the top to apply your notification preferences.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Now
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
