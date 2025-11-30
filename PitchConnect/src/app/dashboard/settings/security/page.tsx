/**
 * Security Settings Page
 * Password, two-factor authentication, and security management
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Lock,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  Trash2,
  Plus,
  Copy,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows Desktop',
      browser: 'Chrome',
      location: 'London, UK',
      ipAddress: '192.168.1.1',
      lastActive: '2 minutes ago',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 14',
      browser: 'Safari',
      location: 'Manchester, UK',
      ipAddress: '192.168.1.50',
      lastActive: '1 hour ago',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'MacBook Pro',
      browser: 'Safari',
      location: 'London, UK',
      ipAddress: '192.168.1.75',
      lastActive: '3 days ago',
      isCurrent: false,
    },
  ]);

  const backupCodes = ['1234-5678-9012', '3456-7890-1234', '5678-9012-3456', '7890-1234-5678'];

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Password changed successfully!');
    setIsChangingPassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleEnable2FA = () => {
    toast.success('Two-factor authentication enabled!');
    setIs2FAEnabled(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Backup code copied!');
  };

  const handleLogoutSession = (sessionId: string) => {
    toast.success('Session terminated');
  };

  const handleLogoutAll = () => {
    toast.success('All sessions terminated');
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Security Settings</h1>
        <p className="text-charcoal-600">Manage your account security and login sessions</p>
      </div>

      {/* PASSWORD CHANGE */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-600" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password regularly to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-charcoal-700 font-semibold">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="Enter your current password"
                className="pr-12 border-blue-300 focus:border-blue-500"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-charcoal-500 hover:text-charcoal-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-charcoal-700 font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Enter your new password"
                className="pr-12 border-blue-300 focus:border-blue-500"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-charcoal-500 hover:text-charcoal-700"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="text-xs text-charcoal-600 space-y-1">
              <p>Password must contain:</p>
              <ul>
                <li
                  className={`${
                    passwordForm.newPassword.length >= 8
                      ? 'text-green-600'
                      : 'text-charcoal-500'
                  }`}
                >
                  ✓ At least 8 characters
                </li>
                <li
                  className={`${
                    /[A-Z]/.test(passwordForm.newPassword)
                      ? 'text-green-600'
                      : 'text-charcoal-500'
                  }`}
                >
                  ✓ Uppercase letter
                </li>
                <li
                  className={`${
                    /[0-9]/.test(passwordForm.newPassword)
                      ? 'text-green-600'
                      : 'text-charcoal-500'
                  }`}
                >
                  ✓ Number
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-charcoal-700 font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Confirm your new password"
                className="pr-12 border-blue-300 focus:border-blue-500"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-charcoal-500 hover:text-charcoal-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Passwords do not match
                </p>
              )}
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !passwordForm.currentPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-md disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* TWO-FACTOR AUTHENTICATION */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-purple-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Status */}
          <div
            className={`p-4 rounded-lg border-2 flex items-center justify-between ${
              is2FAEnabled
                ? 'bg-green-50 border-green-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="font-bold text-charcoal-900">
                  {is2FAEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-sm text-charcoal-700">
                  {is2FAEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Strengthen your account security'}
                </p>
              </div>
            </div>
          </div>

          {!is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-charcoal-700">
                Secure your account by enabling two-factor authentication. You'll need to verify your
                identity using your phone when signing in.
              </p>
              <Button
                onClick={handleEnable2FA}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Backup Codes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-charcoal-900">Backup Codes</h4>
                  <button
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    {showBackupCodes ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showBackupCodes && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                    <p className="text-sm text-charcoal-700 mb-3">
                      Save these codes in a safe place. You can use them to access your account if you
                      lose access to your authenticator app.
                    </p>
                    {backupCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200"
                      >
                        <code className="font-mono text-sm text-charcoal-900">{code}</code>
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manage 2FA */}
              <div className="flex gap-2 pt-2 border-t border-neutral-200">
                <Button
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Codes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTIVE SESSIONS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-gold-600" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage devices where you're signed in</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border-2 ${
                session.isCurrent
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-charcoal-900">{session.device}</p>
                    {session.isCurrent && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Current Device
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-charcoal-600">
                    <p>
                      <span className="font-semibold">Browser:</span> {session.browser}
                    </p>
                    <p>
                      <span className="font-semibold">Location:</span> {session.location}
                    </p>
                    <p>
                      <span className="font-semibold">IP Address:</span> {session.ipAddress}
                    </p>
                    <p>
                      <span className="font-semibold">Last Active:</span> {session.lastActive}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <Button
                    onClick={() => handleLogoutSession(session.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            onClick={handleLogoutAll}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* SECURITY RECOMMENDATIONS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-charcoal-900">Strong Password</p>
              <p className="text-sm text-charcoal-700">Your password is strong and secure</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              is2FAEnabled
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            {is2FAEnabled ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-charcoal-900">
                {is2FAEnabled ? 'Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
              </p>
              <p className="text-sm text-charcoal-700">
                {is2FAEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-charcoal-900">Active Sessions</p>
              <p className="text-sm text-charcoal-700">Review your active sessions regularly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
