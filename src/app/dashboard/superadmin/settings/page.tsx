// src/app/dashboard/superadmin/settings/page.tsx
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SuperAdminSettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(240); // 4 hours in minutes
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const handle2FAEnable = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/superadmin/settings/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable' }),
      });

      if (!response.ok) throw new Error('Failed to enable 2FA');

      const data = await response.json();
      setQrCode(data.qrCode);
      setShowQRCode(true);
      toast.success('2FA QR Code generated');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/superadmin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTimeoutMinutes: sessionTimeout,
          ipWhitelist: ipWhitelist
            .split('\n')
            .map((ip) => ip.trim())
            .filter((ip) => ip.length > 0),
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage SuperAdmin security and session settings
        </p>
      </div>

      <div className="space-y-6">
        {/* 2FA Settings */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add an extra layer of security to your SuperAdmin account
              </p>
            </div>
            <button
              onClick={handle2FAEnable}
              disabled={saving || twoFactorEnabled}
              className="px-4 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
            </button>
          </div>

          {showQRCode && qrCode && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-charcoal-700 rounded-lg border border-gray-200 dark:border-charcoal-600">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Scan this QR code with an authenticator app:
              </p>
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-64 h-64 bg-white p-2 rounded"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
                Use authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-800 dark:text-blue-200">
            ℹ️ 2FA will be required every time you log in to SuperAdmin
          </div>
        </div>

        {/* Session Timeout */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Session Timeout
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inactivity Timeout (minutes)
              </label>
              <input
                type="number"
                min="30"
                max="480"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 240)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                SuperAdmin session will automatically logout after {sessionTimeout} minutes of inactivity
              </p>
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-charcoal-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            IP Whitelist
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allowed IP Addresses (one per line)
              </label>
              <textarea
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                rows={4}
                placeholder="192.168.1.1&#10;10.0.0.0/24&#10;172.16.0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold font-mono text-sm"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Leave empty to allow all IPs. Use CIDR notation for ranges.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-gold hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}