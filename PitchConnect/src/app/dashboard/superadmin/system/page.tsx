'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Server,
  Database,
  Activity,
  HardDrive,
  Cpu,
  Zap,
  Shield,
  Globe,
  Mail,
  Bell,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  BarChart3,
  Users,
  Clock,
  FileText,
  Key,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SystemStats {
  uptime: number;
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  databaseSize: string;
  storageUsed: string;
  apiCalls24h: number;
  errorRate: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  email: 'healthy' | 'warning' | 'error';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SuperAdminSystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [systemStats, setSystemStats] = useState<SystemStats>({
    uptime: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalTeams: 0,
    databaseSize: '0 MB',
    storageUsed: '0 MB',
    apiCalls24h: 0,
    errorRate: 0,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    email: 'healthy',
  });

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    twoFactorEnabled: false,
    maxFileSize: '10',
    sessionTimeout: '24',
    passwordMinLength: '8',
    maxLoginAttempts: '5',
  });

  // Fetch system data
  const fetchSystemData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/superadmin/system');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system data');
      }

      const data = await response.json();
      setSystemStats(data.stats || systemStats);
      setSystemHealth(data.health || systemHealth);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchSystemData();
    }
  }, [status, router, fetchSystemData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/superadmin/system/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('✅ Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getHealthColor = (health: 'healthy' | 'warning' | 'error') => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
    }
  };

  const getHealthIcon = (health: 'healthy' | 'warning' | 'error') => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/20 to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-charcoal-700 font-bold text-lg">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/superadmin')}
                className="hover:bg-neutral-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-charcoal-900 mb-2 flex items-center gap-3">
              <Server className="w-10 h-10 text-gold-500" />
              System Configuration
            </h1>
            <p className="text-charcoal-600">Monitor and configure system settings</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={fetchSystemData}
              variant="outline"
              size="sm"
              className="border-charcoal-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-blue-500" />
                <Badge className={getHealthColor(systemHealth.database)}>
                  {getHealthIcon(systemHealth.database)}
                  <span className="ml-2">{systemHealth.database}</span>
                </Badge>
              </div>
              <h3 className="font-bold text-charcoal-900 mb-1">Database</h3>
              <p className="text-sm text-charcoal-600">{systemStats.databaseSize}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-purple-500" />
                <Badge className={getHealthColor(systemHealth.api)}>
                  {getHealthIcon(systemHealth.api)}
                  <span className="ml-2">{systemHealth.api}</span>
                </Badge>
              </div>
              <h3 className="font-bold text-charcoal-900 mb-1">API</h3>
              <p className="text-sm text-charcoal-600">{systemStats.apiCalls24h.toLocaleString()} calls/24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <HardDrive className="w-8 h-8 text-green-500" />
                <Badge className={getHealthColor(systemHealth.storage)}>
                  {getHealthIcon(systemHealth.storage)}
                  <span className="ml-2">{systemHealth.storage}</span>
                </Badge>
              </div>
              <h3 className="font-bold text-charcoal-900 mb-1">Storage</h3>
              <p className="text-sm text-charcoal-600">{systemStats.storageUsed} used</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Mail className="w-8 h-8 text-orange-500" />
                <Badge className={getHealthColor(systemHealth.email)}>
                  {getHealthIcon(systemHealth.email)}
                  <span className="ml-2">{systemHealth.email}</span>
                </Badge>
              </div>
              <h3 className="font-bold text-charcoal-900 mb-1">Email Service</h3>
              <p className="text-sm text-charcoal-600">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-gold-500" />
                <h3 className="font-semibold text-charcoal-900">Uptime</h3>
              </div>
              <p className="text-2xl font-bold text-charcoal-900">{Math.floor(systemStats.uptime / 24)}d</p>
              <p className="text-xs text-charcoal-500">{systemStats.uptime % 24}h remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-charcoal-900">Active Users</h3>
              </div>
              <p className="text-2xl font-bold text-charcoal-900">{systemStats.activeUsers}</p>
              <p className="text-xs text-charcoal-500">of {systemStats.totalUsers} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-charcoal-900">Error Rate</h3>
              </div>
              <p className="text-2xl font-bold text-charcoal-900">{systemStats.errorRate}%</p>
              <p className="text-xs text-green-600">Within threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-charcoal-900">Teams</h3>
              </div>
              <p className="text-2xl font-bold text-charcoal-900">{systemStats.totalTeams}</p>
              <p className="text-xs text-charcoal-500">across platform</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Manage platform settings and features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-gold-500" />
                  General Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-semibold text-charcoal-900">Maintenance Mode</Label>
                      <p className="text-sm text-charcoal-600">Disable user access temporarily</p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-semibold text-charcoal-900">User Registration</Label>
                      <p className="text-sm text-charcoal-600">Allow new user signups</p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, registrationEnabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-semibold text-charcoal-900">Email Verification</Label>
                      <p className="text-sm text-charcoal-600">Require verified emails</p>
                    </div>
                    <Switch
                      checked={settings.emailVerificationRequired}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, emailVerificationRequired: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-semibold text-charcoal-900">Two-Factor Auth</Label>
                      <p className="text-sm text-charcoal-600">Enable 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, twoFactorEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold-500" />
                  Security Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) =>
                        setSettings({ ...settings, maxFileSize: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        setSettings({ ...settings, sessionTimeout: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Password Min Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) =>
                        setSettings({ ...settings, passwordMinLength: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) =>
                        setSettings({ ...settings, maxLoginAttempts: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gold-500" />
                  System Actions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export System Logs
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-orange-600 border-orange-300">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Services
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-300">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-purple-600 border-purple-300">
                    <Key className="w-4 h-4 mr-2" />
                    Rotate API Keys
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white px-8"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
