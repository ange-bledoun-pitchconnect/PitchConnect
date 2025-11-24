// ============================================================================
// FILE 4: src/app/dashboard/admin/settings/page.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Lock,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-charcoal-400">
          Configure platform-wide settings and preferences
        </p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-950 border border-green-700 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <p className="text-green-200">Settings saved successfully!</p>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700 flex items-center gap-3">
          <Settings className="w-5 h-5 text-gold-500" />
          <h2 className="text-xl font-bold text-white">General Settings</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Platform Name
            </label>
            <Input
              type="text"
              defaultValue="PitchConnect"
              className="bg-charcoal-900 border-charcoal-600 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">
              Support Email
            </label>
            <Input
              type="email"
              defaultValue="support@pitchconnect.com"
              className="bg-charcoal-900 border-charcoal-600 text-white"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">
              Admin Contact
            </label>
            <Input
              type="email"
              defaultValue="admin@pitchconnect.com"
              className="bg-charcoal-900 border-charcoal-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700 flex items-center gap-3">
          <Bell className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">New User Registrations</p>
              <p className="text-charcoal-400 text-sm">
                Get notified when new users sign up
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Subscription Changes</p>
              <p className="text-charcoal-400 text-sm">
                Get notified about subscription updates
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">System Alerts</p>
              <p className="text-charcoal-400 text-sm">
                Get notified about system issues
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Payment Failures</p>
              <p className="text-charcoal-400 text-sm">
                Get notified about failed payments
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-bold text-white">Security</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-charcoal-400 text-sm">
                Require 2FA for all admin accounts
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Session Timeout</p>
              <p className="text-charcoal-400 text-sm">
                Auto-logout after 30 minutes of inactivity
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">IP Whitelist</p>
              <p className="text-charcoal-400 text-sm">
                Restrict admin access to specific IPs
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-700 flex items-center gap-3">
          <Database className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold text-white">Database & Backups</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Daily Backups</p>
              <p className="text-charcoal-400 text-sm">
                Automatic daily database backups
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Backup Retention</p>
              <p className="text-charcoal-400 text-sm">Keep backups for 30 days</p>
            </div>
            <Input
              type="number"
              defaultValue="30"
              className="w-20 bg-charcoal-900 border-charcoal-600 text-white"
            />
          </div>
          <div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Database className="w-4 h-4 mr-2" />
              Trigger Manual Backup
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold-600 hover:bg-gold-700 text-charcoal-900 px-8"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}