/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Analyst Dashboard v2.0
 * Path: src/app/dashboard/analyst/page.tsx
 * ============================================================================
 * 
 * Features:
 * ✅ Performance analytics
 * ✅ Match analysis
 * ✅ Player statistics
 * ✅ Team comparisons
 * ✅ Video tagging tools
 * ✅ Custom reports
 * 
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, FileText, Video, Target, PieChart,
  ArrowRight, Calendar, Activity, Zap, Database, LineChart, Clock,
} from 'lucide-react';

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getAnalystDashboardData(userId: string) {
  const analyst = await prisma.analyst.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!analyst) {
    return { hasAssignment: false, stats: null, clubs: [], recentAnalysis: [] };
  }

  // Get clubs through user's club memberships
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clubMemberships: {
        where: { isActive: true },
        include: {
          club: { select: { id: true, name: true, sport: true } },
        },
      },
    },
  });

  const clubs = user?.clubMemberships.map(cm => cm.club) || [];

  return {
    hasAssignment: true,
    clubs,
    stats: {
      reportsCreated: 0,
      matchesAnalyzed: 0,
      playersTracked: 0,
      insightsGenerated: 0,
    },
    recentAnalysis: [],
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function AnalystPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const data = await getAnalystDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-white mb-2 flex items-center gap-3">
          📊 Analyst Dashboard
        </h1>
        <p className="text-charcoal-600 dark:text-charcoal-400">
          Analyze performance, generate insights, and create data-driven reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Reports Created" value={data.stats?.reportsCreated || 0} icon={<FileText className="w-8 h-8 text-blue-500" />} hoverColor="hover:border-blue-400" />
        <StatCard label="Matches Analyzed" value={data.stats?.matchesAnalyzed || 0} icon={<BarChart3 className="w-8 h-8 text-green-500" />} hoverColor="hover:border-green-400" />
        <StatCard label="Players Tracked" value={data.stats?.playersTracked || 0} icon={<Users className="w-8 h-8 text-purple-500" />} hoverColor="hover:border-purple-400" />
        <StatCard label="Insights Generated" value={data.stats?.insightsGenerated || 0} icon={<Zap className="w-8 h-8 text-gold-500" />} hoverColor="hover:border-gold-400" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction
          href="/dashboard/analyst/match-analysis"
          icon={<Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          title="Match Analysis"
          description="Analyze match footage and tag events"
          gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          borderColor="border-blue-200 dark:border-blue-800 hover:border-blue-400"
        />
        <QuickAction
          href="/dashboard/analyst/player-stats"
          icon={<TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />}
          title="Player Statistics"
          description="Deep dive into player performance"
          gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          borderColor="border-green-200 dark:border-green-800 hover:border-green-400"
        />
        <QuickAction
          href="/dashboard/analyst/team-comparison"
          icon={<PieChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
          title="Team Comparison"
          description="Compare team performance metrics"
          gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          borderColor="border-purple-200 dark:border-purple-800 hover:border-purple-400"
        />
        <QuickAction
          href="/dashboard/analyst/reports"
          icon={<FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
          title="Custom Reports"
          description="Generate detailed analytical reports"
          gradient="from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
          borderColor="border-orange-200 dark:border-orange-800 hover:border-orange-400"
        />
      </div>

      {/* Analysis Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analysis */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Analysis
            </h2>
            <Link href="/dashboard/analyst/history" className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6">
            <EmptyState
              icon={<LineChart className="w-16 h-16" />}
              title="No analysis yet"
              description="Start analyzing matches to see your history"
              actionLabel="Start Analysis"
              actionHref="/dashboard/analyst/match-analysis"
            />
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700">
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
            <h2 className="text-lg font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              Data Sources
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <DataSourceRow label="Match Data" status="connected" count={0} />
            <DataSourceRow label="Player Statistics" status="connected" count={0} />
            <DataSourceRow label="Video Footage" status="pending" count={0} />
            <DataSourceRow label="GPS/Tracking Data" status="disconnected" count={0} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, icon, hoverColor }: { label: string; value: number; icon: React.ReactNode; hoverColor: string }) {
  return (
    <div className={`bg-white dark:bg-charcoal-800 rounded-xl shadow-sm border border-neutral-200 dark:border-charcoal-700 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${hoverColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1 font-medium">{label}</p>
          <p className="text-3xl font-bold text-charcoal-900 dark:text-white">{value}</p>
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

function DataSourceRow({ label, status, count }: { label: string; status: 'connected' | 'pending' | 'disconnected'; count: number }) {
  const statusConfig = {
    connected: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Connected' },
    pending: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'Pending' },
    disconnected: { color: 'bg-neutral-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-400', label: 'Not Connected' },
  };

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-charcoal-700 rounded-lg">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-charcoal-400" />
        <span className="font-medium text-charcoal-700 dark:text-charcoal-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-charcoal-500 dark:text-charcoal-400">{count} records</span>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: {
  icon: React.ReactNode; title: string; description?: string; actionLabel?: string; actionHref?: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold rounded-lg text-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}