'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Smartphone,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronRight,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Profile
    firstName: session?.user?.name?.split(' ')[0] || '',
    lastName: session?.user?.name?.split(' ')[1] || '',
    email: session?.user?.email || '',
    phone: '',
    bio: '',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    matchReminders: true,
    trainingReminders: true,
    teamUpdates: true,
    statsUpdates: true,
    achievementAlerts: true,
    
    // Privacy
    profileVisibility: 'team',
    showStats: true,
    showActivity: true,
    allowMessages: true,
    
    // Appearance
    theme: 'auto',
    language: 'en-GB',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    
    // Performance
    dataQuality: 'high',
    autoSyncData: true,
    offlineMode: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'data', label: 'Data & Storage', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Settings</h1>
          <p className="text-charcoal-600">Manage your account preferences and app settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-md'
                            : 'text-charcoal-700 hover:bg-neutral-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{section.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Save Success Banner */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-down">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gold-500" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information and profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+44 7700 900000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={settings.bio}
                      onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-charcoal-900"
                    />
                    <p className="text-xs text-charcoal-500">Maximum 500 characters</p>
                  </div>

                  <Button
                    onClick={() => router.push('/dashboard/settings/profile')}
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    Edit Full Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gold-500" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified about activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900">Notification Channels</h3>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-charcoal-500" />
                        <div>
                          <p className="font-medium text-charcoal-900">Email Notifications</p>
                          <p className="text-sm text-charcoal-600">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-charcoal-500" />
                        <div>
                          <p className="font-medium text-charcoal-900">Push Notifications</p>
                          <p className="text-sm text-charcoal-600">Get alerts on your device</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-charcoal-500" />
                        <div>
                          <p className="font-medium text-charcoal-900">SMS Notifications</p>
                          <p className="text-sm text-charcoal-600">Receive text messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, smsNotifications: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900">What to Notify</h3>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Match Reminders</p>
                        <p className="text-sm text-charcoal-600">Get notified before matches</p>
                      </div>
                      <Switch
                        checked={settings.matchReminders}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, matchReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Training Reminders</p>
                        <p className="text-sm text-charcoal-600">Training session alerts</p>
                      </div>
                      <Switch
                        checked={settings.trainingReminders}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, trainingReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Team Updates</p>
                        <p className="text-sm text-charcoal-600">News and announcements</p>
                      </div>
                      <Switch
                        checked={settings.teamUpdates}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, teamUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Stats Updates</p>
                        <p className="text-sm text-charcoal-600">Performance statistics</p>
                      </div>
                      <Switch
                        checked={settings.statsUpdates}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, statsUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Achievement Alerts</p>
                        <p className="text-sm text-charcoal-600">When you unlock achievements</p>
                      </div>
                      <Switch
                        checked={settings.achievementAlerts}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, achievementAlerts: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy & Security Section */}
            {activeSection === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gold-500" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>Control your privacy and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900">Profile Visibility</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={settings.profileVisibility === 'public'}
                          onChange={(e) =>
                            setSettings({ ...settings, profileVisibility: e.target.value })
                          }
                          className="w-4 h-4 text-gold-500"
                        />
                        <div>
                          <p className="font-medium text-charcoal-900">Public</p>
                          <p className="text-sm text-charcoal-600">Anyone can see your profile</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="visibility"
                          value="team"
                          checked={settings.profileVisibility === 'team'}
                          onChange={(e) =>
                            setSettings({ ...settings, profileVisibility: e.target.value })
                          }
                          className="w-4 h-4 text-gold-500"
                        />
                        <div>
                          <p className="font-medium text-charcoal-900">Team Only</p>
                          <p className="text-sm text-charcoal-600">Only your teammates can see</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={settings.profileVisibility === 'private'}
                          onChange={(e) =>
                            setSettings({ ...settings, profileVisibility: e.target.value })
                          }
                          className="w-4 h-4 text-gold-500"
                        />
                        <div>
                          <p className="font-medium text-charcoal-900">Private</p>
                          <p className="text-sm text-charcoal-600">Only you can see your profile</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900">Data Sharing</h3>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Show Statistics</p>
                        <p className="text-sm text-charcoal-600">Display your performance stats</p>
                      </div>
                      <Switch
                        checked={settings.showStats}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, showStats: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Show Activity</p>
                        <p className="text-sm text-charcoal-600">Display your recent activity</p>
                      </div>
                      <Switch
                        checked={settings.showActivity}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, showActivity: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-charcoal-900">Allow Messages</p>
                        <p className="text-sm text-charcoal-600">Let others message you</p>
                      </div>
                      <Switch
                        checked={settings.allowMessages}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allowMessages: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Shield className="w-4 h-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-gold-500" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900">Theme</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === 'light'}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border-2 rounded-lg text-center ${
                            settings.theme === 'light'
                              ? 'border-gold-500 bg-gold-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <div className="w-12 h-12 bg-white border rounded mx-auto mb-2" />
                          <p className="text-sm font-medium">Light</p>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border-2 rounded-lg text-center ${
                            settings.theme === 'dark'
                              ? 'border-gold-500 bg-gold-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <div className="w-12 h-12 bg-charcoal-900 border rounded mx-auto mb-2" />
                          <p className="text-sm font-medium">Dark</p>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={settings.theme === 'auto'}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="sr-only"
                        />
                        <div
                          className={`p-4 border-2 rounded-lg text-center ${
                            settings.theme === 'auto'
                              ? 'border-gold-500 bg-gold-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-white to-charcoal-900 border rounded mx-auto mb-2" />
                          <p className="text-sm font-medium">Auto</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regional Section */}
            {activeSection === 'regional' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gold-500" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>Language, timezone, and regional preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="en-GB">English (UK)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gold-500" />
                    Billing & Subscription
                  </CardTitle>
                  <CardDescription>Manage your subscription and payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-gold-50 to-orange-50 rounded-xl border border-gold-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-charcoal-900 text-lg">Player (Free)</h3>
                        <p className="text-sm text-charcoal-600">Basic features included</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white">
                      Upgrade to Pro
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-charcoal-900">Payment Methods</h3>
                    <p className="text-sm text-charcoal-600">No payment methods added</p>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-charcoal-900">Billing History</h3>
                    <p className="text-sm text-charcoal-600">No billing history</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data & Storage Section */}
            {activeSection === 'data' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-gold-500" />
                    Data & Storage
                  </CardTitle>
                  <CardDescription>Manage your data and storage preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-charcoal-900">Auto-Sync Data</p>
                      <p className="text-sm text-charcoal-600">Automatically sync your data</p>
                    </div>
                    <Switch
                      checked={settings.autoSyncData}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoSyncData: checked })
                      }
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-charcoal-900">Export Your Data</h3>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download All Data
                    </Button>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-charcoal-900 text-red-600">Danger Zone</h3>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                    <p className="text-xs text-charcoal-500">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3 sticky bottom-6">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold px-8 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
