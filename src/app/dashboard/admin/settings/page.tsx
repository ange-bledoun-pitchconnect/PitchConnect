'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
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
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronRight,
  RefreshCw,
  Plus,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    firstName: session?.user?.name?.split(' ')[0] || '',
    lastName: session?.user?.name?.split(' ')[1] || '',
    email: session?.user?.email || '',
    phone: '',
    bio: '',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    matchReminders: true,
    trainingReminders: true,
    teamUpdates: true,
    statsUpdates: true,
    achievementAlerts: true,
    profileVisibility: 'team',
    showStats: true,
    showActivity: true,
    allowMessages: true,
    language: 'en-GB',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    dataQuality: 'high',
    autoSyncData: true,
    offlineMode: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
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

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Clean and bright',
      preview: 'bg-white border-2',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes',
      preview: 'bg-charcoal-900 border-2',
    },
    {
      value: 'system',
      label: 'Auto',
      icon: Monitor,
      description: 'Match system',
      preview: 'bg-gradient-to-r from-white to-charcoal-900 border-2',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
            Admin Settings
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Manage your admin account preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
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
                            : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
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
            {/* Save Success */}
            {saveSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center gap-3 animate-slide-down">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Settings saved successfully!
                </p>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <User className="w-5 h-5 text-gold-500" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Update your admin profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="dark:text-white">First Name</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                        placeholder="John"
                        className="dark:bg-charcoal-900 dark:border-charcoal-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="dark:text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                        placeholder="Doe"
                        className="dark:bg-charcoal-900 dark:border-charcoal-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="your@email.com"
                      className="dark:bg-charcoal-900 dark:border-charcoal-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="dark:text-white">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+44 7700 900000"
                      className="dark:bg-charcoal-900 dark:border-charcoal-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="dark:text-white">Bio</Label>
                    <textarea
                      id="bio"
                      value={settings.bio}
                      onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-charcoal-900 dark:text-white dark:bg-charcoal-900"
                    />
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                      Maximum 500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Bell className="w-5 h-5 text-gold-500" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900 dark:text-white">
                      Notification Channels
                    </h3>
                    
                    <div className="flex items-center justify-between py-3 border-b dark:border-charcoal-700">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
                        <div>
                          <p className="font-medium text-charcoal-900 dark:text-white">
                            Email Notifications
                          </p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                            Receive updates via email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b dark:border-charcoal-700">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400" />
                        <div>
                          <p className="font-medium text-charcoal-900 dark:text-white">
                            Push Notifications
                          </p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                            Get alerts on your device
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, pushNotifications: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-charcoal-900 dark:text-white">
                      What to Notify
                    </h3>
                    
                    {[
                      { key: 'teamUpdates', label: 'System Updates', desc: 'Platform updates and announcements' },
                      { key: 'statsUpdates', label: 'Performance Stats', desc: 'System performance reports' },
                      { key: 'achievementAlerts', label: 'Alert Notifications', desc: 'Important system alerts' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-charcoal-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                            {item.desc}
                          </p>
                        </div>
                        <Switch
                          checked={settings[item.key as keyof typeof settings] as boolean}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy & Security Section */}
            {activeSection === 'privacy' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Shield className="w-5 h-5 text-gold-500" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Manage your security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3 pt-4">
                    <Button variant="outline" className="w-full justify-start text-left dark:border-charcoal-600 dark:text-white dark:hover:bg-charcoal-700">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left dark:border-charcoal-600 dark:text-white dark:hover:bg-charcoal-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Section - THEME TOGGLE */}
            {activeSection === 'appearance' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Palette className="w-5 h-5 text-gold-500" />
                    Appearance
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Customize how the admin dashboard looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-charcoal-900 dark:text-white">Theme</h3>
                      <Badge className="bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">
                        {theme === 'system' ? `Auto (${resolvedTheme})` : theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = theme === option.value;
                        
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-lg scale-105'
                                : 'border-neutral-200 dark:border-charcoal-600 hover:border-gold-300 dark:hover:border-gold-600 hover:shadow-md'
                            }`}
                          >
                            <div className={`w-full h-24 rounded-lg mb-4 flex items-center justify-center ${option.preview}`}>
                              <Icon className={`w-8 h-8 ${
                                isSelected ? 'text-gold-600 dark:text-gold-400' : 'text-charcoal-400 dark:text-charcoal-500'
                              }`} />
                            </div>
                            
                            <div className="text-center space-y-1">
                              <p className={`font-semibold ${
                                isSelected ? 'text-gold-700 dark:text-gold-300' : 'text-charcoal-900 dark:text-white'
                              }`}>
                                {option.label}
                              </p>
                              <p className={`text-xs ${
                                isSelected ? 'text-gold-600 dark:text-gold-400' : 'text-charcoal-500 dark:text-charcoal-400'
                              }`}>
                                {option.description}
                              </p>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="w-5 h-5 text-gold-600 dark:text-gold-400 fill-gold-100 dark:fill-gold-900" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                            Theme preference saved
                          </p>
                          <p className="text-blue-700 dark:text-blue-300">
                            Your theme will persist across sessions.
                            {theme === 'system' && ' Auto mode switches based on system preferences.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regional Section */}
            {activeSection === 'regional' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Globe className="w-5 h-5 text-gold-500" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Language, timezone, and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="dark:text-white">Language</Label>
                    <select
                      id="language"
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-charcoal-900 dark:text-white"
                    >
                      <option value="en-GB">English (UK)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="dark:text-white">Timezone</Label>
                    <select
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-charcoal-900 dark:text-white"
                    >
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="dark:text-white">Date Format</Label>
                    <select
                      id="dateFormat"
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-charcoal-900 dark:text-white"
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
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <CreditCard className="w-5 h-5 text-gold-500" />
                    Billing & Subscription
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Manage subscription and payment settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 rounded-xl border border-gold-200 dark:border-gold-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-charcoal-900 dark:text-white text-lg">
                          SuperAdmin (Full Access)
                        </h3>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          All features included
                        </p>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Devices Section */}
            {activeSection === 'devices' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Smartphone className="w-5 h-5 text-gold-500" />
                    Devices & Sessions
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Manage your active sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-sm">
                    Device management coming soon
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Data & Storage Section */}
            {activeSection === 'data' && (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
                    <Download className="w-5 h-5 text-gold-500" />
                    Data & Storage
                  </CardTitle>
                  <CardDescription className="dark:text-charcoal-400">
                    Manage your data preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-charcoal-900 dark:text-white">
                        Auto-Sync Data
                      </p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Automatically sync your data
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSyncData}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoSyncData: checked })
                      }
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t dark:border-charcoal-700">
                    <h3 className="font-semibold text-charcoal-900 dark:text-white">
                      Export Data
                    </h3>
                    <Button variant="outline" className="w-full justify-start dark:border-charcoal-600 dark:text-white dark:hover:bg-charcoal-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download All Data
                    </Button>
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
