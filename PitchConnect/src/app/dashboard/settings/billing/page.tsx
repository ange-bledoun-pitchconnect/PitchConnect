/**
 * Billing Settings Page
 * Subscription management, invoices, and payment methods
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  Edit3,
  Trash2,
  Plus,
  Lock,
  Zap,
  Users,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'annual';
  features: string[];
  recommended?: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

export default function BillingPage() {
  const [currentPlan] = useState<Plan>({
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    billing: 'monthly',
    features: ['Unlimited teams', 'Advanced analytics', 'Priority support'],
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/25',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      brand: 'Mastercard',
      last4: '5555',
      expiry: '08/26',
      isDefault: false,
    },
  ]);

  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-001',
      date: '2025-11-01',
      amount: 9.99,
      status: 'paid',
      description: 'Pro Plan - Monthly',
    },
    {
      id: 'INV-002',
      date: '2025-10-01',
      amount: 9.99,
      status: 'paid',
      description: 'Pro Plan - Monthly',
    },
    {
      id: 'INV-003',
      date: '2025-09-01',
      amount: 9.99,
      status: 'paid',
      description: 'Pro Plan - Monthly',
    },
  ]);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      billing: 'monthly',
      features: [
        '1 team',
        'Basic statistics',
        'Community support',
        'Standard features',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      billing: 'monthly',
      features: [
        'Unlimited teams',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'Team management tools',
      ],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      billing: 'monthly',
      features: [
        'Unlimited everything',
        'Dedicated support',
        'Custom integrations',
        'API access',
        'Advanced reporting',
        'White label option',
      ],
    },
  ];

  const handleDeletePaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
    toast.success('Payment method deleted');
  };

  const handleSetDefaultPaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      }))
    );
    toast.success('Default payment method updated');
  };

  const handleUpgradePlan = (planId: string) => {
    toast.success(`Upgraded to ${plans.find((p) => p.id === planId)?.name} plan!`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Invoice ${invoiceId} downloaded`);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Billing & Subscription</h1>
        <p className="text-charcoal-600">Manage your subscription and payment methods</p>
      </div>

      {/* CURRENT PLAN */}
      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gold-50 via-orange-50 to-purple-50 p-6 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">Current Plan</h2>
              <p className="text-charcoal-600">You are currently on the Pro plan</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gold-600">£{currentPlan.price}</p>
              <p className="text-sm text-charcoal-600">per month</p>
            </div>
          </div>
        </div>

        <CardContent className="pt-6 space-y-6">
          {/* Plan Features */}
          <div>
            <p className="text-sm font-bold text-charcoal-700 uppercase tracking-wider mb-3">
              Included Features
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-charcoal-900 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-xs text-charcoal-700 font-semibold mb-1">Next Billing Date</p>
              <p className="font-bold text-charcoal-900">December 1, 2025</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-700 font-semibold mb-1">Renewal</p>
              <p className="font-bold text-charcoal-900">Monthly</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-semibold"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Manage Plan
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UPGRADE PLANS */}
      <div>
        <h2 className="text-2xl font-bold text-charcoal-900 mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-white border-2 shadow-sm overflow-hidden transition-all transform hover:scale-105 ${
                plan.recommended
                  ? 'border-gold-500 shadow-lg'
                  : 'border-neutral-200 hover:border-gold-300'
              }`}
            >
              {plan.recommended && (
                <div className="bg-gradient-to-r from-gold-500 to-orange-400 text-white px-4 py-2">
                  <p className="text-sm font-bold text-center">Recommended</p>
                </div>
              )}

              <CardContent className="pt-6 pb-6 space-y-6">
                {/* Plan Name & Price */}
                <div>
                  <h3 className="text-2xl font-bold text-charcoal-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-charcoal-900">
                      {plan.price === 0 ? 'Free' : `£${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-charcoal-600">/month</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-charcoal-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleUpgradePlan(plan.id)}
                  disabled={plan.id === 'pro'}
                  className={`w-full font-bold shadow-md ${
                    plan.id === 'pro'
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                      : plan.recommended
                      ? 'bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {plan.id === 'pro'
                    ? 'Current Plan'
                    : plan.id === 'basic'
                    ? 'Downgrade'
                    : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PAYMENT METHODS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment cards</CardDescription>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                method.isDefault
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-neutral-50 border-neutral-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-charcoal-900">
                    {method.brand} •••• {method.last4}
                  </p>
                  <p className="text-sm text-charcoal-600">Expires {method.expiry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    Default
                  </span>
                ) : (
                  <Button
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold text-xs"
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  onClick={() => handleDeletePaymentMethod(method.id)}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-3 mt-4">
            <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              Your payment information is securely encrypted and stored. We never save your full card details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* BILLING HISTORY */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-charcoal-900">
                      {invoice.id}
                    </td>
                    <td className="px-4 py-4 text-charcoal-700">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-charcoal-700">
                      {invoice.description}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-charcoal-900">
                      £{invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {invoice.status === 'paid' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          ✓ Paid
                        </span>
                      )}
                      {invoice.status === 'pending' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                          ⏳ Pending
                        </span>
                      )}
                      {invoice.status === 'failed' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          ✕ Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* USAGE & LIMITS */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            Usage & Limits
          </CardTitle>
          <CardDescription>Your current plan usage</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {[
            { label: 'Teams', usage: 3, limit: 'Unlimited' },
            { label: 'Members', usage: 28, limit: 'Unlimited' },
            { label: 'Storage', usage: '2.4 GB', limit: '50 GB' },
            { label: 'Monthly API Calls', usage: '45,230', limit: '1,000,000' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-charcoal-900">{item.label}</p>
                <p className="text-sm text-charcoal-600">
                  {item.usage} / {item.limit}
                </p>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  style={{
                    width:
                      item.limit === 'Unlimited'
                        ? '0%'
                        : `${Math.min((Math.random() * 60 + 10), 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* TAX ID */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent pb-4">
          <CardTitle>Tax & Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-charcoal-700 font-semibold">
              Tax ID / VAT Number (Optional)
            </Label>
            <Input
              id="taxId"
              placeholder="Enter your tax ID"
              defaultValue=""
              className="border-neutral-300 focus:border-orange-500"
            />
            <p className="text-xs text-charcoal-600">
              Adding your tax ID may exempt you from taxes in some regions
            </p>
          </div>
          <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold shadow-md">
            Save Tax Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
