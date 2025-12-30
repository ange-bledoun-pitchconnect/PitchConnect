/**
 * Billing Settings Page - ENTERPRISE EDITION
 * Path: /dashboard/settings/billing/page.tsx
 *
 * ============================================================================
 * FEATURES (Subscription & Payments Only)
 * ============================================================================
 * ✅ Subscription plan management
 * ✅ Payment methods (cards, etc.)
 * ✅ Invoice history with download
 * ✅ Usage tracking
 * ✅ Plan comparison
 * ✅ Upgrade/downgrade flows
 * ✅ Dark mode support
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Download,
  Plus,
  Trash2,
  Star,
  Zap,
  Crown,
  Users,
  BarChart3,
  Clock,
  Calendar,
  Receipt,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Toast System
type ToastType = 'success' | 'error' | 'info' | 'default';
interface ToastMessage { id: string; type: ToastType; message: string; }

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((message: string, type: ToastType = 'default') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, success: (m: string) => addToast(m, 'success'), error: (m: string) => addToast(m, 'error'), info: (m: string) => addToast(m, 'info') };
};

// Types
interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl: string;
}

// Constants
const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    icon: Users,
    color: 'bg-charcoal-500',
    features: ['Basic profile', 'Join 1 team', 'View schedules', 'Basic stats'],
  },
  {
    id: 'player',
    name: 'Player',
    price: 4.99,
    interval: 'month',
    icon: Star,
    color: 'bg-blue-500',
    features: ['Everything in Free', 'Join unlimited teams', 'Advanced stats', 'Performance tracking', 'Video highlights'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    icon: Crown,
    color: 'bg-gold-500',
    popular: true,
    features: ['Everything in Player', 'AI insights', 'Priority support', 'Custom reports', 'API access', 'Multi-sport profiles'],
  },
  {
    id: 'club',
    name: 'Club',
    price: 49.99,
    interval: 'month',
    icon: Shield,
    color: 'bg-purple-500',
    features: ['Everything in Pro', 'Unlimited teams', 'Club management', 'Financial tools', 'White-label options', 'Dedicated support'],
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2027, isDefault: true },
  { id: '2', type: 'card', last4: '8888', brand: 'Mastercard', expiryMonth: 6, expiryYear: 2026, isDefault: false },
];

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-001', date: '2025-12-01', amount: 9.99, status: 'paid', description: 'Pro Plan - December 2025', downloadUrl: '#' },
  { id: 'INV-002', date: '2025-11-01', amount: 9.99, status: 'paid', description: 'Pro Plan - November 2025', downloadUrl: '#' },
  { id: 'INV-003', date: '2025-10-01', amount: 9.99, status: 'paid', description: 'Pro Plan - October 2025', downloadUrl: '#' },
];

// Components
const PlanCard = ({ plan, isCurrentPlan, onSelect }: { plan: Plan; isCurrentPlan: boolean; onSelect: () => void }) => {
  const Icon = plan.icon;
  return (
    <div className={`relative p-6 rounded-2xl border-2 transition-all ${
      isCurrentPlan 
        ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 shadow-lg' 
        : plan.popular 
          ? 'border-purple-300 dark:border-purple-700'
          : 'border-neutral-200 dark:border-charcoal-600'
    }`}>
      {plan.popular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-500 text-white"><Sparkles className="w-3 h-3 mr-1" />Most Popular</Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gold-500 text-white"><Check className="w-3 h-3 mr-1" />Current Plan</Badge>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${plan.color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-charcoal-900 dark:text-white">{plan.name}</h3>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            {plan.price === 0 ? 'Free forever' : `£${plan.price}/${plan.interval}`}
          </p>
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-charcoal-700 dark:text-charcoal-300">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        disabled={isCurrentPlan}
        className={`w-full ${
          isCurrentPlan
            ? 'bg-neutral-200 dark:bg-charcoal-600 text-charcoal-500 cursor-not-allowed'
            : plan.popular
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-charcoal-800 hover:bg-charcoal-900 text-white'
        }`}
      >
        {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
      </Button>
    </div>
  );
};

const PaymentMethodCard = ({ method, onSetDefault, onRemove }: { method: PaymentMethod; onSetDefault: () => void; onRemove: () => void }) => {
  const brandColors: Record<string, string> = {
    Visa: 'bg-blue-600',
    Mastercard: 'bg-red-500',
    Amex: 'bg-blue-400',
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${method.isDefault ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-neutral-200 dark:border-charcoal-600'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-8 ${brandColors[method.brand || ''] || 'bg-charcoal-500'} rounded flex items-center justify-center text-white text-xs font-bold`}>
            {method.brand?.substring(0, 4)}
          </div>
          <div>
            <p className="font-bold text-charcoal-900 dark:text-white">•••• {method.last4}</p>
            <p className="text-xs text-charcoal-500">Expires {method.expiryMonth}/{method.expiryYear}</p>
          </div>
          {method.isDefault && <Badge className="bg-green-100 text-green-700">Default</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {!method.isDefault && (
            <Button variant="ghost" size="sm" onClick={onSetDefault} className="text-green-600">Set Default</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default function BillingPage() {
  const { toasts, success, error: showError, info } = useToast();
  
  const [currentPlanId, setCurrentPlanId] = useState('pro');
  const [paymentMethods, setPaymentMethods] = useState(MOCK_PAYMENT_METHODS);
  const [invoices] = useState(MOCK_INVOICES);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const currentPlan = PLANS.find(p => p.id === currentPlanId);
  const nextBillingDate = '2026-01-01';

  const handleChangePlan = async (planId: string) => {
    setIsChangingPlan(true);
    await new Promise(r => setTimeout(r, 1500));
    setCurrentPlanId(planId);
    setIsChangingPlan(false);
    success(`Switched to ${PLANS.find(p => p.id === planId)?.name} plan!`);
  };

  // Usage data
  const usage = {
    teams: { used: 3, limit: 10 },
    storage: { used: 2.4, limit: 5 },
    apiCalls: { used: 8500, limit: 10000 },
  };

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {t.message}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">Billing</h2>
        <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan Overview */}
      <Card className="bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 dark:from-gold-900/20 dark:via-orange-900/20 dark:to-purple-900/20 border-gold-200 dark:border-gold-900/40">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gold-500 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white">{currentPlan?.name} Plan</h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  £{currentPlan?.price}/{currentPlan?.interval} • Next billing: {nextBillingDate}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-gold-300 text-gold-700">
                <Calendar className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" />Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-charcoal-700 dark:text-charcoal-300">Teams</span>
              <span className="font-semibold">{usage.teams.used} / {usage.teams.limit}</span>
            </div>
            <Progress value={(usage.teams.used / usage.teams.limit) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-charcoal-700 dark:text-charcoal-300">Storage (GB)</span>
              <span className="font-semibold">{usage.storage.used} / {usage.storage.limit}</span>
            </div>
            <Progress value={(usage.storage.used / usage.storage.limit) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-charcoal-700 dark:text-charcoal-300">API Calls</span>
              <span className="font-semibold">{usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}</span>
            </div>
            <Progress value={(usage.apiCalls.used / usage.apiCalls.limit) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" />Available Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={plan.id === currentPlanId}
                onSelect={() => handleChangePlan(plan.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-500" />Payment Methods</CardTitle>
            <Button className="bg-green-600 text-white"><Plus className="w-4 h-4 mr-2" />Add Card</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethods.map(method => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={() => {
                setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === method.id })));
                success('Default payment method updated');
              }}
              onRemove={() => {
                if (method.isDefault) { showError('Cannot remove default payment method'); return; }
                setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
                success('Payment method removed');
              }}
            />
          ))}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-orange-500" />Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-neutral-200 dark:divide-charcoal-700">
            {invoices.map(invoice => (
              <div key={invoice.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-charcoal-900 dark:text-white">{invoice.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-charcoal-500">{invoice.id}</span>
                    <span className="text-xs text-charcoal-500">{invoice.date}</span>
                    <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-charcoal-900 dark:text-white">£{invoice.amount.toFixed(2)}</span>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}