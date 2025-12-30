// ============================================================================
// 🏆 PITCHCONNECT - Treasurer Dashboard (Enterprise v7.7.0)
// ============================================================================
// Path: app/dashboard/treasurer/page.tsx
// Full Budget & Expense system with multi-sport support
// ============================================================================

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getSportConfig, 
  formatCurrency 
} from '@/lib/sports/sport-config';
import { 
  BudgetStatus, 
  ExpenseStatus, 
  ExpenseCategory,
  Sport 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TreasurerData {
  id: string;
  userId: string;
  yearsExperience: number | null;
  qualifications: string[];
  clubs: {
    id: string;
    name: string;
    sport: Sport;
    logo: string | null;
  }[];
}

interface BudgetSummary {
  id: string;
  name: string;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  status: BudgetStatus;
  club: {
    id: string;
    name: string;
    sport: Sport;
  };
  categories: {
    id: string;
    name: string;
    category: ExpenseCategory;
    allocatedAmount: number;
    spentAmount: number;
  }[];
}

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  expenseDate: Date;
  submitter: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  club: {
    name: string;
    sport: Sport;
  } | null;
}

interface FinancialStats {
  totalBudget: number;
  totalSpent: number;
  pendingApprovals: number;
  activebudgets: number;
  monthlySpend: number;
  lastMonthSpend: number;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTreasurerData(userId: string): Promise<TreasurerData | null> {
  const treasurer = await prisma.treasurer.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          clubMembers: {
            where: {
              role: { in: ['OWNER', 'MANAGER', 'TREASURER'] },
              isActive: true,
            },
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!treasurer) return null;

  return {
    id: treasurer.id,
    userId: treasurer.userId,
    yearsExperience: treasurer.yearsExperience,
    qualifications: treasurer.qualifications || [],
    clubs: treasurer.user.clubMembers.map(m => m.club),
  };
}

async function getBudgetSummaries(clubIds: string[]): Promise<BudgetSummary[]> {
  const budgets = await prisma.budget.findMany({
    where: {
      clubId: { in: clubIds },
      deletedAt: null,
      status: { in: ['ACTIVE', 'DRAFT'] },
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          category: true,
          allocatedAmount: true,
          spentAmount: true,
        },
      },
      expenses: {
        where: { status: { in: ['APPROVED', 'PAID'] } },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return budgets.map(b => {
    const spentAmount = b.expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      id: b.id,
      name: b.name,
      totalBudget: b.totalBudget,
      spentAmount,
      remainingAmount: b.totalBudget - spentAmount,
      status: b.status,
      club: b.club!,
      categories: b.categories,
    };
  });
}

async function getRecentExpenses(clubIds: string[]): Promise<RecentExpense[]> {
  const expenses = await prisma.expense.findMany({
    where: {
      clubId: { in: clubIds },
      deletedAt: null,
    },
    include: {
      submitter: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      club: {
        select: {
          name: true,
          sport: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return expenses.map(e => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    status: e.status,
    expenseDate: e.expenseDate,
    submitter: e.submitter,
    club: e.club,
  }));
}

async function getFinancialStats(clubIds: string[]): Promise<FinancialStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [budgets, pendingExpenses, monthlyExpenses, lastMonthExpenses] = await Promise.all([
    prisma.budget.findMany({
      where: { clubId: { in: clubIds }, deletedAt: null, status: 'ACTIVE' },
      include: {
        expenses: {
          where: { status: { in: ['APPROVED', 'PAID'] } },
          select: { amount: true },
        },
      },
    }),
    prisma.expense.count({
      where: { clubId: { in: clubIds }, status: 'PENDING_APPROVAL', deletedAt: null },
    }),
    prisma.expense.aggregate({
      where: {
        clubId: { in: clubIds },
        status: { in: ['APPROVED', 'PAID'] },
        expenseDate: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        clubId: { in: clubIds },
        status: { in: ['APPROVED', 'PAID'] },
        expenseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        deletedAt: null,
      },
      _sum: { amount: true },
    }),
  ]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => 
    sum + b.expenses.reduce((eSum, e) => eSum + e.amount, 0), 0
  );

  return {
    totalBudget,
    totalSpent,
    pendingApprovals: pendingExpenses,
    activebudgets: budgets.length,
    monthlySpend: monthlyExpenses._sum.amount || 0,
    lastMonthSpend: lastMonthExpenses._sum.amount || 0,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const STATUS_CONFIG: Record<BudgetStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  ACTIVE: { label: 'Active', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  FROZEN: { label: 'Frozen', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  CLOSED: { label: 'Closed', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  ARCHIVED: { label: 'Archived', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  PENDING_APPROVAL: { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  APPROVED: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  PAID: { label: 'Paid', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  REIMBURSED: { label: 'Reimbursed', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

const CATEGORY_ICONS: Partial<Record<ExpenseCategory, string>> = {
  EQUIPMENT_PURCHASE: '🏋️',
  EQUIPMENT_MAINTENANCE: '🔧',
  UNIFORMS_KITS: '👕',
  TRAINING_GEAR: '⚽',
  FACILITY_RENTAL: '🏟️',
  PITCH_HIRE: '🏟️',
  TRAVEL_TRANSPORT: '🚌',
  ACCOMMODATION: '🏨',
  MEALS_CATERING: '🍽️',
  COACHING_FEES: '👨‍🏫',
  REFEREE_FEES: '🧑‍⚖️',
  MEDICAL_SUPPLIES: '🏥',
  PHYSIOTHERAPY: '💆',
  INSURANCE_PREMIUMS: '📋',
  LEAGUE_FEES: '🏆',
  COMPETITION_ENTRY: '🎫',
  MARKETING_PROMOTION: '📣',
  EVENTS_SOCIALS: '🎉',
  AWARDS_TROPHIES: '🏆',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function calculatePercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((spent / total) * 100);
}

function getTrendIndicator(current: number, previous: number): { icon: string; color: string; text: string } {
  if (previous === 0) return { icon: '—', color: 'text-gray-400', text: 'No data' };
  const change = ((current - previous) / previous) * 100;
  if (change > 0) {
    return { icon: '↑', color: 'text-red-400', text: `+${change.toFixed(0)}%` };
  } else if (change < 0) {
    return { icon: '↓', color: 'text-green-400', text: `${change.toFixed(0)}%` };
  }
  return { icon: '→', color: 'text-gray-400', text: 'No change' };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  title,
  value,
  subValue,
  icon,
  trend,
  color = 'amber',
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: { icon: string; color: string; text: string };
  color?: 'amber' | 'green' | 'red' | 'blue' | 'purple';
}) {
  const colorMap = {
    amber: 'from-amber-500 to-orange-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 hover:border-amber-500/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.color}`}>
            {trend.icon} {trend.text}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}

function BudgetCard({ budget }: { budget: BudgetSummary }) {
  const percentage = calculatePercentage(budget.spentAmount, budget.totalBudget);
  const statusConfig = STATUS_CONFIG[budget.status];
  const sportConfig = getSportConfig(budget.club.sport);
  const isOverBudget = budget.spentAmount > budget.totalBudget;

  return (
    <Link
      href={`/dashboard/treasurer/budgets/${budget.id}`}
      className="block bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] overflow-hidden hover:border-amber-500/30 transition-all hover:shadow-xl hover:shadow-black/20"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: `${sportConfig.color}20`, color: sportConfig.color }}
              >
                {sportConfig.icon} {budget.club.name}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                {statusConfig.label}
              </span>
            </div>
            <h3 className="font-bold text-lg text-white truncate">{budget.name}</h3>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Budget Usage</span>
            <span className={isOverBudget ? 'text-red-400 font-medium' : 'text-white'}>
              {percentage}%
            </span>
          </div>
          <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverBudget 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                  : percentage > 80 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Spent</div>
            <div className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(budget.spentAmount)}
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Remaining</div>
            <div className={`font-bold ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(budget.remainingAmount)}
            </div>
          </div>
        </div>

        {/* Category Breakdown Preview */}
        {budget.categories.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
            <div className="flex items-center gap-1">
              {budget.categories.slice(0, 4).map((cat, i) => {
                const catPercent = calculatePercentage(cat.spentAmount, cat.allocatedAmount);
                return (
                  <div
                    key={cat.id}
                    className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden"
                    title={`${cat.name}: ${catPercent}%`}
                  >
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(catPercent, 100)}%` }}
                    />
                  </div>
                );
              })}
              {budget.categories.length > 4 && (
                <span className="text-xs text-gray-500">+{budget.categories.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function ExpenseRow({ expense }: { expense: RecentExpense }) {
  const statusConfig = EXPENSE_STATUS_CONFIG[expense.status];
  const categoryIcon = CATEGORY_ICONS[expense.category] || '💰';
  const sportConfig = expense.club ? getSportConfig(expense.club.sport) : null;

  return (
    <div className="flex items-center gap-4 p-4 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] hover:border-amber-500/20 transition-all">
      {/* Category Icon */}
      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-xl">
        {categoryIcon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{expense.description}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-[#3a3a3a] overflow-hidden">
              {expense.submitter.avatar ? (
                <Image
                  src={expense.submitter.avatar}
                  alt=""
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                  {expense.submitter.firstName[0]}
                </span>
              )}
            </div>
            {expense.submitter.firstName} {expense.submitter.lastName}
          </span>
          <span>•</span>
          <span>{formatDate(expense.expenseDate)}</span>
          {expense.club && sportConfig && (
            <>
              <span>•</span>
              <span style={{ color: sportConfig.color }}>{sportConfig.icon} {expense.club.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <div className="font-bold text-white">{formatCurrency(expense.amount, expense.currency)}</div>
        <div className="text-xs text-gray-500">{expense.category.replace(/_/g, ' ')}</div>
      </div>
    </div>
  );
}

function QuickAction({ 
  href, 
  icon, 
  label, 
  description 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] hover:border-amber-500/30 transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-500 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-white group-hover:text-amber-400 transition-colors">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <svg className="w-5 h-5 text-gray-500 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Financial Data Yet</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-6">
        Start by creating a budget for your club to track expenses and manage finances.
      </p>
      <Link
        href="/dashboard/treasurer/budgets/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                   text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                   transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create First Budget
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
            <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl mb-4" />
            <div className="h-8 w-24 bg-[#2a2a2a] rounded mb-2" />
            <div className="h-4 w-32 bg-[#2a2a2a] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function TreasurerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const treasurerData = await getTreasurerData(session.user.id);
  
  if (!treasurerData || treasurerData.clubs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Treasurer Access Required</h2>
          <p className="text-gray-400 mb-6">
            You need treasurer permissions to access this dashboard. Contact your club administrator.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2a2a2a] border border-[#3a3a3a]
                       text-white rounded-xl hover:border-amber-500/30 transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const clubIds = treasurerData.clubs.map(c => c.id);
  const [budgets, expenses, stats] = await Promise.all([
    getBudgetSummaries(clubIds),
    getRecentExpenses(clubIds),
    getFinancialStats(clubIds),
  ]);

  const spendTrend = getTrendIndicator(stats.monthlySpend, stats.lastMonthSpend);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-amber-400">Treasurer</span>
          </nav>

          {/* Title */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Treasurer Dashboard</h1>
                <p className="text-gray-400">
                  Managing finances for {treasurerData.clubs.length} club{treasurerData.clubs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/treasurer/expenses/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a]
                           text-white rounded-xl hover:border-amber-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </Link>
              <Link
                href="/dashboard/treasurer/budgets/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500
                           text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                           transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Budget
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Budget"
              value={formatCurrency(stats.totalBudget)}
              subValue={`${stats.activebudgets} active budget${stats.activebudgets !== 1 ? 's' : ''}`}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              color="blue"
            />
            <StatCard
              title="Total Spent"
              value={formatCurrency(stats.totalSpent)}
              subValue={`${calculatePercentage(stats.totalSpent, stats.totalBudget)}% of budget`}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              color="amber"
            />
            <StatCard
              title="This Month"
              value={formatCurrency(stats.monthlySpend)}
              trend={spendTrend}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="green"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              subValue="expenses awaiting review"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color={stats.pendingApprovals > 0 ? 'red' : 'green'}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Budgets Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Budgets</h2>
                <Link
                  href="/dashboard/treasurer/budgets"
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              {budgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {budgets.slice(0, 4).map((budget) => (
                    <BudgetCard key={budget.id} budget={budget} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <QuickAction
                  href="/dashboard/treasurer/expenses"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  }
                  label="View All Expenses"
                  description="Browse and filter expense records"
                />
                <QuickAction
                  href="/dashboard/treasurer/approvals"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Pending Approvals"
                  description={`${stats.pendingApprovals} expense${stats.pendingApprovals !== 1 ? 's' : ''} to review`}
                />
                <QuickAction
                  href="/dashboard/treasurer/reports"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Financial Reports"
                  description="Generate and export reports"
                />
                <QuickAction
                  href="/dashboard/treasurer/settings"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  label="Settings"
                  description="Manage categories and defaults"
                />
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          {expenses.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
                <Link
                  href="/dashboard/treasurer/expenses"
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </div>
            </div>
          )}

          {/* Club Breakdown */}
          {treasurerData.clubs.length > 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-6">Clubs Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {treasurerData.clubs.map((club) => {
                  const sportConfig = getSportConfig(club.sport);
                  const clubBudgets = budgets.filter(b => b.club.id === club.id);
                  const clubTotal = clubBudgets.reduce((sum, b) => sum + b.totalBudget, 0);
                  const clubSpent = clubBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
                  
                  return (
                    <Link
                      key={club.id}
                      href={`/dashboard/treasurer/clubs/${club.id}`}
                      className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-amber-500/20 transition-all"
                    >
                      {club.logo ? (
                        <Image
                          src={club.logo}
                          alt={club.name}
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${sportConfig.color}20` }}
                        >
                          {sportConfig.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{club.name}</div>
                        <div className="text-sm text-gray-500">
                          {clubBudgets.length} budget{clubBudgets.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{formatCurrency(clubSpent)}</div>
                        <div className="text-xs text-gray-500">of {formatCurrency(clubTotal)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Treasurer Dashboard | PitchConnect',
  description: 'Manage club finances, budgets, and expenses',
};