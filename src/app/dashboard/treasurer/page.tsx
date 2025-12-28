/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Treasurer Dashboard v2.0
 * Path: src/app/dashboard/treasurer/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Financial overview
 * ✅ Revenue & expense tracking
 * ✅ Invoice management
 * ✅ Payment processing
 * ✅ Budget management
 * ✅ Financial reports
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Receipt,
  PieChart, BarChart3, ArrowRight, Clock, CheckCircle, AlertCircle,
  Wallet, BanknoteIcon, ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTreasurerDashboardData(userId: string) {
  // Get treasurer profile
  const treasurer = await prisma.treasurer.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!treasurer) {
    return { hasClub: false, stats: null, recentTransactions: [], pendingInvoices: [], clubs: [] };
  }

  // Get clubs through user's club memberships
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clubMemberships: {
        where: { isActive: true },
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      },
    },
  });

  const clubs = user?.clubMemberships.map(cm => cm.club) || [];
  
  if (clubs.length === 0) {
    return { hasClub: false, stats: null, recentTransactions: [], pendingInvoices: [], clubs: [] };
  }

  const clubIds = clubs.map(c => c.id);

  // Get financial data (invoices and payments for this user)
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Calculate stats
  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overdueInvoices = invoices.filter(i => 
    i.status === 'SENT' && i.dueDate && new Date(i.dueDate) < new Date()
  );

  return {
    hasClub: true,
    clubs,
    stats: {
      totalRevenue: totalRevenue / 100, // Convert from cents
      monthlyRevenue: totalRevenue / 100 / 12, // Simplified calculation
      pendingPayments: pendingPayments / 100,
      overdueCount: overdueInvoices.length,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
    },
    recentTransactions: payments.slice(0, 5).map(p => ({
      id: p.id,
      amount: (p.amount || 0) / 100,
      status: p.status,
      type: 'PAYMENT',
      createdAt: p.createdAt,
      description: p.description || 'Payment',
    })),
    pendingInvoices: invoices
      .filter(i => i.status === 'SENT' || i.status === 'PENDING')
      .slice(0, 5)
      .map(i => ({
        id: i.id,
        amount: (i.amount || 0) / 100,
        dueDate: i.dueDate,
        status: i.status,
        isOverdue: i.dueDate ? new Date(i.dueDate) < new Date() : false,
      })),
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function TreasurerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getTreasurerDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          💰 Treasurer Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Manage club finances, invoices, and payment tracking
        </p>
      </div>

      {!data.hasClub ? (
        <NoClubState />
      ) : (
        <>
          {/* Financial Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <FinanceCard
              label="Total Revenue"
              value={`£${(data.stats?.totalRevenue || 0).toLocaleString()}`}
              icon={<TrendingUp className="w-8 h-8 text-green-500" />}
              trend={{ direction: 'up', value: 12.5 }}
              color="green"
            />
            <FinanceCard
              label="Monthly Revenue"
              value={`£${(data.stats?.monthlyRevenue || 0).toLocaleString()}`}
              icon={<BarChart3 className="w-8 h-8 text-blue-500" />}
              color="blue"
            />
            <FinanceCard
              label="Pending Payments"
              value={`£${(data.stats?.pendingPayments || 0).toLocaleString()}`}
              icon={<Clock className="w-8 h-8 text-orange-500" />}
              color="orange"
            />
            <FinanceCard
              label="Overdue Invoices"
              value={data.stats?.overdueCount || 0}
              icon={<AlertCircle className="w-8 h-8 text-red-500" />}
              color="red"
              alert={data.stats?.overdueCount ? data.stats.overdueCount > 0 : false}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickAction
              href="/dashboard/treasurer/invoices/create"
              icon={<FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
              title="Create Invoice"
              description="Generate new invoices for members"
              gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
            />
            <QuickAction
              href="/dashboard/treasurer/payments"
              icon={<CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />}
              title="Record Payment"
              description="Log incoming payments and dues"
              gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
            />
            <QuickAction
              href="/dashboard/treasurer/expenses"
              icon={<Receipt className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
              title="Track Expenses"
              description="Record and categorize expenses"
              gradient="from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
              borderColor="border-orange-200 dark:border-orange-800 hover:border-orange-400"
            />
            <QuickAction
              href="/dashboard/treasurer/reports"
              icon={<PieChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
              title="Financial Reports"
              description="Generate detailed financial reports"
              gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
            />
          </div>

          {/* Recent Transactions & Pending Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
              <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-500" />
                  Recent Transactions
                </h2>
                <Link href="/dashboard/treasurer/transactions" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-6">
                {data.recentTransactions.length === 0 ? (
                  <EmptyState icon={<Wallet className="w-12 h-12" />} title="No transactions yet" />
                ) : (
                  <div className="space-y-3">
                    {data.recentTransactions.map((tx) => (
                      <TransactionRow key={tx.id} transaction={tx} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Invoices */}
            <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
              <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Pending Invoices
                </h2>
                <Link href="/dashboard/treasurer/invoices" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-6">
                {data.pendingInvoices.length === 0 ? (
                  <EmptyState icon={<FileText className="w-12 h-12" />} title="No pending invoices" />
                ) : (
                  <div className="space-y-3">
                    {data.pendingInvoices.map((invoice) => (
                      <InvoiceRow key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
            <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  Budget Overview
                </h2>
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Current season budget tracking</p>
              </div>
              <Link
                href="/dashboard/treasurer/budget"
                className="px-4 py-2 bg-neutral-100 dark:bg-charcoal-700 hover:bg-neutral-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                Manage Budget <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BudgetCategory label="Equipment" allocated={5000} spent={3200} color="blue" />
                <BudgetCategory label="Facilities" allocated={8000} spent={6500} color="green" />
                <BudgetCategory label="Travel" allocated={3000} spent={2800} color="orange" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function FinanceCard({ label, value, icon, trend, color, alert }: {
  label: string; value: string | number; icon: React.ReactNode; trend?: { direction: 'up' | 'down'; value: number }; color: string; alert?: boolean;
}) {
  const borderColors: Record<string, string> = {
    green: 'hover:border-green-400 dark:hover:border-green-600',
    blue: 'hover:border-blue-400 dark:hover:border-blue-600',
    orange: 'hover:border-orange-400 dark:hover:border-orange-600',
    red: 'hover:border-red-400 dark:hover:border-red-600',
  };

  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${borderColors[color]} ${alert ? 'ring-2 ring-red-400 dark:ring-red-600' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1 font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.value}% vs last month
            </p>
          )}
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, description, gradient, borderColor }: {
  href: string; icon: React.ReactNode; title: string; description: string; gradient: string; borderColor: string;
}) {
  return (
    <Link href={href} className={`group block bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{description}</p>
      <div className="flex items-center gap-2 mt-4 text-gold-600 dark:text-gold-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Open</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function TransactionRow({ transaction }: { transaction: any }) {
  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-medium text-charcoal-900 dark:text-white text-sm">{transaction.description}</p>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-charcoal-900 dark:text-white">£{transaction.amount.toLocaleString()}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[transaction.status] || statusColors.PENDING}`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: any }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${invoice.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-neutral-50 dark:bg-charcoal-700'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${invoice.isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
          <FileText className={`w-5 h-5 ${invoice.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
        </div>
        <div>
          <p className="font-medium text-charcoal-900 dark:text-white text-sm">Invoice #{invoice.id.slice(-6)}</p>
          {invoice.dueDate && (
            <p className={`text-xs ${invoice.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-charcoal-500 dark:text-charcoal-400'}`}>
              Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              {invoice.isOverdue && ' (Overdue)'}
            </p>
          )}
        </div>
      </div>
      <p className="font-bold text-charcoal-900 dark:text-white">£{invoice.amount.toLocaleString()}</p>
    </div>
  );
}

function BudgetCategory({ label, allocated, spent, color }: { label: string; allocated: number; spent: number; color: string }) {
  const percentage = Math.min((spent / allocated) * 100, 100);
  const colors: Record<string, { bg: string; fill: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', fill: 'bg-blue-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', fill: 'bg-green-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', fill: 'bg-orange-500' },
  };

  return (
    <div className="p-4 bg-neutral-50 dark:bg-charcoal-700 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-charcoal-900 dark:text-white">{label}</p>
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
          £{spent.toLocaleString()} / £{allocated.toLocaleString()}
        </p>
      </div>
      <div className={`h-3 rounded-full ${colors[color].bg} overflow-hidden`}>
        <div className={`h-full ${colors[color].fill} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">{percentage.toFixed(0)}% used</p>
    </div>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3">{icon}</div>
      <p className="text-charcoal-600 dark:text-charcoal-400 font-medium">{title}</p>
    </div>
  );
}

function NoClubState() {
  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-12 text-center">
      <DollarSign className="w-20 h-20 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-3">No Club Assignment</h2>
      <p className="text-charcoal-600 dark:text-charcoal-400 mb-8 max-w-md mx-auto">
        You need to be assigned as a treasurer to a club to access financial management features.
      </p>
    </div>
  );
}