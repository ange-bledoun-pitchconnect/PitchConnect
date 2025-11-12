/**
 * Account Settings Page
 * Subscription, billing, password management
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [subscription] = useState({
    plan: 'PRO',
    status: 'ACTIVE',
    price: 29.99,
    renewalDate: '2025-12-11',
    autoRenew: true,
  });

  async function handlePasswordChange() {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    toast.success('Password changed successfully!');
    setPasswordForm({ current: '', new: '', confirm: '' });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-foreground/70">Manage your account and subscription</p>
        </div>

        {/* Subscription */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-gold" />
              Subscription
            </CardTitle>
            <CardDescription>Your current plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            <div className="p-6 bg-gradient-to-r from-brand-gold/20 to-brand-purple/20 rounded-lg border border-brand-gold/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground/60">Current Plan</p>
                  <p className="text-3xl font-bold text-hero">{subscription.plan}</p>
                </div>
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  {subscription.status}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Monthly Price</span>
                  <span className="font-semibold">${subscription.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Renewal Date</span>
                  <span className="font-semibold">
                    {new Date(subscription.renewalDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Auto-Renew</span>
                  <span className="font-semibold">
                    {subscription.autoRenew ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-2">
              <p className="font-semibold text-sm">Plan Includes:</p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li className="flex items-center gap-2">
                  <span className="text-brand-gold">✓</span> Unlimited team management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-gold">✓</span> Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-gold">✓</span> Tactical board
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-gold">✓</span> Video analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-gold">✓</span> Priority support
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button className="btn-primary flex-1">
                Update Payment Method
              </Button>
              <Button variant="outline" className="flex-1">
                Upgrade Plan
              </Button>
              <Button variant="outline" className="flex-1">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-gold" />
              Password & Security
            </CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            <Button 
              className="w-full btn-primary"
              onClick={handlePasswordChange}
            >
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Previous invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: '2025-11-11', amount: 29.99, status: 'PAID', invoice: 'INV-001' },
                { date: '2025-10-11', amount: 29.99, status: 'PAID', invoice: 'INV-002' },
                { date: '2025-09-11', amount: 29.99, status: 'PAID', invoice: 'INV-003' },
              ].map((bill) => (
                <div key={bill.invoice} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-semibold text-sm">{bill.invoice}</p>
                    <p className="text-xs text-foreground/60">
                      {new Date(bill.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${bill.amount}</p>
                    <p className="text-xs text-green-600">{bill.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground/60">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-500/10">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
